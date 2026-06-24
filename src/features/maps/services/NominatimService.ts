import { MapLocation, AutocompleteSuggestion } from '../types';

/**
 * Service to interact with OpenStreetMap Nominatim API for geocoding and reverse geocoding.
 * Adheres strictly to search guidelines and OpenStreetMap usage policy.
 */
export class NominatimService {
  private static BASE_URL = 'https://nominatim.openstreetmap.org';

  /**
   * Search address suggestion list based on query (Autocomplete behavior)
   */
  static async searchAddress(query: string): Promise<AutocompleteSuggestion[]> {
    if (!query || query.trim().length < 3) return [];

    try {
      const url = `${this.BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en,id',
          'User-Agent': 'StayEaseStaysApp/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Nominatim query failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.map((item: any) => ({
        placeId: item.place_id || String(item.osm_id),
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }));
    } catch (error) {
      console.error('Error in searchAddress Nominatim:', error);
      return [];
    }
  }

  /**
   * Reverse geocode coordinates to retrieve location details
   */
  static async reverseGeocode(lat: number, lng: number): Promise<MapLocation | null> {
    try {
      const url = `${this.BASE_URL}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en,id',
          'User-Agent': 'StayEaseStaysApp/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Nominatim reverse geocode failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        lat,
        lng,
        displayName: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        address: data.address
      };
    } catch (error) {
      console.error('Error in reverseGeocode:', error);
      return null;
    }
  }
}
