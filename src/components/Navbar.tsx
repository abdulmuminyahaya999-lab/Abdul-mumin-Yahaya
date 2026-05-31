import React from 'react';
import { User, LogOut, Shield, DollarSign, Smartphone, Key } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  currentUser: UserType | null;
  onOpenAuth: (view: 'login' | 'register') => void;
  onLogout: () => void;
  currentTab: 'home' | 'dashboard' | 'admin';
  onChangeTab: (tab: 'home' | 'dashboard' | 'admin') => void;
  successNotificationCount?: number;
}

export default function Navbar({
  currentUser,
  onOpenAuth,
  onLogout,
  currentTab,
  onChangeTab,
  successNotificationCount = 0
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand */}
          <div 
            onClick={() => onChangeTab('home')} 
            className="flex items-center gap-2 cursor-pointer group"
            id="nav-logo"
          >
            <div className="bg-yellow-400 p-2 rounded-lg text-slate-900 font-extrabold shadow-sm transition-transform group-hover:scale-105">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-white hover:text-yellow-400 transition-colors">
              REALITY<span className="text-yellow-400">-BEST</span>
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex space-x-1" id="nav-desktop">
            <button
              onClick={() => onChangeTab('home')}
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                currentTab === 'home' 
                  ? 'bg-yellow-400 text-slate-950' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              id="nav-btn-home"
            >
              Home Services
            </button>
            {currentUser && (
              <button
                onClick={() => onChangeTab('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  currentTab === 'dashboard' 
                    ? 'bg-yellow-400 text-slate-950' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                id="nav-btn-dashboard"
              >
                <span>My Account Dashboard</span>
                {successNotificationCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-green-500 px-1 py-0.5 text-[10px] font-bold text-white shadow-md animate-pulse">
                    {successNotificationCount}
                  </span>
                )}
              </button>
            )}
            {currentUser && currentUser.role === 'admin' && (
              <button
                onClick={() => onChangeTab('admin')}
                className={`px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                  currentTab === 'admin' 
                    ? 'bg-yellow-400 text-slate-950' 
                    : 'text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20'
                }`}
                id="nav-btn-admin"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </button>
            )}
          </nav>

          {/* User Section / Action Buttons */}
          <div className="flex items-center gap-3" id="nav-actions">
            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Active Balance indicator */}
                <div 
                  onClick={() => onChangeTab('dashboard')} 
                  className="bg-slate-800 border border-slate-700 hover:border-yellow-400 hover:bg-slate-800/80 transition-colors cursor-pointer px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1.5"
                  title="View your dashboard wallet"
                  id="nav-wallet-pill"
                >
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs sm:text-sm font-mono font-bold text-yellow-400">
                    GH₵ {currentUser.walletBalance.toFixed(2)}
                  </span>
                </div>

                {/* Profile Display / Dropdown */}
                <div className="hidden sm:flex flex-col items-end text-xs">
                  <span className="font-semibold text-slate-200 line-clamp-1">{currentUser.fullName}</span>
                  <span className="text-slate-400 text-[10px] font-mono capitalize px-1.5 py-0.2 bg-slate-800 rounded">
                    {currentUser.role}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 rounded-lg transition-colors"
                  title="Logout from Account"
                  id="nav-btn-logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  id="nav-btn-login"
                >
                  Login
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 text-sm font-bold bg-yellow-400 text-slate-950 hover:bg-yellow-300 rounded-lg shadow-sm transition-all active:scale-95"
                  id="nav-btn-register"
                >
                  Register
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Small screen secondary tab-bar */}
        <div className="flex md:hidden border-t border-slate-800 py-1.5 justify-around text-xs font-semibold" id="nav-mobile-tabs">
          <button
            onClick={() => onChangeTab('home')}
            className={`flex-1 py-1 text-center rounded transition-colors ${
              currentTab === 'home' ? 'text-yellow-400 bg-slate-800' : 'text-slate-400'
            }`}
          >
            Home
          </button>
          {currentUser && (
            <button
              onClick={() => onChangeTab('dashboard')}
              className={`flex-1 py-1 text-center rounded transition-colors flex items-center justify-center gap-1 relative ${
                currentTab === 'dashboard' ? 'text-yellow-400 bg-slate-800' : 'text-slate-400'
              }`}
            >
              <span>Dashboard</span>
              {successNotificationCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-green-500 px-0.5 text-[8px] font-bold text-white shadow-sm animate-pulse">
                  {successNotificationCount}
                </span>
              )}
            </button>
          )}
          {currentUser && currentUser.role === 'admin' && (
            <button
              onClick={() => onChangeTab('admin')}
              className={`flex-1 py-1 text-center rounded transition-colors ${
                currentTab === 'admin' ? 'text-yellow-400 bg-yellow-400/10' : 'text-slate-400'
              }`}
            >
              Admin Config
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
