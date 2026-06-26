import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, Eye, EyeOff, Loader2, XCircle } from 'lucide-react';
import { getSupabaseClient } from '../../../shared/services/supabase';

interface ResetPasswordProps {
  onNavigate: (path: string, params?: any) => void;
  params?: any;
}

export default function ResetPassword({ onNavigate, params }: ResetPasswordProps) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const validateToken = async () => {
      setIsValidating(true);
      setValidationError('');

      // Extract token from URL search, hash, or params
      const searchParams = new URLSearchParams(window.location.search);
      const queryToken = searchParams.get('token') || searchParams.get('access_token');
      
      const hash = window.location.hash;
      let hashToken = '';
      if (hash) {
        const hashParams = new URLSearchParams(hash.replace('#', '?'));
        hashToken = hashParams.get('access_token') || hashParams.get('token') || '';
      }
      
      const extractedToken = queryToken || hashToken || params?.token || '';

      if (!extractedToken) {
        setValidationError('Link reset password sudah digunakan atau telah kedaluwarsa. Silakan lakukan permintaan reset password baru.');
        setIsValidating(false);
        return;
      }

      setToken(extractedToken);

      try {
        const res = await fetch('/api/auth/reset-password/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: extractedToken })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Token invalid');
        }
      } catch (err: any) {
        setValidationError('Link reset password sudah digunakan atau telah kedaluwarsa. Silakan lakukan permintaan reset password baru.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Password validation rules
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      setLoading(false);
      return;
    }

    try {
      // 1. Complete password reset on backend (updates DB & syncs to Supabase admin)
      const res = await fetch('/api/auth/reset-password/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');

      // 2. Perform password update and signOut in client-side Supabase client if a session was established
      try {
        const supabase = await getSupabaseClient();
        await supabase.auth.updateUser({ password });
        await supabase.auth.signOut();
      } catch (supErr) {
        console.warn('Supabase client-side password update/signout omitted:', supErr);
      }

      // 3. Clear existing local authentication sessions
      localStorage.removeItem('stayease_token');
      localStorage.removeItem('stayease_user');

      // 4. Remove token and other credentials from URL search and hash
      window.history.replaceState({}, document.title, window.location.pathname);

      // 5. Success notifications and route navigation redirection
      setSuccess('Password berhasil diperbarui. Silakan login menggunakan password baru.');
      setTimeout(() => {
        onNavigate('/');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Token expired or password criteria not met.');
    } finally {
      setLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="max-w-md mx-auto my-12 px-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500">Memvalidasi token keamanan...</p>
        </div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="max-w-md mx-auto my-12 px-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl relative overflow-hidden text-center min-h-[300px] flex flex-col justify-center items-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 -z-10" />
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-6">
            <XCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-display mb-3">Tautan Tidak Valid</h2>
          <p className="text-xs text-slate-505 leading-relaxed max-w-xs mb-8">
            {validationError}
          </p>
          <button
            onClick={() => onNavigate('/')}
            className="w-full bg-indigo-950 hover:bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs transition-colors shadow-xs cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-12 px-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 -z-10" />

        <div className="mb-6">
          <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 block mb-2">Security Portal</span>
          <h2 className="text-2xl font-bold text-indigo-950 font-display">Define New Password</h2>
          <p className="text-xs text-slate-400 mt-1">Please enter your reset security token along with your new password choice.</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 text-[11px] font-semibold py-2 px-3 rounded-lg border border-rose-100 mb-5">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold py-4 px-4 rounded-xl border border-emerald-100 mb-5 flex flex-col gap-2 items-center text-center">
            <span className="flex items-center gap-1 font-bold"><ShieldCheck className="w-5 h-5 text-emerald-600 animate-bounce" /> Success!</span>
            <span>{success}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">Security Key/Token</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input 
                  required 
                  type="text" 
                  placeholder="reset_xxxxx" 
                  value={token} 
                  onChange={e => setToken(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-200 focus:bg-white text-xs font-semibold py-2.5 pl-10 pr-4 rounded-xl focus:outline-hidden transition-all text-indigo-950"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">New Password</label>
              <div className="relative">
                <input 
                  required 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-200 focus:bg-white text-xs font-semibold py-2.5 px-4 rounded-xl focus:outline-hidden transition-all text-indigo-950"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-indigo-950"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-950 hover:bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              {loading ? 'Submitting Change...' : 'Define Password Credentials'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
