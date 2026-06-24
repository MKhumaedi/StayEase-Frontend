import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../shared/context/AuthContext';
import { UserRole } from '../types';
import { 
  BarChart3, Users, ShieldCheck, Building2, Bed, Calendar, Star, Bell, Terminal, Settings, LogOut, ArrowLeft, Menu, X, ChevronLeft, ChevronRight, Activity, CreditCard, TrendingUp, Lock, Sparkles, User, Globe
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
  bookingsCount?: number;
  reviewsCount?: number;
  notificationsCount?: number;
}

export default function AdminLayout({ 
  children, 
  activePath, 
  onNavigate,
  bookingsCount = 12,
  reviewsCount = 3,
  notificationsCount = 8
}: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stayease_admin_sidebar_collapsed');
      return saved === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('stayease_admin_sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }

  const groups = [
    {
      id: 'overview',
      title: 'Overview',
      items: [
        { path: '/admin', label: 'Dashboard', icon: BarChart3 }
      ]
    },
    {
      id: 'management',
      title: 'USER MANAGEMENT',
      items: [
        { path: '/admin/users', label: 'Users', icon: Users }
      ]
    },
    {
      id: 'properties-group',
      title: 'PROPERTY MANAGEMENT',
      items: [
        { path: '/admin/properties', label: 'Properties', icon: Building2 }
      ]
    },
    {
      id: 'operations',
      title: 'OPERATIONS',
      items: [
        { path: '/admin/bookings', label: 'Bookings', icon: Calendar, badge: bookingsCount },
        { path: '/admin/reviews', label: 'Reviews', icon: Star, badge: reviewsCount }
      ]
    },
    {
      id: 'financial',
      title: 'FINANCE & PRICING',
      items: [
        { path: '/admin/finance', label: 'Finance', icon: CreditCard },
        { path: '/admin/peak-seasons', label: 'Peak Seasons', icon: Sparkles }
      ]
    },
    {
      id: 'system',
      title: 'SYSTEM',
      items: [
        { path: '/admin/notifications', label: 'Notifications', icon: Bell, badge: notificationsCount },
        { path: '/admin/activity-logs', label: 'Activity Logs', icon: Terminal },
        { path: '/admin/settings', label: 'Settings', icon: Settings }
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    onNavigate('/login');
  };

  // Check if a path corresponds to an active route
  const isRouteActive = (p: string) => {
    if (activePath === p) return true;
    if (p === '/admin/properties' && activePath.startsWith('/admin/properties')) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans" id="admin-enterprise-shell">
      {/* 1. Mobile Top Bar */}
      <div className="md:hidden bg-slate-950 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0" id="admin-mobile-topbar">
        <div className="flex items-center gap-3">
          <span className="bg-indigo-650 bg-indigo-600 p-2 rounded-xl text-white">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white leading-none">StayEase</h1>
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-400">Admin Portal</span>
          </div>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition"
          id="admin-mobile-hamburger"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* 2. Desktop/Tablet Sidebar Drawer & Column */}
      {/* Background slide-over overlay for Mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside 
        className={`
          fixed inset-y-0 left-0 z-[1001] bg-gradient-to-b from-[#0F172A] to-[#111827] text-slate-100 flex flex-col shrink-0 border-r border-slate-800 transition-all duration-300 md:translate-x-0 md:sticky md:top-0 md:h-screen
          ${mobileMenuOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-[80px]' : 'md:w-[280px]'}
        `}
        id="admin-sidebar"
      >
        {/* Branding & Logo Area */}
        <div className="p-5 border-b border-slate-800/60 relative flex items-center justify-between h-18 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <Sparkles className="h-5 w-5" />
            </span>
            {(!isCollapsed || mobileMenuOpen) && (
              <div className="min-w-0 transition-opacity duration-300">
                <h1 className="font-black tracking-tight text-sm text-white select-none">StayEase</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-indigo-300 font-extrabold tracking-widest uppercase">Admin Portal</span>
                  <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded font-mono border border-emerald-500/20">Prod</span>
                </div>
              </div>
            )}
          </div>

          {/* Collapse Trigger desktop only */}
          <button 
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex absolute -right-3 top-6 bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 w-6.5 h-6.5 items-center justify-center rounded-full cursor-pointer transition shadow-md z-[100]"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>

          {/* Close button inside mobile menu drawer */}
          <button 
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Sidebar Scroll Container */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-5" id="sidebar-navigation-container">
          {groups.map((group) => (
            <div key={group.id} className="space-y-1.5">
              {/* Group Title */}
              {(!isCollapsed || mobileMenuOpen) ? (
                <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest select-none">
                  {group.title}
                </h3>
              ) : (
                <div className="border-t border-slate-800/50 my-3 mx-1" />
              )}

              {/* Group Items */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = isRouteActive(item.path);

                  return (
                    <button 
                      key={item.path}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onNavigate(item.path);
                      }}
                      className={`
                        group relative w-full flex items-center justify-start rounded-xl text-xs font-semibold tracking-wide transition duration-200 cursor-pointer focus:outline-hidden
                        ${isCollapsed && !mobileMenuOpen ? 'p-3 justify-center' : 'px-3.5 py-2.5 gap-3.5'}
                        ${isActive 
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-650/15 border-l-3 border-indigo-400' 
                          : 'text-slate-400 hover:bg-slate-800/45 hover:text-white'
                        }
                      `}
                    >
                      {/* Icon */}
                      <IconComponent className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400 transition-colors'}`} />

                      {/* Label - hidden if collapsed on desktop */}
                      {(!isCollapsed || mobileMenuOpen) && (
                        <span className="truncate flex-1 text-left">{item.label}</span>
                      )}

                      {/* Badge if present */}
                      {item.badge !== undefined && item.badge > 0 && (
                        <>
                          {(!isCollapsed || mobileMenuOpen) ? (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                              isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20'
                            }`}>
                              {item.badge}
                            </span>
                          ) : (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 shadow-md ring-1 ring-indigo-300" />
                          )}
                        </>
                      )}

                      {/* Collapsed Tooltip Hover */}
                      {isCollapsed && !mobileMenuOpen && (
                        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-950 text-white text-[10.5px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-[100] shadow-xl border border-slate-800 whitespace-nowrap">
                          {item.label}
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="ml-1.5 text-[9px] text-indigo-405 font-bold bg-indigo-500/10 text-indigo-400 px-1 py-0.2 rounded">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer Widget Area */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-950/20 space-y-2 shrink-0">
          {/* Actions Block */}
          <div className="space-y-2" id="admin-sidebar-footer-actions">
            {(!isCollapsed || mobileMenuOpen) ? (
              <button 
                type="button"
                onClick={() => onNavigate('/')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-bold text-slate-405 text-slate-400 hover:text-white hover:bg-slate-800/40 rounded-xl transition cursor-pointer border border-slate-800/40 bg-slate-900/30"
                id="sidebar-back-to-website-btn"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-slate-400" /> Back to Website
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => onNavigate('/')}
                className="group relative w-full flex items-center justify-center p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/45 rounded-xl transition cursor-pointer"
                id="sidebar-back-to-website-btn-collapsed"
              >
                <ArrowLeft className="h-4.5 w-4.5" />
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-950 text-white text-[10.5px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-[100] shadow-xl border border-slate-800 whitespace-nowrap">
                  Back to Website
                </div>
              </button>
            )}
            
            {(!isCollapsed || mobileMenuOpen) ? (
              <button 
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-bold border border-rose-500/15 bg-rose-500/5 hover:bg-rose-600 text-rose-300 hover:text-white hover:border-transparent rounded-xl transition-all duration-200 cursor-pointer"
                id="sidebar-sign-out-btn"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleLogout}
                className="group relative w-full flex items-center justify-center p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-600 text-rose-300 hover:text-white transition duration-200 cursor-pointer"
                id="sidebar-sign-out-btn-collapsed"
              >
                <LogOut className="h-4.5 w-4.5" />
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-950 text-white text-[10.5px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-[100] shadow-xl border border-slate-800 whitespace-nowrap">
                  Sign Out
                </div>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area Side */}
      <div className="flex-1 flex flex-col min-w-0" id="admin-main-section">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/60 h-18 px-6 md:px-8 flex items-center justify-between shrink-0" id="admin-top-header">
          {/* Welcome Message / Location Tracker */}
          <div>
            <h2 className="hidden md:block text-slate-800 text-sm font-bold tracking-tight uppercase text-[11px] text-slate-400">
              Staff Environment Panel
            </h2>
            <p className="text-slate-800 text-sm font-semibold select-all mt-0.5">
              {activePath === '/admin' ? 'Strategic Performance Overview' : activePath.replace('/admin/', '').replace('-', ' ').toUpperCase()}
            </p>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-4 ml-auto" id="admin-header-controls">
            {/* Notification Icon */}
            <div className="relative p-2 text-slate-405 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition cursor-pointer">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white" />
            </div>

            {/* Profile Widget with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 border-l border-slate-150 pl-4 py-1 text-left focus:outline-hidden cursor-pointer group hover:opacity-90"
                id="header-profile-dropdown-trigger"
              >
                <img 
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80'} 
                  className="h-8.5 w-8.5 rounded-full object-cover border border-slate-200 group-hover:border-indigo-500 transition-colors"
                  alt="Account Avatar"
                />
                <div className="hidden sm:block">
                  <p className="text-xs font-black text-slate-900 leading-tight flex items-center gap-1 transition-colors group-hover:text-indigo-650">
                    {user.name}
                    <span className="text-[8px] text-slate-400 group-hover:text-slate-600">▼</span>
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[8px] font-black tracking-widest text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase">
                      {user.role}
                    </span>
                  </div>
                </div>
              </button>

              {/* Enterprise Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-200/80 shadow-xl rounded-xl py-1.5 z-50 animate-slide-up text-slate-800"
                  id="admin-header-profile-dropdown"
                >
                  {/* Quick User Identity Card */}
                  <div className="px-3.5 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-black text-slate-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
                  </div>

                  <div className="flex flex-col gap-0.5 px-1.5">
                    <button 
                      onClick={() => { setProfileDropdownOpen(false); onNavigate('/admin/settings'); }}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-left hover:bg-slate-50 text-slate-700 rounded-lg transition-all text-xs font-semibold cursor-pointer w-full"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>My Account</span>
                    </button>

                    <button 
                      onClick={() => { setProfileDropdownOpen(false); onNavigate('/admin'); }}
                      className={`flex items-center gap-2.5 px-2.5 py-2 text-left hover:bg-slate-50 text-slate-700 rounded-lg transition-all text-xs font-semibold cursor-pointer w-full ${
                        activePath === '/admin' ? 'text-indigo-600 bg-indigo-50/40 font-bold' : ''
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Dashboard</span>
                    </button>

                    <button 
                      onClick={() => { setProfileDropdownOpen(false); onNavigate('/'); }}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-left hover:bg-slate-50 text-slate-700 rounded-lg transition-all text-xs font-semibold cursor-pointer w-full"
                    >
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Website</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 my-1" />

                  <div className="px-1.5">
                    <button 
                      onClick={() => { setProfileDropdownOpen(false); handleLogout(); }}
                      className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors text-xs font-semibold text-left cursor-pointer"
                    >
                      <span>Logout</span>
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Box */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8 bg-slate-50/50" id="admin-content-viewport">
          {children}
        </main>
      </div>
    </div>
  );
}
