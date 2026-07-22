export const API_BASE_URL = 
  ((import.meta as any).env?.VITE_API_URL) || 
  (typeof window !== 'undefined' 
    ? (window.location.hostname.includes('stayease.online') 
        ? 'https://api.stayease.online/api' 
        : `${window.location.protocol}//${window.location.host}/api`) 
    : 'https://api.stayease.online/api');

export function getApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (cleanPath.startsWith('/api') && API_BASE_URL.endsWith('/api')) {
    const baseUrlWithoutApi = API_BASE_URL.slice(0, -4);
    return `${baseUrlWithoutApi}${cleanPath}`;
  }
  return `${API_BASE_URL}${cleanPath}`;
}


if (typeof window !== 'undefined' && !(window as any).__stayease_fetch_patched) {
  (window as any).__stayease_fetch_patched = true;
  const originalFetch = window.fetch ? window.fetch.bind(window) : null;
  if (originalFetch) {
    const customFetch = function (input: RequestInfo | URL, init?: RequestInit) {
      if (typeof input === 'string' && (input.startsWith('/api/') || input === '/api')) {
        input = getApiUrl(input);
      } else if (input instanceof URL && (input.pathname.startsWith('/api/') || input.pathname === '/api')) {
        input = getApiUrl(input.pathname + input.search);
      }
      return originalFetch(input, init);
    };

    try {
      window.fetch = customFetch;
    } catch (e) {
      try {
        Object.defineProperty(window, 'fetch', {
          value: customFetch,
          writable: true,
          configurable: true,
        });
      } catch (err) {
        console.warn('Unable to intercept window.fetch in this environment:', err);
      }
    }
  }
}

