import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { 
  Key, ShieldCheck, Eye, EyeOff, CheckCircle2, XCircle, 
  AlertTriangle, RefreshCw, Lock, UserCheck 
} from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

export default function Security() {
  const { user, token } = useAuth();
  const { language } = useLanguage();

  // Input states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status handling states
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Real-time criteria checks
  const hasMinLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  // Strength score builder: 0 to 4
  const [strength, setStrength] = useState<'Weak' | 'Medium' | 'Strong'>('Weak');
  const [strengthScore, setStrengthScore] = useState(0);

  useEffect(() => {
    let score = 0;
    if (newPassword.length > 0) {
      if (hasMinLen) score += 1;
      if (hasUpper) score += 1;
      if (hasLower) score += 1;
      if (hasDigit) score += 1;
      if (hasSpecial) score += 1;
    }

    setStrengthScore(score);

    if (score <= 2) {
      setStrength('Weak');
    } else if (score === 3 || score === 4) {
      setStrength('Medium');
    } else {
      setStrength('Strong');
    }
  }, [newPassword, hasMinLen, hasUpper, hasLower, hasDigit, hasSpecial]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Run all validations locally first
    if (!hasMinLen || !hasUpper || !hasLower || !hasDigit) {
      setErrorMsg(language === 'en' ? 'Password does not meet safety criteria' : 'Kata sandi belum memenuhi kriteria keamanan');
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg(language === 'en' ? 'New passwords do not match' : 'Konfirmasi kata sandi baru tidak cocok');
      return;
    }

    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (language === 'en' ? 'Failed to update password' : 'Gagal mengubah kata sandi'));
      }

      setSuccessMsg(language === 'en' ? 'Password changed successfully!' : 'Kata sandi berhasil diubah!');
      
      // Reset inputs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

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
          {language === 'en' ? 'Please sign in to access security.' : 'Silakan masuk untuk mengakses keamanan.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in text-slate-800">
      
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5 mb-8 gap-4">
        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-[#4f46e5] block mb-1">
            {language === 'en' ? 'Credentials & Passkeys' : 'Kredensial & Kunci Akses'}
          </span>
          <h1 className="text-3xl font-black text-indigo-950 font-display tracking-tight flex items-center gap-2">
            <Lock className="w-8 h-8 text-indigo-650 shrink-0 stroke-[2.5]" />
            <span>{language === 'en' ? 'Security' : 'Keamanan'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en' 
              ? 'Update account passwords, audit encryption strength, and check security guidelines.' 
              : 'Perbarui kata sandi akun, audit kekuatan enkripsi, dan periksa panduan keamanan.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => { window.history.pushState(null, '', '/profile'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-150 text-slate-650 rounded-xl hover:bg-slate-100 transition-all font-bold text-xs cursor-pointer"
          >
            <span>{language === 'en' ? 'Manage Profile' : 'Kelola Profil'}</span>
          </button>
        </div>
      </div>

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

      <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* ==================== LEFT COLLAPSED WORKSPACE (CRITERIA AUDITOR) ==================== */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs">
            <span className="text-[9px] uppercase font-black tracking-widest text-indigo-500 mb-3.5 block">
              {language === 'en' ? 'Safety Checklist' : 'Daftar Periksa Keamanan'}
            </span>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                {hasMinLen ? <CheckCircle2 className="w-4 h-4 text-emerald-505 shrink-0" /> : <XCircle className="w-4 h-4 text-slate-300 shrink-0" />}
                <span className={hasMinLen ? 'text-slate-800 font-bold' : ''}>
                  {language === 'en' ? 'At least 8 characters' : 'Minimal 8 karakter'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                {hasUpper ? <CheckCircle2 className="w-4 h-4 text-emerald-505 shrink-0" /> : <XCircle className="w-4 h-4 text-slate-300 shrink-0" />}
                <span className={hasUpper ? 'text-slate-800 font-bold' : ''}>
                  {language === 'en' ? 'Uppercase letter (A-Z)' : 'Huruf besar (A-Z)'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                {hasLower ? <CheckCircle2 className="w-4 h-4 text-emerald-505 shrink-0" /> : <XCircle className="w-4 h-4 text-slate-300 shrink-0" />}
                <span className={hasLower ? 'text-slate-800 font-bold' : ''}>
                  {language === 'en' ? 'Lowercase letter (a-z)' : 'Huruf kecil (a-z)'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                {hasDigit ? <CheckCircle2 className="w-4 h-4 text-emerald-505 shrink-0" /> : <XCircle className="w-4 h-4 text-slate-300 shrink-0" />}
                <span className={hasDigit ? 'text-slate-800 font-bold' : ''}>
                  {language === 'en' ? 'At least one number (0-9)' : 'Minimal satu angka (0-9)'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                {passwordsMatch ? <CheckCircle2 className="w-4 h-4 text-emerald-505 shrink-0" /> : <XCircle className="w-4 h-4 text-slate-300 shrink-0" />}
                <span className={passwordsMatch ? 'text-slate-800 font-bold' : ''}>
                  {language === 'en' ? 'Passwords match' : 'Kata sandi cocok'}
                </span>
              </div>
            </div>

            <div className="w-full h-px bg-slate-100 my-5" />

            {/* Micro details or guidelines */}
            <div className="text-[10px] text-slate-450 leading-relaxed font-semibold">
              <p>
                {language === 'en' 
                  ? 'StayEase hashes and salts passwords locally using cryptographically sound bcrypt containers before saving.' 
                  : 'StayEase melakukan enkripsi kata sandi secara lokal menggunakan algoritma bcrypt sebelum disimpan.'}
              </p>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT DETAILED PASSWORD EDITOR ==================== */}
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
          <h2 className="text-sm font-black uppercase text-slate-600 tracking-wider border-b border-slate-100 pb-3">
            {language === 'en' ? 'Change Password' : 'Ganti Kata Sandi Akun'}
          </h2>

          <div className="flex flex-col gap-4">
            
            {/* CURRENT PASSWORD SELECTOR */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                {language === 'en' ? 'Current Passcode' : 'Kata Sandi Saat Ini'}
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold border border-slate-150 rounded-2xl focus:border-indigo-500 focus:outline-hidden bg-slate-50/50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-450 hover:text-slate-600 cursor-pointer"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* NEW PASSWORD SELECTOR AND VISIBILITY METER */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                {language === 'en' ? 'New Secure Password' : 'Kata Sandi Baru'}
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold border border-slate-150 rounded-2xl focus:border-indigo-500 focus:outline-hidden bg-slate-50/50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-450 hover:text-slate-600 cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Dynamic strength meter progress indicator styled dynamically */}
              {newPassword.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-1">
                    <span className="text-slate-400">{language === 'en' ? 'Entropy Strength:' : 'Tingkat Kekuatan:'}</span>
                    <span className={`${
                      strength === 'Weak' ? 'text-rose-500' : strength === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      {strength === 'Weak' ? (language === 'en' ? 'Weak' : 'Lemah') : strength === 'Medium' ? (language === 'en' ? 'Medium' : 'Sedang') : (language === 'en' ? 'Strong' : 'Kuat')}
                    </span>
                  </div>
                  
                  {/* Gauge bar */}
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        strength === 'Weak' ? 'bg-rose-500' : strength === 'Medium' ? 'bg-amber-500' : 'bg-emerald-505'
                      }`}
                      style={{ width: `${Math.min(100, (strengthScore / 5) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CONFIRM NEW PASSWORD SELECTOR */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                {language === 'en' ? 'Confirm New Password' : 'Konfirmasi Kata Sandi Baru'}
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold border border-slate-150 rounded-2xl focus:border-indigo-500 focus:outline-hidden bg-slate-50/50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-450 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

          </div>

          {/* Action button */}
          <div className="flex items-center justify-end border-t border-slate-50 pt-5 mt-4">
            <button
              type="submit"
              disabled={saving || !currentPassword || !hasMinLen || !hasUpper || !hasLower || !hasDigit || !passwordsMatch}
              className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-2 ${
                !saving && currentPassword && hasMinLen && hasUpper && hasLower && hasDigit && passwordsMatch
                  ? 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] shadow-md shadow-indigo-600/10'
                  : 'bg-indigo-300 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === 'en' ? 'Updating...' : 'Memperbarui...'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Update Password' : 'Ubah Kata Sandi'}</span>
                </>
              )}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
