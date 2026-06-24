import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { 
  User, Mail, Shield, ShieldCheck, MapPin, 
  Award, Lock, Calendar, Eye, Activity, Save, RefreshCw, 
  AlertTriangle, Upload, CheckCircle2, UserCircle 
} from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

// Helper to extract initials from name
export function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'SE';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Profile() {
  const { user, token, login } = useAuth();
  const { language } = useLanguage();

  // Fresh state loaded from backend / context
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Tenant Specific States
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');

  // UI / Uploader states
  const [urlInput, setUrlInput] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Validation states
  const [nameError, setNameError] = useState('');

  // Hydrate user data from context
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      const rawUrl = user.avatarUrl;
      const hasValidPhoto = rawUrl && !rawUrl.includes('dicebear.com');
      setAvatarUrl(hasValidPhoto ? rawUrl : '');
      
      if (user.tenantProfile) {
        setCompanyName(user.tenantProfile.companyName || '');
        setTaxId(user.tenantProfile.taxId || '');
        setPhoneNumber(user.tenantProfile.phoneNumber || '');
        setAddress(user.tenantProfile.address || '');
        setBankName(user.tenantProfile.bankName || '');
        setBankAccountName(user.tenantProfile.bankAccountName || '');
        setBankAccountNo(user.tenantProfile.bankAccountNo || '');
      }
      setLoading(false);
    }
  }, [user]);

  // Track changes to trigger Unsaved warning
  useEffect(() => {
    if (user) {
      const isTenantChanged = user.role === 'TENANT' && (
        companyName !== (user.tenantProfile?.companyName || '') ||
        taxId !== (user.tenantProfile?.taxId || '') ||
        phoneNumber !== (user.tenantProfile?.phoneNumber || '') ||
        address !== (user.tenantProfile?.address || '') ||
        bankName !== (user.tenantProfile?.bankName || '') ||
        bankAccountName !== (user.tenantProfile?.bankAccountName || '') ||
        bankAccountNo !== (user.tenantProfile?.bankAccountNo || '')
      );

      const normUserAvatar = (user.avatarUrl && !user.avatarUrl.includes('dicebear.com')) ? user.avatarUrl : '';
      const isChanged = 
        name !== (user.name || '') || 
        avatarUrl !== normUserAvatar ||
        isTenantChanged;
      setIsDirty(isChanged);
    }
  }, [name, avatarUrl, companyName, taxId, phoneNumber, address, bankName, bankAccountName, bankAccountNo, user]);

  // Real-time Name Validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (val.trim().length < 2) {
      setNameError(language === 'en' ? 'Name must be at least 2 characters long' : 'Nama minimal 2 karakter');
    } else {
      setNameError('');
    }
  };

  // Drag-and-drop & manual file helpers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setErrorMsg('');
    setSuccessMsg('');

    // Reject > 2 MB file uploads
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg(language === 'en' ? 'File exceeds maximum 2 MB limit.' : 'Ukuran file melebihi batas 2 MB.');
      return;
    }

    // Validate MIME types
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrorMsg(language === 'en' ? 'Only JPG, JPEG, PNG, or WEBP formats are permitted.' : 'Hanya format JPG, JPEG, PNG, atau WEBP yang diizinkan.');
      return;
    }

    setAvatarFile(file);
    const preview = URL.createObjectURL(file);
    setAvatarUrl(preview);
    setUrlInput('');
  };

  const handleApplyUrl = () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!urlInput.trim()) return;

    try {
      new URL(urlInput);
    } catch (_) {
      setErrorMsg(language === 'en' ? 'Please provide a valid, well-formed URL.' : 'Silakan masukkan URL yang valid.');
      return;
    }

    setAvatarFile(null);
    setAvatarUrl(urlInput);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;

    if (name.trim().length < 2) {
      setNameError(language === 'en' ? 'Name is required (min 2 chars)' : 'Nama wajib diisi (min 2 karakter)');
      return;
    }

    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      let finalAvatarUrl = avatarUrl;

      // 1. Upload custom avatar if file state is loaded
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        const uploadRes = await fetch('/api/auth/profile/avatar/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || (language === 'en' ? 'Failed to upload photo.' : 'Gagal mengunggah foto.'));
        }
        finalAvatarUrl = uploadData.avatarUrl;
        setAvatarFile(null);
      } else if (avatarUrl && avatarUrl !== (user.avatarUrl || '')) {
        // 2. Validate URL safety if URL is custom-typed
        const isPreset = avatarUrl.includes('dicebear.com');
        if (!isPreset) {
          const urlRes = await fetch('/api/auth/profile/avatar/url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ url: avatarUrl })
          });

          const urlData = await urlRes.json();
          if (!urlRes.ok) {
            throw new Error(urlData.error || (language === 'en' ? 'Failed to validate custom URL.' : 'Gagal memvalidasi URL kustom.'));
          }
          finalAvatarUrl = urlData.avatarUrl;
        }
      }

      // 3. Persist name and tenant metadata
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name, 
          avatarUrl: finalAvatarUrl,
          ...(user.role === 'TENANT' ? {
            companyName,
            taxId,
            phoneNumber,
            address,
            bankName,
            bankAccountName,
            bankAccountNo
          } : {})
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (language === 'en' ? 'Failed to update profile' : 'Gagal memperbarui profil'));
      }

      // Sync updated user into localStorage and AuthContext
      const updatedUser = { ...user, ...data.user };
      login(updatedUser, token);

      setSuccessMsg(language === 'en' ? 'Profile updated successfully!' : 'Profil berhasil diperbarui!');
      setIsDirty(false);

      // Fade alert out
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
          {language === 'en' ? 'Please sign in to view your profile.' : 'Silakan masuk untuk melihat profil Anda.'}
        </p>
      </div>
    );
  }

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in text-slate-800">
      {/* Header Profile Title and Unsaved Warning Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5 mb-8 gap-4">
        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-[#4f46e5] block mb-1">
            {language === 'en' ? 'Personal Account Coordinates' : 'Koordinat Akun Pribadi'}
          </span>
          <h1 className="text-3xl font-black text-indigo-950 font-display tracking-tight">
            {language === 'en' ? 'My Profile' : 'Profil Saya'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en' 
              ? 'Oversee credentials, email checks, role clearances, and personal dynamic avatars.' 
              : 'Pantau kredensial, pemeriksaan email, izin peran, dan avatar dinamis pribadi.'}
          </p>
        </div>

        {/* Tab Shortcuts for Account Operations */}
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => { window.history.pushState(null, '', '/settings'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-150 text-slate-650 rounded-xl hover:bg-slate-100 transition-all font-bold text-xs cursor-pointer"
          >
            <span>{language === 'en' ? 'Account Preferences' : 'Preferensi Akun'}</span>
          </button>
          <button 
            type="button"
            onClick={() => { window.history.pushState(null, '', '/security'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-150 text-slate-650 rounded-xl hover:bg-slate-100 transition-all font-bold text-xs cursor-pointer"
          >
            <span>{language === 'en' ? 'Security Settings' : 'Keamanan'}</span>
          </button>
        </div>
      </div>

      {isDirty && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200/60 rounded-2xl flex items-center gap-3 animate-pulse text-amber-850">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
          <div className="text-xs font-semibold">
            {language === 'en' 
              ? 'You have unsaved changes in your profile. Click "Save Changes" below to sync with StayEase.' 
              : 'Anda memiliki perubahan yang belum disimpan. Klik "Simpan Perubahan" di bawah.'}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-150 rounded-2xl flex items-center gap-3 text-emerald-800">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
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
        
        {/* ==================== LEFT COLLAPSED WORKSPACE (AVATAR GENERATOR) ==================== */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs flex flex-col items-center text-center">
            <span className="text-[9px] uppercase font-black tracking-widest text-indigo-500 mb-3 block">
              {language === 'en' ? 'Active Identifier' : 'Pengenal Aktif'}
            </span>
            
            {/* Main Profile Image Display */}
            <div className="w-28 h-28 rounded-full bg-indigo-600 border-4 border-slate-100 shadow-md mb-4 relative overflow-hidden flex items-center justify-center select-none text-white font-black">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={name || 'User'} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-white text-3.5xl font-black tracking-wider">
                  {getInitials(name)}
                </span>
              )}
              {saving && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center text-white">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
              )}
            </div>

            <h3 className="text-base font-extrabold text-indigo-950 truncate max-w-full">
              {name || 'StayEase User'}
            </h3>

            {/* Quick Badges indicating Identity clearances */}
            <div className="flex flex-wrap gap-1.5 justify-center mt-3">
              <span className="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-650 rounded-md">
                {user.role === 'TENANT' 
                  ? (language === 'en' ? 'HOST PARTNER' : 'MITRA TENANT') 
                  : (language === 'en' ? 'GUEST TRAVELER' : 'PENGUNJUNG')}
              </span>
              <span className={`text-[9px] uppercase font-black tracking-wider px-2 py-0.5 border rounded-md flex items-center gap-1 ${
                user.isVerified 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                  : 'bg-amber-50 border-amber-100 text-amber-700'
              }`}>
                <ShieldCheck className="w-2.5 h-2.5" />
                {user.isVerified 
                  ? (language === 'en' ? 'VERIFIED' : 'TERVERIFIKASI') 
                  : (language === 'en' ? 'PENDING CHECK' : 'PENDING')}
              </span>
            </div>

            {/* Change Avatar Workspace trigger */}
            <div className="w-full h-px bg-slate-100 my-5" />

            <div className="w-full text-left">
              {/* Drag and Drop File Upload */}
              <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider mb-2 block">
                {language === 'en' ? 'Upload Image' : 'Unggah Gambar'}
              </span>
              
              <div 
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  isDragging ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-350 bg-slate-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('avatar-file-input')?.click()}
              >
                <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1.5" />
                <p className="text-[10px] text-slate-500 font-semibold mb-0.5">
                  {language === 'en' ? 'Drag & drop image or click' : 'Seret & lepas atau klik'}
                </p>
                <p className="text-[8.5px] text-slate-400">
                  {language === 'en' ? 'JPG, PNG, WEBP (Max 2MB)' : 'JPG, PNG, WEBP (Maks 2MB)'}
                </p>
                <input 
                  id="avatar-file-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Avatar URL Input */}
              <div className="w-full h-px bg-slate-100 my-4" />
              <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider mb-2 block">
                {language === 'en' ? 'Avatar Image URL' : 'URL Gambar Avatar'}
              </span>
              <div className="flex gap-1.5">
                <input 
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 px-3 py-1.5 text-[10px] border border-slate-150 rounded-xl focus:border-indigo-500 focus:outline-hidden bg-slate-50 font-semibold truncate"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 text-[10px] font-bold rounded-xl transition-all cursor-pointer"
                >
                  {language === 'en' ? 'Preview' : 'Pratinjau'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT DETAILED FORM DATA (ACCESSIBLE DESIGN) ==================== */}
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
          <h2 className="text-sm font-black uppercase text-slate-600 tracking-wider border-b border-slate-50 pb-3">
            {language === 'en' ? 'System Coordinates & Verification' : 'Koordinat Sistem & Verifikasi'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Interactive Inputs */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                {language === 'en' ? 'Full Legal Name' : 'Nama Lengkap'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-350">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  className={`w-full pl-10 pr-4 py-2.5 text-xs font-semibold border ${
                    nameError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-150 focus:border-indigo-500'
                  } rounded-2xl focus:outline-hidden bg-slate-50/50`}
                  placeholder={language === 'en' ? 'Enter legal name' : 'Masukkan nama lengkap'}
                />
              </div>
              {nameError && (
                <span className="text-[10px] font-semibold text-rose-500 mt-1 block">{nameError}</span>
              )}
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                {language === 'en' ? 'Email Address' : 'Alamat Email'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-350">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold border border-slate-150 rounded-2xl bg-slate-100/70 text-slate-400 cursor-not-allowed focus:outline-hidden"
                />
              </div>
              <span className="text-[9px] text-slate-400 font-bold block mt-1">
                {language === 'en' ? 'Emails cannot be altered to maintain login alignment.' : 'Email tidak dapat diubah demi keselarasan sistem.'}
              </span>
            </div>
          </div>

          {/* SaaS Metadata Read-Only parameters (Created, Last Login, verification status) */}
          <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3.5 text-xs font-semibold text-slate-650">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{language === 'en' ? 'Registered Date' : 'Tanggal Pendaftaran'}</span>
              </div>
              <span className="text-slate-800 font-bold text-xs">{formatDate(user.createdAt)}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <span>{language === 'en' ? 'Last Login Timestamp' : 'Waktu Log Masuk Terakhir'}</span>
              </div>
              <span className="text-slate-800 font-bold text-xs">{formatDate(user.lastLoginAt || user.createdAt)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>{language === 'en' ? 'Verification Clearances' : 'Izin Uji Verifikasi'}</span>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                user.isVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
              }`}>
                {user.isVerified 
                  ? (language === 'en' ? 'EMAIL VERIFIED' : 'EMAIL TERVERIFIKASI') 
                  : (language === 'en' ? 'UNCONFIRMED' : 'BELUM DIKONFIRMASI')}
              </span>
            </div>
          </div>

          {/* Tenant Business & Financial Information */}
          {user.role === 'TENANT' && (
            <div className="border-t border-slate-100 pt-6 mt-2 flex flex-col gap-5">
              <h3 className="text-sm font-black uppercase text-indigo-950 tracking-wider">
                {language === 'en' ? 'Tenant Business & Financial Records' : 'Catatan Bisnis & Keuangan Tenant'}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                    {language === 'en' ? 'Company Legal Name' : 'Nama Legal Perusahaan'}
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-semibold border border-slate-150 rounded-2xl focus:border-indigo-500 focus:outline-hidden bg-slate-50/50"
                    placeholder="e.g. StayEase Management Ltd"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                    {language === 'en' ? 'Tax ID / NPWP' : 'Nomor NPWP / Pajak'}
                  </label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-semibold border border-slate-150 rounded-2xl focus:border-indigo-500 focus:outline-hidden bg-slate-50/50"
                    placeholder="e.g. 12.345.678.9-012.000"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                    {language === 'en' ? 'Contact Phone Number' : 'Nomor Telepon Kontak'}
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-semibold border border-slate-150 rounded-2xl focus:border-indigo-500 focus:outline-hidden bg-slate-50/50"
                    placeholder="e.g. +62812345678"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                    {language === 'en' ? 'Bank Name' : 'Nama Bank'}
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-semibold border border-slate-150 rounded-2xl focus:border-indigo-500 focus:outline-hidden bg-slate-50/50"
                    placeholder="e.g. Bank Central Asia (BCA)"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                    {language === 'en' ? 'Bank Account Full Name' : 'Nama Lengkap Pemilik Rekening'}
                  </label>
                  <input
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-semibold border border-slate-150 rounded-2xl focus:border-indigo-500 focus:outline-hidden bg-slate-50/50"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                    {language === 'en' ? 'Bank Account Number' : 'Nomor Rekening Bank'}
                  </label>
                  <input
                    type="text"
                    value={bankAccountNo}
                    onChange={(e) => setBankAccountNo(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-semibold border border-slate-150 rounded-2xl focus:border-indigo-500 focus:outline-hidden bg-slate-50/50"
                    placeholder="e.g. 8000918239"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                  {language === 'en' ? 'Company Address' : 'Alamat Lengkap Perusahaan'}
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 text-xs font-semibold border border-slate-150 rounded-2xl focus:border-indigo-500 focus:outline-hidden bg-slate-50/50"
                  placeholder="e.g. 123 Indigo Boulevard, Suite 500, Jakarta, Indonesia"
                />
              </div>
            </div>
          )}

          {/* Action Footer Button with responsive state handling */}
          <div className="flex items-center justify-between mt-4 gap-3">
            <button
              type="button"
              onClick={() => {
                if (user) {
                  setName(user.name || '');
                  const rawUrl = user.avatarUrl;
                  const hasValidPhoto = rawUrl && !rawUrl.includes('dicebear.com');
                  setAvatarUrl(hasValidPhoto ? rawUrl : '');
                  setAvatarFile(null);
                  setUrlInput('');
                  if (user.tenantProfile) {
                    setCompanyName(user.tenantProfile.companyName || '');
                    setTaxId(user.tenantProfile.taxId || '');
                    setPhoneNumber(user.tenantProfile.phoneNumber || '');
                    setAddress(user.tenantProfile.address || '');
                    setBankName(user.tenantProfile.bankName || '');
                    setBankAccountName(user.tenantProfile.bankAccountName || '');
                    setBankAccountNo(user.tenantProfile.bankAccountNo || '');
                  }
                }
              }}
              disabled={!isDirty || saving}
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                isDirty && !saving
                  ? 'border-slate-150 text-slate-650 bg-white hover:bg-slate-50'
                  : 'border-slate-100 text-slate-350 bg-slate-50/50 cursor-not-allowed'
              }`}
            >
              {language === 'en' ? 'Reset Settings' : 'Batal Ubah'}
            </button>

            <button
              type="submit"
              disabled={!isDirty || saving || !!nameError}
              className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-2 shrink-0 ${
                isDirty && !nameError && !saving
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
                  <span>{language === 'en' ? 'Save Changes' : 'Simpan Perubahan'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
