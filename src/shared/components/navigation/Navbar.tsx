import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { UserRole } from '../../../types';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { usePropertyFilterOptions } from '../../../hooks/usePropertyFilterOptions';
import { 
  Shield, 
  User, 
  LogOut, 
  ChevronDown, 
  Compass, 
  MapPin, 
  Menu, 
  X, 
  DoorOpen, 
  Building2, 
  ArrowRight,
  Bookmark,
  Briefcase,
  Layers,
  Inbox,
  UserCircle,
  Globe,
  Mail,
  ShieldCheck,
  HelpCircle,
  Lock,
  Eye,
  EyeOff,
  Bell,
  BookOpenCheck,
  Trash2,
  Check,
  AlertTriangle,
  Settings,
  Chrome,
  Apple,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../../i18n';
import { getSupabaseClient } from '../../services/supabase';

function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'SE';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface NavbarProps {
  activePath: string;
  onNavigate: (path: string, params?: any) => void;
  showLoginModal?: boolean;
  setShowLoginModal?: (show: boolean) => void;
  showRegisterModal?: boolean;
  setShowRegisterModal?: (show: boolean) => void;
}

export default function Navbar({ 
  activePath, 
  onNavigate,
  showLoginModal: propShowLoginModal,
  setShowLoginModal: propSetShowLoginModal,
  showRegisterModal: propShowRegisterModal,
  setShowRegisterModal: propSetShowRegisterModal
}: NavbarProps) {
  const { language, setLanguage, t, currency, setCurrency, formatCurrencyIDR } = useLanguage();
  const { user, token, login: authContextLogin, logout, updateRoleInContext } = useAuth();
  const { favoritesCount } = useWishlist();
  
  // Local state fallbacks if props are not supplied
  const [localShowLoginModal, localSetShowLoginModal] = useState(false);
  const [localShowRegisterModal, localSetShowRegisterModal] = useState(false);

  const showLoginModal = propShowLoginModal !== undefined ? propShowLoginModal : localShowLoginModal;
  const setShowLoginModal = propSetShowLoginModal !== undefined ? propSetShowLoginModal : localSetShowLoginModal;

  const showRegisterModal = propShowRegisterModal !== undefined ? propShowRegisterModal : localShowRegisterModal;
  const setShowRegisterModal = propSetShowRegisterModal !== undefined ? propSetShowRegisterModal : localSetShowRegisterModal;

  // Shared state
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [becomeHostModalOpen, setBecomeHostModalOpen] = useState(false);
  const [destinationsOpen, setDestinationsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showInlineLangCurr, setShowInlineLangCurr] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(() => {
    return localStorage.getItem('stayee_mfa') === 'true';
  });

  const [showLangCurrMenu, setShowLangCurrMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [dbUser, setDbUser] = useState<any>(null);
  const [fetchingRole, setFetchingRole] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [loadingBecomeHost, setLoadingBecomeHost] = useState(false);
  const [errorBecomeHost, setErrorBecomeHost] = useState<string | null>(null);

  const handleConfirmBecomeHost = async () => {
    if (!token) return;
    setLoadingBecomeHost(true);
    setErrorBecomeHost(null);
    try {
      const res = await fetch('/api/auth/become-host', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requireApproval,
          companyName: `${user?.name || 'StayEase'} Accommodations`,
          phone: '+6281234567890',
          address: 'Bali, Indonesia'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit host onboarding');
      }

      setBecomeHostModalOpen(false);

      // Reload fresh user details in context
      if (!requireApproval && updateRoleInContext) {
        updateRoleInContext(UserRole.TENANT);
      }

      const fetchMe = async () => {
        try {
          const meRes = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            if (meData.success && meData.user) {
              setDbUser(meData.user);
            }
          }
        } catch (e) {
          console.error('Error reloading user after become host:', e);
        }
      };
      await fetchMe();

      if (requireApproval) {
        alert(language === 'en' 
          ? 'Application Submitted! Your host onboarding application status is PENDING. StayEase administrators will review your application shortly.' 
          : 'Pengajuan Terkirim! Pengajuan kemitraan host Anda berstatus PROSES. Administrator StayEase akan segera meninjau pengajuan Anda.'
        );
      } else {
        onNavigate('/dashboard');
        alert(language === 'en' 
          ? 'Welcome to the Host Community! You have been upgraded to Host role. Your host profile has been provisioned successfully.' 
          : 'Selamat Datang di Komunitas Host! Peran Anda telah ditingkatkan menjadi Host. Profil host Anda berhasil dibuat.'
        );
      }
    } catch (err: any) {
      console.error(err);
      setErrorBecomeHost(err.message || 'Error onboarding host');
    } finally {
      setLoadingBecomeHost(false);
    }
  };

  useEffect(() => {
    if (!user || !token) {
      setDbUser(null);
      return;
    }
    
    // Fallback to current user state first to keep it smooth
    setDbUser(user);
    
    let isMounted = true;
    const fetchFreshUser = async () => {
      setFetchingRole(true);
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.success && data.user) {
            setDbUser(data.user);
          }
        }
      } catch (err) {
        console.error('Error fetching fresh user details in Navbar:', err);
      } finally {
        if (isMounted) {
          setFetchingRole(false);
        }
      }
    };
    
    fetchFreshUser();
    
    return () => {
      isMounted = false;
    };
  }, [user, token]);

  useEffect(() => {
    if (!user || !token) {
      setNotifications([]);
      return;
    }
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const items = (data.notifications || []).map((n: any) => ({
            ...n,
            read: n.isRead !== undefined ? n.isRead : n.read
          }));
          setNotifications(items);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user, token]);

  const handleMarkRead = async (id: string) => {
    setNotifications(prev => prev.map(item => item.id === id ? { ...item, read: true, isRead: true } : item));
    if (!token) return;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
    if (!token) return;
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, deletedAt: new Date().toISOString() } : n));
    if (!token) return;
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAllNotifications = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, deletedAt: new Date().toISOString() })));
    if (!token) return;
    try {
      await fetch('/api/notifications/delete-all', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginHint, setLoginHint] = useState('');

  // Register form state
  const [regRole, setRegRole] = useState<UserRole>(UserRole.USER);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccessData, setRegSuccessData] = useState<{ user: any; verificationToken: string } | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  // Password visibility toggle states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Lock body scroll while any modal is open
  useEffect(() => {
    const isModalOpen = showLoginModal || showRegisterModal;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showLoginModal, showRegisterModal]);

  // Click ESC key listener to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLoginModal(false);
        setShowRegisterModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowLoginModal, setShowRegisterModal]);

  // Listener for custom stayease-open-login-modal triggers (e.g. from Wishlist context)
  useEffect(() => {
    const handleOpenLoginModal = (e: any) => {
      setShowLoginModal(true);
      if (e.detail && e.detail.message) {
        setLoginHint(e.detail.message);
      }
    };
    window.addEventListener('stayease-open-login-modal', handleOpenLoginModal as any);
    return () => window.removeEventListener('stayease-open-login-modal', handleOpenLoginModal as any);
  }, [setShowLoginModal]);

  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && origin !== window.location.origin) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { user: oauthUser, token: oauthToken } = event.data;
        authContextLogin(oauthUser, oauthToken);
        setLoginHint(`Logged in as ${oauthUser.name} (${oauthUser.role})`);
        setGoogleLoading(false);
        setTimeout(() => {
          setShowLoginModal(false);
          setShowRegisterModal(false);
          setLoginHint('');
          if (oauthUser.role === UserRole.ADMIN) {
            onNavigate('/admin');
          } else {
            onNavigate(oauthUser.role === UserRole.TENANT ? '/dashboard' : '/traveler-dashboard');
          }
        }, 1200);
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        const errorMsg = event.data.error || 'Google authentication failed';
        setLoginError(errorMsg);
        setRegError(errorMsg);
        setGoogleLoading(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [authContextLogin, onNavigate, setShowLoginModal, setShowRegisterModal]);

  const handleGoogleLogin = async () => {
    setLoginError('');
    setRegError('');
    setGoogleLoading(true);
    try {
      const supabase = await getSupabaseClient();
      const redirectUrl = `${window.location.origin}/api/auth/callback`;
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true
        }
      });
      if (signInError) throw signInError;
      if (!data?.url) throw new Error('Failed to generate Google authentication URL');

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      const popup = window.open(
        data.url,
        'stayease_google_oauth',
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
      );
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for StayEase to authenticate with Google.');
      }
    } catch (err: any) {
      console.error('[GoogleLogin] Error:', err);
      const errMsg = err.message || 'Failed to start Google sign-in';
      setLoginError(errMsg);
      setRegError(errMsg);
      setGoogleLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccessData(null);

    if (!regName.trim()) {
      setRegError('Full Name is required');
      return;
    }
    if (!regEmail.trim()) {
      setRegError('Email Address is required');
      return;
    }
    if (!regPassword) {
      setRegError('Password is required');
      return;
    }
    
    // Password validation rules
    if (regPassword.length < 8) {
      setRegError('Password must be at least 8 characters long');
      return;
    }
    const hasUppercase = /[A-Z]/.test(regPassword);
    const hasLowercase = /[a-z]/.test(regPassword);
    const hasNumber = /[0-9]/.test(regPassword);
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      setRegError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match');
      return;
    }

    setRegLoading(true);
    try {
      const supabase = await getSupabaseClient();
      const redirectUrl = window.location.origin + '/auth/callback';
      console.log('[Navbar:signUp] Initiating signUp for email:', regEmail, 'redirectUrl:', redirectUrl);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: { name: regName, role: regRole },
          emailRedirectTo: redirectUrl
        }
      });

      console.log('[Navbar:signUp] Response details:', { data, error: signUpError });

      if (signUpError) {
        console.error('[Navbar:signUp] Supabase signUp failed:', signUpError);
        if (signUpError.message.toLowerCase().includes('already registered') || signUpError.message.toLowerCase().includes('already exists')) {
          throw new Error('Email already registered');
        }
        throw new Error(`Verification email failed: ${signUpError.message}`);
      }

      if (!data?.user) {
        throw new Error('Verification email failed: Supabase did not return user data.');
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: data.user.id,
          name: regName, 
          email: regEmail, 
          role: regRole, 
          password: regPassword 
        })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Registration failed');
      
      setRegSuccessData({ user: resData.user, verificationToken: '' });
      setTimeout(() => {
        setShowRegisterModal(false);
        // Reset states
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
        setRegSuccessData(null);
        // Redirect to verify email
        onNavigate('/verify-email', { email: regEmail });
      }, 2500);
    } catch (err: any) {
      setRegError(err.message || 'Error occurred during registration');
    } finally {
      setRegLoading(false);
    }
  };

  // Dropdown & Click outside references
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const destDropdownRef = useRef<HTMLDivElement>(null);
  const langCurrRef = useRef<HTMLDivElement>(null);
  const notifyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = activePath === '/';
  const showDarkHeader = !isHome || isScrolled;

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (destDropdownRef.current && !destDropdownRef.current.contains(event.target as Node)) {
        setDestinationsOpen(false);
      }
      if (langCurrRef.current && !langCurrRef.current.contains(event.target as Node)) {
        setShowLangCurrMenu(false);
      }
      if (notifyDropdownRef.current && !notifyDropdownRef.current.contains(event.target as Node)) {
        // If clicking inside a portal dialog overlay (marked with 'fixed'), do not close.
        const clickedPortal = (event.target as HTMLElement).closest && (event.target as HTMLElement).closest('.fixed');
        if (!clickedPortal) {
          setShowNotifications(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
    setProfileDropdownOpen(false);
    onNavigate('/');
  };

  const selectDestination = (loc: string) => {
    setDestinationsOpen(false);
    setMobileMenuOpen(false);
    onNavigate('/search', { location: loc });
  };

  const { cities } = usePropertyFilterOptions();
  const popularDestinations = cities.map(city => {
    let region = '';
    let description = '';

    if (city === 'Jakarta') {
      region = 'DKI Jakarta';
      description = 'Skyline suites and dynamic business hubs';
    } else if (city === 'Bandung') {
      region = 'Jawa Barat';
      description = 'Art deco villas and refreshing mountain air';
    } else if (city === 'Surabaya') {
      region = 'Jawa Timur';
      description = 'Modern design in the historical port city';
    } else if (city === 'Yogyakarta') {
      region = 'DI Yogyakarta';
      description = 'Grand heritage stays and cultural mastery';
    } else {
      region = 'Indonesia';
      description = 'Discover extraordinary architectural stays and curated comfort';
    }

    return { name: city, region, description };
  });

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  const handleBecomeHostClick = async () => {
    if (!user) {
      setShowRegisterModal(true);
    } else {
      setBecomeHostModalOpen(true);
    }
  };

  // Dedicated function for Orders menu action
  const handleOrdersClick = () => {
    setMobileMenuOpen(false);
    if (!user) {
      setShowLoginModal(true);
    } else if (user.role === UserRole.USER) {
      onNavigate('/my-bookings');
    } else if (user.role === UserRole.TENANT) {
      onNavigate('/bookings');
    }
  };

  // Auth Submit Handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    setLoginHint('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      authContextLogin(data.user, data.token);
      setLoginHint(`Successfully logged in as ${data.user.name}`);
      setTimeout(() => {
        setShowLoginModal(false);
        setLoginEmail('');
        setLoginPassword('');
        setLoginHint('');
        if (data.user.role === UserRole.ADMIN) {
          onNavigate('/admin');
        } else {
          onNavigate(data.user.role === UserRole.TENANT ? '/dashboard' : '/traveler-dashboard');
        }
      }, 1000);
    } catch (err: any) {
      setLoginError(err.message || 'An error occurred during authentication');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleQuickFill = (emailVal: string) => {
    setLoginEmail(emailVal);
    setLoginPassword('••••••••');
    setLoginError('');
  };

  // Dynamically determine user states from fresh DB call
  const resolvedUser = dbUser || user;
  const role = resolvedUser?.role;
  const tenantProfile = resolvedUser?.tenantProfile;

  const tenantPaths = [
    '/dashboard',
    '/tenant-dashboard',
    '/properties',
    '/rooms',
    '/availability',
    '/reservations',
    '/finance',
    '/payments',
    '/operations',
    '/check-in',
    '/check-out',
    '/reviews',
    '/reports'
  ];
  const isTenantWorkspace = !!(resolvedUser && role === UserRole.TENANT && (
    tenantPaths.includes(activePath) || activePath === '/bookings' || activePath.startsWith('/bookings/')
  ));

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-md flex items-center justify-between px-6 py-4 border-b ${
      showDarkHeader 
        ? 'bg-white/95 border-slate-100 shadow-sm text-slate-800' 
        : 'bg-transparent border-transparent text-white'
    }`}>
      
      {/* Brand & Left Navigation */}
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-3.5">
          <span 
            onClick={() => onNavigate('/')} 
            onKeyDown={(e) => handleKeyDown(e, () => onNavigate('/'))}
            role="link"
            tabIndex={0}
            className={`text-2xl font-black tracking-tight cursor-pointer font-display flex items-center gap-2 transition-colors ${
              showDarkHeader ? 'text-slate-900' : 'text-white'
            }`}
          >
            <Compass className={`w-6 h-6 animate-spin-slow transition-colors ${showDarkHeader ? 'text-indigo-600' : 'text-white'}`} />
            StayEase<span className="text-indigo-600 font-sans">.</span>
          </span>

          {isTenantWorkspace && (
            <div className={`hidden sm:flex items-center gap-2.5 border-l ${showDarkHeader ? 'border-slate-200' : 'border-white/20'} pl-3.5 py-1 select-none`}>
              <span className={`text-sm font-black tracking-wide uppercase font-sans ${showDarkHeader ? 'text-indigo-950/90' : 'text-white'}`}>
                {language === 'en' ? 'Dashboard Host' : 'Dasbor Host'}
              </span>
            </div>
          )}
        </div>
 
        {/* Dynamic Navigation Menu based on Role - Hidden in Tenant Workspace */}
        {!isTenantWorkspace && (
          <nav className="hidden lg:flex items-center gap-8 text-[13px] font-semibold tracking-wide">
            
            {/* PUBLIC WEBSITE Navigation links (for Guest, Admin, or Tenant outside workspace) */}
            {(!user || role === UserRole.ADMIN || role === UserRole.TENANT) && (
              <>
                {/* Discover */}
                <span 
                  onClick={() => onNavigate('/')} 
                  className={`cursor-pointer transition-colors relative py-1 focus:outline-hidden ${
                    activePath === '/' 
                      ? (showDarkHeader ? 'text-indigo-600 font-bold border-b-2 border-indigo-600' : 'text-white font-bold border-b-2 border-white')
                      : (showDarkHeader ? 'text-slate-600 hover:text-indigo-600' : 'text-white/80 hover:text-white')
                  }`}
                >
                  {t.common.discover}
                </span>

                {/* Properties */}
                <span 
                  onClick={() => onNavigate('/properties')} 
                  className={`cursor-pointer transition-colors relative py-1 focus:outline-hidden ${
                    activePath === '/properties' || activePath === '/search'
                      ? (showDarkHeader ? 'text-indigo-600 font-bold border-b-2 border-indigo-600' : 'text-white font-bold border-b-2 border-white')
                      : (showDarkHeader ? 'text-slate-600 hover:text-indigo-600' : 'text-white/80 hover:text-white')
                  }`}
                >
                  {t.common.properties}
                </span>

                {/* Destinations */}
                <div className="relative" ref={destDropdownRef}>
                  <button 
                    onClick={() => setDestinationsOpen(!destinationsOpen)} 
                    className={`flex items-center gap-1 cursor-pointer transition-colors py-1 font-semibold focus:outline-hidden ${
                      showDarkHeader 
                        ? (destinationsOpen ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600') 
                        : (destinationsOpen ? 'text-white font-bold' : 'text-white/80 hover:text-white')
                    }`}
                  >
                    {t.common.destinations} <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${destinationsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {destinationsOpen && (
                    <div className="absolute left-0 mt-3 w-80 bg-white border border-slate-100 shadow-2xl rounded-2xl p-4 z-50 text-slate-800 animate-slide-up">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2.5">{t.navbar.curatedDestinations}</span>
                      <div className="flex flex-col gap-1">
                        {popularDestinations.map((d, index) => (
                          <button 
                            key={`navbar-popdest-desktop-${d.name}-${index}`}
                            onClick={() => selectDestination(d.name)}
                            className="flex items-start gap-3 p-2.5 hover:bg-slate-50 rounded-xl text-left transition-colors cursor-pointer group"
                          >
                            <MapPin className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-[12.5px] font-bold text-slate-800 group-hover:text-indigo-600">{d.name}, {d.region}</div>
                              <div className="text-[10.5px] text-slate-400 leading-normal">{d.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* About */}
                <span 
                  onClick={() => onNavigate('/about')} 
                  className={`cursor-pointer transition-colors py-1 focus:outline-hidden ${
                    activePath === '/about'
                      ? (showDarkHeader ? 'text-indigo-600 font-bold border-b-2 border-indigo-600' : 'text-white font-bold border-b-2 border-white')
                      : (showDarkHeader ? 'text-slate-600 hover:text-indigo-600' : 'text-white/80 hover:text-white')
                  }`}
                >
                  {t.common.about}
                </span>

                {/* Orders */}
                {!user && (
                  <button 
                    onClick={handleOrdersClick} 
                    className={`cursor-pointer transition-colors py-1 font-semibold focus:outline-hidden ${
                      showDarkHeader ? 'text-slate-600 hover:text-indigo-600' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {t.navbar.orders}
                  </button>
                )}
              </>
            )}

            {/* Traveler USER Flow */}
            {user && role === UserRole.USER && (
              <>
                {/* Discover */}
                <span 
                  onClick={() => onNavigate('/')} 
                  className={`cursor-pointer transition-colors relative py-1 focus:outline-hidden ${
                    activePath === '/' ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  {t.common.discover}
                  {activePath === '/' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                  )}
                </span>

                {/* My Bookings / Orders */}
                <span 
                  onClick={() => onNavigate('/my-bookings')} 
                  className={`cursor-pointer transition-colors relative py-1 focus:outline-hidden ${
                    activePath === '/my-bookings' ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  {t.navbar.orders}
                  {activePath === '/my-bookings' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                  )}
                </span>

                {/* Wishlist */}
                <span 
                  onClick={() => onNavigate('/wishlist')} 
                  className={`cursor-pointer transition-colors relative py-1 focus:outline-hidden ${
                    activePath === '/wishlist' ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  {t.navbar.myWishlist} ({favoritesCount})
                  {activePath === '/wishlist' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                  )}
                </span>
              </>
            )}

          </nav>
        )}
      </div>

      {/* Right Actions & Buttons */}
      <div className="flex items-center gap-4">
        
        {/* Dynamic Language & Currency Selector (e.g. 🇮🇩 ID | Rp) */}
        <div className="relative" ref={langCurrRef}>
          <button
            onClick={() => setShowLangCurrMenu(!showLangCurrMenu)}
            className={`flex items-center gap-2 text-xs font-black py-1.5 px-3 rounded-xl border transition-all cursor-pointer focus:outline-hidden ${
              showDarkHeader
                ? 'border-slate-200 text-slate-800 hover:border-slate-350 hover:bg-slate-50 bg-white/70 shadow-2xs'
                : 'border-white/20 text-white hover:border-white/30 hover:bg-white/10 bg-slate-900/10'
            }`}
          >
            <Globe className="w-3.5 h-3.5 opacity-80" />
            <span>
              {language === 'id' ? '🇮🇩 ID' : '🇺🇸 EN'} | {currency.symbol}
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showLangCurrMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Language & Currency Dropdown Modal Container */}
          {showLangCurrMenu && (
            <div className="absolute right-0 mt-3.5 w-64 bg-white border border-slate-100 shadow-2xl rounded-2xl p-4 z-50 text-slate-800 animate-slide-up">
              <div className="mb-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">
                  {t.navbar.language}
                </label>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setLanguage('id');
                      setShowLangCurrMenu(false);
                    }}
                    className={`flex items-center justify-between text-xs font-semibold py-2 px-3 rounded-xl transition-all cursor-pointer ${
                      language === 'id' ? 'bg-indigo-50 text-indigo-750' : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>ID | Bahasa Indonesia</span>
                    {language === 'id' && <ShieldCheck className="w-4 h-4 text-indigo-650" />}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setShowLangCurrMenu(false);
                    }}
                    className={`flex items-center justify-between text-xs font-semibold py-2 px-3 rounded-xl transition-all cursor-pointer ${
                      language === 'en' ? 'bg-indigo-50 text-indigo-750' : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>EN | English</span>
                    {language === 'en' && <ShieldCheck className="w-4 h-4 text-indigo-650" />}
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">
                  {t.navbar.currency}
                </label>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setCurrency('IDR');
                      setShowLangCurrMenu(false);
                    }}
                    className="flex items-center justify-between text-xs font-semibold py-2 px-3 rounded-xl bg-indigo-50 text-indigo-750 transition-all"
                  >
                    <span className="font-bold">IDR (Rp)</span>
                    <ShieldCheck className="w-4 h-4 text-indigo-650" />
                  </button>
                  
                  {/* Future Currency Placeholder (Future-Ready Architecture) */}
                  <button
                    disabled
                    className="flex items-center justify-between text-xs font-semibold py-2 px-3 rounded-xl text-slate-350 cursor-not-allowed border border-dashed border-slate-100"
                  >
                    <span>USD ($) - {language === 'en' ? 'Coming Soon' : 'Segera Hadir'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Public view (NOT signed in) CTA buttons */}
        {!user && (
          <div className="hidden sm:flex items-center gap-4">
            <button 
              onClick={() => setShowLoginModal(true)} 
              className={`text-[13px] font-bold cursor-pointer transition-colors focus:outline-hidden px-3 py-2 rounded-xl ${
                showDarkHeader ? 'text-slate-700 hover:text-indigo-600' : 'text-white/90 hover:text-white'
              }`}
            >
              {t.common.signIn}
            </button>
            <button 
              onClick={() => setShowRegisterModal(true)} 
              className={`text-[13px] font-black px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs focus:outline-hidden ${
                showDarkHeader 
                  ? 'bg-indigo-950 hover:bg-slate-900 text-white shadow-md' 
                  : 'bg-white hover:bg-slate-100 text-indigo-950 font-bold'
              }`}
            >
              {t.common.getStarted}
            </button>
          </div>
        )}

        {/* Signed-in user profile / actions */}
        {user && (
          <div className="flex items-center gap-3">
            
            {/* Dynamic Role Actions with Loading Skeleton */}
            {fetchingRole ? (
              <div 
                id="role-loading-skeleton"
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/60 bg-slate-50/50 animate-pulse w-32 h-8"
              >
                <div className="h-2 bg-slate-200 rounded-sm w-4"></div>
                <div className="h-2 bg-slate-200 rounded-sm flex-1"></div>
              </div>
            ) : (
              <>
                {role === UserRole.TENANT && !isTenantWorkspace && (
                  <button 
                    id="host-dashboard-btn"
                    onClick={() => onNavigate('/dashboard')}
                    className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer focus:outline-hidden ${
                      showDarkHeader 
                        ? 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100/50 hover:border-emerald-250 text-emerald-950' 
                        : 'bg-emerald-950/40 border-emerald-800/60 hover:bg-emerald-950/20 text-emerald-200'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    <span>{language === 'en' ? 'Host Dashboard' : 'Dasbor Host'}</span>
                  </button>
                )}
              </>
            )}

            {/* Notification Bell for USER and TENANT */}
            {user && (role === UserRole.TENANT || role === UserRole.USER) && (() => {
              const visibleNotifications = notifications.filter(n => !n.deletedAt);
              const unreadCount = visibleNotifications.filter(n => !n.read).length;

              return (
                <div className="relative" ref={notifyDropdownRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative p-2 rounded-xl border transition-all cursor-pointer focus:outline-hidden ${
                      showDarkHeader
                        ? 'border-slate-200 text-slate-800 hover:border-slate-350 hover:bg-slate-50 bg-white/70 shadow-2xs'
                        : 'border-white/20 text-white hover:border-white/30 hover:bg-white/10 bg-slate-900/10'
                    }`}
                  >
                    <Bell className="w-4 h-4 opacity-80" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white leading-none shadow-xs animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 shadow-2xl rounded-2xl p-4 z-50 text-slate-800 animate-slide-up">
                      <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 mb-3">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                          {language === 'en' ? 'Notifications' : 'Notifikasi'}
                        </h4>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <button 
                              onClick={handleMarkAllRead}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer transition-colors"
                            >
                              {language === 'en' ? 'Mark all' : 'Semua dibaca'}
                            </button>
                          )}
                          {visibleNotifications.length > 0 && (
                            <>
                              <span className="text-slate-250 text-xs shrink-0 font-medium">|</span>
                              <button 
                                onClick={() => setDeleteConfirmId('all')}
                                className="text-[10px] text-rose-500 hover:text-rose-700 font-bold cursor-pointer transition-colors flex items-center gap-0.5"
                              >
                                <Trash2 className="w-3 h-3 shrink-0" />
                                <span>{language === 'en' ? 'Clear all' : 'Hapus semua'}</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 max-h-68 overflow-y-auto pr-0.5 scrollbar-thin">
                        {visibleNotifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-7 text-center px-4">
                            <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl mb-2.5">
                              <Bell className="w-6 h-6 stroke-[1.5]" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 block mb-0.5">
                              {language === 'en' ? 'All caught up!' : 'Sudah rapi!'}
                            </span>
                            <p className="text-[10px] text-slate-400 font-semibold max-w-[200px] leading-relaxed">
                              {language === 'en' ? 'No active notifications at the moment.' : 'Tidak ada notifikasi aktif untuk saat ini.'}
                            </p>
                          </div>
                        ) : (
                          visibleNotifications.map((n, idx) => (
                            <div 
                              key={`${n.id}-${idx}`} 
                              className={`relative p-2.5 rounded-xl text-xs flex flex-col gap-1 transition-all duration-150 group cursor-default border ${
                                n.read 
                                  ? 'bg-slate-50/50 border-transparent hover:border-slate-100 hover:bg-slate-100/30' 
                                  : 'bg-indigo-50/25 border-indigo-50/40 hover:bg-indigo-50/40 hover:border-indigo-100'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2 group-hover:pr-14 transition-all duration-150">
                                <span className="font-bold text-slate-800 leading-tight block">{n.title}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-[9px] text-slate-400 font-medium group-hover:opacity-0 transition-opacity whitespace-nowrap">{n.time}</span>
                                  {!n.read && (
                                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0 group-hover:opacity-0 transition-opacity" />
                                  )}
                                </div>
                              </div>
                              <p className="text-slate-500 text-[11px] leading-relaxed font-semibold group-hover:pr-14 transition-all duration-150">{n.message}</p>
                              
                              {/* Action Buttons visible on hover */}
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150 absolute right-2.5 top-2 bg-white border border-slate-100 rounded-lg p-0.5 shadow-sm z-10">
                                {!n.read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkRead(n.id);
                                    }}
                                    title={language === 'en' ? 'Mark as read' : 'Tandai telah dibaca'}
                                    className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer focus:outline-hidden"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(n.id);
                                  }}
                                  title={language === 'en' ? 'Delete' : 'Hapus'}
                                  className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer focus:outline-hidden"
                                >
                                  <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {deleteConfirmId && createPortal(
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in text-slate-800">
                      <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full p-5 shadow-2xl animate-scale-up text-slate-800">
                        <div className="flex items-center gap-3.5 mb-3.5 text-amber-500">
                          <span className="p-2 bg-amber-50 rounded-xl">
                            <AlertTriangle className="w-6 h-6 stroke-[2]" />
                          </span>
                          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 leading-none">
                            {deleteConfirmId === 'all' 
                              ? (language === 'en' ? 'Delete All' : 'Hapus Semua')
                              : (language === 'en' ? 'Delete Notification' : 'Hapus Notifikasi')}
                          </h3>
                        </div>
                        <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-5">
                          {deleteConfirmId === 'all'
                            ? (language === 'en' 
                                ? 'Are you sure you want to delete all active notifications? This action cannot be undone.' 
                                : 'Apakah Anda yakin ingin menghapus semua notifikasi aktif? Tindakan ini tidak dapat dibatalkan.')
                            : (language === 'en'
                                ? 'Are you sure you want to delete this notification? It will be archived and removed from your list.'
                                : 'Apakah Anda yakin ingin menghapus notifikasi ini? Notifikasi akan disimpan dan dihapus dari daftar Anda.')}
                        </p>
                        <div className="flex gap-2.5 justify-end">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                          >
                            {language === 'en' ? 'Cancel' : 'Batal'}
                          </button>
                          <button
                            onClick={() => {
                              if (deleteConfirmId === 'all') {
                                handleDeleteAllNotifications();
                              } else {
                                handleDeleteNotification(deleteConfirmId);
                              }
                              setDeleteConfirmId(null);
                            }}
                            className="px-4 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-sm cursor-pointer"
                          >
                            {language === 'en' ? 'Confirm Delete' : 'Konfirmasi Hapus'}
                          </button>
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              );
            })()}

            {/* Profile Dropdown Module */}
            <div className="relative" ref={profileDropdownRef}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-2xl transition-all cursor-pointer text-left focus:outline-hidden ${
                  showDarkHeader 
                    ? 'bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-800' 
                    : 'bg-white/10 border-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <div className="w-7 h-7 rounded-xl overflow-hidden bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs select-none">
                  {user.avatarUrl && !user.avatarUrl.includes('dicebear.com') ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span>{getInitials(user.name)}</span>
                  )}
                </div>
                <div className="hidden md:block">
                  <div className="text-[11.5px] font-black leading-tight truncate max-w-[100px]">{user.name}</div>
                  <div className="text-[9px] uppercase font-black tracking-wider leading-none opacity-85">{role === UserRole.TENANT ? t.navbar.registerAsTenant : t.navbar.continueAsGuest}</div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 opacity-80 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown List */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3.5 w-[210px] bg-white border border-slate-100 shadow-xl rounded-2xl py-2 z-50 animate-slide-up text-slate-800">
                  {user?.role === UserRole.ADMIN ? (
                    <div className="flex flex-col gap-0.5 px-2">
                      <button 
                        onClick={() => { setProfileDropdownOpen(false); onNavigate('/admin'); }}
                        className="flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 rounded-xl transition-all text-xs font-bold cursor-pointer text-slate-700 w-full"
                        id="navbar-admin-dashboard-btn"
                      >
                        <Shield className="w-4 h-4 shrink-0 text-indigo-600" />
                        <span>Dashboard</span>
                      </button>
                      <button 
                        onClick={() => { setProfileDropdownOpen(false); onNavigate('/'); }}
                        className="flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 rounded-xl transition-all text-xs font-bold cursor-pointer text-slate-700 w-full"
                        id="navbar-admin-website-btn"
                      >
                        <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Website</span>
                      </button>
                      <div className="border-t border-slate-100 my-1.5" />
                      <button 
                        onClick={() => { 
                          setProfileDropdownOpen(false); 
                          setShowSignOutModal(true); 
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors text-xs font-bold text-left cursor-pointer"
                        id="navbar-admin-logout-btn"
                      >
                        <span>{t.common.signOut}</span>
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Main Dropdown Menu Options */}
                      <div className="flex flex-col gap-0.5 px-2">
                        {/* Unified Profile-Related Actions */}
                        {role === UserRole.TENANT && isTenantWorkspace && (
                          <button 
                            onClick={() => { setProfileDropdownOpen(false); onNavigate('/'); }}
                            className="flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-indigo-50/50 rounded-xl transition-all text-xs font-bold text-indigo-600 w-full cursor-pointer border-b border-slate-50 mb-1"
                            id="navbar-tenant-switch-to-traveling"
                          >
                            <Globe className="w-4 h-4 text-indigo-500 shrink-0" />
                            <span>{language === 'en' ? 'Switch to Traveling' : 'Kembali ke Traveler'}</span>
                          </button>
                        )}
                        {role === UserRole.TENANT && !isTenantWorkspace && (
                          <button 
                            onClick={() => { setProfileDropdownOpen(false); onNavigate('/dashboard'); }}
                            className="flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-emerald-50 text-emerald-800 rounded-xl transition-all text-xs font-bold w-full cursor-pointer border-b border-slate-50 mb-1"
                            id="navbar-tenant-switch-to-hosting"
                          >
                            <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>{language === 'en' ? 'Host Dashboard' : 'Dasbor Host'}</span>
                          </button>
                        )}

                        <button 
                          onClick={() => { setProfileDropdownOpen(false); onNavigate('/profile'); }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 rounded-xl transition-all text-xs font-bold cursor-pointer ${
                            activePath === '/profile' ? 'text-indigo-600 bg-indigo-50/30 font-extrabold' : 'text-slate-700 font-semibold'
                          }`}
                        >
                          <UserCircle className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{language === 'en' ? 'My Profile' : 'Profil Saya'}</span>
                        </button>

                        <button 
                          onClick={() => { setProfileDropdownOpen(false); onNavigate('/settings'); }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 rounded-xl transition-all text-xs font-bold cursor-pointer ${
                            activePath === '/settings' ? 'text-indigo-600 bg-indigo-50/30 font-extrabold' : 'text-slate-705 font-semibold'
                          }`}
                        >
                          <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{language === 'en' ? 'Account Settings' : 'Pengaturan Akun'}</span>
                        </button>

                        <button 
                          onClick={() => { setProfileDropdownOpen(false); onNavigate('/security'); }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 rounded-xl transition-all text-xs font-bold cursor-pointer ${
                            activePath === '/security' ? 'text-indigo-600 bg-indigo-50/30 font-extrabold' : 'text-slate-705 font-semibold'
                          }`}
                        >
                          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{language === 'en' ? 'Security' : 'Keamanan'}</span>
                        </button>

                        {fetchingRole ? (
                          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-slate-450 select-none animate-pulse bg-slate-50/50">
                            <Building2 className="w-4 h-4 text-slate-300 shrink-0" />
                            <span>{language === 'en' ? 'Checking host status...' : 'Memeriksa status host...'}</span>
                          </div>
                        ) : (
                          (role === UserRole.USER || role === 'TRAVELER') && (
                            dbUser?.hostApplication?.status === 'PENDING' ? (
                              <div 
                                id="menu-pending-host-badge"
                                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50/40 select-none"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                  </span>
                                  <span>{language === 'en' ? 'Host Application Pending' : 'Pengajuan Host Diproses'}</span>
                                </div>
                              </div>
                            ) : (
                              <button 
                                id="menu-become-host-btn"
                                onClick={() => { 
                                  setProfileDropdownOpen(false); 
                                  setBecomeHostModalOpen(true); 
                                }}
                                className="flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 rounded-xl transition-all text-xs font-bold cursor-pointer text-indigo-650 w-full"
                              >
                                <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                                <span>{language === 'en' ? 'Become a Host' : 'Menjadi Host'}</span>
                              </button>
                            )
                          )
                        )}
                      </div>

                      {/* Sign Out Divider & Option */}
                      <div className="border-t border-slate-100 my-1.5" />
                      
                      <div className="px-2">
                        <button 
                          onClick={() => { 
                            setProfileDropdownOpen(false); 
                            setShowSignOutModal(true); 
                          }}
                          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors text-xs font-bold text-left cursor-pointer"
                        >
                          <span>{t.common.signOut}</span>
                          <LogOut className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile menu Grid Toggle */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-905 hover:bg-slate-50 rounded-xl cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Navigation Slide */}
      {mobileMenuOpen && (
        <div className="absolute top-[73px] left-0 right-0 bg-white border-b border-slate-150 shadow-xl p-5 flex flex-col gap-4 z-40 lg:hidden text-slate-800 animate-slide-up">
          
          {/* Mobile Language Selector */}
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t.navbar.language} / Bahasa</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setLanguage('id');
                setMobileMenuOpen(false);
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                language === 'id' ? 'bg-indigo-900 border-indigo-900 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-750 hover:bg-slate-100'
              }`}
            >
              🇮🇩 Bahasa Indonesia
            </button>
            <button
              onClick={() => {
                setLanguage('en');
                setMobileMenuOpen(false);
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                language === 'en' ? 'bg-indigo-900 border-indigo-900 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-750 hover:bg-slate-100'
              }`}
            >
              🇺🇸 English
            </button>
          </div>

          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Navigation</span>
          
          <div className="flex flex-col gap-1">
            
            {/* TENANT WORKSPACE minimal mobile navigation */}
            {isTenantWorkspace && (
              <>
                <div className="text-xs font-black text-indigo-950 uppercase tracking-widest px-3 py-1 bg-indigo-50/50 rounded-lg inline-block w-fit mb-2">
                  {language === 'en' ? 'Dashboard Host' : 'Dasbor Host'}
                </div>
                <button 
                  onClick={() => { setMobileMenuOpen(false); onNavigate('/'); }} 
                  className="text-left font-bold text-sm text-indigo-600 py-2.5 px-3 rounded-xl hover:bg-slate-50 flex items-center gap-2"
                >
                  <Globe className="w-4 h-4 shrink-0 text-indigo-600" />
                  <span>{language === 'en' ? 'Switch to Traveling' : 'Kembali ke Traveler'}</span>
                </button>
              </>
            )}

            {/* PUBLIC Navigation links when NOT in tenant workspace */}
            {!isTenantWorkspace && (!user || role === UserRole.ADMIN || role === UserRole.TENANT) && (
              <>
                <button onClick={() => { setMobileMenuOpen(false); onNavigate('/'); }} className="text-left font-bold text-sm text-slate-705 py-2.5 px-3 rounded-xl hover:bg-slate-50">{t.common.discover}</button>
                <button onClick={() => { setMobileMenuOpen(false); onNavigate('/search'); }} className="text-left font-bold text-sm text-slate-705 py-2.5 px-3 rounded-xl hover:bg-slate-50">{t.common.properties}</button>
                <span className="font-bold text-sm text-slate-400 py-2 px-3 block">{t.common.destinations}:</span>
                <div className="grid grid-cols-2 gap-2 pl-3">
                  {popularDestinations.map((d, index) => (
                    <button 
                      key={`navbar-popdest-mobile-${d.name}-${index}`}
                      onClick={() => selectDestination(d.name)}
                      className="text-left text-xs font-semibold text-slate-650 py-1.5 px-2 hover:bg-slate-50 rounded-lg"
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
                <button onClick={() => { setMobileMenuOpen(false); onNavigate('/about'); }} className="text-left font-bold text-sm text-slate-705 py-2.5 px-3 rounded-xl hover:bg-slate-50">{t.common.about}</button>
                {!user && (
                  <button onClick={handleOrdersClick} className="text-left font-bold text-sm text-slate-705 py-2.5 px-3 rounded-xl hover:bg-slate-50">{t.navbar.orders}</button>
                )}
                {user && role === UserRole.ADMIN && (
                  <button onClick={() => { setMobileMenuOpen(false); onNavigate('/admin'); }} className="text-left font-bold text-sm text-indigo-650 py-2.5 px-3 rounded-xl hover:bg-indigo-50/50">{language === 'en' ? 'Back to Admin' : 'Kembali ke Admin'}</button>
                )}
              </>
            )}

            {/* USER (TRAVELER) standard navigation links */}
            {!isTenantWorkspace && user && role === UserRole.USER && (
              <>
                <button onClick={() => { setMobileMenuOpen(false); onNavigate('/'); }} className="text-left font-bold text-sm text-slate-705 py-2.5 px-3 rounded-xl hover:bg-slate-50">{t.common.discover}</button>
                <button onClick={() => { setMobileMenuOpen(false); onNavigate('/my-bookings'); }} className="text-left font-bold text-sm text-slate-705 py-2.5 px-3 rounded-xl hover:bg-slate-50">{t.navbar.orders}</button>
                <button onClick={() => { setMobileMenuOpen(false); onNavigate('/wishlist'); }} className="text-left font-bold text-sm text-slate-705 py-2.5 px-3 rounded-xl hover:bg-slate-50">{t.navbar.myWishlist} ({favoritesCount})</button>
              </>
            )}

            {/* Profile actions for any logged in user */}
            {user && (
              <>
                <button onClick={() => { setMobileMenuOpen(false); onNavigate('/profile'); }} className="text-left font-bold text-sm text-slate-705 py-2.5 px-3 rounded-xl hover:bg-slate-50">{language === 'en' ? 'My Profile' : 'Profil Saya'}</button>
                <button onClick={() => { setMobileMenuOpen(false); onNavigate('/settings'); }} className="text-left font-bold text-sm text-slate-705 py-2.5 px-3 rounded-xl hover:bg-slate-50">{language === 'en' ? 'Account Settings' : 'Pengaturan Akun'}</button>
                <button onClick={() => { setMobileMenuOpen(false); onNavigate('/security'); }} className="text-left font-bold text-sm text-slate-705 py-2.5 px-3 rounded-xl hover:bg-slate-50">{language === 'en' ? 'Security' : 'Keamanan'}</button>
                
                {!isTenantWorkspace && role === UserRole.USER && (
                  fetchingRole ? (
                    <div className="animate-pulse bg-slate-50 text-[11px] font-bold text-slate-400 py-2.5 px-3 rounded-xl">
                      {language === 'en' ? 'Checking host status...' : 'Memeriksa status host...'}
                    </div>
                  ) : (
                    (dbUser?.role === 'USER' || dbUser?.role === 'TRAVELER') && (
                      dbUser?.hostApplication?.status === 'PENDING' ? (
                        <div className="font-bold text-sm text-amber-970 py-2.5 px-3 rounded-xl bg-amber-50/40 flex items-center gap-2 select-none">
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          <span>{language === 'en' ? 'Host Application Pending' : 'Pengajuan Host Diproses'}</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => { setMobileMenuOpen(false); setBecomeHostModalOpen(true); }} 
                          className="text-left font-bold text-sm text-indigo-700 py-2.5 px-3 rounded-xl hover:bg-indigo-50/50"
                        >
                          {language === 'en' ? 'Become a Host' : 'Menjadi Host'}
                        </button>
                      )
                    )
                  )
                )}
              </>
            )}

          </div>

          {/* Bottom mobile session CTA section */}
          {!user ? (
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5">
              <button onClick={() => { setMobileMenuOpen(false); handleBecomeHostClick(); }} className="text-center font-bold text-sm text-indigo-700 py-2.5 border border-indigo-100 rounded-xl bg-indigo-50/20">{language === 'en' ? 'Become a Host' : 'Menjadi Host'}</button>
              <button onClick={() => { setMobileMenuOpen(false); setShowLoginModal(true); }} className="text-center font-bold text-sm text-slate-700 py-2.5">{t.common.signIn}</button>
              <button onClick={() => { setMobileMenuOpen(false); setShowRegisterModal(true); }} className="text-center font-black text-sm text-white bg-indigo-900 rounded-xl py-2.5 shadow-sm">{t.common.getStarted}</button>
            </div>
          ) : (
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5">
              <span className="text-[10px] font-black uppercase text-slate-400 block px-3">Signed In Profile</span>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black select-none">
                  {user.avatarUrl && !user.avatarUrl.includes('dicebear.com') ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span>{getInitials(user.name)}</span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{user.name}</div>
                  <div className="text-[10px] text-slate-450 truncate">{user.email}</div>
                </div>
              </div>
              
              {fetchingRole ? (
                <div 
                  id="mobile-role-loading-skeleton"
                  className="animate-pulse bg-slate-100 rounded-xl h-10 w-full flex items-center justify-center mb-2"
                >
                  <div className="h-3 bg-slate-200 rounded-sm w-1/3"></div>
                </div>
              ) : (
                <>
                  {role === UserRole.TENANT && (
                    isTenantWorkspace ? (
                      <button 
                        id="mobile-traveler-mode-btn"
                        onClick={() => { setMobileMenuOpen(false); onNavigate('/'); }} 
                        className="text-center font-bold text-sm text-indigo-800 py-2.5 border border-indigo-200 rounded-xl bg-indigo-50/40 cursor-pointer w-full flex items-center justify-center gap-2 mb-2"
                      >
                        <Globe className="w-4 h-4 text-indigo-600" />
                        <span>{language === 'en' ? 'Switch to Traveling' : 'Kembali ke Traveler'}</span>
                      </button>
                    ) : (
                      <button 
                        id="mobile-host-dashboard-btn"
                        onClick={() => { setMobileMenuOpen(false); onNavigate('/dashboard'); }} 
                        className="text-center font-bold text-sm text-emerald-800 py-2.5 border border-emerald-200 rounded-xl bg-emerald-50/40 cursor-pointer w-full flex items-center justify-center gap-2 mb-2"
                      >
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        <span>{language === 'en' ? 'Host Dashboard' : 'Dasbor Host'}</span>
                      </button>
                    )
                  )}
                </>
              )}

              <button 
                onClick={() => { setMobileMenuOpen(false); setShowSignOutModal(true); }}
                className="w-full text-center font-bold text-sm text-rose-600 border border-rose-100 rounded-xl py-2.5 bg-rose-50/10 cursor-pointer"
              >
                {t.common.signOut}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================================================= */}
      {/* SECURITY MODAL PORTAL */}
      {/* ================================================= */}
      {showSecurityModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in text-slate-800">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-md w-full p-6 shadow-2xl animate-scale-up text-slate-800 relative">
            <button 
              onClick={() => setShowSecurityModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4 text-indigo-600">
              <span className="p-2.5 bg-indigo-50 rounded-2xl">
                <Lock className="w-6 h-6 stroke-[2]" />
              </span>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 leading-none">
                  {language === 'en' ? 'Security & Clearances' : 'Keamanan & Autentikasi'}
                </h3>
                <p className="text-[10px] text-slate-450 font-black mt-1 uppercase tracking-wider">Certified Secure by StayEase</p>
              </div>
            </div>

            <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-5">
              {language === 'en' 
                ? 'Review credentials, secure active logins, and configure multi-factor checks below.' 
                : 'Periksa kredensial, amankan masuk aktif, dan konfigurasikan pemeriksaan multi-faktor di bawah.'}
            </p>

            <div className="flex flex-col gap-4 mb-6">
              {/* MFA Switch */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">{language === 'en' ? 'Multi-Factor Auth (MFA)' : 'Autentikasi Multi-Faktor (MFA)'}</span>
                  <span className="text-[10px] text-slate-450 mt-0.5">{language === 'en' ? 'Secure accounts from unauthorized accesses.' : 'Amankan akun dari akses yang tidak dikenal.'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !mfaEnabled;
                    setMfaEnabled(nextVal);
                    localStorage.setItem('stayee_mfa', String(nextVal));
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    mfaEnabled ? 'bg-indigo-600' : 'bg-slate-350'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      mfaEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Password Status */}
              <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">{language === 'en' ? 'Account Password' : 'Kata Sandi Akun'}</span>
                  <span className="text-[10px] text-slate-450 mt-0.5">{language === 'en' ? 'Last rotation: 3 weeks ago' : 'Rotasi terakhir: 3 minggu lalu'}</span>
                </div>
                <span className="text-[10px] font-black px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md uppercase tracking-wide border border-emerald-100">
                  {language === 'en' ? 'Secured' : 'Aman'}
                </span>
              </div>

              {/* Device Session */}
              <div className="p-3.5 bg-indigo-50/20 border border-indigo-50/30 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-black text-slate-800 block">{language === 'en' ? 'Current Session' : 'Sesi Aktif Saat Ini'}</span>
                  <span className="text-[10px] text-slate-450 font-semibold block truncate">Jakarta, ID • Chrome Browser</span>
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-emerald-600 mt-0.5 inline-block bg-emerald-50 px-1 py-0.2 rounded">This Device</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSecurityModal(false)}
                className="px-4 py-2.5 text-xs font-black text-white bg-indigo-900 hover:bg-indigo-850 rounded-xl transition-colors shadow-sm cursor-pointer w-full text-center hover:bg-opacity-95"
              >
                {language === 'en' ? 'Dismiss' : 'Selesai'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================================================= */}
      {/* 1. LOGIN EXPERIENCE (Portal compact authentication modal) */}
      {/* ================================================= */}
      {showLoginModal && createPortal(
        <div 
          id="login-modal-overlay"
          onClick={() => {
            setShowLoginModal(false);
            setLoginEmail('');
            setLoginPassword('');
            setLoginError('');
            setLoginHint('');
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div 
            id="login-modal-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-[420px] rounded-[24px] border border-slate-100 shadow-2xl overflow-hidden relative p-8 flex flex-col gap-6 text-slate-800 animate-slide-up"
          >
            
            {/* Close toggle */}
            <button 
              id="close-login-modal"
              onClick={() => {
                setShowLoginModal(false);
                setLoginEmail('');
                setLoginPassword('');
                setLoginError('');
                setLoginHint('');
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-150 text-slate-400 hover:text-slate-700 transition-all cursor-pointer border border-slate-100 bg-white shadow-3xs"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title and Subtitle Block */}
            <div className="text-center mt-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {t.navbar.welcomeBack}
              </h2>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                {t.navbar.signInSubtitle}
              </p>
            </div>

            {/* Error logs */}
            {loginError && (
              <div className="bg-rose-50 text-rose-650 text-xs font-semibold py-2.5 px-3.5 rounded-xl border border-rose-100 leading-normal">
                {loginError}
              </div>
            )}

            {/* Success banner */}
            {loginHint && (
              <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold py-2.5 px-3.5 rounded-xl border border-emerald-100 flex items-center gap-2 animate-pulse">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" /> {loginHint}
              </div>
            )}

            {/* Email and Password Form */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 shadow-sm"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <Chrome className="w-4 h-4 text-rose-500" />
                )}
                Continue with Google
              </button>
              <button
                type="button"
                disabled={true}
                title="Coming Soon"
                className="w-full bg-slate-50 text-slate-400 border border-slate-200 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed transition-all duration-150 shadow-sm"
              >
                <Apple className="w-4 h-4 text-slate-400" />
                Continue with Apple
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              
              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-650 block">
                  {t.navbar.emailAddress}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <input 
                    required 
                    type="email" 
                    placeholder="you@domain.com" 
                    value={loginEmail} 
                    onChange={e => setLoginEmail(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm font-medium py-3 pl-11 pr-4 rounded-xl focus:outline-hidden transition-all text-slate-900 shadow-3xs"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-650 block">
                    {t.navbar.password}
                  </label>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowLoginModal(false);
                      onNavigate('/forgot-password');
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-bold hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative font-sans text-slate-800">
                  <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <input 
                    required
                    type={showLoginPassword ? "text" : "password"} 
                    placeholder="••••••••••••" 
                    value={loginPassword} 
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm font-medium py-3 pl-11 pr-12 rounded-xl focus:outline-hidden transition-all text-slate-900 shadow-3xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showLoginPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button 
                type="submit" 
                disabled={loginLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-sm cursor-pointer transition-colors shadow-sm mt-2 focus:ring-4 focus:ring-indigo-100 flex items-center justify-center gap-1.5"
              >
                {loginLoading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            {/* Footer switch to Registration */}
            <div className="border-t border-slate-100 pt-4 text-center">
              <div className="text-xs text-slate-500 font-medium">
                {language === 'en' ? "Don't have an account?" : 'Belum punya akun?'}{' '}
                <button 
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowRegisterModal(true);
                  }} 
                  className="text-indigo-650 font-black hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ================================================= */}
      {/* 2. REGISTER EXPERIENCE (Portal compact registration form) */}
      {/* ================================================= */}
      {showRegisterModal && createPortal(
        <div 
          id="register-modal-overlay"
          onClick={() => {
            setShowRegisterModal(false);
            setRegError('');
            setRegSuccessData(null);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div 
            id="register-modal-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-[440px] rounded-[24px] border border-slate-100 shadow-2xl overflow-hidden relative p-8 flex flex-col gap-5 text-slate-800 animate-slide-up max-h-[94vh] overflow-y-auto"
          >
            
            {/* Close toggle */}
            <button 
              id="close-register-modal"
              onClick={() => {
                setShowRegisterModal(false);
                setRegError('');
                setRegSuccessData(null);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-150 text-slate-400 hover:text-slate-700 transition-all cursor-pointer border border-slate-100 bg-white shadow-3xs"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title Block */}
            <div className="text-center mt-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Create Account
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 font-medium">
                Join StayEase today to find and list premium workspaces
              </p>
            </div>

            {/* Error logs */}
            {regError && (
              <div className="bg-rose-50 text-rose-650 text-xs font-semibold py-2.5 px-3.5 rounded-xl border border-rose-100 leading-normal">
                {regError}
              </div>
            )}

            {/* Success logs */}
            {regSuccessData && (
              <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold py-3 px-3.5 rounded-xl border border-emerald-100 flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 animate-bounce" /> Account Created!
                </span>
                <span>
                  Your actvation token is <strong className="font-bold underline text-indigo-900">{regSuccessData.verificationToken}</strong>. Redirecting to verify your email...
                </span>
              </div>
            )}

            {/* OAuth Buttons */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 shadow-sm"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <Chrome className="w-4 h-4 text-rose-500" />
                )}
                Continue with Google
              </button>
              <button
                type="button"
                disabled={true}
                title="Coming Soon"
                className="w-full bg-slate-50 text-slate-400 border border-slate-200 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed transition-all duration-150 shadow-sm"
              >
                <Apple className="w-4 h-4 text-slate-400" />
                Continue with Apple
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
              
              {/* Role Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 block">Select Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole(UserRole.USER)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                      regRole === UserRole.USER 
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Compass className={`w-5 h-5 ${regRole === UserRole.USER ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-[10.5px] font-extrabold block text-slate-900">Traveler</span>
                      <span className="text-[8.5px] text-slate-450 font-bold leading-none">I want to stay</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole(UserRole.TENANT)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                      regRole === UserRole.TENANT 
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Building2 className={`w-5 h-5 ${regRole === UserRole.TENANT ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-[10.5px] font-extrabold block text-slate-900">Property Owner</span>
                      <span className="text-[8.5px] text-slate-450 font-bold leading-none">I want to list suites</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-650 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <input 
                    required 
                    type="text" 
                    placeholder="Jane Doe" 
                    value={regName} 
                    onChange={e => setRegName(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm font-medium py-3 pl-11 pr-4 rounded-xl focus:outline-hidden transition-all text-slate-900 shadow-3xs"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-650 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <input 
                    required 
                    type="email" 
                    placeholder="you@domain.com" 
                    value={regEmail} 
                    onChange={e => setRegEmail(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm font-medium py-3 pl-11 pr-4 rounded-xl focus:outline-hidden transition-all text-slate-900 shadow-3xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-650 block">Password</label>
                <div className="relative font-sans text-slate-800">
                  <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <input 
                    required 
                    type={showRegPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={regPassword} 
                    onChange={e => setRegPassword(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm font-medium py-3 pl-11 pr-12 rounded-xl focus:outline-hidden transition-all text-slate-900 shadow-3xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showRegPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-650 block">Confirm Password</label>
                <div className="relative font-sans text-slate-800">
                  <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <input 
                    required 
                    type={showRegConfirmPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={regConfirmPassword} 
                    onChange={e => setRegConfirmPassword(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm font-medium py-3 pl-11 pr-12 rounded-xl focus:outline-hidden transition-all text-slate-900 shadow-3xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Create Account Button */}
              <button 
                type="submit" 
                disabled={regLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-sm cursor-pointer transition-colors shadow-sm mt-1 focus:ring-4 focus:ring-indigo-100 flex items-center justify-center gap-1.5"
              >
                {regLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            {/* Footer switch to Sign In */}
            <div className="border-t border-slate-100 pt-4 text-center">
              <span className="text-xs text-slate-500 font-medium">
                Already have an account?{' '}
                <button 
                  onClick={() => {
                    setShowRegisterModal(false);
                    setShowLoginModal(true);
                  }} 
                  className="text-indigo-650 font-black hover:underline cursor-pointer"
                >
                  {t.common.signIn}
                </button>
              </span>
            </div>

          </div>
        </div>,
        document.body
      )}

      {showSignOutModal && createPortal(
        <div id="sign-out-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[10000] animate-fade-in text-slate-800">
          <div className="bg-white border border-slate-150 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative animate-scale-up text-slate-800">
            <div className="mb-4 text-left">
              <h3 className="text-lg font-black text-indigo-950 font-display">Sign Out</h3>
              <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
                Are you sure you want to sign out? You will need to re-authenticate to view your properties, bookings, and active dashboard coordinates.
              </p>
            </div>
            
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSignOutModal(false)}
                className="px-4 py-2 border border-slate-150 text-slate-650 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignOutModal(false);
                  handleSignOut();
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all font-bold text-xs cursor-pointer shadow-md shadow-rose-600/10"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {becomeHostModalOpen && createPortal(
        <div id="become-host-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[10000] animate-fade-in text-slate-800">
          <div className="bg-white border border-slate-150 rounded-3xl max-w-xl w-full p-8 shadow-2xl relative animate-scale-up text-slate-800">
            {/* Header */}
            <div className="border-b border-slate-100 pb-4 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-indigo-950 font-display">
                    {language === 'en' ? 'Become a StayEase Host' : 'Menjadi Host StayEase'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {language === 'en' ? 'Start hosting & monetize your space' : 'Mulai menyewakan & dapatkan penghasilan'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setBecomeHostModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 p-2 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description / Explaining Benefits */}
            <div className="mb-6">
              <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
                {language === 'en' 
                  ? 'Join millions of hosts on StayEase. We provide everything you need to list, manage, and earn from your properties securely.' 
                  : 'Bergabunglah dengan jutaan host di StayEase. Kami menyediakan semua yang Anda butuhkan untuk mendaftarkan, mengelola, dan menghasilkan uang.'}
              </p>
              
              {/* Host Benefits Grid/List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80 flex items-start gap-3">
                  <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{language === 'en' ? 'List Properties' : 'Daftarkan Properti'}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {language === 'en' ? 'Earn extra income by listing spare rooms, houses, or villas.' : 'Dapatkan penghasilan dengan mendaftarkan kamar kosong atau vila.'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80 flex items-start gap-3">
                  <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{language === 'en' ? 'Manage Reservations' : 'Kelola Reservasi'}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {language === 'en' ? 'Fully control your calendar, prices, and approval rules.' : 'Kontrol penuh kalender, harga sewa, dan peraturan persetujuan.'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80 flex items-start gap-3">
                  <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{language === 'en' ? 'Receive Payments' : 'Terima Pembayaran'}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {language === 'en' ? 'Safe, integrated payouts directly into your bank or wallet.' : 'Pencairan dana aman & terintegrasi langsung ke bank atau dompet.'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80 flex items-start gap-3">
                  <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{language === 'en' ? 'Access Analytics' : 'Akses Analitik'}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {language === 'en' ? 'Monitor views, bookings, and revenue metrics in real-time.' : 'Pantau kunjungan iklan, pemesanan, & pendapatan secara real-time.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Workflow Mode Picker (Instant vs Admin Approval) */}
            <div className="p-4 rounded-2xl bg-indigo-50/10 border border-dashed border-indigo-200/80 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-indigo-950 block">
                  {language === 'en' ? 'Onboarding Workflow Mode' : 'Mode Alur Onboarding'}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                  {requireApproval 
                    ? (language === 'en' ? 'Simulates approval workflow (requires administrator verification approval).' : 'Simulasi persetujuan (memerlukan persetujuan verifikasi instansi/admin).')
                    : (language === 'en' ? 'Direct upgrade (instantly updates your role & builds tenant profile).' : 'Ditingkatkan langsung (instan memperbarui peran & membuat profil host).')
                  }
                </span>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => setRequireApproval(false)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                    !requireApproval 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {language === 'en' ? 'Instant' : 'Instan'}
                </button>
                <button
                  type="button"
                  onClick={() => setRequireApproval(true)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                    requireApproval 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {language === 'en' ? 'Pending Approval' : 'Persetujuan'}
                </button>
              </div>
            </div>

            {/* Error messaging state */}
            {errorBecomeHost && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorBecomeHost}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={loadingBecomeHost}
                onClick={() => setBecomeHostModalOpen(false)}
                className="px-5 py-2.5 border border-slate-150 text-slate-650 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="button"
                disabled={loadingBecomeHost}
                onClick={handleConfirmBecomeHost}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-xs cursor-pointer shadow-md shadow-indigo-600/10 flex items-center gap-1.5 disabled:opacity-50"
              >
                {loadingBecomeHost ? (language === 'en' ? 'Processing...' : 'Memproses...') : (language === 'en' ? 'Yes, Become a Host' : 'Ya, Hubungkan Peran Host')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </header>
  );
}
export {};