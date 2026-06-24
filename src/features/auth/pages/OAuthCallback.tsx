import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../../../shared/services/supabase';
import { Loader2, XCircle } from 'lucide-react';

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    code: params.get('code'),
    verifier: params.get('verifier')
  };
}

function restoreVerifier(supabase: any, verifier: string | null) {
  if (!verifier) return;
  const supabaseUrl = supabase.supabaseUrl || '';
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\./);
  const projectRef = match ? match[1] : '';
  if (projectRef) {
    localStorage.setItem(`sb-${projectRef}-auth-token-code-verifier`, verifier);
  } else {
    localStorage.setItem('sb-auth-token-code-verifier', verifier);
  }
}

async function exchangeBackend(userId: string) {
  const res = await fetch('/api/auth/callback-exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId })
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error || 'Failed to authenticate with backend');
  }
  return res.json();
}

function notifySuccess(user: any, token: string) {
  if (window.opener) {
    window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user, token }, '*');
    window.close();
  } else {
    window.location.href = '/';
  }
}

function notifyFailure(errMsg: string) {
  if (window.opener) {
    window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: errMsg }, '*');
    setTimeout(() => window.close(), 4000);
  }
}

export default function OAuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleExchange = async () => {
      try {
        const { code, verifier } = getParams();
        if (!code) throw new Error('No authorization code found in URL');
        const supabase = await getSupabaseClient();
        restoreVerifier(supabase, verifier);
        const { data, error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) throw exErr;
        if (!data?.session?.user) throw new Error('No session returned');
        const { user, token } = await exchangeBackend(data.session.user.id);
        notifySuccess(user, token);
      } catch (err: any) {
        console.error('[OAuthCallback] Error:', err);
        const errMsg = err.message || 'Unknown authentication error';
        setError(errMsg);
        notifyFailure(errMsg);
      }
    };
    handleExchange();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full text-center">
        {error ? (
          <div>
            <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <div className="text-rose-500 font-bold mb-2">Authentication Failed</div>
            <p className="text-slate-600 text-sm mb-4">{error}</p>
            <p className="text-slate-400 text-xs">Closing window...</p>
          </div>
        ) : (
          <div>
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <div className="text-slate-800 font-bold mb-1">Completing Sign-In</div>
            <p className="text-slate-500 text-sm animate-pulse">Securing connection to StayEase...</p>
          </div>
        )}
      </div>
    </div>
  );
}

