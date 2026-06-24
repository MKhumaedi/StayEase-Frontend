export const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL) || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api` : 'http://localhost:5000/api');

export function getApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
