import React, { useState, useEffect } from 'react';
import { Property, Room, Review } from '../../../types';
import { useAuth } from '../../../shared/context/AuthContext';
import { 
  Star, Shield, ArrowLeft, Eye, MessageSquare, BedDouble, HelpCircle, Heart,
  Wifi, Wind, Waves, Bath, Sparkles, Utensils, Film, Compass, Mountain, Car, Dumbbell, Tv, Check, Coffee
} from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import { useWishlist } from '../../../shared/context/WishlistContext';
import { PricingService } from '../services/PricingService';

function getAmenityIcon(name: string) {
  const norm = name.toLowerCase();
  
  if (norm.includes('wifi') || norm.includes('internet')) {
    return <Wifi className="w-4 h-4 text-indigo-600 shrink-0" />;
  }
  if (norm.includes('air conditioning') || norm.includes('ac ') || norm.includes('temp') || norm.includes('cooling') || norm.includes('air_conditioning')) {
    return <Wind className="w-4 h-4 text-indigo-600 shrink-0" />;
  }
  if (norm.includes('pool') || norm.includes('swimming') || norm.includes('wave')) {
    return <Waves className="w-4 h-4 text-indigo-600 shrink-0" />;
  }
  if (norm.includes('tub') || norm.includes('jacuzzi') || norm.includes('bath')) {
    return <Bath className="w-4 h-4 text-indigo-600 shrink-0" />;
  }
  if (norm.includes('spa') || norm.includes('sauna') || norm.includes('wellness')) {
    return <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />;
  }
  if (norm.includes('kitchen') || norm.includes('chef') || norm.includes('cook')) {
    return <Utensils className="w-4 h-4 text-indigo-600 shrink-0" />;
  }
  if (norm.includes('cinema') || norm.includes('theater')) {
    return <Film className="w-4 h-4 text-indigo-600 shrink-0" />;
  }
  if (norm.includes('beach') || norm.includes('ocean')) {
    return <Compass className="w-4 h-4 text-indigo-600 shrink-0" />;
  }
  if (norm.includes('mountain') || norm.includes('hill') || norm.includes('view')) {
    return <Mountain className="w-4 h-4 text-indigo-600 shrink-0" />;
  }
  if (norm.includes('garage') || norm.includes('parking') || norm.includes('car')) {
    return <Car className="w-4 h-4 text-indigo-600 shrink-0" />;
  }
  if (norm.includes('gym') || norm.includes('fitness') || norm.includes('exercise')) {
    return <Dumbbell className="w-4 h-4 text-indigo-600 shrink-0" />;
  }
  if (norm.includes('tv') || norm.includes('streaming') || norm.includes('television')) {
    return <Tv className="w-4 h-4 text-indigo-600 shrink-0" />;
  }
  if (norm.includes('coffee') || norm.includes('espresso')) {
    return <Coffee className="w-4 h-4 text-indigo-600 shrink-0" />;
  }
  if (norm.includes('breakfast')) {
    return <Utensils className="w-4 h-4 text-indigo-600 shrink-0" />;
  }
  return <Check className="w-4 h-4 text-indigo-600 shrink-0" />;
}

