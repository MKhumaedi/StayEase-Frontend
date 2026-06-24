import React, { useEffect, useRef, useState } from 'react';

interface OpenStreetMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  interactive?: boolean;
  onCoordinatesChange?: (lat: number, lng: number) => void;
  className?: string;
  height?: string;
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
  height = '300px'
}: OpenStreetMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    loadLeafletAssets()
      .then(() => setLeafletLoaded(true))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Fix marker icon default paths if needed
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });

    // Initialize or re-center map if it already exists
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: zoom,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: false,
        touchZoom: interactive
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapInstanceRef.current);

      markerInstanceRef.current = L.marker([lat, lng], {
        draggable: interactive
      }).addTo(mapInstanceRef.current);

      if (interactive && onCoordinatesChange) {
        markerInstanceRef.current.on('dragend', () => {
          const position = markerInstanceRef.current.getLatLng();
          if (position) {
            onCoordinatesChange(position.lat, position.lng);
          }
        });

        mapInstanceRef.current.on('click', (e: any) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          markerInstanceRef.current.setLatLng([clickLat, clickLng]);
          onCoordinatesChange(clickLat, clickLng);
        });
      }
    } else {
      // Map already exists, update state views
      mapInstanceRef.current.setView([lat, lng], zoom);
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([lat, lng]);
      }
    }

    return () => {
      // Cleanup leaflet map instance on unmount to prevent container holding issues
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, lat, lng, zoom, interactive]);

  return (
    <div 
      id="osm-map-container"
      ref={mapContainerRef} 
      className={`w-full bg-slate-100 rounded-2xl z-10 overflow-hidden relative border border-slate-200/65 ${className}`}
      style={{ height }}
    />
  );
}
