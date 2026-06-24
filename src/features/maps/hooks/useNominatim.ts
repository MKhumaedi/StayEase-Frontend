import { useState, useEffect } from 'react';
import { NominatimService } from '../services/NominatimService';
import { AutocompleteSuggestion, MapLocation } from '../types';

export function useNominatim(initialLat?: number, initialLng?: number) {
  const [lat, setLat] = useState<number>(initialLat ?? -6.2088);
  const [lng, setLng] = useState<number>(initialLng ?? 106.8456);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [addressDetails, setAddressDetails] = useState<MapLocation | null>(null);

  // Trigger inverse geocoding when lat/lng markers shift or are set
  const triggerReverseGeocode = async (targetLat: number, targetLng: number) => {
    setIsGeocoding(true);
    try {
      const details = await NominatimService.reverseGeocode(targetLat, targetLng);
      if (details) {
        setAddressDetails(details);
        setLat(targetLat);
        setLng(targetLng);
        return details;
      }
    } catch (err) {
      console.error('Failed to resolve reverse geocode:', err);
    } finally {
      setIsGeocoding(false);
    }
    return null;
  };

  return {
    lat,
    lng,
    setLat,
    setLng,
    isGeocoding,
    addressDetails,
    triggerReverseGeocode
  };
}
