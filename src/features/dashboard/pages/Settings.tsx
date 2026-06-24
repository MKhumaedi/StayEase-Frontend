import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { 
  Settings as SettingsIcon, Globe, Calendar, SunMoon, 
  Bell, Mail, BookOpen, Building, MessageSquare, ShieldCheck, 
  AlertTriangle, Save, RefreshCw, Undo, Volume2 
} from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

interface UserSettings {
  timezone: string;
  dateFormat: string;
  theme: string;
  emailNotifications: boolean;
  bookingNotifications: boolean;
  propertyNotifications: boolean;
  reviewNotifications: boolean;
  marketingEmails: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  timezone: 'UTC',
  dateFormat: 'DD/MM/YYYY',
  theme: 'System',
  emailNotifications: true,
  bookingNotifications: true,
  propertyNotifications: true,
  reviewNotifications: true,
  marketingEmails: false
};

const TIMEZONES = [
  { value: 'Asia/Jakarta', label: 'WIB - Jakarta (UTC+7)' },
  { value: 'Asia/Makassar', label: 'WITA - Makassar (UTC+8)' },
  { value: 'Asia/Jayapura', label: 'WIT - Jayapura (UTC+9)' },
  { value: 'UTC', label: 'UTC (GMT+0)' },
  { value: 'Europe/London', label: 'GMT - London (UTC+0/BST)' },
  { value: 'America/New_York', label: 'EST - New York (UTC-5/EDT)' }
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g. 25/12/2026)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g. 12/25/2026)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (e.g. 2026-12-25)' }
];

const THEMES = [
  { value: 'Light', label: 'Light Theme' },
  { value: 'Dark', label: 'Dark Theme' },
  { value: 'System', label: 'System Default' }
];

