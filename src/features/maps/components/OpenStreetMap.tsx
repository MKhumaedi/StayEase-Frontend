import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../../shared/i18n';
import { MapPin, ExternalLink, Clock, Compass } from 'lucide-react';

interface OpenStreetMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  interactive?: boolean;
  onCoordinatesChange?: (lat: number, lng: number) => void;
  className?: string;
  height?: string;
  address?: string;
  city?: string;
  province?: string;
}

// Global script load guard to avoid double injections
let leafletPromise: Promise<void> | null = null;

function loadLeafletAssets(): Promise<void> {
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    if ((window as any).L) {
      resolve();
      return;
    }

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      leafletPromise = null; // allow retry on failure
      reject(new Error('Failed to load OpenStreetMap Leaflet assets'));
    };
    document.body.appendChild(script);
  });

  return leafletPromise;
}

export function OpenStreetMap({
  lat,
  lng,
  zoom = 13,
  interactive = false,
  onCoordinatesChange,
  className = '',
  height = '300px',
  address = '',
  city = '',
  province = ''
}: OpenStreetMapProps) {
  const { language } = useLanguage();
  const en = language === 'en';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Normalize inputs to handle string input safely
  const numLat = typeof lat === 'string' ? parseFloat(lat) : lat;
  const numLng = typeof lng === 'string' ? parseFloat(lng) : lng;

  const hasValidCoords = 
    typeof numLat === 'number' && 
    typeof numLng === 'number' && 
    !isNaN(numLat) && 
    !isNaN(numLng) && 
    numLat !== 0 && 
    numLng !== 0;

  // Initialize last updated timestamp
  useEffect(() => {
    if (hasValidCoords && !lastUpdated) {
      setLastUpdated(new Date().toLocaleTimeString());
    }
  }, [hasValidCoords]);

  const handleLoadMap = () => {
    setLoading(true);
    setMapError(false);
    loadLeafletAssets()
      .then(() => {
        setLeafletLoaded(true);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setMapError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    handleLoadMap();
  }, []);

  // Cleanup Leaflet map on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Map cleanup error:', e);
        }
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, []);

  // Destroy map instance if coordinates become invalid (triggers empty state)
  useEffect(() => {
    if (!hasValidCoords) {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Map removal on invalid coordinates error:', e);
        }
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    }
  }, [hasValidCoords]);

  // Create the Map and Marker once when assets are loaded and coordinates are valid
  useEffect(() => {
    if (!leafletLoaded || !hasValidCoords || !mapContainerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Fix marker default icons
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [numLat, numLng],
        zoom: zoom,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: false,
        touchZoom: interactive
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      const marker = L.marker([numLat, numLng], {
        draggable: interactive
      }).addTo(map);

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;

      // Popup Content
      const popupContent = `
        <div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
          <b style="color: #1e1b4b; display: block; font-size: 12px; margin-bottom: 4px;">${address || (en ? 'Property Location' : 'Lokasi Properti')}</b>
          ${city || province ? `<div style="color: #475569; font-weight: 600;">${city}${city && province ? ', ' : ''}${province}</div>` : ''}
        </div>
      `;
      marker.bindPopup(popupContent).openPopup();

      if (interactive && onCoordinatesChange) {
        marker.on('dragend', () => {
          const position = marker.getLatLng();
          if (position) {
            onCoordinatesChange(position.lat, position.lng);
            setLastUpdated(new Date().toLocaleTimeString());
          }
        });

        map.on('click', (e: any) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          marker.setLatLng([clickLat, clickLng]);
          onCoordinatesChange(clickLat, clickLng);
          setLastUpdated(new Date().toLocaleTimeString());
        });
      }

      // Handle map sizing issue in hidden steps
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);
    }
  }, [leafletLoaded, hasValidCoords]);

  // Resize Observer to handle invalidating size dynamically when container resizes (e.g. modal opens/transitions)
  useEffect(() => {
    if (!leafletLoaded || !hasValidCoords || !mapContainerRef.current) return;

    const container = mapContainerRef.current;
    let resizeTimeout: any = null;

    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      
      resizeTimeout = setTimeout(() => {
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.invalidateSize({ animate: true });
          } catch (e) {
            console.warn('Map invalidateSize error:', e);
          }
        }
      }, 100); // 100ms debounce
    });

    resizeObserver.observe(container);

    return () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, [leafletLoaded, hasValidCoords]);

  // Update marker position and pan to coordinates smoothly when coordinates or details change
  useEffect(() => {
    if (!mapInstanceRef.current || !hasValidCoords) return;

    const map = mapInstanceRef.current;
    const marker = markerInstanceRef.current;
    if (!map || !marker) return;

    const currentLatLng = marker.getLatLng();
    if (Math.abs(currentLatLng.lat - numLat) > 0.00001 || Math.abs(currentLatLng.lng - numLng) > 0.00001) {
      marker.setLatLng([numLat, numLng]);
      map.panTo([numLat, numLng], { animate: true, duration: 0.6 });
      setLastUpdated(new Date().toLocaleTimeString());
    }

    // Update popup
    const popupContent = `
      <div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
        <b style="color: #1e1b4b; display: block; font-size: 12px; margin-bottom: 4px;">${address || (en ? 'Property Location' : 'Lokasi Properti')}</b>
        ${city || province ? `<div style="color: #475569; font-weight: 600;">${city}${city && province ? ', ' : ''}${province}</div>` : ''}
      </div>
    `;
    marker.setPopupContent(popupContent);
    if (marker.isPopupOpen()) {
      marker.update();
    }
  }, [numLat, numLng, address, city, province, hasValidCoords]);

  // RENDER STATES

  // 1. Loading State
  if (loading && !mapError) {
    return (
      <div 
        className="w-full bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center p-6 animate-pulse select-none"
        style={{ height }}
      >
        <div className="w-8 h-8 rounded-full border-2 border-t-indigo-600 border-slate-200 animate-spin mb-2.5" />
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
          {en ? 'Initializing map preview...' : 'Menyiapkan pratinjau peta...'}
        </span>
      </div>
    );
  }

  // 2. Error State
  if (mapError) {
    return (
      <div 
        className="w-full bg-rose-50 rounded-2xl border border-rose-100 flex flex-col items-center justify-center text-center p-6 select-none"
        style={{ height }}
      >
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-2.5 font-bold text-lg">!</div>
        <h4 className="text-xs font-black text-rose-800">{en ? 'Unable to load map.' : 'Gagal memuat peta.'}</h4>
        <button 
          type="button" 
          onClick={handleLoadMap}
          className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase rounded-xl shadow-3xs hover:shadow-2xs cursor-pointer transition-all border-0"
        >
          {en ? 'Retry' : 'Coba Lagi'}
        </button>
      </div>
    );
  }

  // 3. Professional Empty State
  if (!hasValidCoords) {
    return (
      <div 
        className="w-full bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6 select-none"
        style={{ height }}
      >
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-450 mb-3 border border-slate-200/50 shadow-3xs">
          <Compass className="w-5 h-5 animate-spin-slow text-slate-400" />
        </div>
        <h4 className="text-xs font-black text-slate-800 tracking-tight">{en ? 'Map Preview' : 'Pratinjau Peta'}</h4>
        <p className="text-[11px] font-bold text-slate-450 mt-1 max-w-[240px]">
          {en ? 'Search a location or enter coordinates' : 'Cari lokasi atau masukkan koordinat untuk melihat pratinjau peta.'}
        </p>
        <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest mt-3.5 px-2.5 py-1 bg-rose-50 border border-rose-100/50 rounded-lg shadow-3xs">
          {en ? 'No location selected' : 'Lokasi belum dipilih'}
        </span>
      </div>
    );
  }

  // 4. Fully Rendered Map and Detailed Specifications Card
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Map Container */}
      <div 
        id="osm-map-container"
        ref={mapContainerRef} 
        className="w-full bg-slate-100 rounded-2xl z-10 overflow-hidden relative border border-slate-250 shadow-3xs"
        style={{ height }}
      />

      {/* Information & Actions Block */}
      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col gap-3.5 transition-all duration-300">
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider block mb-0.5 select-none">
              {en ? 'Selected Location' : 'Lokasi Terpilih'}
            </span>
            <p className="text-xs font-black text-slate-800 leading-normal truncate">
              {address || (city || province ? `${city}${city && province ? ', ' : ''}${province}` : (en ? 'Custom Coordinates' : 'Koordinat Kustom'))}
            </p>
          </div>
          
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${numLat.toFixed(6)}, ${numLng.toFixed(6)}`);
                setCopyFeedback(true);
                setTimeout(() => setCopyFeedback(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-indigo-600 hover:text-indigo-800 text-[10px] font-black rounded-xl shadow-3xs hover:shadow-2xs transition-all cursor-pointer select-none"
            >
              <span>{copyFeedback ? (en ? 'Copied!' : 'Disalin!') : (en ? 'Copy Coordinates' : 'Salin Koordinat')}</span>
            </button>

            <a 
              href={`https://www.google.com/maps?q=${numLat},${numLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-indigo-600 hover:text-indigo-800 text-[10px] font-black rounded-xl shadow-3xs hover:shadow-2xs transition-all cursor-pointer no-underline select-none"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{en ? 'Open in Google Maps' : 'Buka di Google Maps'}</span>
            </a>
          </div>
        </div>

        {/* Technical Data Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 border-t border-slate-150/80 pt-3.5 text-[10px] font-bold text-slate-500">
          <div>
            <span className="text-slate-400 text-[8px] uppercase block tracking-wider select-none">{en ? 'Latitude' : 'Lintang'}</span>
            <span className="text-slate-800 font-mono text-xs mt-0.5 block">{numLat.toFixed(6)}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[8px] uppercase block tracking-wider select-none">{en ? 'Longitude' : 'Bujur'}</span>
            <span className="text-slate-800 font-mono text-xs mt-0.5 block">{numLng.toFixed(6)}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[8px] uppercase block tracking-wider select-none">{en ? 'Coordinate Accuracy' : 'Akurasi Koordinat'}</span>
            <span className="text-slate-800 text-xs mt-0.5 block flex items-center gap-1 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>{en ? 'High (GPS Exact)' : 'Tinggi (GPS Eksak)'}</span>
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-[8px] uppercase block tracking-wider select-none">{en ? 'Last Updated' : 'Pembaruan Terakhir'}</span>
            <span className="text-slate-800 text-xs font-mono mt-0.5 block">{lastUpdated || 'Just now'}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[8px] uppercase block tracking-wider select-none">{en ? 'Map Provider' : 'Penyedia Peta'}</span>
            <a 
              href="https://www.openstreetmap.org" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-650 hover:text-indigo-800 hover:underline text-xs mt-0.5 block"
            >
              OpenStreetMap
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
