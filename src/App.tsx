import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Search, 
  MapPin, 
  Activity, 
  Compass, 
  Database, 
  Grid, 
  User as UserIcon, 
  ShieldCheck, 
  Plus, 
  Check, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  RefreshCw, 
  Clock, 
  PhoneCall, 
  Wifi, 
  Trash2, 
  Sparkles,
  Layers,
  ChevronRight,
  Calculator,
  UserCheck
} from 'lucide-react';
import { 
  User, 
  BundlePackage, 
  Transaction, 
  Deposit, 
  SalesStatistics,
  NetworkType 
} from './types';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';

export default function App() {
  // Global Session Credentials
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('rb-token'));
  
  // Tab control & Modals
  const [currentTab, setCurrentTab] = useState<'home' | 'dashboard' | 'admin'>('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [initialAuthTab, setInitialAuthTab] = useState<'login' | 'register'>('login');
  
  // Reseller dynamic data
  const [packages, setPackages] = useState<BundlePackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  
  // User records (lazy loaded)
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [userDeposits, setUserDeposits] = useState<Deposit[]>([]);
  const [isLoadingUserRecords, setIsLoadingUserRecords] = useState(false);
  
  // Quick tracking state
  const [trackingId, setTrackingId] = useState('');
  const [trackResult, setTrackResult] = useState<{
    found: boolean;
    type?: 'transaction' | 'deposit';
    data?: any;
    error?: string;
  } | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  // Active Transaction / Purchase Workflow States
  const [purchaseType, setPurchaseType] = useState<'airtime' | 'data' | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<BundlePackage | null>(null);
  const [airtimeNetwork, setAirtimeNetwork] = useState<NetworkType>('MTN');
  const [purchasePhone, setPurchasePhone] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState<string>('');
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState('');
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);

  // Active Funding / Deposit Request State
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositMethod, setDepositMethod] = useState<'MTN MoMo' | 'Telecel Cash' | 'AT Money'>('MTN MoMo');
  const [depositTxId, setDepositTxId] = useState('');
  const [depositError, setDepositError] = useState('');
  const [depositSuccess, setDepositSuccess] = useState('');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);

  // Admin Dashboard Component states
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminDeposits, setAdminDeposits] = useState<Deposit[]>([]);
  const [adminTransactions, setAdminTransactions] = useState<Transaction[]>([]);
  const [adminStats, setAdminStats] = useState<SalesStatistics | null>(null);
  const [adminSelectedUser, setAdminSelectedUser] = useState<User | null>(null);
  const [adminAdjustBalanceAmount, setAdminAdjustBalanceAmount] = useState<string>('');
  const [adminIsSubmittingUserAdjust, setAdminIsSubmittingUserAdjust] = useState(false);

  // Admin Create Package State
  const [newPkgNetwork, setNewPkgNetwork] = useState<NetworkType>('MTN');
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgSize, setNewPkgSize] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState('');
  const [newPkgDuration, setNewPkgDuration] = useState('30 Days');
  const [newPkgDesc, setNewPkgDesc] = useState('');
  const [newPkgError, setNewPkgError] = useState('');
  const [newPkgSuccess, setNewPkgSuccess] = useState('');
  const [isCreatingPkg, setIsCreatingPkg] = useState(false);

  // Notification Banner State
  const [notifText, setNotifText] = useState<string | null>(null);
  const [notifType, setNotifType] = useState<'success' | 'info' | 'error'>('info');

  // Real-time Success Notifications State for Dashboard Badge
  const [successNotifications, setSuccessNotifications] = useState<any[]>([]);

  // Real-time Success Alert banners inside Dashboard panel
  const [dashboardAlerts, setDashboardAlerts] = useState<any[]>([]);

  // Trigger brief alert banner
  const triggerNotification = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotifText(text);
    setNotifType(type);
    setTimeout(() => {
      setNotifText(null);
    }, 5000);
  };

  // 1. Check/Rehydrate active user state on load or token update
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setCurrentUser(null);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const userData = await res.json();
          setCurrentUser(userData);
        } else {
          // Token expired or invalid
          localStorage.removeItem('rb-token');
          setToken(null);
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Error fetching user profile', err);
      }
    };
    fetchUser();
  }, [token]);

  // 1b. Real-time WebSocket subscriptions for Success Notifications
  useEffect(() => {
    if (!currentUser) {
      setSuccessNotifications([]);
      setDashboardAlerts([]);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/?userId=${currentUser.id}`;
    
    console.log('[WS CLIENT] Attaching to WebSocket:', wsUrl);
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.addEventListener('open', () => {
        console.log('[WS CLIENT] Connected to notification stream.');
      });

      socket.addEventListener('message', (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'purchase_success') {
            const tx = payload.data;
            console.log('[WS CLIENT] Received success notification:', tx);

            // Add to active notification queue for badge trigger
            setSuccessNotifications(prev => {
              if (prev.some(p => p.id === tx.id)) return prev;
              return [tx, ...prev];
            });

            // Add to persistent dashboard-only alert banners (dismissible by user directly in portal)
            setDashboardAlerts(prev => {
              if (prev.some(p => p.id === tx.id)) return prev;
              return [tx, ...prev];
            });

            // Trigger visual overlay notification toast
            triggerNotification(`Purchase Confirmed: Airtime/Data sent to ${tx.recipientPhone} successfully!`, 'success');

            // Instantly refresh user logs (history lists) so they update in real-time
            fetchUserLogs();

            // Refetch current user details (refresh wallet balance)
            if (token) {
              fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
              }).then(r => {
                if (r.ok) r.json().then(u => setCurrentUser(u));
              }).catch(e => console.error(e));
            }
          }
        } catch (err) {
          console.error('[WS CLIENT] Error reading message:', err);
        }
      });

      socket.addEventListener('close', () => {
        console.log('[WS CLIENT] Connection closed. Retrying in 4s...');
        reconnectTimeout = setTimeout(connect, 4000);
      });

      socket.addEventListener('error', (err) => {
        console.error('[WS CLIENT] Socket error met:', err);
      });
    };

    connect();

    return () => {
      if (socket) {
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [currentUser?.id, token]);

  // 2. Load bundle packages from API
  const fetchPackages = async () => {
    setIsLoadingPackages(true);
    try {
      const res = await fetch('/api/admin/packages');
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
      }
    } catch (err) {
      console.error('Failed to grab reseller data packages:', err);
    } finally {
      setIsLoadingPackages(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // 3. Load active user's transaction/deposit logs
  const fetchUserLogs = async () => {
    if (!token) return;
    setIsLoadingUserRecords(true);
    try {
      const p1 = fetch('/api/user/transactions', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
      const p2 = fetch('/api/user/deposits', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
      
      const [txs, deps] = await Promise.all([p1, p2]);
      
      if (Array.isArray(txs)) setUserTransactions(txs);
      if (Array.isArray(deps)) setUserDeposits(deps);
    } catch (err) {
      console.error('Error downloading customer account history:', err);
    } finally {
      setIsLoadingUserRecords(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUserLogs();
    }
  }, [currentUser, token]);

  // Handle successful login or signup from AuthModal
  const handleAuthSuccess = (user: User, userToken: string) => {
    localStorage.setItem('rb-token', userToken);
    setToken(userToken);
    setCurrentUser(user);
    triggerNotification(`Welcome back, ${user.fullName}!`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('rb-token');
    setToken(null);
    setCurrentUser(null);
    setCurrentTab('home');
    triggerNotification('Signed out securely. See you again soon!', 'info');
  };

  // Quick Action: Search/Track Orders by Reference
  const handleTrackRef = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    
    setIsTracking(true);
    setTrackResult(null);
    try {
      const res = await fetch(`/api/orders/track/${trackingId.trim()}`);
      const data = await res.json();
      if (res.ok) {
        setTrackResult({ found: true, type: data.type, data: data.data });
      } else {
        setTrackResult({ found: false, error: data.error || 'Invoice record not found.' });
      }
    } catch (err) {
      setTrackResult({ found: false, error: 'Network error query service.' });
    } finally {
      setIsTracking(false);
    }
  };

  // Trigger quick login reminder if non-authed user attempts action
  const requireAuth = (actionName: string): boolean => {
    if (!currentUser) {
      setInitialAuthTab('login');
      setIsAuthOpen(true);
      triggerNotification(`Authentication required: Please sign in to buy ${actionName}.`, 'info');
      return false;
    }
    return true;
  };

  // Action: Open Purchase Workflow
  const openPurchaseWorkflow = (type: 'airtime' | 'data', pkg?: BundlePackage) => {
    if (!requireAuth(type === 'airtime' ? 'airtime' : 'data bundle')) return;
    
    setPurchaseType(type);
    setPurchaseError('');
    setPurchaseSuccess('');
    
    if (currentUser) {
      // Pre-fill user's own telephone for speed
      setPurchasePhone(currentUser.phone);
    } else {
      setPurchasePhone('');
    }

    if (type === 'data') {
      if (pkg) {
        setSelectedPackage(pkg);
        setAirtimeNetwork(pkg.network);
        setPurchaseAmount(pkg.price.toString());
      } else {
        // No specific packet preset, select the first active packet
        const activePkgs = packages.filter(p => p.isActive);
        if (activePkgs.length > 0) {
          setSelectedPackage(activePkgs[0]);
          setAirtimeNetwork(activePkgs[0].network);
          setPurchaseAmount(activePkgs[0].price.toString());
        } else {
          setPurchaseError('No active packages available. Please contact administrator.');
        }
      }
    } else {
      // Airtime mode
      setSelectedPackage(null);
      setPurchaseAmount('10'); // Default start GH¢
    }
  };

  // Process Airtime or Data Package purchase
  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurchaseError('');
    setPurchaseSuccess('');

    if (!purchasePhone.trim() || !purchaseAmount) {
      setPurchaseError('Please provide both telephone and amount fields fully.');
      return;
    }

    const numericAmount = parseFloat(purchaseAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setPurchaseError('Kindly write a valid positive amount in Ghana Cedis.');
      return;
    }

    if (currentUser && currentUser.walletBalance < numericAmount) {
      setPurchaseError(`Insufficient funds in wallet. Price is GH₵ ${numericAmount.toFixed(2)}, but you possess GH₵ ${currentUser.walletBalance.toFixed(2)}.`);
      return;
    }

    setIsSubmittingPurchase(true);

    try {
      const response = await fetch('/api/user/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          network: selectedPackage ? selectedPackage.network : airtimeNetwork,
          serviceType: purchaseType,
          serviceName: selectedPackage ? selectedPackage.name : `${airtimeNetwork} Instant Airtime`,
          amount: numericAmount,
          recipientPhone: purchasePhone.trim(),
          packageId: selectedPackage ? selectedPackage.id : undefined
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Reselling transaction failed.');
      }

      // Success! Update local user's balance
      setCurrentUser(prevOutput => {
        if (!prevOutput) return null;
        return {
          ...prevOutput,
          walletBalance: resData.newBalance
        };
      });

      setPurchaseSuccess(`Success! Ordered ${purchaseType === 'airtime' ? 'GH₵' + numericAmount : selectedPackage?.name} onto ${purchasePhone.trim()}. Reference Code: ${resData.transaction.referenceId}`);
      triggerNotification('Transaction completed successfully!', 'success');
      
      // Reload logs
      fetchUserLogs();

      // Slow modal close
      setTimeout(() => {
        setPurchaseType(null);
        setSelectedPackage(null);
        setPurchaseSuccess('');
      }, 3500);

    } catch (err: any) {
      setPurchaseError(err.message || 'Something went wrong processing standard purchase. Retry later.');
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  // Action: Submit Wallet Funding deposit slip (Mobile Money)
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError('');
    setDepositSuccess('');

    const numericAmount = parseFloat(depositAmount);
    if (!depositAmount || isNaN(numericAmount) || numericAmount < 1) {
      setDepositError('Minimum funding amount allowed is GH₵ 1.00');
      return;
    }

    if (!depositTxId.trim()) {
      setDepositError('Please provide your MoMo carrier Transaction reference / TxID.');
      return;
    }

    setIsSubmittingDeposit(true);
    try {
      const res = await fetch('/api/user/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: numericAmount,
          paymentMethod: depositMethod,
          transactionId: depositTxId.trim()
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Deposit logging failed.');
      }

      setDepositSuccess('Deposit logged in sandbox database! Waiting for Admin verification and approval.');
      triggerNotification('Mobile money transaction slip uploaded.', 'success');
      
      // Reload lists
      fetchUserLogs();

      // Reset
      setDepositAmount('');
      setDepositTxId('');

      setTimeout(() => {
        setIsDepositModalOpen(false);
        setDepositSuccess('');
      }, 3500);

    } catch (err: any) {
      setDepositError(err.message || 'Failed connecting to server.');
    } finally {
      setIsSubmittingDeposit(false);
    }
  };


  /* ==================== ADMIN ACTIONS & TRIGGERS ==================== */

  const fetchAdminData = async () => {
    if (!token || currentUser?.role !== 'admin') return;
    try {
      const [uRes, dRes, tRes, sRes] = await Promise.all([
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/admin/deposits', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/admin/transactions', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/admin/statistics', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
      ]);

      if (Array.isArray(uRes)) setAdminUsers(uRes);
      if (Array.isArray(dRes)) setAdminDeposits(dRes);
      if (Array.isArray(tRes)) setAdminTransactions(tRes);
      if (sRes && !sRes.error) setAdminStats(sRes);

    } catch (err) {
      console.error('Failed to sync admin lists data:', err);
    }
  };

  // Sync admin panels when active tab changes to admin
  useEffect(() => {
    if (currentTab === 'admin' && currentUser?.role === 'admin') {
      fetchAdminData();
    }
  }, [currentTab, currentUser]);

  // Action: Approve or Reject customer wallet MoMo slips
  const handleDepositAction = async (depositId: string, statusText: 'Approved' | 'Rejected') => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/deposits/${depositId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: statusText })
      });
      const data = await res.json();
      if (res.ok) {
        triggerNotification(`Deposit is updated: ${statusText}!`, 'success');
        fetchAdminData(); // refresh reporting
      } else {
        triggerNotification(data.error || 'Action failed.', 'error');
      }
    } catch (err) {
      triggerNotification('Connection error while updating deposit status.', 'error');
    }
  };

  // Action: Update transaction status (e.g. Failure refund)
  const handleTransactionStatusAction = async (txId: string, statusText: 'Success' | 'Failed') => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/transactions/${txId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: statusText })
      });
      const data = await res.json();
      if (res.ok) {
        triggerNotification(`Transaction status set to ${statusText}. Wallet balances updated.`, 'success');
        fetchAdminData();
      } else {
        triggerNotification(data.error || 'Action failed.', 'error');
      }
    } catch (err) {
      triggerNotification('Server connectivity error.', 'error');
    }
  };

  // Action: Modify user's balance manually
  const handleModifyUserBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSelectedUser || adminAdjustBalanceAmount === '') return;

    const numericVal = parseFloat(adminAdjustBalanceAmount);
    if (isNaN(numericVal) || numericVal < 0) {
      triggerNotification('Please input a valid amount (can be 0 or dynamic values)', 'error');
      return;
    }

    setAdminIsSubmittingUserAdjust(true);
    try {
      const res = await fetch(`/api/admin/users/${adminSelectedUser.id}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ changeAmount: numericVal })
      });
      const data = await res.json();
      if (res.ok) {
        triggerNotification(`Credit modified for ${adminSelectedUser.fullName} to GH₵ ${numericVal}`, 'success');
        setAdminSelectedUser(null);
        setAdminAdjustBalanceAmount('');
        fetchAdminData();
      } else {
        triggerNotification(data.error || 'Modification failed.', 'error');
      }
    } catch (err) {
      triggerNotification('Connection error.', 'error');
    } finally {
      setAdminIsSubmittingUserAdjust(false);
    }
  };

  // Action: Create package presets
  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewPkgError('');
    setNewPkgSuccess('');

    if (!newPkgName || !newPkgSize || !newPkgPrice) {
      setNewPkgError('Fill name, size parameters and target price.');
      return;
    }

    const priceNum = parseFloat(newPkgPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setNewPkgError('Provide valid positive value tags.');
      return;
    }

    setIsCreatingPkg(true);
    try {
      const res = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          network: newPkgNetwork,
          name: newPkgName,
          dataSize: newPkgSize,
          price: priceNum,
          duration: newPkgDuration,
          description: newPkgDesc
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Package creation failed.');
      }

      setNewPkgSuccess('Package published instantly on the platform!');
      triggerNotification('Telecom resell bundle launched!', 'success');
      
      // Reload frontend package lists
      fetchPackages();
      fetchAdminData();

      // Reset
      setNewPkgName('');
      setNewPkgSize('');
      setNewPkgPrice('');
      setNewPkgDesc('');

    } catch (err: any) {
      setNewPkgError(err.message || 'Error processing request.');
    } finally {
      setIsCreatingPkg(false);
    }
  };

  // Action: Delete package plan
  const handleDeletePackage = async (packageId: string) => {
    if (!token || !window.confirm('Are you entirely sure you want to remove this bundle offer?')) return;
    try {
      const res = await fetch(`/api/admin/packages/${packageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        triggerNotification('Plan deleted successfully', 'success');
        fetchPackages();
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Action: Toggle package active state
  const handleTogglePackageActive = async (pkg: BundlePackage) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/packages/${pkg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !pkg.isActive })
      });
      if (res.ok) {
        triggerNotification(`Package updated state!`, 'success');
        fetchPackages();
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-yellow-400 font-sans text-slate-900 flex flex-col selection:bg-slate-900 selection:text-yellow-400" id="main-view-wrapper">
      
      {/* Dynamic Top Floating Notification Bar */}
      {notifText && (
        <div className="fixed top-20 right-4 z-[60] max-w-sm w-full bg-slate-900 border-l-4 border-yellow-400 p-4 rounded-lg shadow-xl text-yellow-100 flex items-start gap-2.5 animate-slide-in" id="toast-notif">
          <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-semibold leading-relaxed">{notifText}</p>
        </div>
      )}

      {/* Top sticky navbar */}
      <Navbar 
        currentUser={currentUser}
        onOpenAuth={(view) => {
          setInitialAuthTab(view);
          setIsAuthOpen(true);
        }}
        onLogout={handleLogout}
        currentTab={currentTab}
        successNotificationCount={successNotifications.length}
        onChangeTab={(tab) => {
          if (tab === 'dashboard' || tab === 'admin') {
            if (!currentUser) {
              setInitialAuthTab('login');
              setIsAuthOpen(true);
              triggerNotification('Please login to explore active dashboards.', 'info');
              return;
            }
          }
          if (tab === 'dashboard') {
            setSuccessNotifications([]); // Clear badge on navigation
          }
          setCurrentTab(tab);
        }}
      />

      {/* Primary body view content */}
      <main className="flex-1 w-full" id="main-content-fluid">
        
        {/* VIEW 1: HOME VIEW */}
        {currentTab === 'home' && (
          <div className="animate-fade-in" id="home-view-fragment">
            
            {/* HERO BRAND HEADER */}
            <section className="bg-slate-900 text-white pt-10 pb-16 px-4 md:px-8 border-b-8 border-yellow-500 rounded-b-[2rem] shadow-xl relative overflow-hidden" id="hero-banner">
              {/* Background abstract circles for professional flare */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none"></div>

              <div className="max-w-4xl mx-auto text-center relative z-10">
                <span className="inline-flex items-center gap-1 bg-amber-400/10 text-yellow-400 rounded-full px-3 py-1 text-xs font-extrabold tracking-wider uppercase mb-5 border border-yellow-400/20">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  Fast Instant Delivery Reseller Systems
                </span>
                
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase leading-none" id="brand-headline">
                  REALITY<span className="text-yellow-400">-BEST</span>
                </h1>
                
                <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
                  Ghana's premier reselling hub. Secure instant top-ups, cheap MTN AFA registration, AT iShare data, Telecel plans and airtime at premium reduced rates.
                </p>

                {/* Micro Action Buttons */}
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <button 
                    onClick={() => openPurchaseWorkflow('airtime')} 
                    className="px-6 py-3 bg-yellow-400 text-slate-950 font-extrabold text-sm sm:text-base rounded-xl hover:bg-yellow-300 transition-all active:scale-95 flex items-center gap-2 shadow-lg"
                    id="hero-buy-airtime-btn"
                  >
                    <PhoneCall className="w-4 h-4" />
                    Buy Airtime (Now)
                  </button>
                  <button 
                    onClick={() => {
                      const container = document.getElementById('telecom-grid');
                      container?.scrollIntoView({ behavior: 'smooth' });
                    }} 
                    className="px-6 py-3 bg-slate-800 text-white hover:bg-slate-700 transition-all font-bold text-sm sm:text-base rounded-xl flex items-center gap-2 border border-slate-700"
                  >
                    <Wifi className="w-4 h-4 text-yellow-400" />
                    Browse Bundle Plans
                  </button>
                </div>
              </div>
            </section>

            {/* QUICK ACTIONS & ORDER TRACKING SECTION */}
            <section className="max-w-4xl mx-auto -mt-8 px-4 relative z-20" id="quick-actions-tracking">
              <div className="bg-white rounded-2xl shadow-xl p-5 border border-slate-100">
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-yellow-400 text-slate-900 rounded-lg font-bold">
                      <Search className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-950 uppercase tracking-tight">
                        Instant Tracking Portal
                      </h3>
                      <p className="text-xs text-slate-500">
                        Input any Order reference ID code or transaction number to view instant fulfillment logs
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleTrackRef} className="flex gap-2" id="order-search-form">
                    <input
                      type="text"
                      required
                      placeholder="e.g. RB-0544521401-AFA30 or MoMo TXN ID"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      className="flex-1 px-4 py-2 text-sm border-2 border-slate-100 focus:border-slate-800 bg-slate-50 outline-none rounded-xl text-slate-900 font-semibold"
                      id="order-search-input"
                    />
                    <button
                      type="submit"
                      disabled={isTracking}
                      className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-yellow-400 font-extrabold text-xs sm:text-sm uppercase tracking-wide rounded-xl transition-all disabled:opacity-50"
                      id="order-search-submit"
                    >
                      {isTracking ? 'Searching...' : 'Track Order'}
                    </button>
                  </form>

                  {/* Tracking Search Result Output Display */}
                  {trackResult && (
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 text-xs text-slate-800 animate-slide-in" id="track-result-output">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="font-bold text-slate-900">Tracking Reference Search Result</span>
                        <button 
                          onClick={() => setTrackResult(null)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                        >
                          Clear
                        </button>
                      </div>

                      {trackResult.found ? (
                        <div className="pt-2.5 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              trackResult.data.status === 'Success' || trackResult.data.status === 'Approved'
                                ? 'bg-green-100 text-green-700'
                                : trackResult.data.status === 'Pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              ● {trackResult.data.status}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(trackResult.data.createdAt || trackResult.data.date).toLocaleString()}
                            </span>
                          </div>

                          {trackResult.type === 'transaction' ? (
                            <div className="grid grid-cols-2 gap-y-1.5 text-slate-700">
                              <div><strong>Reference Code:</strong></div>
                              <div className="font-mono text-slate-950 font-semibold">{trackResult.data.referenceId}</div>
                              <div><strong>Telecom Network:</strong></div>
                              <div className="font-semibold text-slate-950">{trackResult.data.network}</div>
                              <div><strong>Service Pack:</strong></div>
                              <div>{trackResult.data.serviceName}</div>
                              <div><strong>Amount Charged:</strong></div>
                              <div className="text-slate-950 font-bold">GH₵ {trackResult.data.amount.toFixed(2)}</div>
                              <div><strong>Recipient Number:</strong></div>
                              <div className="font-mono text-slate-950">{trackResult.data.recipientPhone}</div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-y-1.5 text-slate-700">
                              <div><strong>Ref Code:</strong></div>
                              <div className="font-mono text-slate-950 font-semibold">{trackResult.data.referenceId}</div>
                              <div><strong>Funder Email:</strong></div>
                              <div>{trackResult.data.userEmail}</div>
                              <div><strong>Payment Route:</strong></div>
                              <div>{trackResult.data.paymentMethod}</div>
                              <div><strong>Transaction ID:</strong></div>
                              <div className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">{trackResult.data.transactionId}</div>
                              <div><strong>Funding Amount:</strong></div>
                              <div className="text-green-600 font-black">GH₵ {trackResult.data.amount.toFixed(2)}</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="pt-2 text-red-600 font-semibold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>{trackResult.error}</span>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </section>

            {/* FEATURED SERVICE CARD */}
            <section className="max-w-4xl mx-auto px-4 mt-8" id="featured-promo">
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border-t-4 border-yellow-400 relative overflow-hidden">
                <div className="absolute top-0 right-0 py-1.5 px-3 bg-yellow-400 text-slate-950 text-[10px] font-black uppercase rounded-bl-xl tracking-wider">
                  Featured Best Seller
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-lg">
                    <span className="text-yellow-400 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest block">
                      MTN Reselling Advantage
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight uppercase">
                      Airtime for AFA registration Bundle
                    </h2>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      Instant verification on MTN Ghana. Unlocks monthly free Socials, high priority custom VoIP, and un-expiring 5GB data pack allocations. Perfect for retailers and personal partners.
                    </p>
                    <div className="flex items-center gap-4 pt-2">
                      <div className="text-yellow-400">
                        <span className="text-xs text-slate-300 block">Offer price</span>
                        <strong className="text-2xl font-black tracking-tight font-mono">GH₵ 30.00</strong>
                      </div>
                      <div className="border-l border-slate-700 h-10"></div>
                      <div>
                        <span className="text-xs text-slate-300 block">Validity</span>
                        <strong className="text-xs text-white uppercase bg-slate-800 px-2 py-1 rounded">30 Days Duration</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <button
                      onClick={() => {
                        const afaPkg = packages.find(p => p.name.includes('AFA') || p.price === 30);
                        openPurchaseWorkflow('data', afaPkg);
                      }}
                      className="w-full sm:w-auto px-6 py-4 bg-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl hover:bg-yellow-300 transition-all transform active:scale-95 shadow-md flex items-center justify-center gap-2"
                      id="featured-afa-btn"
                    >
                      <Layers className="w-4 h-4 text-slate-950" />
                      Register with AFA
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* MAIN TELECOM SERVICES GRID */}
            <section className="max-w-4xl mx-auto px-4 py-12" id="telecom-services-portal">
              <div className="text-center md:text-left mb-6">
                <h2 className="text-2xl font-black text-slate-950 tracking-tight uppercase" id="telecom-grid">
                  Telecom Services & Data Packages
                </h2>
                <p className="text-xs text-slate-700 mt-1 font-medium">
                  We process direct network distribution instant delivery. Secure transactions starting down from GH₵ 1.00
                </p>
              </div>

              {isLoadingPackages ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-800 font-bold gap-3" id="loading-spinner">
                  <RefreshCw className="w-8 h-8 animate-spin text-slate-900" />
                  <span>Loading network reseller pricing...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" id="telecom-pricing-bundle-grid">
                  
                  {/* DYNAMIC PACKAGE MAP */}
                  {packages.filter(p => p.isActive).map((pkg) => (
                    <div 
                      key={pkg.id}
                      className="bg-white rounded-2xl p-4 shadow hover:shadow-lg border border-slate-100 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Network pill indicator */}
                        <div className="flex justify-between items-start mb-3">
                          <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${
                            pkg.network === 'MTN' 
                              ? 'bg-yellow-400/20 text-yellow-800 border border-yellow-300' 
                              : pkg.network === 'AT' 
                              ? 'bg-red-400/10 text-red-700 border border-red-300' 
                              : 'bg-blue-400/10 text-blue-700 border border-blue-300'
                          }`}>
                            {pkg.network} Bundle
                          </span>
                          <span className="text-xs font-bold text-slate-400 uppercase font-mono tracking-tighter">
                            {pkg.duration}
                          </span>
                        </div>

                        {/* Name and size details */}
                        <h4 className="text-sm font-extrabold text-slate-950 line-clamp-1 uppercase">
                          {pkg.name}
                        </h4>
                        
                        <div className="my-2 bg-slate-50 rounded-lg p-2 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500">Allocation:</span>
                          <span className="text-xs font-black text-slate-800">{pkg.dataSize}</span>
                        </div>

                        {pkg.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-normal">
                            {pkg.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-slate-900">
                          <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-tight">Direct Cost</span>
                          <strong className="text-sm font-bold font-mono">GH₵ {pkg.price.toFixed(2)}</strong>
                        </div>
                        <button
                          onClick={() => openPurchaseWorkflow('data', pkg)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-yellow-400 uppercase tracking-widest rounded-lg transition-transform active:scale-95"
                        >
                          Buy Plan
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* QUICK AIRTIME PURCHASING CARDS */}
                  <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border-l-4 border-yellow-400 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="bg-yellow-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase font-mono">
                          ALL NETWORKS
                        </span>
                        <span className="text-xs font-mono font-bold text-yellow-400">
                          Direct Top-up
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">
                        Quick Airtime Transfer
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-1 lines-clamp-3 leading-relaxed">
                        Top up any Ghanaian mobile card with airtime instantly. Secure direct delivery for MTN, AT, & Telecel numbers.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Min Purchase</span>
                        <strong className="text-sm font-mono text-yellow-400">GH₵ 1.00</strong>
                      </div>
                      <button
                        onClick={() => openPurchaseWorkflow('airtime')}
                        className="px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-[11px] font-black uppercase tracking-widest rounded-lg"
                      >
                        Buy Airtime
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </section>

          </div>
        )}


        {/* VIEW 2: CUSTOMER DASHBOARD PANEL */}
        {currentTab === 'dashboard' && currentUser && (
          <div className="animate-fade-in max-w-4xl mx-auto px-4 py-8" id="dashboard-view-fragment">
            
            {/* USER PORTAL WELCOME HEADER */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden" id="dashboard-welcome">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-2xl"></div>
              <div>
                <span className="text-[10px] uppercase font-bold text-yellow-400 tracking-wider">
                  Verified Retail Reseller Wallet
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase">
                  Hello, {currentUser.fullName}!
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {currentUser.id} | Ghana Mobile No: {currentUser.phone}
                </p>
              </div>

              {/* Instant Fund triggers */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setDepositError('');
                    setDepositSuccess('');
                    setIsDepositModalOpen(true);
                  }}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-transform active:scale-95"
                  id="dash-fund-wallet-btn"
                >
                  Fund My Wallet
                </button>
                <button
                  onClick={fetchUserLogs}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                  title="Force Refresh Data Logs"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* REAL-TIME SUCCESS NOTIFICATION BADGE BOARD */}
            {dashboardAlerts.length > 0 && (
              <div className="mt-6 bg-green-50 border border-green-200 text-green-950 p-4 rounded-xl shadow-sm animate-fade-in flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="dashboard-success-badge-panel">
                <div className="flex items-start gap-3">
                  <div className="relative flex h-3 w-3 mt-1 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </div>
                  <div>
                    <strong className="block font-black text-sm text-green-900">
                      🎉 Real-Time Fulfillment Success! ({dashboardAlerts.length})
                    </strong>
                    <div className="mt-1 text-xs text-green-800 space-y-1 font-medium">
                      {dashboardAlerts.map((da, idx) => (
                        <div key={da.id || idx} className="flex flex-wrap items-center gap-1">
                          <span className="bg-green-100 hover:bg-green-200 text-green-950 px-1.5 py-0.2 rounded font-mono text-[10px]">
                            {da.referenceId}
                          </span>
                          <span>{da.serviceName} delivered to <strong>{da.recipientPhone}</strong> ({new Date(da.date).toLocaleTimeString()})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setDashboardAlerts([])}
                  className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition shadow-sm active:scale-95 flex-shrink-0 align-self-end sm:alt-auto"
                >
                  Clear Alerts
                </button>
              </div>
            )}

            {/* ACCOUNT BALANCES & REVENUE BENTO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6" id="dashboard-balance-cards">
              
              {/* CURRENT WALLET CARD */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">Available Cash</span>
                  <div className="text-2xl font-black text-slate-950 font-mono">
                    GH₵ {currentUser.walletBalance.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    Fast automatic payments instant deduction
                  </span>
                </div>
                <div className="bg-yellow-400 text-slate-950 p-3 rounded-full font-black">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              {/* COUNT CARD */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">Fulfillment Count</span>
                  <div className="text-2xl font-black text-slate-950 font-mono">
                    {userTransactions.length}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    Completed telecom distributions delivery
                  </span>
                </div>
                <div className="bg-slate-900 text-yellow-400 p-3 rounded-full font-black">
                  <Check className="w-6 h-6" />
                </div>
              </div>

              {/* MOMO REPLICATE CARD */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow sm:col-span-2 md:col-span-1 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase mb-2">My Connected Number</span>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                  <strong className="text-sm font-mono text-slate-800">{currentUser.phone}</strong>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Used by default as default payout channel or order logs identifier.
                </p>
              </div>

            </div>

            {/* SERVICE QUICK TRIGGERS DASH SECTION */}
            <div className="mt-8 bg-slate-900 text-white rounded-2xl p-5" id="dashboard-quick-buy">
              <h3 className="text-sm font-black uppercase text-yellow-450 tracking-wider mb-3">
                Quick Reseller Payouts
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  onClick={() => openPurchaseWorkflow('airtime')}
                  className="p-3 bg-slate-850 hover:bg-slate-800 rounded-xl transition text-center flex flex-col items-center gap-1 border border-slate-800"
                >
                  <Smartphone className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs font-bold font-mono">Buy Airtime</span>
                </button>
                <button
                  onClick={() => {
                    const mtnAf = packages.find(p => p.network === 'MTN' && p.isActive);
                    openPurchaseWorkflow('data', mtnAf);
                  }}
                  className="p-3 bg-slate-855 hover:bg-slate-800 rounded-xl transition text-center flex flex-col items-center gap-1 border border-slate-800"
                >
                  <Layers className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs font-bold font-mono">MTN Data</span>
                </button>
                <button
                  onClick={() => {
                    const atIs = packages.find(p => p.network === 'AT' && p.isActive);
                    openPurchaseWorkflow('data', atIs);
                  }}
                  className="p-3 bg-slate-855 hover:bg-slate-800 rounded-xl transition text-center flex flex-col items-center gap-1 border border-slate-800"
                >
                  <Wifi className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs font-bold font-mono">AT iShare</span>
                </button>
                <button
                  onClick={() => {
                    const telD = packages.find(p => p.network === 'Telecel' && p.isActive);
                    openPurchaseWorkflow('data', telD);
                  }}
                  className="p-3 bg-slate-855 hover:bg-slate-800 rounded-xl transition text-center flex flex-col items-center gap-1 border border-slate-800"
                >
                  <ArrowUpRight className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs font-bold font-mono">Telecel Box</span>
                </button>
              </div>
            </div>

            {/* TRANSACTIONS & DEPOSIT HISTORY */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-tables-split">
              
              {/* TRANSACTION ORDER HISTORY */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center bg-slate-900 text-white rounded-t-xl px-4 py-3 border-b-2 border-yellow-400">
                  <h3 className="font-extrabold text-xs uppercase sm:text-sm tracking-wide">
                    My Telecom Purchase Swaps
                  </h3>
                  <span className="text-[10px] font-mono text-yellow-400 font-bold bg-slate-800 px-2 py-0.5 rounded-full">
                    Total: {userTransactions.length}
                  </span>
                </div>

                {isLoadingUserRecords ? (
                  <div className="text-center py-6 text-slate-800 font-bold text-xs bg-white rounded-b-xl border border-slate-100 shadow">
                    Querying transactions...
                  </div>
                ) : userTransactions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs bg-white rounded-b-xl border border-slate-100 p-6 flex flex-col items-center gap-2">
                    <Database className="w-6 h-6 text-slate-350" />
                    <strong>No telecom purchases logged.</strong>
                    <span>Your transactions list is empty. Click browse packages to start buying!</span>
                  </div>
                ) : (
                  <div className="bg-white rounded-b-xl overflow-hidden shadow border border-slate-100 divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                    {userTransactions.map((tx) => (
                      <div key={tx.id} className="p-3.5 flex justify-between items-start hover:bg-slate-50 transition-colors text-xs text-slate-800">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-950 uppercase">{tx.network} {tx.serviceType}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{tx.referenceId}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Recipient Number: <strong className="font-mono text-slate-700">{tx.recipientPhone}</strong>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(tx.date).toLocaleString()}
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="text-slate-950 font-black font-mono">
                            GH₵ {tx.amount.toFixed(2)}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                            tx.status === 'Success' 
                              ? 'bg-green-100 text-green-800' 
                              : tx.status === 'Pending' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MOBILE MONEY INCOME DEPOSIT REQUESTS */}
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-900 text-white rounded-t-xl px-4 py-3 border-b-2 border-yellow-400">
                  <h3 className="font-extrabold text-xs uppercase sm:text-sm tracking-wide">
                    Manual MOMO Funding Slips
                  </h3>
                  <button 
                    onClick={() => setIsDepositModalOpen(true)}
                    className="p-1 hover:bg-slate-800 text-yellow-400 rounded transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {isLoadingUserRecords ? (
                  <div className="text-center py-6 text-slate-850 font-bold text-xs bg-white rounded-b-xl border border-slate-100 shadow">
                    Querying slips...
                  </div>
                ) : userDeposits.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs bg-white rounded-b-xl border border-slate-100 p-4">
                    <span>No deposit slip logged. click top fund button to log Mobile Money transaction ID.</span>
                  </div>
                ) : (
                  <div className="bg-white rounded-b-xl overflow-hidden shadow border border-slate-150 divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                    {userDeposits.map((dep) => (
                      <div key={dep.id} className="p-3 flex flex-col gap-1.5 hover:bg-slate-50 transition text-xs text-slate-800">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-indigo-700 font-mono text-[10px]">
                            {dep.referenceId}
                          </span>
                          <strong className="text-green-600 font-black font-mono">
                            +GH₵ {dep.amount.toFixed(2)}
                          </strong>
                        </div>

                        <div className="text-[10px] text-slate-500 space-y-0.5">
                          <div>Gateway: <strong>{dep.paymentMethod}</strong></div>
                          <div>TxID code: <code className="bg-slate-50 px-1 py-0.2 rounded text-slate-700">{dep.transactionId}</code></div>
                          <div className="text-[9px] text-slate-405">{new Date(dep.createdAt).toLocaleDateString()}</div>
                        </div>

                        <div className="pt-1 flex items-center justify-between">
                          <span className={`px-2 py-0.2 text-[9px] font-black rounded-full ${
                            dep.status === 'Approved'
                              ? 'bg-green-100 text-green-800'
                              : dep.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {dep.status}
                          </span>
                          {dep.status === 'Approved' && (
                            <span className="text-[8px] text-slate-400 capitalize">confirmed sandbox</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}


        {/* VIEW 3: ADMIN CONFIGURATION CONTROLS */}
        {currentTab === 'admin' && currentUser && currentUser.role === 'admin' && (
          <div className="animate-fade-in max-w-6xl mx-auto px-4 py-8" id="admin-view-fragment">
            
            <div className="bg-slate-900 text-yellow-400 rounded-2xl p-6 shadow-xl mb-8 border-b-4 border-yellow-500" id="admin-welcome">
              <span className="inline-block bg-yellow-400/20 text-yellow-300 font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full mb-1">
                Security Operator Access Level
              </span>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                System Operator Admin Dashboard
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Audit transactions, adjust wallet balances, create/update bundle pricing plans and instantaneously authorize mobile money cash deposits into system registers.
              </p>
            </div>

            {/* REAL-TIME TOTAL REVENUE STATISTICS PANEL */}
            {adminStats ? (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8" id="admin-reporting-grid">
                
                <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Gross Vol Cash In</span>
                  <div className="text-lg font-black text-slate-950 font-mono mt-1">
                    GH₵ {adminStats.totalVolume.toFixed(2)}
                  </div>
                  <p className="text-[9px] text-green-600 mt-0.5">Approved Momo slips volume</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Reseller Outflow</span>
                  <div className="text-lg font-black text-slate-950 font-mono mt-1">
                    GH₵ {adminStats.totalSales.toFixed(2)}
                  </div>
                  <p className="text-[9px] text-blue-600 mt-0.5">Successfully delivered volume</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-yellow-600">MTN Cedis Vol</span>
                  <div className="text-lg font-black text-slate-950 font-mono mt-1">
                    GH₵ {adminStats.mtnSales.toFixed(2)}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">MTN networks</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-indigo-600">AT Cedis Vol</span>
                  <div className="text-lg font-black text-slate-950 font-mono mt-1">
                    GH₵ {adminStats.atSales.toFixed(2)}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">AirtelTigo distribution</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow border border-slate-100 col-span-2 lg:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-red-600">Telecel Cedis Vol</span>
                  <div className="text-lg font-black text-slate-950 font-mono mt-1">
                    GH₵ {adminStats.telecelSales.toFixed(2)}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">Telecel network</p>
                </div>

              </div>
            ) : (
              <div className="bg-white p-4 text-center rounded-xl font-bold font-mono text-xs text-slate-500 mb-8">
                Reading statistics aggregates...
              </div>
            )}

            {/* MANUAL MoMo FUNDING AUTHORIZER SLIPS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="admin-action-split">
              
              {/* DEPOSIT AUTHORIZER STREAM */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-900 text-white rounded-t-xl px-4 py-3 flex justify-between items-center border-b border-yellow-400">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider">
                    Authorise Mobile Money Funding Slips
                  </h3>
                  <span className="bg-yellow-450 text-slate-950 text-[10px] font-mono px-2 py-0.5 rounded font-black uppercase">
                    Sandbox
                  </span>
                </div>

                {adminDeposits.length === 0 ? (
                  <div className="bg-white rounded-b-xl p-8 text-center text-slate-400 text-xs border">
                    No customers have uploaded Mobile Money deposits yet.
                  </div>
                ) : (
                  <div className="bg-white rounded-b-xl border overflow-hidden divide-y divide-slate-150 shadow max-h-[400px] overflow-y-auto">
                    {adminDeposits.map((dep) => (
                      <div key={dep.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 text-slate-700 font-bold rounded">
                              {dep.referenceId}
                            </span>
                            <span className="text-[10px] text-slate-500">{dep.userEmail}</span>
                          </div>
                          
                          <div className="mt-1.5 text-[10px] text-slate-600 space-y-0.5">
                            <div>Gateway Provider: <strong className="text-slate-800">{dep.paymentMethod}</strong></div>
                            <div>Reference TxID: <code className="bg-indigo-50 font-bold text-indigo-700 px-1 rounded">{dep.transactionId}</code></div>
                            <div>Submitted: <span className="text-slate-400 font-mono">{new Date(dep.createdAt).toLocaleString()}</span></div>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-2 shrink-0">
                          <strong className="text-lg font-black font-mono text-green-600">
                            GH₵ {dep.amount.toFixed(2)}
                          </strong>

                          {dep.status === 'Pending' ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDepositAction(dep.id, 'Approved')}
                                className="px-2.5 py-1 text-[10px] font-black uppercase bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm"
                              >
                                Approve Direct Cash
                              </button>
                              <button
                                onClick={() => handleDepositAction(dep.id, 'Rejected')}
                                className="px-2 py-1 text-[10px] font-black uppercase bg-red-100 hover:bg-red-200 text-red-700 rounded-md"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <span className={`px-2.5 py-0.2 rounded-full text-[10px] font-bold ${
                              dep.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {dep.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* USER BALANCE ADJUSTMENTS SECTION */}
              <div className="space-y-4">
                <div className="bg-slate-900 text-white rounded-t-xl px-4 py-3 border-b border-yellow-400">
                  <h3 className="font-extrabold text-xs uppercase tracking-widest">
                    Quick User Balance Editor
                  </h3>
                </div>

                <div className="bg-white rounded-b-xl border p-4 shadow space-y-4 text-xs font-medium text-slate-800">
                  <p className="text-[11px] text-slate-500">
                    Instantly modify wallet balance of registered customers for debugging or custom overrides.
                  </p>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Select Customer
                    </label>
                    <select
                      className="w-full border p-2 bg-slate-50 rounded-lg text-xs"
                      onChange={(e) => {
                        const usr = adminUsers.find(u => u.id === e.target.value);
                        setAdminSelectedUser(usr || null);
                        if (usr) setAdminAdjustBalanceAmount(usr.walletBalance.toString());
                      }}
                      value={adminSelectedUser?.id || ''}
                    >
                      <option value="">-- Choose active account --</option>
                      {adminUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.phone}) - Bal: GH₵ {u.walletBalance.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {adminSelectedUser && (
                    <form onSubmit={handleModifyUserBalance} className="space-y-3 pt-2 border-t text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Name</span>
                        <strong>{adminSelectedUser.fullName} ({adminSelectedUser.email})</strong>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                          Set Absolute Balance (GH₵)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={adminAdjustBalanceAmount}
                          onChange={(e) => setAdminAdjustBalanceAmount(e.target.value)}
                          className="w-full p-2 border-2 rounded-lg font-mono text-sm"
                        />
                      </div>

                      <div className="flex gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setAdminSelectedUser(null)}
                          className="flex-1 py-2 bg-slate-150 hover:bg-slate-200 border rounded-lg font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={adminIsSubmittingUserAdjust}
                          className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-lg shadow-sm"
                        >
                          {adminIsSubmittingUserAdjust ? 'Saving...' : 'Update Balance'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

            </div>


            {/* SYSTEM ACTIVE TELECOM PACKAGES MANAGEMENT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12" id="admin-packages-configuration">
              
              {/* CURRENT RESELL PLANS */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-900 text-white rounded-t-xl px-4 py-3 border-b border-yellow-400">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider">
                    Published Telecom Offer Preset Lists
                  </h3>
                </div>

                <div className="bg-white rounded-b-xl border overflow-hidden shadow divide-y divide-slate-100">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="p-4 flex justify-between items-center text-xs text-slate-800">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 font-bold text-[9px] uppercase tracking-wide rounded ${
                            pkg.network === 'MTN' ? 'bg-yellow-105 bg-yellow-400/20 text-yellow-805' : 'bg-slate-100'
                          }`}>
                            {pkg.network} Bundle
                          </span>
                          <strong className="text-slate-950 font-bold capitalize">{pkg.name}</strong>
                          <span className="text-[10px] text-slate-400">({pkg.dataSize})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{pkg.description}</p>
                        <div className="text-[10px] text-slate-400 mt-0.5">Validity cycle: {pkg.duration}</div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                        <strong className="text-sm font-black font-mono">GH₵ {pkg.price.toFixed(2)}</strong>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleTogglePackageActive(pkg)}
                            className={`px-2.5 py-0.5 text-[9px] font-black uppercase rounded ${
                              pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {pkg.isActive ? 'Live' : 'Paused'}
                          </button>
                          <button 
                            onClick={() => handleDeletePackage(pkg.id)}
                            className="p-1 hover:bg-red-50 text-red-500 rounded"
                            title="Remove Packet"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CREATE BUNDLE/REGISTRATION FORM */}
              <div className="space-y-4">
                <div className="bg-slate-900 text-white rounded-t-xl px-4 py-3 border-b border-yellow-400">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider">
                    Publish New Bundle Presets
                  </h3>
                </div>

                <div className="bg-white rounded-b-xl border p-4 shadow-md text-xs">
                  {newPkgError && (
                    <div className="mb-3.5 p-2 bg-red-50 border border-red-200 text-red-600 rounded flex gap-1 items-start">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{newPkgError}</span>
                    </div>
                  )}

                  {newPkgSuccess && (
                    <div className="mb-3.5 p-2 bg-green-50 border border-green-200 text-green-700 rounded select-none">
                      {newPkgSuccess}
                    </div>
                  )}

                  <form onSubmit={handleCreatePackage} className="space-y-3 text-slate-800">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Telecom Operator Grid
                      </label>
                      <select
                        className="w-full border p-2 bg-slate-50 rounded-lg text-xs"
                        value={newPkgNetwork}
                        onChange={(e) => setNewPkgNetwork(e.target.value as NetworkType)}
                      >
                        <option value="MTN">MTN Ghana</option>
                        <option value="AT">AT (AirtelTigo) Ghana</option>
                        <option value="Telecel">Telecel Ghana</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                        Package Display Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MTN Bossu Special 5G"
                        value={newPkgName}
                        onChange={(e) => setNewPkgName(e.target.value)}
                        className="w-full border p-2 bg-slate-50 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                        Allocation Data Size
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 15 GB, Unlimited VoIP"
                        value={newPkgSize}
                        onChange={(e) => setNewPkgSize(e.target.value)}
                        className="w-full border p-2 bg-slate-50 rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                          Price Code (GH₵)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="30.00"
                          value={newPkgPrice}
                          onChange={(e) => setNewPkgPrice(e.target.value)}
                          className="w-full border p-2 bg-slate-50 rounded-lg font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                          Validity Period
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 30 Days"
                          value={newPkgDuration}
                          onChange={(e) => setNewPkgDuration(e.target.value)}
                          className="w-full border p-2 bg-slate-50 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                        Detailed Description (Optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Add information about voice calls, internet speed, AFA affiliation etc."
                        value={newPkgDesc}
                        onChange={(e) => setNewPkgDesc(e.target.value)}
                        className="w-full border p-2 bg-slate-50 rounded-lg text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isCreatingPkg}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-yellow-300 font-extrabold uppercase tracking-widest rounded-lg mt-2 shadow"
                    >
                      {isCreatingPkg ? 'Publishing Preset...' : 'Launch Package Plan'}
                    </button>
                  </form>
                </div>
              </div>

            </div>


            {/* SYSTEM ORDER FULFILLMENT STREAM logs */}
            <div className="mt-12 bg-white rounded-xl shadow border overflow-hidden" id="admin-orders-stream">
              <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center border-b border-yellow-405">
                <h3 className="font-extrabold text-xs uppercase tracking-wider">
                  Global System Purchase Fulfillment Stream
                </h3>
                <span className="text-[10px] font-mono text-slate-300">
                  Total Orders Audited: {adminTransactions.length}
                </span>
              </div>

              {adminTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No purchases compiled in system logs.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto text-xs">
                  {adminTransactions.map((tx) => (
                    <div key={tx.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                            tx.network === 'MTN' ? 'bg-yellow-400 text-slate-950 px-1.5' : 'bg-slate-800 text-white px-1.5'
                          }`}>
                            {tx.network} {tx.serviceType}
                          </span>
                          <span className="font-bold font-mono text-[11px] text-slate-700">{tx.referenceId}</span>
                        </div>

                        <div className="text-[10px] text-slate-600 space-y-0.5">
                          <div>Fulfillment target: <strong className="font-mono text-slate-800">{tx.recipientPhone}</strong></div>
                          <div>Customer: <strong className="text-slate-700">{tx.userEmail} ({tx.userPhone})</strong></div>
                          <div>Offer: <span>{tx.serviceName}</span></div>
                          <div className="text-[9px] text-slate-400 font-mono">{new Date(tx.date).toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-2 shrink-0">
                        <strong className="text-base font-black font-mono text-slate-900">
                          GH₵ {tx.amount.toFixed(2)}
                        </strong>

                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-black ${
                            tx.status === 'Success' ? 'bg-green-105 text-green-800' : 'bg-red-105 text-red-808'
                          }`}>
                            {tx.status}
                          </span>
                          
                          {/* Fail/Refund button inside fullstack sandbox */}
                          {tx.status === 'Success' ? (
                            <button
                              onClick={() => handleTransactionStatusAction(tx.id, 'Failed')}
                              className="px-2 py-0.5 border border-red-200 text-red-600 rounded bg-red-50 hover:bg-red-100 text-[9px] font-black uppercase"
                              title="Set status to Fail and issue automated instant Cedi wallet refund."
                            >
                              Fail/Refund
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTransactionStatusAction(tx.id, 'Success')}
                              className="px-2 py-0.5 border border-green-200 text-green-700 rounded bg-green-50 hover:bg-green-100 text-[9px] font-black uppercase"
                              title="Re-process order deduction."
                            >
                              Succeed
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* FOOTER AREA */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 md:px-8 border-t border-slate-800" id="footer-system">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 text-center sm:text-left">
          
          <div className="space-y-1">
            <h4 className="text-base font-extrabold tracking-tight text-white uppercase">
              REALITY<span className="text-yellow-405 text-yellow-400">-BEST</span> GHANA
            </h4>
            <p className="text-xs text-slate-400">
              Approved Reseller of Airtime, Bundles & AFA Affiliations.
            </p>
          </div>

          <div className="text-xs space-y-1.5 font-mono">
            <div>Licensed Sandbox API Provider v2.1</div>
            <div>Time Zone Sync: UTC (Accra)</div>
            <div className="text-[10px] text-slate-500">© 2026 Reality-Best. Built beautifully for responsive mobile users.</div>
          </div>

        </div>
      </footer>


      {/* ==================== POPUP WORKFLOW MODALS ==================== */}

      {/* 1. SECURED SIGN-IN/SIGN-UP FORM MODAL */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialTab={initialAuthTab}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* 2. TRANSACTION AND AIRTIME TRANSFER PURCHASE MODAL */}
      {purchaseType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" id="purchase-popup-overlay">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border flex flex-col" id="purchase-popup-card">
            
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center border-b-2 border-yellow-400">
              <div>
                <h4 className="font-extrabold uppercase tracking-tight text-sm">
                  {purchaseType === 'airtime' ? 'Instant Airtime Top-Up' : 'Confirm Data Bundle'}
                </h4>
                <p className="text-[10px] text-yellow-400 font-mono">Reselling Transfer Channels</p>
              </div>
              <button 
                onClick={() => {
                  setPurchaseType(null);
                  setSelectedPackage(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[85vh] space-y-4 text-xs font-semibold">
              
              {/* Balance prompt helper */}
              {currentUser && (
                <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center text-slate-800 border">
                  <span>Your Balance:</span>
                  <strong className="text-slate-950 font-mono text-sm">
                    GH₵ {currentUser.walletBalance.toFixed(2)}
                  </strong>
                </div>
              )}

              {purchaseError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-655 text-red-600 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{purchaseError}</span>
                </div>
              )}

              {purchaseSuccess && (
                <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 rounded-lg whitespace-pre-wrap">
                  {purchaseSuccess}
                </div>
              )}

              {/* Purchase Submission form element */}
              {!purchaseSuccess && (
                <form onSubmit={handleSubmitPurchase} className="space-y-4 text-slate-800">
                  
                  {/* Package breakdown display */}
                  {selectedPackage ? (
                    <div className="bg-amber-400/10 border border-amber-400/30 p-3.5 rounded-xl space-y-1.5 text-slate-900">
                      <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">SELECTED PACKAGE</span>
                      <h5 className="font-extrabold uppercase text-[12px]">{selectedPackage.name}</h5>
                      <div className="flex justify-between items-center text-xs">
                        <span>Allocated Volume:</span>
                        <strong className="text-slate-955">{selectedPackage.dataSize}</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-yellow-405/20">
                        <span>Price Deducted:</span>
                        <strong className="text-sm font-black font-mono">GH₵ {selectedPackage.price.toFixed(2)}</strong>
                      </div>
                    </div>
                  ) : (
                    // Airtime selection options
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1">
                          Select Telecom Network
                        </label>
                        <select
                          className="w-full border p-2 bg-slate-50 rounded-lg text-xs"
                          value={airtimeNetwork}
                          onChange={(e) => setAirtimeNetwork(e.target.value as NetworkType)}
                        >
                          <option value="MTN">MTN Ghana</option>
                          <option value="AT">AT (AirtelTigo) Ghana</option>
                          <option value="Telecel">Telecel Ghana</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1">
                          Airtime Top-up Amount (GH₵)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          required
                          value={purchaseAmount}
                          onChange={(e) => setPurchaseAmount(e.target.value)}
                          placeholder="e.g. 5.00, 20.00"
                          className="w-full border-2 p-2.5 rounded-lg bg-slate-50 focus:bg-white text-sm font-mono text-slate-900"
                        />
                        <span className="text-[9px] text-slate-400 font-normal">Enter dynamic value starting down from GH₵ 1.00</span>
                      </div>
                    </div>
                  )}

                  {/* Targeted phone input */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1">
                      Recipient Mobile Phone Number (Ghana)
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0541234567"
                      pattern="[0-9]{9,11}"
                      value={purchasePhone}
                      onChange={(e) => setPurchasePhone(e.target.value)}
                      title="Please specify clean receiver telephone format"
                      className="w-full border-2 p-2.5 rounded-lg bg-slate-50 focus:bg-white text-sm font-mono text-slate-900"
                    />
                    <p className="text-[9px] text-slate-400 font-normal mt-1">
                      Verify correctness of number. Telecomm distributions are irreversibly instant.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingPurchase}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-yellow-400 font-extrabold uppercase tracking-widest rounded-xl transition shadow active:scale-95 text-xs0"
                  >
                    {isSubmittingPurchase ? 'Authorizing Secure Deduction...' : 'Confirm & Deliver Transfer'}
                  </button>

                </form>
              )}

            </div>
          </div>
        </div>
      )}


      {/* 3. WALL DEPOSIT (MoMo FUND SLIP) REQUEST MODAL */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" id="deposit-slip-popup-overlay">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border" id="deposit-slip-popup-card">
            
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center border-b-2 border-yellow-400">
              <div>
                <h4 className="font-extrabold uppercase text-sm">
                  Manual Mobile Money Deposit Slip
                </h4>
                <p className="text-[10px] text-yellow-400">Log Instant Sandbox Wallet Credit</p>
              </div>
              <button 
                onClick={() => setIsDepositModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-semibold">
              <div className="bg-yellow-400/10 border p-3 rounded-lg text-slate-805 space-y-1">
                <strong> Ghana Mobile Money Funding Instructions:</strong>
                <p className="text-[11px] text-slate-650 leading-relaxed font-normal">
                  1. Send the cash value from your wallet to any of our sandbox receiver lines below.
                  <br />
                  2. copy the <strong>Transaction Reference ID (TxID)</strong> code in the carrier SMS.
                  <br />
                  3. Log the credit request below. Sandbox operators review and credit accounts near-instantly!
                </p>
              </div>

              {depositError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded flex gap-1.5 items-start">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{depositError}</span>
                </div>
              )}

              {depositSuccess && (
                <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 rounded-lg select-all">
                  {depositSuccess}
                </div>
              )}

              {!depositSuccess && (
                <form onSubmit={handleSubmitDeposit} className="space-y-4 text-slate-800">
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                        Deposit gateway
                      </label>
                      <select
                        className="w-full border p-2 bg-slate-50 rounded-lg text-xs"
                        value={depositMethod}
                        onChange={(e) => setDepositMethod(e.target.value as any)}
                      >
                        <option value="MTN MoMo">MTN MoMo Cash</option>
                        <option value="Telecel Cash">Telecel Cash</option>
                        <option value="AT Money">AT Money</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                        Fulfillment Value (GH₵)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="50"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full border-2 p-2 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Carrier SMS Transaction Reference / TxID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 15409848529"
                      value={depositTxId}
                      onChange={(e) => setDepositTxId(e.target.value)}
                      className="w-full border-2 p-2.5 rounded-lg bg-slate-50 focus:bg-white text-sm font-mono text-slate-900"
                    />
                    <span className="text-[9px] text-slate-400 font-normal">
                      Type any mock combination for immediate sandbox verification tests.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingDeposit}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-yellow-400 font-extrabold uppercase tracking-widest rounded-xl transition shadow active:scale-95"
                  >
                    {isSubmittingDeposit ? 'Logging slip reference...' : 'Send Funding Slip'}
                  </button>

                </form>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