function formatAmenityLabel(name: string): string {
  if (!name) return '';
  // Check if it's already a well-formatted string with spaces but no underscores
  if (name.includes(' ') && !name.includes('_')) {
    return name;
  }
  
  const norm = name.toLowerCase();
  if (norm === 'wifi' || norm === 'wi-fi') return 'WiFi';
  if (norm === 'ac') return 'Air Conditioning';
  
  // Replace underscores or hyphens with spaces and capitalize each word
  return name
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .map(word => {
      const lower = word.toLowerCase();
      if (lower === 'wifi' || lower === 'wi-fi') return 'WiFi';
      if (lower === 'tv') return 'TV';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

interface PropertyDetailProps {
  propertyId: string;
  onNavigate: (path: string, params?: any) => void;
}

export default function PropertyDetail({ propertyId, onNavigate }: PropertyDetailProps) {
  const { t, language, formatCurrencyIDR } = useLanguage();
  const { isFavorited, toggleFavorite } = useWishlist();
  const [data, setData] = useState<{ property: Property; rooms: Room[] } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [startDate, setStartDate] = useState('2026-10-12');
  const [endDate, setEndDate] = useState('2026-10-15');
  const [guestCount, setGuestCount] = useState(1);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(5.0);

  const { user, token } = useAuth();
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [replyComment, setReplyComment] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replying, setReplying] = useState(false);

  const fetchReviewsOfProperty = () => {
    fetch(`/api/reviews/properties/${propertyId}?page=${reviewPage}&limit=5`)
      .then(res => res.json())
      .then(resData => {
        if (resData && resData.reviews) {
          setReviews(resData.reviews);
          setTotalReviews(resData.total || 0);
          setAverageRating(resData.averageRating || 5.0);
        }
      })
      .catch(err => console.error('Error fetching reviews:', err));
  };

  useEffect(() => {
    fetch(`/api/properties/${propertyId}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        if (resData.rooms.length > 0) setSelectedRoom(resData.rooms[0]);
      });
  }, [propertyId]);

  useEffect(() => {
    fetchReviewsOfProperty();
  }, [propertyId, reviewPage]);

  useEffect(() => {
    console.log('Property Reviews:', reviews);
  }, [reviews]);

  const handleSaveReply = async (reviewId: string) => {
    if (!replyComment || replyComment.trim() === '') {
      setReplyError(language === 'en' ? 'Reply comment cannot be empty.' : 'Balasan tidak boleh kosong.');
      return;
    }

    setReplying(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ replyComment: replyComment.trim() })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to submit reply');
      }

      setReplyComment('');
      setReplyingReviewId(null);
      setEditMode(false);
      fetchReviewsOfProperty();
    } catch (err: any) {
      console.error(err);
      setReplyError(err.message || 'Error occurred while saving reply.');
    } finally {
      setReplying(false);
    }
  };

  const handleUpdateReply = async (reviewId: string) => {
    if (!replyComment || replyComment.trim() === '') {
      setReplyError(language === 'en' ? 'Reply comment cannot be empty.' : 'Balasan tidak boleh kosong.');
      return;
    }

    setReplying(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ replyComment: replyComment.trim() })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to update reply');
      }

      setReplyComment('');
      setReplyingReviewId(null);
      setEditMode(false);
      fetchReviewsOfProperty();
    } catch (err: any) {
      console.error(err);
      setReplyError(err.message || 'Error occurred while updating reply.');
    } finally {
      setReplying(false);
    }
  };

  const handleDeleteReply = async (reviewId: string) => {
    setReplying(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to delete reply');
      }

      fetchReviewsOfProperty();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error occurred while deleting reply.');
    } finally {
      setReplying(false);
    }
  };

  useEffect(() => {
    console.log('[DEBUG DETAIL FRONTEND INPUT] Checking conditions for fetching quote:', {
      selectedRoom: selectedRoom ? {
        id: selectedRoom.id,
        price: (selectedRoom as any).price,
        basePrice: selectedRoom.basePrice,
        nightlyRate: (selectedRoom as any).nightlyRate
      } : null,
      startDate,
      endDate,
      propertyId
    });

    if (selectedRoom && startDate && endDate) {
      const startD = new Date(startDate);
      const endD = new Date(endDate);
      if (startD < endD) {
        console.log('[DEBUG DETAIL FRONTEND CLIENT] Fetching quote from server...');
        fetch(`/api/quotes?propertyId=${propertyId}&roomId=${selectedRoom.id}&start=${startDate}&end=${endDate}`)
          .then(res => res.json())
          .then(val => {
            console.log('[DEBUG DETAIL FRONTEND SERVER OUTPUT] Received quote breakdown FROM SERVER:', val);
            if (val && !val.error && typeof val.total === 'number' && !isNaN(val.total)) {
              setBreakdown(val);
            } else {
              console.error('[DEBUG DETAIL FRONTEND ENGINE] Error/NaN in API quote breakdown:', val);
              // Fallback calculations using Client PricingService to prevent NaN/broken states
              try {
                const fallbackInput = {
                  basePrice: typeof selectedRoom.basePrice === 'number' ? selectedRoom.basePrice : Number(selectedRoom.basePrice) || 0,
                  cleaningFee: typeof data?.property?.cleaningFee === 'number' ? data.property.cleaningFee : Number(data?.property?.cleaningFee) || 0,
                  serviceFee: typeof data?.property?.serviceFee === 'number' ? data.property.serviceFee : Number(data?.property?.serviceFee) || 0,
                  peakSeasonRates: []
                };
                const fbQuote = PricingService.calculateQuote(fallbackInput, selectedRoom, startDate, endDate);
                console.log('[DEBUG DETAIL FRONTEND CLIENT FALLBACK] Calculated local fallback quote:', fbQuote);
                setBreakdown(fbQuote);
              } catch (err) {
                console.error('[DEBUG DETAIL FRONTEND CLIENT FALLBACK FAILED]', err);
                setBreakdown(null);
              }
            }
          })
          .catch(err => {
            console.error('[DEBUG DETAIL FRONTEND FETCH ERROR]', err);
            setBreakdown(null);
          });
      } else {
        console.warn('[DEBUG DETAIL FRONTEND] Skipping fetch: check-in is not before check-out.');
        setBreakdown(null);
      }
    } else {
      console.warn('[DEBUG DETAIL FRONTEND] Skipping fetch: missing room, start date, or end date.');
      setBreakdown(null);
    }
  }, [selectedRoom, startDate, endDate, propertyId, data]);

  if (!data) return <div className="text-center py-20">{t.common.loading}</div>;
  const { property, rooms } = data;

  const handleBook = () => {
    onNavigate('/checkout', { property, selectedRoom, startDate, endDate, breakdown, guestCount });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <button onClick={() => onNavigate('/search')} className="text-xs text-indigo-900 border border-slate-200 font-bold bg-white hover:bg-slate-50 px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> {t.propertyDetail.backToListings}
        </button>

        <button
          onClick={() => toggleFavorite(property)}
          className={`text-xs font-black px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all duration-300 border cursor-pointer ${
            isFavorited(property.id)
              ? 'bg-rose-50 border-rose-150 text-rose-600 shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 transition-transform duration-300 ${isFavorited(property.id) ? 'fill-current scale-110' : ''}`} />
          <span>{isFavorited(property.id) ? (language === 'en' ? 'Saved to Wishlist' : 'Tersimpan') : (language === 'en' ? 'Save to Wishlist' : 'Simpan')}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-indigo-950 font-display mb-1">{property.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap font-sans text-xs">
              <span className="text-slate-500 font-bold">{property.location}</span>
              <span className="text-slate-300">•</span>
              {(!property.reviewCount || property.reviewCount === 0) ? (
                <span className="text-slate-400 font-semibold italic">
                  {language === 'en' ? 'No reviews yet' : 'Belum ada ulasan'}
                </span>
              ) : (
                <>
                  <div className="flex items-center gap-0.5 font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                    <span>
                      {parseFloat(property.rating.toString()).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-slate-400 font-bold">
                    ({property.reviewCount} {language === 'en' ? 'reviews' : 'ulasan'})
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
            <img src={(property.imageUrls && property.imageUrls.length > 0) ? property.imageUrls[0] : 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'} alt={property.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-2 font-display">
              {language === 'en' ? 'About this premium stay' : 'Tentang hunian premium ini'}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">{property.description}</p>
          </div>

          {/* Dedicated Property Amenities Section */}
          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 font-display">
              {language === 'en' ? 'Premium Amenities & Features' : 'Fasilitas & Fitur Premium'}
            </h2>
            {(!property.amenities || property.amenities.length === 0) ? (
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-slate-500 italic">
                {language === 'en' ? 'No amenities have been configured yet.' : 'Belum ada fasilitas yang dikonfigurasi.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((am, idx) => (
                  <div key={`amenity-${idx}`} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 transition-all text-xs font-semibold text-slate-700">
                    {getAmenityIcon(am)}
                    <span className="truncate">{formatAmenityLabel(am)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rooms Inventory */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-3 font-display">{t.propertyDetail.selectSuites}</h2>
            <p className="text-xs text-slate-400 mb-4">{t.propertyDetail.availableSuitesDesc}</p>
            <div className="flex flex-col gap-3">
              {rooms.map((r, idx) => {
                const details = (() => {
                  try {
                    if (r.floor && r.floor.trim().startsWith('{')) {
                      return JSON.parse(r.floor);
                    }
                  } catch (e) {}
                  return { bedCount: 1, bathCount: 1, quantity: 1 };
                })();

                return (
                  <div key={r.id ? `room-${r.id}-${idx}` : `room-${idx}`} className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${selectedRoom?.id === r.id ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                    <div className="flex gap-4 items-start w-full md:w-auto">
                      {r.image && (
                        <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-150">
                          <img src={r.image} alt={r.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm sm:text-base mb-0.5">
                          <BedDouble className="w-4 h-4 text-indigo-600" /> {r.name}
                        </h4>
                        <span className="text-xs text-slate-400 font-semibold block mt-0.5">
                          {r.type} • {t.propertyDetail.capacityCount.replace('{count}', String(r.capacity))} • {details.bedCount || 1} {language === 'en' ? 'beds' : 'kasur'} • {details.bathCount || 1} {language === 'en' ? 'baths' : 'kamar mandi'}
                        </span>
                        {r.wing && (
                          <p className="text-[11px] text-slate-500 mt-1 max-w-md leading-normal">
                            {r.wing}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto mt-2 md:mt-0 border-t border-slate-50 md:border-none pt-2 md:pt-0">
                      <div className="flex flex-col items-start md:items-end">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold leading-none mb-1 ${
                          r.status === 'Available' ? 'bg-emerald-50 text-emerald-600' : r.status === 'Occupied' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {r.status === 'Available' ? t.common.available : r.status === 'Occupied' ? t.common.occupied : t.common.maintenance}
                        </span>
                        <span className="text-sm font-black text-indigo-900">{formatCurrencyIDR(r.basePrice)} / {t.common.night}</span>
                      </div>
                      <button onClick={() => setSelectedRoom(r)} className="bg-indigo-900 hover:bg-indigo-850 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer">
                        {language === 'en' ? 'Select' : 'Pilih'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guest Reviews Section */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4 font-display">{t.propertyDetail.customerReviewsTitle}</h2>
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold italic bg-slate-50 p-4 rounded-xl border border-dashed text-center">
                {language === 'en' ? 'No reviews yet for this property.' : 'Belum ada ulasan untuk properti ini.'}
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {reviews.map((rv, idx) => {
                  const name = rv.guest?.name || rv.guestName || (language === 'en' ? 'Verified Guest' : 'Tamu Terverifikasi');
                  const avatar = rv.guest?.avatarUrl || rv.guestAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';
                  
                  return (
                    <div key={`review-${rv.id || idx}-${idx}`} className="p-4 bg-white rounded-xl border border-slate-100 flex gap-4">
                      <img src={avatar} alt={name} className="w-10 h-10 rounded-full bg-slate-50 border object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-slate-800">{name}</span>
                            <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 leading-none">
                              <Shield className="w-2.5 h-2.5" /> {language === 'en' ? 'Verified Guest' : 'Tamu Terverifikasi'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium ml-1">
                              • {new Date(rv.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center text-amber-500 text-xs font-bold gap-0.5">
                            <Star className="w-3.5 h-3.5 fill-current" /> {rv.rating}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-1">{rv.comment}</p>
                        
                        {/* Host Reply Card / Form Area */}
                        {rv.replyComment ? (
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-3 ml-4 flex flex-col gap-2 relative">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-slate-800">
                                  {data?.property?.tenant?.name || (language === 'en' ? 'Host' : 'Pemilik Properti')}
                                </span>
                                <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider leading-none">
                                  Host
                                </span>
                                {rv.replyDate && (
                                  <span className="text-[10px] text-slate-400 font-medium ml-1">
                                    • {new Date(rv.replyDate).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                              
                              {/* If host owns the property, they can edit or delete this reply */}
                              {user && user.role === 'TENANT' && data?.property && data.property.tenantId === user.id && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setReplyingReviewId(rv.id);
                                      setEditMode(true);
                                      setReplyComment(rv.replyComment || '');
                                      setReplyError(null);
                                    }}
                                    className="text-[10px] text-indigo-700 hover:text-indigo-900 font-bold hover:underline cursor-pointer"
                                  >
                                    {language === 'en' ? 'Edit' : 'Ubah'}
                                  </button>
                                  <span className="text-slate-300 text-xs">|</span>
                                  <button
                                    onClick={() => handleDeleteReply(rv.id)}
                                    className="text-[10px] text-red-600 hover:text-red-800 font-bold hover:underline cursor-pointer"
                                  >
                                    {language === 'en' ? 'Delete' : 'Hapus'}
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-slate-650 leading-relaxed italic">"{rv.replyComment}"</p>
                          </div>
                        ) : (
                          // If NO reply comment yet, and current user is owner tenant, offer "Balas Ulasan"
                          user && user.role === 'TENANT' && data?.property && data.property.tenantId === user.id && replyingReviewId !== rv.id && (
                            <div className="mt-2 ml-4">
                              <button
                                onClick={() => {
                                  setReplyingReviewId(rv.id);
                                  setEditMode(false);
                                  setReplyComment('');
                                  setReplyError(null);
                                }}
                                className="bg-indigo-50 border border-indigo-150 hover:bg-indigo-100/50 text-indigo-950 text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 transition-all"
                              >
                                <MessageSquare className="w-3 h-3" />
                                {language === 'en' ? 'Reply Review' : 'Balas Ulasan'}
                              </button>
                            </div>
                          )
                        )}

                        {/* Inline Expandable Form (shown if replyingReviewId === rv.id) */}
                        {replyingReviewId === rv.id && (
                          <div className="bg-indigo-50/10 p-4 rounded-xl border border-indigo-100/50 mt-3 ml-4">
                            <span className="text-[11px] font-bold text-indigo-950 block mb-2">
                              {editMode 
                                ? (language === 'en' ? 'Edit reply to guest' : 'Ubah balasan kepada tamu')
                                : (language === 'en' ? 'Write reply to guest' : 'Tulis balasan kepada tamu')}
                            </span>
                            <textarea
                              rows={3}
                              value={replyComment}
                              onChange={(e) => setReplyComment(e.target.value)}
                              placeholder={language === 'en' ? 'Thank guest for staying and feedback...' : 'Tulis balasan kepada tamu...'}
                              className="w-full p-2.5 text-xs text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-800 focus:border-indigo-800 bg-white"
                            />
                            {replyError && (
                              <p className="text-[10px] text-red-600 font-medium mt-1">{replyError}</p>
                            )}
                            <div className="flex items-center gap-2 mt-3 justify-end">
                              <button
                                onClick={() => {
                                  setReplyingReviewId(null);
                                  setReplyComment('');
                                  setReplyError(null);
                                }}
                                className="px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-all"
                              >
                                {language === 'en' ? 'Cancel' : 'Batal'}
                              </button>
                              <button
                                onClick={() => editMode ? handleUpdateReply(rv.id) : handleSaveReply(rv.id)}
                                disabled={replying}
                                className="px-3 py-1.5 text-[11px] font-bold text-white bg-indigo-900 hover:bg-indigo-850 rounded-lg cursor-pointer transition-all disabled:opacity-50"
                              >
                                {replying 
                                  ? (language === 'en' ? 'Saving...' : 'Menyimpan...')
                                  : (language === 'en' ? 'Save Reply' : 'Simpan Balasan')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Pagination Controls */}
                {totalReviews > 5 && (
                  <div className="flex items-center justify-between mt-4 border-t border-slate-50 pt-4 font-sans">
                    <button 
                      disabled={reviewPage === 1}
                      onClick={() => setReviewPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 text-xs font-bold text-indigo-900 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {language === 'en' ? 'Previous' : 'Sebelumnya'}
                    </button>
                    <span className="text-xs text-slate-500 font-bold">
                      {language === 'en' ? `Page ${reviewPage} of ${Math.ceil(totalReviews / 5)}` : `Halaman ${reviewPage} dari ${Math.ceil(totalReviews / 5)}`}
                    </span>
                    <button 
                      disabled={reviewPage >= Math.ceil(totalReviews / 5)}
                      onClick={() => setReviewPage(prev => prev + 1)}
                      className="px-3 py-1.5 text-xs font-bold text-indigo-900 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {language === 'en' ? 'Next' : 'Berikutnya'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Calculator Sticky Widget */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit sticky top-28 self-start">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.propertyDetail.bookYourStay}</h3>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 text-xs font-medium text-slate-600 font-sans">
            {language === 'en' ? 'Selected Room' : 'Kamar Terpilih'}: <span className="font-bold text-indigo-900 block mt-1">{selectedRoom?.name || (language === 'en' ? 'Please select a room' : 'Silakan pilih kamar')}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{language === 'en' ? 'Check In' : 'Check In'}</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2 focus:outline-hidden" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{language === 'en' ? 'Check Out' : 'Check Out'}</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2 focus:outline-hidden" />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{language === 'en' ? 'Guests' : 'Tamu'}</label>
            <input type="number" min="1" value={guestCount} onChange={e => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2 focus:outline-hidden" />
          </div>

          {breakdown && (
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 mb-4 text-xs text-slate-600">
              
              {breakdown.peakMultiplier > 1 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2 flex flex-col gap-1.5 text-xs text-[#78350f]">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-500 shrink-0" />
                      {language === 'en' ? 'Peak Season Active' : 'Musim Liburan Aktif'}
                    </span>
                    <span className="font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[9px]">
                      {breakdown.peakMultiplier.toFixed(2)}x
                    </span>
                  </div>
                  {breakdown.peakSeasonName && (
                    <div className="text-[10px] font-medium leading-tight">
                      🎉 {breakdown.peakSeasonName}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 border-t border-amber-200/50 pt-2 text-[10px] mt-0.5">
                    <div>
                      <span className="block text-slate-400 font-medium uppercase tracking-wider text-[8px]">{language === 'en' ? 'Base Price' : 'Harga Dasar'}</span>
                      <span className="font-semibold text-slate-700">{formatCurrencyIDR(breakdown.nightlyRate)}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-medium uppercase tracking-wider text-[8px]">{language === 'en' ? 'Multiplier' : 'Pengali'}</span>
                      <span className="font-semibold text-slate-700">{breakdown.peakMultiplier.toFixed(2)}x</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-medium uppercase tracking-wider text-[8px]">{language === 'en' ? 'Final Price' : 'Harga Final'}</span>
                      <span className="font-bold text-indigo-950">{formatCurrencyIDR(breakdown.finalRoomPrice || breakdown.nightlyRate)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <span>{language === 'en' ? 'Nightly Rate' : 'Harga Per Malam'}</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrencyIDR(Number.isFinite(breakdown.nightlyRate) ? breakdown.nightlyRate : 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Base Subtotal' : 'Subtotal Dasar'}</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrencyIDR(Number.isFinite(breakdown.subtotal) ? breakdown.subtotal : 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Cleaning Fee' : 'Biaya Pembersihan'}</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrencyIDR(Number.isFinite(breakdown.cleaningFee) ? breakdown.cleaningFee : 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Service Fee' : 'Biaya Layanan'}</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrencyIDR(Number.isFinite(breakdown.serviceFee) ? breakdown.serviceFee : 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Taxes' : 'Pajak'}</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrencyIDR(Number.isFinite(breakdown.taxes) ? breakdown.taxes : (Number.isFinite(breakdown.tax) ? breakdown.tax : 0))}
                </span>
              </div>
              <div className="flex justify-between text-base font-black text-indigo-950 border-t border-slate-50 pt-3 mt-1">
                <span>Total</span>
                <span>
                  {formatCurrencyIDR(Number.isFinite(breakdown.total) ? breakdown.total : 0)}
                </span>
              </div>
            </div>
          )}

          <button 
            disabled={!selectedRoom || !startDate || !endDate || (new Date(startDate) >= new Date(endDate)) || guestCount <= 0} 
            onClick={handleBook} 
            className="w-full bg-indigo-900 hover:bg-indigo-850 disabled:bg-slate-350 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl text-sm cursor-pointer shadow-indigo-100 shadow-sm transition-all text-center"
          >
            {!selectedRoom 
              ? (language === 'en' ? 'Please Select a Room First' : 'Silakan Pilih Kamar Dahulu')
              : (!startDate || !endDate) ? (language === 'en' ? 'Select Valid Dates' : 'Pilih Tanggal Valid')
              : (new Date(startDate) >= new Date(endDate)) ? (language === 'en' ? 'Check-in must be before check-out' : 'Check-in harus sebelum check-out')
              : guestCount <= 0 ? (language === 'en' ? 'Guest count must be > 0' : 'Jumlah tamu harus > 0')
              : (language === 'en' ? 'Instantiate Booking' : 'Lanjutkan Pemesanan')}
          </button>
        </div>
      </div>
    </div>
  );
}
