import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClientCached: SupabaseClient | null = null;

async function fetchConfig() {
  const res = await fetch('/api/auth/config');
  if (!res.ok) throw new Error(`Config failed: ${res.statusText}`);
  const { supabaseUrl, supabaseAnonKey } = await res.json();
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase config missing.');
  }
  return { supabaseUrl, supabaseAnonKey };
}

function findCodeVerifier(): string {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.endsWith('-code-verifier')) {
      return localStorage.getItem(key) || '';
    }
  }
  return '';
}

function appendVerifierToUrl(url: string, verifier: string): string {
  try {
    const urlObj = new URL(url);
    const redirect = urlObj.searchParams.get('redirect_to');
    if (redirect) {
      const redirectObj = new URL(redirect);
      redirectObj.searchParams.set('verifier', verifier);
      urlObj.searchParams.set('redirect_to', redirectObj.toString());
      return urlObj.toString();
    }
  } catch (err) {
    console.error('Verifier append failed', err);
  }
  return url;
}

function wrapOAuth(supabase: SupabaseClient): void {
  const original = supabase.auth.signInWithOAuth.bind(supabase.auth);
  supabase.auth.signInWithOAuth = async (credentials) => {
    const result = await original(credentials);
    const verifier = findCodeVerifier();
    if (result.data?.url && verifier) {
      result.data.url = appendVerifierToUrl(result.data.url, verifier);
    }
    return result;
  };
}

export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseClientCached) return supabaseClientCached;
  const { supabaseUrl, supabaseAnonKey } = await fetchConfig();
  supabaseClientCached = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  wrapOAuth(supabaseClientCached);
  return supabaseClientCached;
}

