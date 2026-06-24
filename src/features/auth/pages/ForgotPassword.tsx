import React, { useState } from 'react';
import { Mail, ShieldCheck, ArrowLeft } from 'lucide-react';

interface ForgotPasswordProps {
  onNavigate: (path: string, params?: any) => void;
}

export default function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password reset request failed');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Email address not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 -z-10" />

        <button onClick={() => onNavigate('/')} className="absolute top-6 left-6 text-slate-400 hover:text-indigo-950 flex items-center gap-1 text-[11px] font-bold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="mb-6 mt-6">
          <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 block mb-2">Help Center</span>
          <h2 className="text-2xl font-bold text-indigo-950 font-display">Recover Password</h2>
          <p className="text-xs text-slate-450 mt-1">Enter your email and we'll send you a secure password reset link.</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 text-[11px] font-semibold py-2 px-3 rounded-lg border border-rose-100 mb-5">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Reset Link Sent Successfully!
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
              Please check your inbox. We have sent a secure password reset link to <strong className="text-slate-900">{email}</strong>. Clicking the link will redirect you to choose a new password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input 
                  required 
                  type="email" 
                  placeholder="demo@stayease.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-xs font-semibold py-2.5 pl-10 pr-4 rounded-xl focus:outline-hidden transition-all text-indigo-950"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-950 hover:bg-slate-905 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
