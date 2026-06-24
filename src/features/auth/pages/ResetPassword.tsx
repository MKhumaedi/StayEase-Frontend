import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';

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

  useEffect(() => {
    // Check URL hash first (Supabase recovery / token flow redirect)
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.replace('#', '?'));
      const accessToken = hashParams.get('access_token');
      if (accessToken) {
        setToken(accessToken);
      }
    } else if (params?.token) {
      setToken(params.token);
    }
  }, [params]);

  const handleResetSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => {
      onNavigate('/');
    }, 2000);
  };

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
      const res = await fetch('/api/auth/reset-password/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      handleResetSuccess('Your password has been changed successfully!');
    } catch (err: any) {
      setError(err.message || 'Token expired or password criteria not met.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 -z-10" />

        <div className="mb-6">
          <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 block mb-2">Security Portal</span>
          <h2 className="text-2xl font-bold text-indigo-950 font-display">Define New Password</h2>
          <p className="text-xs text-slate-450 mt-1">Please enter your reset security token along with your new password choice.</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 text-[11px] font-semibold py-2 px-3 rounded-lg border border-rose-100 mb-5">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-emerald-50 text-emerald-750 text-xs font-semibold py-3 px-3 rounded-xl border border-emerald-100 mb-5 flex flex-col gap-1 items-center">
            <span className="flex items-center gap-1 font-bold"><ShieldCheck className="w-4 h-4 text-emerald-600 animate-bounce" /> Success!</span>
            <span>{success} Redirecting to login...</span>
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
                  className="absolute right-3.5 top-3 text-slate-450 hover:text-indigo-950"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-950 hover:bg-slate-905 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              {loading ? 'Submitting Change...' : 'Define Password Credentials'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
