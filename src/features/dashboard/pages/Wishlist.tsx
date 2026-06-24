import React from 'react';
import { Bookmark, Star, ArrowRight, Heart, MapPin, Loader2, ArrowLeft, Lock } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import { useAuth } from '../../../shared/context/AuthContext';
import { useWishlist } from '../../../shared/context/WishlistContext';

interface WishlistProps {
  onNavigate: (path: string, params?: any) => void;
}

export default function Wishlist({ onNavigate }: WishlistProps) {
  const { language, formatCurrencyIDR } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { favorites, loadingFavorites, toggleFavorite } = useWishlist();

  // If auth is loading, render a sleek loader
  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          {language === 'en' ? 'Verifying authentication...' : 'Memverifikasi autentikasi...'}
        </p>
      </div>
    );
  }

  // If user is not logged in, prompt professional custom lock overlay with login prompt
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="bg-slate-50 border border-slate-150 rounded-3xl p-8 shadow-3xs flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 mb-4 shadow-3xs">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-black text-indigo-950 font-display">
            {language === 'en' ? 'Unlock Your Wishlist' : 'Buka Keinginan Anda'}
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed mb-6">
            {language === 'en' 
              ? 'Sign in to sync your favorited properties across your devices and review available booking dates.'
              : 'Masuk log untuk mensinkronisasi properti favorit Anda lintas perangkat dan meninjau tanggal pemesanan.'}
          </p>
          <button 
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('stayease-open-login-modal', {
                  detail: { message: 'Please sign in to save properties to your wishlist.' }
                })
              );
            }}
            className="w-full bg-indigo-950 hover:bg-slate-900 text-white font-black text-xs py-3 rounded-xl transition-all shadow-xs cursor-pointer hover:shadow-md"
          >
            {language === 'en' ? 'Sign In to Account' : 'Masuk ke Akun'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="border-b border-slate-100 pb-5 mb-8">
        <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 block mb-2">
          {language === 'en' ? 'Saved Listings' : 'Daftar Tersimpan'}
        </span>
        <h1 className="text-3xl font-black text-indigo-950 font-display tracking-tight">
          {language === 'en' ? 'My Wishlist' : 'Wishlist saya'}
        </h1>
        <p className="text-xs text-slate-450 mt-1">
          {language === 'en'
            ? 'Review your selected residences, compare available room packages, and finalize booking terms.'
            : 'Tinjau hunian pilihan Anda, bandingkan paket kamar yang tersedia, dan selesaikan pesanan.'}
        </p>
      </div>

      {loadingFavorites && favorites.length === 0 ? (
        // Beautiful Skeleton loader
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(ind => (
            <div key={ind} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm animate-pulse">
              <div className="h-48 bg-slate-100 w-full" />
              <div className="p-6 space-y-3">
                <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                <div className="h-3 bg-slate-50 rounded-md w-1/2" />
                <div className="h-8 bg-slate-50 rounded-lg w-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        // Requirement 6 Empty State
        <div className="text-center py-20 bg-slate-50 border border-slate-150 rounded-3xl p-10 max-w-md mx-auto shadow-3xs">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100/55 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-4 shadow-3xs">
            <Heart className="w-5 h-5 fill-current animate-pulse" />
          </div>
          <h2 className="text-lg font-black text-indigo-950 font-display">
            {language === 'en' ? 'Your Wishlist is Empty' : 'Wishlist Anda Kosong'}
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed mb-6">
            {language === 'en' 
              ? 'Explore our curated collections of exclusive properties and click the heart icon on listings you love.'
              : 'Jelajahi koleksi properti eksklusif yang kami kurasi dan klik ikon hati pada properti yang Anda sukai.'}
          </p>
          <button 
            onClick={() => onNavigate('/search')}
            className="w-full bg-indigo-950 hover:bg-slate-900 border border-slate-900 text-white font-black text-xs py-3 rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-md flex items-center justify-center gap-1.5"
          >
            <span>{language === 'en' ? 'Explore Properties' : 'Jelajahi Properti'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {favorites.map((item, index) => {
            const coverImage = (item.imageUrls && item.imageUrls.length > 0)
              ? item.imageUrls[0]
              : 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80';
            
            return (
              <div 
                key={`wishlist-item-${item.id || index}-${index}`} 
                className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 overflow-hidden bg-slate-50">
                    <img 
                      src={coverImage} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Heart button to unfavorite cleanly */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item);
                      }}
                      aria-label="Remove from Favorites"
                      title="Remove from Favorites"
                      className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs w-8.5 h-8.5 rounded-full flex items-center justify-center text-rose-500 border border-slate-100/50 shadow-md cursor-pointer hover:bg-white hover:scale-105 active:scale-95 transition-all"
                    >
                      <Heart className="w-4 h-4 fill-current animate-pulse" />
                    </button>

                    {/* Location Badge */}
                    <div className="absolute bottom-4 left-4 bg-indigo-950/80 backdrop-blur-xs text-[9px] font-black text-white px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-indigo-400 shrink-0" /> {item.city}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-extrabold text-indigo-950 font-display text-base leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1" title={item.name}>
                        {item.name}
                      </h3>
                      {item.rating > 0 && (
                        <div className="flex items-center gap-0.5 text-[11px] font-bold text-amber-500 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-current" /> 
                          <span className="text-slate-800 font-semibold">{parseFloat(item.rating.toString()).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-450 line-clamp-2 leading-relaxed mb-1">
                      {item.categoryName || (language === 'en' ? 'Stays' : 'Penginapan')} • {item.province || item.address || ''}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 border-t border-slate-50 pt-4 flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold leading-none mb-1">
                      {language === 'en' ? 'Night Budget' : 'Anggaran Malam'}
                    </span>
                    <span className="text-base font-black text-indigo-950 font-display">
                      {formatCurrencyIDR(item.lowestRoomPrice)}
                      <span className="text-xs font-normal text-slate-400">/night</span>
                    </span>
                  </div>

                  <button 
                    onClick={() => onNavigate(`/property/${item.slug || item.id}`)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>{language === 'en' ? 'Book' : 'Pesan'}</span> 
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
