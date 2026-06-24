import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../../types';
import { usePropertyFilterOptions } from '../../hooks/usePropertyFilterOptions';
import { 
  Shield, 
  User, 
  LogOut, 
  ChevronDown, 
  Compass, 
  MapPin, 
  Info, 
  Menu, 
  X, 
  Globe, 
  DoorOpen, 
  Building2, 
  ArrowRight,
  Bookmark,
  Briefcase
} from 'lucide-react';
import { useLanguage } from '../i18n';

interface HeaderProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  activePath: string;
  onNavigate: (path: string, params?: any) => void;
}

export default function Header({ currentRole, onChangeRole, activePath, onNavigate }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const [user, setUser] = useState<{ id?: string; name: string; email: string; role: string } | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [destinationsOpen, setDestinationsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

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

  // Sync user state from localStorage dynamically on path/storage change
  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem('stayease_user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, [activePath]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setDestinationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('stayease_token');
    localStorage.removeItem('stayease_user');
    setUser(null);
    setProfileDropdownOpen(false);
    onChangeRole(UserRole.TENANT);
    onNavigate('/');
  };

  const selectDestination = (loc: string) => {
    setDestinationsOpen(false);
    setMobileMenuOpen(false);
    onNavigate('/search', { location: loc });
  };

  const handleRoleChange = (role: UserRole) => {
    onChangeRole(role);
    // Update role in localStorage user if available
    const storedUser = localStorage.getItem('stayease_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        parsed.role = role;
        localStorage.setItem('stayease_user', JSON.stringify(parsed));
        setUser(parsed);
      } catch (err) {
        console.error(err);
      }
    }
    setProfileDropdownOpen(false);
    if (role === UserRole.TENANT) {
      onNavigate('/dashboard');
    } else {
      onNavigate('/traveler-dashboard');
    }
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

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-md flex items-center justify-between px-6 py-4 border-b ${
      showDarkHeader 
        ? 'bg-white/95 border-slate-100 shadow-sm text-slate-800' 
        : 'bg-transparent border-transparent text-white'
    }`}>
      {/* Brand Logo */}
      <div className="flex items-center gap-10">
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
 
        {/* Public Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-[13px] font-semibold tracking-wide">
          <span 
            onClick={() => onNavigate('/')} 
            onKeyDown={(e) => handleKeyDown(e, () => onNavigate('/'))}
            role="link"
            tabIndex={0}
            className={`cursor-pointer transition-colors relative py-1 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 rounded ${
              activePath === '/' 
                ? (showDarkHeader ? 'text-indigo-600 font-bold' : 'text-white font-bold border-b-2 border-white')
                : (showDarkHeader ? 'text-slate-600 hover:text-indigo-600' : 'text-white/80 hover:text-white')
            }`}
          >
            {t.common.discover}
            {activePath === '/' && showDarkHeader && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </span>

          <span 
            onClick={() => onNavigate('/search')} 
            onKeyDown={(e) => handleKeyDown(e, () => onNavigate('/search'))}
            role="link"
            tabIndex={0}
            className={`cursor-pointer transition-colors relative py-1 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 rounded ${
              activePath === '/search' 
                ? (showDarkHeader ? 'text-indigo-600 font-bold' : 'text-white font-bold border-b-2 border-white')
                : (showDarkHeader ? 'text-slate-600 hover:text-indigo-600' : 'text-white/80 hover:text-white')
            }`}
          >
            {t.common.properties}
            {activePath === '/search' && showDarkHeader && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </span>

          {/* Destinations Dropdown */}
          <div className="relative" ref={destRef}>
            <button 
              onClick={() => setDestinationsOpen(!destinationsOpen)} 
              className={`flex items-center gap-1 cursor-pointer transition-colors py-1 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 rounded ${
                showDarkHeader 
                  ? (destinationsOpen ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600') 
                  : (destinationsOpen ? 'text-white font-bold' : 'text-white/80 hover:text-white')
              }`}
            >
              {t.common.destinations} <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${destinationsOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {destinationsOpen && (
              <div className="absolute left-0 mt-3 w-80 bg-white border border-slate-100 shadow-2xl rounded-2xl p-4 z-50 animate-fade-in-down text-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2.5">{t.navbar.curatedDestinations}</span>
                <div className="flex flex-col gap-1">
                  {popularDestinations.map((d, index) => (
                    <button 
                      key={`header-popdest-desktop-${d.name}-${index}`}
                      onClick={() => selectDestination(d.name)}
                      className="flex items-start gap-3 p-2.5 hover:bg-slate-50 rounded-xl text-left transition-colors cursor-pointer group focus:outline-hidden focus:ring-2 focus:ring-indigo-505"
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

          <span 
            onClick={() => setAboutOpen(true)} 
            onKeyDown={(e) => handleKeyDown(e, () => setAboutOpen(true))}
            role="link"
            tabIndex={0}
            className={`cursor-pointer transition-colors py-1 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 rounded ${
              showDarkHeader ? 'text-slate-600 hover:text-indigo-600' : 'text-white/80 hover:text-white'
            }`}
          >
            {t.common.about}
          </span>
        </nav>
      </div>

      {/* Right Side CTAs / Authed User Corner */}
      <div className="flex items-center gap-4">
        
        {/* Desktop Language Switcher */}
        <div className="hidden lg:block relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className={`bg-transparent text-xs font-black py-1.5 px-3 rounded-xl border transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
              showDarkHeader
                ? 'border-slate-200 text-slate-800 hover:border-slate-350 bg-white/50'
                : 'border-white/20 text-white hover:border-white/30 bg-slate-900/30'
            }`}
          >
            <option value="id" className="text-slate-800">🇮🇩 ID</option>
            <option value="en" className="text-slate-800">🇺🇸 EN</option>
          </select>
        </div>

        {/* Public Navigation when not signed in */}
        {!user ? (
          <div className="hidden sm:flex items-center gap-5">
            <button 
              onClick={() => onNavigate('/dashboard')} 
              className={`text-[13px] font-semibold cursor-pointer transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 rounded ${
                showDarkHeader ? 'text-slate-600 hover:text-indigo-600' : 'text-white/80 hover:text-white'
              }`}
            >
              {t.common.becomeHost}
            </button>
            <button 
              onClick={() => onNavigate('/login')} 
              className={`text-[13px] font-semibold cursor-pointer transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 rounded ${
                showDarkHeader ? 'text-slate-700 hover:text-indigo-600' : 'text-white/90 hover:text-white'
              }`}
            >
              {t.common.signIn}
            </button>
            <button 
              onClick={() => onNavigate('/register')} 
              className={`text-[13px] font-semibold px-4.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                showDarkHeader 
                  ? 'bg-indigo-900 hover:bg-slate-900 text-white shadow-md' 
                  : 'bg-white hover:bg-slate-100 text-indigo-950 font-bold'
              }`}
            >
              {t.common.getStarted}
            </button>
          </div>
        ) : (
          /* Authenticated User Workspace */
          <div className="flex items-center gap-3">
            {/* Host console shortcut banner */}
            {currentRole === UserRole.USER ? (
              <button 
                onClick={() => handleRoleChange(UserRole.TENANT)}
                className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                  showDarkHeader 
                    ? 'bg-slate-50 border-slate-100 hover:border-indigo-100 text-indigo-900' 
                    : 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600" /> {t.common.becomeHost}
              </button>
            ) : (
              <span className={`hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-black tracking-wider uppercase ${
                showDarkHeader 
                  ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                  : 'bg-white/10 border-white/20 text-white'
              }`}>
                <Shield className="w-3 h-3" /> {currentRole} {t.navbar.roleActiveBadge}
              </span>
            )}

            {/* Profile Dropdown Trigger */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-2xl transition-all cursor-pointer text-left focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                  showDarkHeader 
                    ? 'bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-800' 
                    : 'bg-white/10 border-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-indigo-900 text-indigo-100 flex items-center justify-center font-black text-xs font-mono shadow-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block">
                  <div className="text-[11.5px] font-black leading-tight truncate max-w-[100px]">{user.name}</div>
                  <div className="text-[9px] uppercase font-black tracking-wider leading-none opacity-85">{currentRole.toLowerCase()}</div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 opacity-80 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white border border-slate-100 shadow-2xl rounded-2xl p-4 z-50 animate-fade-in-down">
                  {/* User Profile Header */}
                  <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-black text-base font-mono">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-[13px] font-black text-slate-800 truncate">{user.name}</div>
                      <div className="text-[10px] text-slate-450 truncate">{user.email}</div>
                    </div>
                  </div>

                  {/* Role Switcher Section */}
                  <div className="py-3.5 border-b border-slate-100">
                    <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider block mb-2">Switch Workspace Role</span>
                    <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                      {(Object.keys(UserRole) as Array<keyof typeof UserRole>).map(rKey => {
                        const rVal = UserRole[rKey];
                        const isActive = currentRole === rVal;
                        return (
                          <button
                            key={rVal}
                            onClick={() => handleRoleChange(rVal)}
                            className={`py-1.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                              isActive 
                                ? 'bg-white text-indigo-750 shadow-xs border border-indigo-50' 
                                : 'text-slate-450 hover:text-slate-800'
                            }`}
                          >
                            {rKey.toLowerCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation Links inside dropdown */}
                  <div className="py-2.5 flex flex-col gap-0.5">
                    <button 
                      onClick={() => { setProfileDropdownOpen(false); onNavigate('/traveler-dashboard'); }}
                      className="flex items-center gap-2 px-2.5 py-2 text-left hover:bg-slate-50 rounded-xl transition-colors text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.common.dashboard}</span>
                    </button>
                    
                    <button 
                      onClick={() => { setProfileDropdownOpen(false); onNavigate('/dashboard'); }}
                      className="flex items-center gap-2 px-2.5 py-2 text-left hover:bg-slate-50 rounded-xl transition-colors text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      <span>Tenant Workspace</span>
                    </button>

                    <button 
                      onClick={() => { setProfileDropdownOpen(false); onNavigate('/search'); }}
                      className="flex items-center gap-2 px-2.5 py-2 text-left hover:bg-slate-50 rounded-xl transition-colors text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                      <span>Saved Listings</span>
                    </button>
                  </div>

                  {/* Logout Section */}
                  <div className="pt-2 border-t border-slate-100 mt-1">
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors text-xs font-bold text-left cursor-pointer"
                    >
                      <span>{t.common.signOut}</span>
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Menu Icon */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-[73px] left-0 right-0 bg-white border-b border-slate-150 shadow-xl p-5 flex flex-col gap-4 z-40 animate-fade-in lg:hidden">
          
          {/* Mobile Language Selector */}
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Language / Bahasa</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setLanguage('id')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                language === 'id' ? 'bg-indigo-900 border-indigo-900 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              🇮🇩 Bahasa Indonesia
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                language === 'en' ? 'bg-indigo-900 border-indigo-900 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              🇺🇸 English
            </button>
          </div>

          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Navigation</span>
          <div className="flex flex-col gap-1">
            <button onClick={() => { setMobileMenuOpen(false); onNavigate('/'); }} className="text-left font-bold text-sm text-slate-700 py-2.5 px-3 rounded-xl hover:bg-slate-50">{t.common.discover}</button>
            <button onClick={() => { setMobileMenuOpen(false); onNavigate('/search'); }} className="text-left font-bold text-sm text-slate-700 py-2.5 px-3 rounded-xl hover:bg-slate-50">{t.common.properties}</button>
            <span className="font-bold text-sm text-slate-400 py-2 px-3 block">{t.common.destinations}:</span>
            <div className="grid grid-cols-2 gap-2 pl-3">
              {popularDestinations.map((d, index) => (
                <button 
                  key={`header-popdest-mobile-${d.name}-${index}`}
                  onClick={() => selectDestination(d.name)}
                  className="text-left text-xs font-semibold text-slate-600 py-1.5 px-2 hover:bg-slate-50 rounded-lg"
                >
                  {d.name}
                </button>
              ))}
            </div>
            <button onClick={() => { setMobileMenuOpen(false); setAboutOpen(true); }} className="text-left font-bold text-sm text-slate-700 py-2.5 px-3 rounded-xl hover:bg-slate-50">{t.common.about}</button>
          </div>

          {!user ? (
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5">
              <button onClick={() => { setMobileMenuOpen(false); onNavigate('/dashboard'); }} className="text-center font-bold text-sm text-indigo-700 py-2.5 border border-indigo-100 rounded-xl bg-indigo-50/20">Tenant Workspace</button>
              <button onClick={() => { setMobileMenuOpen(false); onNavigate('/login'); }} className="text-center font-bold text-sm text-slate-700 py-2.5">{t.common.signIn}</button>
              <button onClick={() => { setMobileMenuOpen(false); onNavigate('/register'); }} className="text-center font-black text-sm text-white bg-indigo-900 rounded-xl py-2.5 shadow-sm">{t.common.getStarted}</button>
            </div>
          ) : (
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5">
              <span className="text-[10px] font-black uppercase text-slate-400 block px-3">Signed In Profile</span>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                <div className="w-6 h-6 rounded bg-indigo-900 text-white flex items-center justify-center text-xs font-bold font-mono">{user.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{user.name}</div>
                  <div className="text-[10px] text-slate-400">{user.email}</div>
                </div>
              </div>
              <button 
                onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                className="w-full text-center font-bold text-sm text-rose-600 border border-rose-100 rounded-xl py-2.5 bg-rose-50/10 cursor-pointer"
              >
                {t.common.signOut}
              </button>
            </div>
          )}
        </div>
      )}

      {/* About StayEase Backdrop Drawer / Sliding Panel */}
      {aboutOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white h-screen shadow-2xl p-8 overflow-y-auto flex flex-col justify-between animate-slide-left">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-indigo-600" />
                  <span className="text-lg font-black text-slate-900 tracking-tight font-display">{t.common.about} StayEase Premium</span>
                </div>
                <button 
                  onClick={() => setAboutOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Brand Narrative */}
              <div className="flex flex-col gap-5 leading-relaxed text-sm text-slate-600 mb-8">
                <div className="bg-gradient-to-tr from-indigo-950 to-slate-900 p-5 rounded-2xl text-white relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                    <Compass className="w-48 h-48" />
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-black text-indigo-300 block mb-1">Our Core Mandate</span>
                  <p className="font-display font-medium text-lg leading-snug text-slate-100">
                    “StayEase bridges the requirements of premium real-estate owners with globally mobile executives seeking high-fidelity environments.”
                  </p>
                </div>

                <p>
                  StayEase represents the pinnacle of residential luxury service. Founded to revolutionize intermediate and long-term accommodation for discerning travelers, we coordinate fine real-estate inventories across the globe's premier travel corridors.
                </p>

                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mt-2">Executive Luxury Standards</h4>
                <ul className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-700">
                  <li className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Building2 className="w-4 h-4 text-indigo-600" /> 100% Curated Inventory
                  </li>
                  <li className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <DoorOpen className="w-4 h-4 text-indigo-600" /> Executive Standard Amenities
                  </li>
                  <li className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Shield className="w-4 h-4 text-indigo-600" /> Grade-A Secure Escrows
                  </li>
                  <li className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Globe className="w-4 h-4 text-indigo-600" /> Continuous Concierge support
                  </li>
                </ul>

                <p>
                  Every property undergoes deep audit sweeps across 130 validation factors prior to listing activation, confirming that internet capacity, workspace noise buffers, temperature zoning, and physical safety barriers exceed executive expectations.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <button 
                onClick={() => { setAboutOpen(false); onNavigate('/search'); }}
                className="w-full bg-slate-900 hover:bg-slate-805 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
              >
                Explore Curated Properties <ArrowRight className="w-4 h-4" />
              </button>
              <div className="text-center text-[10.5px] text-slate-400 mt-2.5">
                StayEase Premium Corporate Platform • {t.common.allRightsReserved}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
