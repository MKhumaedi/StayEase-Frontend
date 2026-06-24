export interface MapLocation {
  lat: number;
  lng: number;
  displayName: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    municipality?: string;
    county?: string;
    state_district?: string;
    state?: string;
    region?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

export interface AutocompleteSuggestion {
  placeId: string;
  displayName: string;
  lat: number;
  lng: number;
}
