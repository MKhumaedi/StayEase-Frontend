import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, ArrowRight, Loader2, XCircle } from 'lucide-react';
import { getSupabaseClient } from '../../../shared/services/supabase';

interface VerifyEmailProps {
  onNavigate: (path: string, params?: any) => void;
  params?: any;
}

export default function VerifyEmail({ onNavigate, params }: VerifyEmailProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const targetEmail = params?.email || '';

  // Determine if we are processing a redirect verification link callback from email click
  const searchParams = new URLSearchParams(window.location.search);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const hash = window.location.hash;
  const isCallback = !!(code || tokenHash || hash.includes('access_token') || type);

  useEffect(() => {
    if (isCallback) {
      const processVerificationCallback = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
          const supabase = await getSupabaseClient();
          
          // Exchange code for PKCE session if redirect includes it
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) throw exchangeError;
          }

          // Fetch verified user details
          const { data: { session } } = await supabase.auth.getSession();
          let user = session?.user || null;

          if (!user) {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            user = currentUser;
          }

          if (!user) {
            throw new Error('No active confirmation session was established. Please retry verification.');
          }

          // Call backend to sync verification status inside Prisma DB
          const res = await fetch('/api/auth/verify-supabase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to sync verification state.');
          }

          setSuccess('Your StayEase email address has been successfully verified!');
          setTimeout(() => {
            onNavigate('/login');
          }, 3000);
        } catch (err: any) {
          console.error('[VerifyEmail:processCallback] Verification failed:', err);
          setError(err.message || 'Verification link is invalid or has expired.');
        } finally {
          setLoading(false);
        }
      };

      processVerificationCallback();
    }
  }, [isCallback, code, onNavigate]);

  const handleResend = async () => {
    if (!targetEmail) return;
    setResending(true);
    setResendMsg('');
    setError('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Resend request failed');
      setResendMsg('A fresh verification link has been sent. Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl text-center">
        {!isCallback ? (
          // Registration Success Screen (Shows requested text only)
          <div>
            <div className="mx-auto w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-5">
              <Mail className="w-6 h-6" />
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-indigo-950 font-display">Registration successful. Please check your email to verify your account.</h2>
              {targetEmail && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mt-4 text-xs font-semibold text-slate-600">
                  Registered Email: <span className="text-indigo-900">{targetEmail}</span>
                </div>
              )}
            </div>

            {resendMsg && (
              <div className="bg-emerald-50 text-emerald-700 text-[11px] font-bold py-2.5 px-3 rounded-lg border border-emerald-100 mb-5">
                {resendMsg}
              </div>
            )}

            {error && (
              <div className="bg-rose-50 text-rose-600 text-[11px] font-bold py-2.5 px-3 rounded-lg border border-rose-100 mb-5">
                {error}
              </div>
            )}

            {targetEmail && (
              <button 
                onClick={handleResend}
                disabled={resending}
                className="w-full bg-slate-50 hover:bg-slate-100 text-indigo-950 py-2.5 rounded-xl border border-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors mb-4"
              >
                {resending ? 'Sending Link...' : 'Resend Verification Email'}
              </button>
            )}

            <button onClick={() => onNavigate('/login')} className="text-xs font-bold text-indigo-650 hover:underline flex items-center justify-center gap-1 mx-auto mt-4">
              Return to Sign In <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          // Verification Link Handler
          <div>
            {loading && (
              <div className="py-8">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-bold text-indigo-950">Confirming Email Address</h3>
                <p className="text-xs text-slate-450 mt-1">Please wait while we complete native Supabase Auth verification...</p>
              </div>
            )}

            {error && (
              <div className="py-6">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-indigo-950">Verification Failed</h3>
                <div className="bg-rose-50 text-rose-600 text-xs font-semibold p-3 rounded-xl border border-rose-100 my-4 leading-normal">
                  {error}
                </div>
                <button onClick={() => onNavigate('/login')} className="bg-indigo-950 hover:bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm cursor-pointer transition-all mt-2">
                  Return to Sign In
                </button>
              </div>
            )}

            {success && (
              <div className="py-6">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-indigo-950 animate-pulse">Email Verified!</h3>
                <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold p-3 rounded-xl border border-emerald-100 my-4 leading-normal">
                  {success}
                </div>
                <p className="text-[11px] text-slate-400">Redirecting to login dashboard in a moment...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
