import { useState, useEffect } from 'react';

export interface FilterOptions {
  cities: string[];
  categories: any[];
  amenities: string[];
  minPrice: number;
  maxPrice: number;
}

// Helper untuk menghasilkan tanggal hari ini (YYYY-MM-DD) secara dinamis
export const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

let cachedData: FilterOptions | null = null;
let activePromise: Promise<FilterOptions> | null = null;

export const fetchFilterOptions = (): Promise<FilterOptions> => {
  if (cachedData) {
    return Promise.resolve(cachedData);
  }
  if (activePromise) {
    return activePromise;
  }

  activePromise = fetch('/api/properties/filter-options')
    .then((res) => {
      if (!res.ok) {
        throw new Error('Failed to fetch property filter options');
      }
      return res.json();
    })
    .then((data: FilterOptions) => {
      cachedData = data;
      activePromise = null;
      console.log('Cities loaded:', JSON.stringify(data.cities, null, 2));
      return data;
    })
    .catch((err) => {
      activePromise = null;
      console.error('Error loading filter options:', err);
      throw err;
    });

  return activePromise;
};

export const clearFilterOptionsCache = () => {
  cachedData = null;
};

export function usePropertyFilterOptions() {
  const [cities, setCities] = useState<string[]>(cachedData ? cachedData.cities : []);
  const [categories, setCategories] = useState<any[]>(cachedData ? cachedData.categories : []);
  const [amenities, setAmenities] = useState<string[]>(cachedData ? cachedData.amenities : []);
  const [minPrice, setMinPrice] = useState<number>(cachedData ? cachedData.minPrice : 50000);
  const [maxPrice, setMaxPrice] = useState<number>(cachedData ? cachedData.maxPrice : 5000000);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<Error | null>(null);

  // Tanggal Hari Ini Dinamis (Format YYYY-MM-DD)
  const todayString = getTodayDateString();

  useEffect(() => {
    let active = true;
    
    // Always trigger fetching (handles checking cache or resolving existing promise)
    fetchFilterOptions()
      .then((data) => {
        if (!active) return;
        setCities(data.cities || []);
        setCategories(data.categories || []);
        setAmenities(data.amenities || []);
        setMinPrice(data.minPrice);
        setMaxPrice(data.maxPrice);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const refresh = async () => {
    clearFilterOptionsCache();
    setLoading(true);
    try {
      const data = await fetchFilterOptions();
      setCities(data.cities || []);
      setCategories(data.categories || []);
      setAmenities(data.amenities || []);
      setMinPrice(data.minPrice);
      setMaxPrice(data.maxPrice);
      setLoading(false);
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  };

  return {
    cities,
    categories,
    amenities,
    minPrice,
    maxPrice,
    defaultCheckIn: todayString, 
    minCheckIn: todayString,     
    loading,
    error,
    refresh
  };
}