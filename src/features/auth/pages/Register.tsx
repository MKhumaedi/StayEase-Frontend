import React, { useState, useEffect, useRef } from 'react';
import { Compass, User, Mail, Lock, ShieldCheck, ArrowRight, Loader2, Chrome, Apple } from 'lucide-react';
import { UserRole } from '../../../types'; 
import { useAsyncAction } from '../../../protection';
import { getSupabaseClient } from '../../../shared/services/supabase';
import { useAuth } from '../../../shared/context/AuthContext';

interface RegisterProps {
  onNavigate: (path: string, params?: any) => void;
  params?: any;
}

export default function Register({ onNavigate, params }: RegisterProps) {
  const { login: authContextLogin } = useAuth();
  const isSubmittingRef = useRef(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(params?.role || UserRole.USER);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && origin !== window.location.origin) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { user, token } = event.data;
        authContextLogin(user, token);
        setSuccess(true);
        setGoogleLoading(false);
        setTimeout(() => {
          if (user.role === UserRole.ADMIN) {
            onNavigate('/admin');
          } else {
            onNavigate(user.role === UserRole.TENANT ? '/dashboard' : '/my-bookings');
          }
        }, 1200);
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setError(event.data.error || 'Google authentication failed');
        setGoogleLoading(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [authContextLogin, onNavigate]);

  const handleGoogleLogin = async () => {
    setError('');
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
      setError(err.message || 'Failed to start Google sign-in');
      setGoogleLoading(false);
    }
  };

  const handleRegisterResponse = () => {
    setSuccess(true);
    setTimeout(() => {
      onNavigate('/verify-email', { email });
    }, 2000);
  };

  const { execute: handleSubmit, isLoading: loading } = useAsyncAction(async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSubmittingRef.current) {
      console.warn('Registration action already in progress. Double-click prevented.');
      return;
    }
    setError('');
    
    // Validasi sebelum memanggil Supabase
    if (!name.trim()) {
      setError('Nama Lengkap wajib diisi');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Format email tidak valid');
      return;
    }
    if (!role) {
      setError('Role wajib dipilih');
      return;
    }
    // Simple frontend validation for password strength
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    isSubmittingRef.current = true;

    try {
      // 1. Bootstrap client-side Supabase client
      const supabase = await getSupabaseClient();
      
      // 2. Perform native sign up which dispatches email from Supabase
      const redirectUrl = window.location.origin + '/auth/callback';
      console.log('[Register:signUp] Initiating signUp for email:', email, 'redirectUrl:', redirectUrl);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role },
          emailRedirectTo: redirectUrl
        }
      });

      console.log('[Register:signUp] Response details:', { data, error: signUpError });

      if (signUpError) {
        console.error('[Register:signUp] Supabase signUp failed:', signUpError);
        const errMessage = signUpError.message?.toLowerCase() || '';
        if (signUpError.status === 429 || errMessage.includes('rate limit') || errMessage.includes('too many requests')) {
          throw new Error('Terlalu banyak permintaan verifikasi email. Silakan tunggu beberapa saat sebelum mencoba kembali.');
        }
        if (errMessage.includes('already registered') || errMessage.includes('already exists')) {
          throw new Error('Email already registered');
        }
        throw new Error(`Verification email failed: ${signUpError.message}`);
      }

      if (!data?.user) {
        throw new Error('Verification email failed: Supabase did not return user data.');
      }

      // 3. Register user profile inside backend database with isVerified = false
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: data.user.id,
          name, 
          email, 
          role, 
          password 
        })
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Database registration failed');
      
      handleRegisterResponse();
    } catch (err: any) {
      console.error('[Register:handleSubmit] Error:', err);
      setError(err.message || 'Error occurred during registration');
    } finally {
      isSubmittingRef.current = false;
    }
  });

  return (
    <div className="max-w-md mx-auto my-12 px-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 -z-10" />

        <div className="mb-6">
          <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 block mb-2">Join StayEase</span>
          <h2 className="text-2xl font-bold text-indigo-950 font-display">Create Your Account</h2>
          <p className="text-xs text-slate-450 mt-1">Select your account persona and register to access custom booking rates.</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 text-[11px] font-semibold py-2 px-3 rounded-lg border border-rose-100 mb-5">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold py-3 px-3 rounded-xl border border-emerald-100 mb-5 flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 animate-bounce" /> Registered Successfully!
            </span>
            <span>Registration successful. Please check your email to verify your account.</span>
          </div>
        )}

        {/* OAuth Buttons */}
        {/* <div className="flex flex-col gap-2 mb-4">
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
        </div> */}

        {/* <div className="relative flex py-2 items-center mb-4">
          <div className="grow border-t border-slate-100"></div>
          <span className="shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or register with email</span>
          <div className="grow border-t border-slate-100"></div>
        </div> */}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button 
              type="button" 
              onClick={() => setRole(UserRole.USER)} 
              className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${role === UserRole.USER ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}
            >
              <Compass className={`w-5 h-5 ${role === UserRole.USER ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider block leading-none">Traveler</span>
                <span className="text-[8px] text-slate-400 font-bold leading-normal">I want to rent suites</span>
              </div>
            </button>

            <button 
              type="button" 
              onClick={() => setRole(UserRole.TENANT)} 
              className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${role === UserRole.TENANT ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}
            >
              <User className={`w-5 h-5 ${role === UserRole.TENANT ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider block leading-none">Property Owner</span>
                <span className="text-[8px] text-slate-400 font-bold leading-normal">I want to list properties</span>
              </div>
            </button>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input 
                required 
                type="text" 
                placeholder="Jane Doe" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-200 focus:bg-white text-xs font-semibold py-2.5 pl-10 pr-4 rounded-xl focus:outline-hidden transition-all text-indigo-950"
              />
            </div>
          </div>

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

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input 
                required 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-200 focus:bg-white text-xs font-semibold py-2.5 pl-10 pr-4 rounded-xl focus:outline-hidden transition-all text-indigo-950"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-950 hover:bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            {loading ? 'Creating Profile...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-5 border-t border-slate-100 pt-4 text-center">
          <span className="text-[11px] text-slate-450">Already have an account? <button onClick={() => onNavigate('/login')} className="text-indigo-650 font-black hover:underline">Sign In</button></span>
        </div>
      </div>
    </div>
  );
}
