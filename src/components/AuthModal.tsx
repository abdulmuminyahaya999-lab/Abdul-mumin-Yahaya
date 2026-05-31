import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any, token: string) => void;
  initialTab?: 'login' | 'register';
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialTab = 'login'
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(initialTab);
  
  // Registration and login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleTabChange = (tab: 'login' | 'register' | 'forgot') => {
    setActiveTab(tab);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please fill in all details.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Authentication failed.');
      }

      onAuthSuccess(resData.user, resData.token);
      setSuccessMessage('Logged in successfully!');
      setTimeout(() => {
        onClose();
        // Clear forms
        setEmail('');
        setPassword('');
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Server connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName || !phone) {
      setErrorMessage('Please fill in all properties.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phone })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Registration failed.');
      }

      onAuthSuccess(resData.user, resData.token);
      setSuccessMessage('Account created and logged inside!');
      setTimeout(() => {
        onClose();
        // Clear forms
        setEmail('');
        setPassword('');
        setFullName('');
        setPhone('');
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Server connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter your email.');
      return;
    }
    
    // Simulate finding the credentials for high usability
    if (email.toLowerCase().includes('demo')) {
      setSuccessMessage('Password recovered! The password for demo@realitybest.com is "demo".');
    } else if (email.toLowerCase().includes('admin')) {
      setSuccessMessage('Password recovered! The password for admin@realitybest.com is "admin".');
    } else {
      setSuccessMessage('Demo Password Reset: A recovery link has been simulated for your email address. Default credentials: password is "user123".');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" id="auth-modal-overlay">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
        id="auth-modal-container"
      >
        {/* Header Block with Reality Yellow Branding */}
        <div className="bg-yellow-400 px-6 py-5 flex items-center justify-between text-slate-950">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight">
              {activeTab === 'login' && 'Sign In to Account'}
              {activeTab === 'register' && 'Register on Reality-Best'}
              {activeTab === 'forgot' && 'Trouble Logging In?'}
            </h3>
            <p className="text-xs font-medium text-slate-800 mt-0.5">
              Secure Ghana Airtime & Data Systems
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-900/70 hover:text-slate-950 hover:bg-white/30 rounded-lg transition-colors"
            id="auth-modal-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs Selection */}
        {activeTab !== 'forgot' && (
          <div className="flex border-b border-slate-100 font-semibold" id="auth-modal-tabs">
            <button
              onClick={() => handleTabChange('login')}
              className={`flex-1 text-center py-3 text-sm transition-all focus:outline-none ${
                activeTab === 'login' 
                  ? 'border-b-2 border-slate-900 text-slate-950 bg-slate-50/50' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/20'
              }`}
            >
              Sign In Account
            </button>
            <button
              onClick={() => handleTabChange('register')}
              className={`flex-1 text-center py-3 text-sm transition-all focus:outline-none ${
                activeTab === 'register' 
                  ? 'border-b-2 border-slate-900 text-slate-950 bg-slate-50/50' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/20'
              }`}
            >
              Join Free (Register)
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto max-h-[80vh] flex-1">
          
          {/* Quick Notice Panel */}
          <div className="mb-4 bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-600 flex flex-col gap-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Development Sandbox Mode
            </div>
            <span>
              You can test instantly with Kwame's pre-filled account:
              <br />
              <strong>Email:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">demo@realitybest.com</code> | <strong>Password:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">demo</code>
            </span>
            <span>
              Admin controls:
              <br />
              <strong>Email:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">admin@realitybest.com</code> | <strong>Password:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">admin</code>
            </span>
          </div>

          {/* Status Display boxes */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-start gap-2 animate-shake" id="auth-error">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg flex items-start gap-2" id="auth-success">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* SESSIONS LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4" id="login-form">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. customer@gmail.com"
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900"
                    id="login-email-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your security password"
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900"
                    id="login-password-input"
                  />
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => handleTabChange('forgot')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow transition-all duration-150 disabled:opacity-50 mt-2"
                id="login-submit-btn"
              >
                {isLoading ? 'Verifying Account Info...' : 'Sign In Securely'}
              </button>
            </form>
          )}

          {/* SESSIONS REGISTRATION FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4" id="register-form">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Legal Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Abena Manu"
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900"
                    id="register-fullname-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. abena.manu@gmail.com"
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900"
                    id="register-email-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Phone Number (Ghana)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0541234567"
                    pattern="[0-9]{9,11}"
                    title="Enter a valid Ghanaian mobile phone e.g. 0244123456"
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900"
                    id="register-phone-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Security Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 4 characters"
                    minLength={4}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900"
                    id="register-password-input"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow transition-all duration-150"
                  id="register-submit-btn"
                >
                  Create My Free Wallet
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4" id="forgot-form">
              <p className="text-xs text-slate-500 leading-relaxed">
                Provide your registered email. Since this database runs in a local sandbox mode, we will pull and display your credential on screen immediately so you can proceed without logging issues.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Account Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email to retrieve"
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900"
                    id="forgot-email-input"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTabChange('login')}
                  className="flex-1 py-2 text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Back to Log In
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg"
                  id="forgot-submit-btn"
                >
                  Show Password
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer info lock indicator */}
        <div className="py-3.5 px-6 border-t border-slate-50 bg-slate-50 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
          SSL Secured & Licensed by Ghana Telecoms Resellers
        </div>
      </div>
    </div>
  );
}