export default function Settings() {
  const { user, token, login } = useAuth();
  const { language } = useLanguage();

  // Settings State
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // UI Status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Initialize Settings
  useEffect(() => {
    if (user) {
      if (user.settings && typeof user.settings === 'object') {
        const merged = { ...DEFAULT_SETTINGS, ...user.settings } as UserSettings;
        setSettings(merged);
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
      setLoading(false);
    }
  }, [user]);

  // Track Unsaved Changes
  useEffect(() => {
    if (user) {
      const orig = (user.settings && typeof user.settings === 'object' 
        ? { ...DEFAULT_SETTINGS, ...user.settings } 
        : DEFAULT_SETTINGS) as UserSettings;

      const isChanged = JSON.stringify(settings) !== JSON.stringify(orig);
      setIsDirty(isChanged);
    }
  }, [settings, user]);

  const handleToggle = (key: keyof UserSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleValueChange = (key: keyof UserSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleReset = () => {
    if (user) {
      const orig = (user.settings && typeof user.settings === 'object' 
        ? { ...DEFAULT_SETTINGS, ...user.settings } 
        : DEFAULT_SETTINGS) as UserSettings;
      setSettings(orig);
      setSuccessMsg(language === 'en' ? 'Settings reset to current values!' : 'Pengaturan dikembalikan ke nilai tersimpan!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;

    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (language === 'en' ? 'Failed to update preferences' : 'Gagal memperbarui preferensi'));
      }

      // Sync local context state
      const updatedUser = { ...user, settings: data.user.settings };
      login(updatedUser, token);

      setSuccessMsg(language === 'en' ? 'Preferences saved successfully!' : 'Preferensi berhasil disimpan!');
      setIsDirty(false);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-150 rounded-3xl text-center shadow-xl">
        <p className="text-sm font-semibold text-slate-500">
          {language === 'en' ? 'Please sign in to view your preferences.' : 'Silakan masuk untuk melihat preferensi Anda.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in text-slate-800">
      
      {/* Settings Page Title and Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5 mb-8 gap-4">
        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 block mb-1">
            {language === 'en' ? 'Localizations & Filters' : 'Lokalisasi & Filter Masukan'}
          </span>
          <h1 className="text-3xl font-black text-indigo-950 font-display tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-8 h-8 text-indigo-650 shrink-0 stroke-[2.5]" />
            <span>{language === 'en' ? 'Account Settings' : 'Pengaturan Akun'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en' 
              ? 'Configure default timezones, date styles, interface themes, and instant email alert loops.' 
              : 'Konfigurasikan zona waktu default, gaya tanggal, tema, dan lingkaran peringatan email instan.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => { window.history.pushState(null, '', '/profile'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-150 text-slate-650 rounded-xl hover:bg-slate-100 transition-all font-bold text-xs cursor-pointer"
          >
            <span>{language === 'en' ? 'View My Profile' : 'Profil Saya'}</span>
          </button>
        </div>
      </div>

      {isDirty && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200/60 rounded-2xl flex items-center gap-3 animate-pulse text-amber-850">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
          <div className="text-xs font-semibold">
            {language === 'en' 
              ? 'You have unsaved changes. Remember to click "Save Settings" below to synchronize changes to database.' 
              : 'Anda memiliki perubahan preferensi yang belum disimpan. Ketuk "Simpan Pengaturan" di bawah.'}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-150 rounded-2xl flex items-center gap-3 text-emerald-800">
          <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500" />
          <div className="text-xs font-bold">{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-150 rounded-2xl flex items-center gap-3 text-rose-800">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
          <div className="text-xs font-bold">{errorMsg}</div>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* ==================== LEFT COLLAPSED WORKSPACE (PREFERENCES QUICK CARD) ==================== */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs">
            <span className="text-[9px] uppercase font-black tracking-widest text-[#4f46e5] mb-3 block">
              {language === 'en' ? 'Active Presets' : 'Preset Aktif'}
            </span>

            <div className="space-y-4 text-xs font-semibold text-slate-600">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Timezone / GMT</span>
                <span className="text-slate-800 font-extrabold text-xs block truncate">
                  {TIMEZONES.find(t => t.value === settings.timezone)?.label || settings.timezone}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Date Signature</span>
                <span className="text-slate-800 font-extrabold text-xs block">
                  {settings.dateFormat}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Active Layout Theme</span>
                <span className="text-indigo-650 font-extrabold text-xs block">
                  🎨 {settings.theme} Layout
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT PRESET CONFIGURATION (ACCESSIBLE DESIGN) ==================== */}
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
          
          {/* SECTION 1: GENERAL PREFERENCES */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-indigo-950 font-extrabold border-b border-slate-50 pb-2.5">
              <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
              <h3 className="text-sm font-black uppercase text-slate-600 tracking-wider">
                {language === 'en' ? 'General Preferences' : 'Preferensi Umum'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                  {language === 'en' ? 'Default Timezone' : 'Zona Waktu'}
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleValueChange('timezone', e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-150 rounded-2xl bg-slate-50/50 focus:border-indigo-500 focus:outline-hidden"
                >
                  {TIMEZONES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                  {language === 'en' ? 'Date Format Signature' : 'Format Penulisan Tanggal'}
                </label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => handleValueChange('dateFormat', e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-150 rounded-2xl bg-slate-50/50 focus:border-indigo-500 focus:outline-hidden"
                >
                  {DATE_FORMATS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                  {language === 'en' ? 'User Interface Layout Theme' : 'Gaya Tema Aplikasi'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {THEMES.map(theme => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => handleValueChange('theme', theme.value)}
                      className={`px-3 py-2 rounded-2xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        settings.theme === theme.value
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                          : 'border-slate-150 bg-slate-50/10 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="block">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: SYSTEM ALERT NOTIFICATIONS */}
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center gap-2 text-indigo-950 font-extrabold border-b border-slate-50 pb-2.5">
              <Bell className="w-4 h-4 text-indigo-600 shrink-0" />
              <h3 className="text-sm font-black uppercase text-slate-600 tracking-wider">
                {language === 'en' ? 'Notification Subscriptions' : 'Langganan Notifikasi Sistem'}
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              {/* Email master switcher */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Mail className="w-4.5 h-4.5 text-indigo-500 mt-1 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">
                      {language === 'en' ? 'Email Notifications' : 'Notifikasi Surat Elektronik (Email)'}
                    </span>
                    <span className="text-[10px] text-slate-450 mt-0.5">
                      {language === 'en' ? 'General reports, verification requests, changes.' : 'Laporan umum, permintaan verifikasi, perubahan.'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('emailNotifications')}
                  className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    settings.emailNotifications ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      settings.emailNotifications ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Booking alerts */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-4.5 h-4.5 text-indigo-500 mt-1 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">
                      {language === 'en' ? 'Booking Updates' : 'Pembaruan Pemesanan'}
                    </span>
                    <span className="text-[10px] text-slate-450 mt-0.5">
                      {language === 'en' ? 'Instant payment, check-in clearances, cancellation locks.' : 'Pembayaran instan, perizinan masuk, pembatalan.'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('bookingNotifications')}
                  className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    settings.bookingNotifications ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      settings.bookingNotifications ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Property listings */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Building className="w-4.5 h-4.5 text-indigo-500 mt-1 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">
                      {language === 'en' ? 'Listing & Inventory Changes' : 'Perubahan Daftar & Inventaris'}
                    </span>
                    <span className="text-[10px] text-slate-450 mt-0.5">
                      {language === 'en' ? 'Availability modifications, room assignment edits.' : 'Modifikasi ketersediaan, edit penetapan kamar.'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('propertyNotifications')}
                  className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    settings.propertyNotifications ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      settings.propertyNotifications ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Review reports */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4.5 h-4.5 text-indigo-500 mt-1 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">
                      {language === 'en' ? 'Review & Feedback Alerts' : 'Ulasan & Tanggapan Balik'}
                    </span>
                    <span className="text-[10px] text-slate-450 mt-0.5">
                      {language === 'en' ? 'Guest rating notifications, reply comment dispatches.' : 'Penilaian pengunjung, pengiriman komentar balasan.'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('reviewNotifications')}
                  className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    settings.reviewNotifications ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      settings.reviewNotifications ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Marketing newsletters */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Volume2 className="w-4.5 h-4.5 text-indigo-500 mt-1 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">
                      {language === 'en' ? 'Marketing Newsletters' : 'Buletin & Penawaran Pemasaran'}
                    </span>
                    <span className="text-[10px] text-slate-450 mt-0.5">
                      {language === 'en' ? 'Exclusive promotional, loyalty offers, partner recommendations.' : 'Loyalitas promosi eksklusif, rekomendasi mitra.'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('marketingEmails')}
                  className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    settings.marketingEmails ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4.5. w-4.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      settings.marketingEmails ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Action Footer Button with responsive state handling */}
          <div className="flex items-center justify-between mt-4 gap-3 border-t border-slate-50 pt-5">
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty || saving}
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                isDirty && !saving
                  ? 'border-slate-150 text-slate-650 bg-white hover:bg-slate-50'
                  : 'border-slate-100 text-slate-350 bg-slate-50/50 cursor-not-allowed'
              }`}
            >
              <Undo className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Reset Settings' : 'Reset'}</span>
            </button>

            <button
              type="submit"
              disabled={!isDirty || saving}
              className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-2 shrink-0 ${
                isDirty && !saving
                  ? 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] shadow-md shadow-indigo-600/10'
                  : 'bg-indigo-300 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === 'en' ? 'Saving...' : 'Menyimpan...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Save Settings' : 'Simpan Pengaturan'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
