import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface WishlistContextType {
  favorites: any[];
  loadingFavorites: boolean;
  isFavorited: (propertyId: string) => boolean;
  toggleFavorite: (property: any) => Promise<void>;
  favoritesCount: number;
  triggerToast: (message: string, type: 'success' | 'error') => void;
  refreshFavorites: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchFavorites = async () => {
    if (!token || !user) {
      setFavorites([]);
      return;
    }
    setLoadingFavorites(true);
    try {
      const res = await fetch('/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setFavorites(json.data);
        }
      }
    } catch (e) {
      console.error('[WishlistContext] Failed to fetch favorites:', e);
    } finally {
      setLoadingFavorites(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user, token]);

  const triggerToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  };

  const isFavorited = (propertyId: string): boolean => {
    return favorites.some(fav => fav.id === propertyId);
  };

  const toggleFavorite = async (property: any) => {
    if (!user || !token) {
      // Dispatch custom event to open Login Modal in Navbar
      window.dispatchEvent(
        new CustomEvent('stayease-open-login-modal', {
          detail: { message: 'Please sign in to save properties to your wishlist.' }
        })
      );
      return;
    }

    const propertyId = property.id;
    const isCurrentlyFavorited = isFavorited(propertyId);
    
    // Save original favorites list for potential rollbacks
    const previousFavorites = [...favorites];

    // Optimistic Update: instantly modify state to prevent layout-shifting and page refresh delays
    if (isCurrentlyFavorited) {
      setFavorites(prev => prev.filter(f => f.id !== propertyId));
      triggerToast('Property removed from favorites', 'success');
    } else {
      // Create minimal fake favorite payload optimistically
      const optFavorite = {
        id: propertyId,
        slug: property.slug || '',
        name: property.name || '',
        city: property.city || '',
        province: property.province || '',
        address: property.address || '',
        imageUrls: property.imageUrls || [],
        status: property.status || 'ACTIVE',
        lowestRoomPrice: property.lowestRoomPrice || property.basePrice || 0,
        rating: property.rating || 0,
        reviewCount: property.reviewCount || 0,
        categoryName: property.categoryName || '',
        createdAt: new Date().toISOString()
      };
      setFavorites(prev => [optFavorite, ...prev]);
      triggerToast('Property added to favorites', 'success');
    }

    // Network update in background
    try {
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ propertyId })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to update favorite status');
      }

      // Check return response action in case it was modified of other sources
      const data = await res.json();
      if (data.success) {
        // Sync fresh exact data to ensure clean property keys match perfectly
        fetchFavorites();
      }
    } catch (e: any) {
      // Rollback to previous state if failure happens
      setFavorites(previousFavorites);
      triggerToast(e.message || 'Failed to update favorite status', 'error');
    }
  };

  const favoritesCount = favorites.length;

  return (
    <WishlistContext.Provider
      value={{
        favorites,
        loadingFavorites,
        isFavorited,
        toggleFavorite,
        favoritesCount,
        triggerToast,
        refreshFavorites: fetchFavorites
      }}
    >
      {children}

      {/* Floating Animated Toast Banner */}
      {toast && (
        <div 
          id="wishlist-toast" 
          className={`fixed top-5 right-5 z-[21000] flex items-center gap-2 px-4 py-3 rounded-2xl border text-xs font-black shadow-lg shadow-indigo-950/10 animate-fade-in transition-all ${
            toast.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
              : 'bg-rose-50 border-rose-100 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
