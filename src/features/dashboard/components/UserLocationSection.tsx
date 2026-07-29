import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, RefreshCw, Compass, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

const LOCATION_CACHE_KEY = 'stayease_user_location_cache';
const CACHE_TTL_MS = 45 * 60 * 1000; // 45 minutes cache TTL

interface CacheData {
  locationText: string;
  lat: number;
  lon: number;
  timestamp: number;
}

export function UserLocationSection() {
  const { language } = useLanguage();
  const [locationText, setLocationText] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'granted' | 'prompt' | 'denied' | 'unsupported' | 'unknown'>('unknown');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reverse geocode coordinates using OpenStreetMap Nominatim API
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    // Check localStorage cache first for matching coordinates
    try {
      const cachedRaw = localStorage.getItem(LOCATION_CACHE_KEY);
      if (cachedRaw) {
        const cached: CacheData = JSON.parse(cachedRaw);
        const age = Date.now() - cached.timestamp;
        const latDiff = Math.abs(cached.lat - lat);
        const lonDiff = Math.abs(cached.lon - lon);
        if (age < CACHE_TTL_MS && latDiff < 0.01 && lonDiff < 0.01 && cached.locationText) {
          return cached.locationText;
        }
      }
    } catch {
      // Ignore cache parse error
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
        {
          headers: {
            'Accept-Language': language === 'en' ? 'en' : 'id',
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error('Reverse geocoding request failed');
      }

      const data = await res.json();
      const address = data.address || {};

      // Extract City
      const city =
        address.city ||
        address.town ||
        address.city_district ||
        address.county ||
        address.regency ||
        address.municipality ||
        address.suburb ||
        address.village ||
        '';

      // Extract Province / State
      const province =
        address.state ||
        address.province ||
        address.region ||
        address.state_district ||
        '';

      let formatted = '';
      if (city && province) {
        formatted = `${city}, ${province}`;
      } else if (city) {
        formatted = city;
      } else if (province) {
        formatted = province;
      } else if (address.country) {
        formatted = address.country;
      } else {
        formatted = language === 'en' ? 'Unknown Location' : 'Lokasi Tidak Diketahui';
      }

      // Save to cache
      try {
        const cachePayload: CacheData = {
          locationText: formatted,
          lat,
          lon,
          timestamp: Date.now(),
        };
        localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cachePayload));
      } catch {
        // Storage error ignored
      }

      return formatted;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  const requestLocation = useCallback(
    async (forceRefresh = false) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        setPermissionState('unsupported');
        setErrorMsg(language === 'en' ? 'Geolocation not supported' : 'Geolokasi tidak didukung');
        return;
      }

      setLoading(true);
      setErrorMsg(null);

      // Try reading from cache if not force refreshing
      if (!forceRefresh) {
        try {
          const cachedRaw = localStorage.getItem(LOCATION_CACHE_KEY);
          if (cachedRaw) {
            const cached: CacheData = JSON.parse(cachedRaw);
            if (Date.now() - cached.timestamp < CACHE_TTL_MS && cached.locationText) {
              setLocationText(cached.locationText);
              setPermissionState('granted');
              setLoading(false);
              return;
            }
          }
        } catch {
          // ignore
        }
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            setPermissionState('granted');
            const result = await reverseGeocode(position.coords.latitude, position.coords.longitude);
            setLocationText(result);
            setErrorMsg(null);
          } catch (err) {
            console.warn('Reverse geocoding error:', err);
            setErrorMsg(
              language === 'en'
                ? 'Gagal mendapatkan data alamat'
                : 'Gagal mendapatkan data alamat'
            );
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          setLoading(false);
          if (error.code === error.PERMISSION_DENIED) {
            setPermissionState('denied');
            setLocationText(null);
            setErrorMsg(
              language === 'en' ? '📍 Location not allowed' : '📍 Lokasi belum diizinkan'
            );
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setErrorMsg(
              language === 'en' ? 'Location unavailable' : 'Lokasi tidak tersedia'
            );
          } else if (error.code === error.TIMEOUT) {
            setErrorMsg(
              language === 'en' ? 'Location request timed out' : 'Permintaan lokasi waktu habis'
            );
          } else {
            setErrorMsg(
              language === 'en' ? 'Failed to retrieve location' : 'Gagal mengambil lokasi'
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: forceRefresh ? 0 : 300000,
        }
      );
    },
    [language]
  );

  useEffect(() => {
    let isMounted = true;

    const checkPermissionAndFetch = async () => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        if (isMounted) setPermissionState('unsupported');
        return;
      }

      if (navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          if (isMounted) {
            setPermissionState(status.state as any);
          }

          status.onchange = () => {
            if (isMounted) {
              setPermissionState(status.state as any);
              if (status.state === 'granted') {
                requestLocation(false);
              } else if (status.state === 'denied') {
                setLocationText(null);
                setErrorMsg(language === 'en' ? '📍 Location not allowed' : '📍 Lokasi belum diizinkan');
              }
            }
          };

          if (status.state === 'granted' || status.state === 'prompt') {
            requestLocation(false);
          } else if (status.state === 'denied') {
            setErrorMsg(language === 'en' ? '📍 Location not allowed' : '📍 Lokasi belum diizinkan');
          }
          return;
        } catch {
          // Permissions API query for geolocation not supported in some browsers
        }
      }

      // Fallback: trigger location request
      requestLocation(false);
    };

    checkPermissionAndFetch();

    return () => {
      isMounted = false;
    };
  }, [requestLocation, language]);

  return (
    <div className="bg-slate-50/80 border border-slate-150 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs font-semibold text-slate-700 transition-all shadow-xs">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center shrink-0 text-indigo-600">
          <MapPin className="w-4 h-4" />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            {language === 'en' ? 'User Location' : 'Lokasi Pengguna'}
          </span>

          <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5 mt-0.5">
            {loading ? (
              <span className="text-slate-400 flex items-center gap-1.5 font-normal">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                {language === 'en' ? 'Retrieving location...' : 'Mencari lokasi...'}
              </span>
            ) : locationText ? (
              <span className="text-slate-900 font-extrabold flex items-center gap-1">
                📍 {locationText}
              </span>
            ) : permissionState === 'denied' || errorMsg?.includes('belum diizinkan') || errorMsg?.includes('not allowed') ? (
              <span className="text-rose-600 font-bold">
                📍 {language === 'en' ? 'Location not allowed' : 'Lokasi belum diizinkan'}
              </span>
            ) : errorMsg ? (
              <span className="text-slate-500 font-semibold">{errorMsg}</span>
            ) : (
              <span className="text-slate-400 font-normal">
                {language === 'en' ? 'Location not set' : 'Lokasi belum diatur'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {permissionState === 'denied' || (!locationText && !loading) ? (
          <button
            type="button"
            onClick={() => requestLocation(true)}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Compass className="w-3.5 h-3.5" />
            )}
            <span>{language === 'en' ? 'Allow Location' : 'Izinkan Lokasi'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => requestLocation(true)}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-extrabold text-slate-700 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{language === 'en' ? 'Update Location' : 'Perbarui Lokasi'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
