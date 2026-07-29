import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../../../shared/services/supabase';
import { Loader2, XCircle } from 'lucide-react';

function getParams() {
  const searchParams = new URLSearchParams(window.location.search);
  let code = searchParams.get('code');
  let verifier = searchParams.get('verifier');
  let accessToken = searchParams.get('access_token');
  let refreshToken = searchParams.get('refresh_token');

  if (window.location.hash) {
    const hashStr = window.location.hash.replace(/^#\/?/, '');
    const hashParams = new URLSearchParams(hashStr);
    if (!code) code = hashParams.get('code');
    if (!verifier) verifier = hashParams.get('verifier');
    if (!accessToken) accessToken = hashParams.get('access_token');
    if (!refreshToken) refreshToken = hashParams.get('refresh_token');
  }

  return { code, verifier, accessToken, refreshToken };
}

function restoreVerifier(supabase: any, verifier: string | null) {
  if (!verifier) return;
  const supabaseUrl = supabase.supabaseUrl || '';
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\./);
  const projectRef = match ? match[1] : '';

  localStorage.setItem('sb-auth-token-code-verifier', verifier);
  if (projectRef) {
    localStorage.setItem(`sb-${projectRef}-auth-token-code-verifier`, verifier);
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.endsWith('-code-verifier')) {
        localStorage.setItem(key, verifier);
      }
    }
  } catch (e) {}
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
  try {
    localStorage.setItem('stayease_token', token);
    localStorage.setItem('stayease_user', JSON.stringify(user));
    localStorage.setItem('stayease_oauth_event', JSON.stringify({ type: 'OAUTH_AUTH_SUCCESS', user, token, timestamp: Date.now() }));
  } catch (e) {
    console.error('[OAuthCallback] Error saving credentials to localStorage:', e);
  }

  try {
    const channel = new BroadcastChannel('stayease_oauth_channel');
    channel.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user, token });
    channel.close();
  } catch (e) {
    // Ignore BroadcastChannel errors if unsupported
  }

  if (window.opener) {
    try {
      window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user, token }, '*');
    } catch (e) {
      console.error('[OAuthCallback] Error posting message to window.opener:', e);
    }
  }

  setTimeout(() => {
    try {
      window.close();
    } catch (e) {
      window.location.href = '/';
    }
  }, 100);
}

function notifyFailure(errMsg: string) {
  try {
    localStorage.setItem('stayease_oauth_event', JSON.stringify({ type: 'OAUTH_AUTH_ERROR', error: errMsg, timestamp: Date.now() }));
  } catch (e) {}

  try {
    const channel = new BroadcastChannel('stayease_oauth_channel');
    channel.postMessage({ type: 'OAUTH_AUTH_ERROR', error: errMsg });
    channel.close();
  } catch (e) {}

  if (window.opener) {
    try {
      window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: errMsg }, '*');
    } catch (e) {}
  }
  setTimeout(() => {
    try {
      window.close();
    } catch (e) {
      window.location.href = '/login?error=' + encodeURIComponent(errMsg);
    }
  }, 3000);
}

export default function OAuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleExchange = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
        const errParam = searchParams.get('error_description') || searchParams.get('error') || hashParams.get('error_description') || hashParams.get('error');
        if (errParam) {
          throw new Error(errParam);
        }

        const { code, verifier, accessToken, refreshToken } = getParams();
        const supabase = await getSupabaseClient();
        restoreVerifier(supabase, verifier);

        let supabaseUser: any = null;

        if (code) {
          const { data, error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (!exErr && data?.session?.user) {
            supabaseUser = data.session.user;
          } else if (exErr) {
            console.warn('[OAuthCallback] exchangeCodeForSession notice:', exErr.message);
          }
        }

        if (!supabaseUser && accessToken && refreshToken) {
          const { data: setSessionData, error: setSessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (!setSessionErr && setSessionData?.session?.user) {
            supabaseUser = setSessionData.session.user;
          }
        }

        if (!supabaseUser) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user) {
            supabaseUser = sessionData.session.user;
          }
        }

        if (!supabaseUser) {
          throw new Error('No valid authorization code or authentication session found');
        }

        const { user, token } = await exchangeBackend(supabaseUser.id);
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