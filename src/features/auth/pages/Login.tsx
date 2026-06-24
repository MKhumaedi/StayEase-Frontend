import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, ShieldCheck, HelpCircle, Chrome, Loader2, Apple } from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';
import { UserRole } from '../../../types';
import { useAsyncAction } from '../../../protection';

interface LoginProps {
  onNavigate: (path: string, params?: any) => void;
  onSetUser?: (user: any) => void;
}

export default function Login({ onNavigate }: LoginProps) {
  const { login: authContextLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) {
      setError(decodeURIComponent(err));
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Izinkan origin dari domain yang sama agar aman dan tidak memblokir localhost / production
      if (event.origin !== window.location.origin && !event.origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { user, token } = event.data;
        
        // Eksekusi login ke AuthContext Anda
        authContextLogin(user, token);
        setGoogleLoading(false);
        setHint(`Logged in successfully as ${user.name}`);
        
        // Arahkan ke halaman utama/dashboard sesuai role
        setTimeout(() => {
          if (user.role === 'ADMIN') {
            onNavigate('/admin');
          } else if (user.role === 'TENANT') {
            onNavigate('/dashboard');
          } else {
            onNavigate('/my-bookings');
          }
        }, 500);
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setError(event.data.error || 'Google authentication failed');
        setGoogleLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [authContextLogin, onNavigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isOAuthSuccess = params.get('oauth_success');
    const oauthToken = params.get('token');
    const oauthUserJson = params.get('user');

    if (isOAuthSuccess === 'true' && oauthToken && oauthUserJson) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(oauthUserJson));
        
        // Eksekusi fungsi login bawaan context aplikasi Anda
        authContextLogin(parsedUser, oauthToken);
        setHint(`Logged in as ${parsedUser.name} (${parsedUser.role})`);
        
        // Alihkan halaman sesuai role user
        setTimeout(() => {
          if (parsedUser.role === UserRole.ADMIN) {
            onNavigate('/admin');
          } else {
            onNavigate(parsedUser.role === UserRole.TENANT ? '/dashboard' : '/my-bookings');
          }
        }, 1000);
      } catch (e) {
        setError('Failed to parse OAuth user data');
      }
    }
  }, [authContextLogin, onNavigate]);

  const handleGoogleLogin = async () => {
    setError('');
    setHint('');
    setGoogleLoading(true);
    try {
      const { getSupabaseClient } = await import('../../../shared/services/supabase');
      const supabase = await getSupabaseClient();
      
      const redirectUrl = `${window.location.origin}/api/auth/callback`;
      
      // Lakukan redirect penuh pada tab yang sama
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          // Memaksa Google menampilkan jendela pemilihan akun di perangkat
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
      
      if (signInError) throw signInError;
    } catch (err: any) {
      console.error('[GoogleLogin] Error:', err);
      setError(err.message || 'Failed to start Google sign-in');
      setGoogleLoading(false);
    }
  };

  const handleQuickFill = (val: string) => {
    setEmail(val);
    setError('');
    setResendMessage('');
  };

  const handleLoginResponse = (data: any) => {
    authContextLogin(data.user, data.token);
    setHint(`Logged in as ${data.user.name} (${data.user.role})`);
    setTimeout(() => {
      if (data.user.role === UserRole.ADMIN) {
        onNavigate('/admin');
      } else {
        onNavigate(data.user.role === UserRole.TENANT ? '/dashboard' : '/my-bookings');
      }
    }, 1200);
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setResendLoading(true);
    setResendMessage('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend email');
      setResendMessage('Verification link resent successfully! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  const { execute: handleSubmit, isLoading: loading } = useAsyncAction(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setHint('');
    setResendMessage('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      handleLoginResponse(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    }
  });

  return (
    <div className="max-w-md mx-auto my-12 px-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 -z-10" />
        
        <div className="mb-8">
          <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 block mb-2">Welcome Back</span>
          <h2 className="text-2xl font-bold text-indigo-950 font-display">Sign in to StayEase</h2>
          <p className="text-xs text-slate-450 mt-1">Access secure bookings, traveler history, and listing management portals.</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 text-[11px] font-semibold py-2.5 px-3 rounded-lg border border-rose-100 mb-5 flex flex-col gap-2">
            <div>{error}</div>
            {error.includes('verify your email') && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="self-start text-[10px] uppercase font-black tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 px-3 py-1.5 rounded-md cursor-pointer transition-colors mt-1 focus:outline-none"
              >
                {resendLoading ? 'Resending Link...' : 'Resend Verification Email'}
              </button>
            )}
            {resendMessage && (
              <div className="text-[10px] text-emerald-800 font-bold mt-1 bg-emerald-50 p-2 rounded border border-emerald-100 animate-pulse">
                {resendMessage}
              </div>
            )}
          </div>
        )}

        {hint && (
          <div className="bg-emerald-50 text-emerald-700 text-[11.5px] font-semibold py-2 px-3 rounded-lg border border-emerald-100 mb-5 flex items-center gap-1.5 animate-pulse">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> {hint}
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="flex flex-col gap-2 mb-4">
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

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or sign in with email</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input 
                required 
                type="email" 
                placeholder="you@domain.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-200 focus:bg-white text-xs font-semibold py-2.5 pl-10 pr-4 rounded-xl focus:outline-hidden transition-all text-indigo-950"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-950 hover:bg-slate-905 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            {loading ? 'Authenticating...' : 'Sign In To Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5 text-center flex flex-col gap-3">
          
          <div className="flex justify-between items-center text-[11px] mt-2">
            <span className="text-slate-450">Don't have an account? <button onClick={() => onNavigate('/register')} className="text-indigo-650 font-black hover:underline">Register</button></span>
            <button onClick={() => onNavigate('/forgot-password')} className="text-slate-450 hover:text-indigo-600 flex items-center gap-0.5"><HelpCircle className="w-3 h-3" /> Forgot Password?</button>
          </div>
        </div>
      </div>
    </div>
  );
}
