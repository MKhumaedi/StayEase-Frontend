import React, { useState, useEffect, useRef } from 'react';
import { Property, Room, Review } from '../../../types';
import { useAuth } from '../../../shared/context/AuthContext';
import { 
  Star, Shield, ArrowLeft, Eye, MessageSquare, BedDouble, HelpCircle, Heart,
  Wifi, Wind, Waves, Bath, Sparkles, Utensils, Film, Compass, Mountain, Car, Dumbbell, Tv, Check, Coffee, AlertTriangle, Info,
  MapPin, Zap, CheckCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import { useWishlist } from '../../../shared/context/WishlistContext';
import { PricingService } from '../services/PricingService';
import { useDocumentMetadata } from '../../../hooks/useDocumentMetadata';

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
  params?: any;
}

export default function PropertyDetail({ propertyId, onNavigate, params }: PropertyDetailProps) {
  const { t, language, formatCurrencyIDR } = useLanguage();
  const { isFavorited, toggleFavorite } = useWishlist();
  const [data, setData] = useState<{ property: Property; rooms: Room[] } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const formatLocalDate = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const generateConsecutiveDates = (startFromStr: string, count: number): string[] => {
    const dates: string[] = [];
    const baseDate = new Date(startFromStr + 'T00:00:00');
    if (isNaN(baseDate.getTime())) {
      return [];
    }
    for (let i = 0; i < count; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      dates.push(formatLocalDate(d));
    }
    return dates;
  };

  const hasInitializedDates = useRef(false);

  const [startDate, setStartDate] = useState(() => {
    return formatLocalDate(new Date());
  });
  const [endDate, setEndDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatLocalDate(tomorrow);
  });
  const [guestCount, setGuestCount] = useState(() => {
    return params?.prefill?.guestCount ? Number(params.prefill.guestCount) : 1;
  });
  const [roomUnavailableWarning, setRoomUnavailableWarning] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(5.0);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [relatedProperties, setRelatedProperties] = useState<Property[]>([]);

  const isRoomEnabled = (room: any) => {
    if (!room) return false;
    const status = room.availabilityStatus || 'Tersedia';
    const remaining = typeof room.remainingRooms === 'number' ? room.remainingRooms : 1;
    return (status === 'Tersedia' || status === 'Hampir Habis') && remaining > 0;
  };

  const handleSelectDate = (isoDate: string) => {
    setStartDate(isoDate);
    // Default check-out must be one night after the selected check-in
    const checkinDate = new Date(isoDate);
    const checkoutDate = new Date(endDate);
    if (checkinDate >= checkoutDate) {
      const nextDate = new Date(checkinDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const yyyy = nextDate.getFullYear();
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dd = String(nextDate.getDate()).padStart(2, '0');
      setEndDate(`${yyyy}-${mm}-${dd}`);
    }
  };

  const getDynamicRates = (base: number) => {
    const dates = generateConsecutiveDates(startDate, 10);
    return dates.map(dStr => {
      // Create a checkout date (dStr + 1 day)
      const dateParts = dStr.split('-');
      const d = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      d.setDate(d.getDate() + 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const nextDStr = `${yyyy}-${mm}-${dd}`;

      // Calculate quote
      const quoteInputProperty = {
        basePrice: data?.property?.basePrice,
        cleaningFee: data?.property?.cleaningFee,
        serviceFee: data?.property?.serviceFee,
        peakSeasonRates: data?.property?.peakSeasonRates || []
      };

      const quoteInputRoom = selectedRoom ? {
        id: selectedRoom.id,
        basePrice: selectedRoom.basePrice,
        availabilities: selectedRoom.availabilities || []
      } : null;

      const quote = PricingService.calculateQuote(quoteInputProperty, quoteInputRoom, dStr, nextDStr);
      
      // Check if peak season or promo is applied
      const isPeak = quote.seasonalAdjustment > 0;
      const isPromo = quote.seasonalAdjustment < 0;
      
      // Look up if there's a peak season rule matching this date
      const peakRates = data?.property?.peakSeasonRates || [];
      const match = peakRates.find((p: any) => p.isActive !== false && dStr >= p.startDate && dStr <= p.endDate);

      let badge = language === 'en' ? "Base Price" : "Harga Dasar";
      let label = language === 'en' ? "Standard Rate" : "Tarif Dasar";
      let badgeClass = "bg-slate-100 text-slate-700 border border-slate-200";

      const dParts = dStr.split('-');
      const tempD = new Date(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2]));
      const actualDayOfWeek = tempD.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday
      const isWeekend = actualDayOfWeek === 5 || actualDayOfWeek === 6 || actualDayOfWeek === 0;

      if (isPeak) {
        badge = match ? match.name : (language === 'en' ? "Peak Season" : "Musim Ramai");
        label = language === 'en' ? "Peak Season Rate" : "Tarif Musim Ramai";
        badgeClass = "bg-purple-100 text-purple-700 border border-purple-200";
      } else if (isPromo) {
        badge = language === 'en' ? "Promo" : "Promo";
        label = language === 'en' ? "Special Promo" : "Promo Khusus";
        badgeClass = "bg-emerald-100 text-emerald-700 border border-emerald-200";
      } else if (isWeekend) {
        badge = language === 'en' ? "Weekend" : "Weekend";
        label = language === 'en' ? "Weekend Markup" : "Tarif Akhir Pekan";
        badgeClass = "bg-amber-100 text-amber-700 border border-amber-200";
      }

      // Check if blocked in RoomAvailability
      const isBlocked = selectedRoom?.availabilities?.some((o: any) => o.date === dStr && o.isBlocked) || false;

      const formattedLabelDate = (() => {
        const parts = dStr.split('-');
        const tempDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const day = tempDate.getDate();
        const monthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthNamesId = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
        const monthName = language === 'en' ? monthNamesEn[tempDate.getMonth()] : monthNamesId[tempDate.getMonth()];
        return `${day} ${monthName}`;
      })();

      return {
        isoDate: dStr,
        date: formattedLabelDate,
        rate: isBlocked ? 0 : quote.subtotal,
        badge: isBlocked ? (language === 'en' ? "Closed" : "Tutup") : badge,
        label,
        isPromo,
        isPeak,
        badgeClass: isBlocked ? "bg-red-100 text-red-700 border border-red-200" : badgeClass
      };
    });
  };

  const propertyTitle = data?.property ? data.property.name : '';
  const propertyDesc = data?.property ? data.property.description : '';
  const propertyImage = data?.property && data.property.imageUrls && data.property.imageUrls.length > 0 ? data.property.imageUrls[0] : '';
  const propertyUrl = data?.property ? `https://stay-ease-frontend-nu.vercel.app/property/${data.property.slug || data.property.id}` : '';

  useDocumentMetadata({
    title: propertyTitle,
    description: propertyDesc,
    image: propertyImage,
    url: propertyUrl,
  });

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

  const fetchPropertyData = () => {
    fetch(`/api/properties/${propertyId}?checkIn=${startDate}&checkOut=${endDate}`)
      .then(res => res.json())
      .then(resData => {
        if (resData && resData.property) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId);
          if (isUuid && resData.property.slug) {
            onNavigate(`/property/${resData.property.slug}`, params);
            return;
          }
        }
        setData(resData);
        if (resData && resData.rooms && resData.rooms.length > 0) {
          if (!hasInitializedDates.current) {
            const hasAvailableRoom = resData.rooms.some((r: any) => isRoomEnabled(r));
            if (hasAvailableRoom) {
              hasInitializedDates.current = true;
            } else {
              const findAvailableDates = async () => {
                for (let offset = 1; offset < 90; offset++) {
                  const checkInDate = new Date();
                  checkInDate.setDate(checkInDate.getDate() + offset);
                  const checkInStr = formatLocalDate(checkInDate);

                  const checkOutDate = new Date(checkInDate);
                  checkOutDate.setDate(checkOutDate.getDate() + 1);
                  const checkOutStr = formatLocalDate(checkOutDate);

                  try {
                    const res = await fetch(`/api/properties/${propertyId}?checkIn=${checkInStr}&checkOut=${checkOutStr}`);
                    const dataJson = await res.json();
                    if (dataJson && dataJson.rooms && dataJson.rooms.length > 0) {
                      const foundAvailable = dataJson.rooms.some((r: any) => {
                        const status = r.availabilityStatus || 'Tersedia';
                        const remaining = typeof r.remainingRooms === 'number' ? r.remainingRooms : 1;
                        return (status === 'Tersedia' || status === 'Hampir Habis') && remaining > 0;
                      });
                      if (foundAvailable) {
                        setStartDate(checkInStr);
                        setEndDate(checkOutStr);
                        hasInitializedDates.current = true;
                        return;
                      }
                    }
                  } catch (e) {
                    console.error("Error finding future dates:", e);
                  }
                }
                hasInitializedDates.current = true;
              };
              findAvailableDates();
              return;
            }
          }

          const prefillRoomId = params?.prefill?.roomId;
          if (prefillRoomId) {
            const matchedRoom = resData.rooms.find((r: any) => r.id === prefillRoomId);
            if (matchedRoom) {
              if (isRoomEnabled(matchedRoom)) {
                setSelectedRoom(prev => {
                  const updated = resData.rooms.find((r: any) => r.id === (prev?.id || prefillRoomId));
                  return updated || matchedRoom;
                });
                setRoomUnavailableWarning(null);
              } else {
                setSelectedRoom(null);
                setRoomUnavailableWarning(
                  language === 'en' 
                    ? 'Selected room is unavailable. Please choose another room.' 
                    : 'Kamar yang dipilih tidak tersedia. Silakan pilih kamar lain.'
                );
              }
            } else {
              setSelectedRoom(null);
              setRoomUnavailableWarning(
                language === 'en' 
                  ? 'Selected room is unavailable. Please choose another room.' 
                  : 'Kamar yang dipilih tidak tersedia. Silakan pilih kamar lain.'
              );
            }
          } else {
            setSelectedRoom(prev => {
              if (prev) {
                const updated = resData.rooms.find((r: any) => r.id === prev.id);
                return updated || resData.rooms[0];
              }
              return resData.rooms[0];
            });
          }
        }
      })
      .catch(err => console.error('Error fetching property:', err));
  };

  useEffect(() => {
    fetchPropertyData();
  }, [propertyId, params, startDate, endDate]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchPropertyData();
    }, 4000);
    return () => clearInterval(timer);
  }, [propertyId, startDate, endDate]);

  useEffect(() => {
    fetchReviewsOfProperty();
  }, [propertyId, reviewPage]);

  useEffect(() => {
    console.log('Property Reviews:', reviews);
  }, [reviews]);

  useEffect(() => {
    if (data?.property) {
      fetch('/api/properties')
        .then(res => res.json())
        .then(resData => {
          if (resData && resData.data) {
            const filtered = resData.data
              .filter((p: Property) => p.id !== data.property.id)
              .filter((p: Property) => p.categoryId === data.property.categoryId || p.category?.slug === data.property.category?.slug)
              .slice(0, 3);
            setRelatedProperties(filtered);
          }
        })
        .catch(err => console.error('Error fetching related properties:', err));
    }
  }, [propertyId, data?.property]);

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

  const fallbackGallery = [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
  ];
  const allImages = [...(property.imageUrls || [])];
  if (allImages.length < 6) {
    fallbackGallery.forEach(img => {
      if (!allImages.includes(img) && allImages.length < 8) {
        allImages.push(img);
      }
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Navigation and Wishlist Header Bar */}
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

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left main content column */}
        <div className="lg:col-span-2 flex flex-col gap-8 flex-wrap">
          
          {/* 1. PROPERTY HEADER INFO */}
          <div>
            {/* Rating Stars and Reviews top row */}
            <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-indigo-950">
              {(!property.rating || property.rating === 0) ? (
                <span className="text-slate-400 italic">
                  {language === 'en' ? 'No reviews yet' : 'Belum ada ulasan'}
                </span>
              ) : (
                <div className="flex items-center gap-1 flex-wrap">
                  <div className="flex items-center text-amber-500 mr-1">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
                  </div>
                  <span className="text-slate-900 font-extrabold text-sm">
                    {parseFloat(property.rating.toString()).toFixed(1)}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 font-bold">
                    {property.reviewCount} {language === 'en' ? 'Reviews' : 'Ulasan'}
                  </span>
                </div>
              )}
            </div>

            {/* Property Name */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight mb-3">
              {property.name}
            </h1>

            {/* Dynamic Badges Row */}
            <div className="flex flex-wrap gap-2 mb-4">
              {/* Verified Badge */}
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                <Shield className="w-3 h-3 text-emerald-600" />
                {language === 'en' ? 'Verified Property' : 'Properti Terverifikasi'}
              </span>

              {/* Premium Choice Badge (shown based on rating >= 4.7 or custom categories) */}
              {property.rating >= 4.7 && (
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  {language === 'en' ? 'Premium Choice' : 'Pilihan Premium'}
                </span>
              )}

              {/* Instant Booking Badge */}
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                {language === 'en' ? 'Instant Booking' : 'Pemesanan Instan'}
              </span>

              {/* Super Host Badge */}
              {property.rating >= 4.8 && (
                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  <Star className="w-3 h-3 text-rose-600 fill-rose-500" />
                  {language === 'en' ? 'Super Host' : 'Super Host'}
                </span>
              )}
            </div>

            {/* Location with Icon */}
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
              <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{property.location}</span>
            </div>
          </div>

          {/* 2. PROPERTY GALLERY WITH THUMBNAILS */}
          <div className="flex flex-col gap-3">
            {/* Main Featured Photo */}
            <div className="aspect-video bg-slate-100 rounded-3xl overflow-hidden border border-slate-100 shadow-xs relative group">
              <img 
                src={
                  allImages[activeImgIdx] || 
                  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'
                } 
                alt={property.name} 
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" 
                referrerPolicy="no-referrer" 
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Photo Thumbnails Row */}
            <div className="grid grid-cols-5 gap-3">
              {allImages.slice(0, 5).map((img, idx) => {
                const isSelected = activeImgIdx === idx;
                const isLast = idx === 4 && allImages.length > 5;
                const remainingCount = allImages.length - 4;

                return (
                  <button
                    key={`thumb-${idx}`}
                    onClick={() => setActiveImgIdx(idx)}
                    className={`relative aspect-video rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 hover:scale-[1.05] ${
                      isSelected ? 'border-indigo-600 ring-2 ring-indigo-600/15' : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`Thumbnail ${idx + 1}`} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                    {isLast && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white font-extrabold text-[10px] sm:text-xs">
                        +{remainingCount} {language === 'en' ? 'Photos' : 'Foto'}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. MENGAPA MEMILIH PROPERTI INI HIGHLIGHTS */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 font-display">
              {language === 'en' ? 'Why Choose This Property?' : 'Mengapa memilih properti ini?'}
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {/* Card 1: Verified Property */}
              <div className="p-4 bg-emerald-50/30 border border-emerald-100/60 rounded-2xl flex flex-col gap-2 transition-all hover:shadow-xs hover:border-emerald-200">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span className="font-extrabold text-xs text-slate-800">{language === 'en' ? 'Verified Property' : 'Properti Terverifikasi'}</span>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {language === 'en' ? 'This host has submitted valid business credentials.' : 'Pemilik telah menyerahkan berkas administrasi terverifikasi.'}
                </p>
              </div>

              {/* Card 2: Instant Booking */}
              <div className="p-4 bg-amber-50/30 border border-amber-100/60 rounded-2xl flex flex-col gap-2 transition-all hover:shadow-xs hover:border-amber-200">
                <Zap className="w-5 h-5 text-amber-600 fill-amber-500/20" />
                <span className="font-extrabold text-xs text-slate-800">{language === 'en' ? 'Instant Booking' : 'Pemesanan Instan'}</span>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {language === 'en' ? 'Book instantly and secure your stay without waiting.' : 'Dapatkan kepastian menginap langsung tanpa konfirmasi lama.'}
                </p>
              </div>

              {/* Card 3: Premium Experience */}
              {(property.rating >= 4.7 || property.category?.slug === 'luxury-villas') && (
                <div className="p-4 bg-indigo-50/30 border border-indigo-100/60 rounded-2xl flex flex-col gap-2 transition-all hover:shadow-xs hover:border-indigo-200">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span className="font-extrabold text-xs text-slate-800">{language === 'en' ? 'Premium Experience' : 'Pengalaman Premium'}</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {language === 'en' ? 'Highly rated for service, cleanliness, and comfort.' : 'Mendapat rating istimewa untuk pelayanan dan kebersihan.'}
                  </p>
                </div>
              )}

              {/* Card 4: High Speed WiFi */}
              {property.amenities?.some(am => am.toLowerCase().includes('wifi') || am.toLowerCase().includes('internet')) && (
                <div className="p-4 bg-indigo-50/30 border border-indigo-100/60 rounded-2xl flex flex-col gap-2 transition-all hover:shadow-xs hover:border-indigo-200">
                  <Wifi className="w-5 h-5 text-indigo-600" />
                  <span className="font-extrabold text-xs text-slate-800">{language === 'en' ? 'High Speed WiFi' : 'WiFi Kecepatan Tinggi'}</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {language === 'en' ? 'Stay connected with fast, reliable internet access.' : 'Koneksi internet andalan untuk kerja maupun hiburan.'}
                  </p>
                </div>
              )}

              {/* Card 5: Secure Payment */}
              <div className="p-4 bg-blue-50/30 border border-blue-100/60 rounded-2xl flex flex-col gap-2 transition-all hover:shadow-xs hover:border-blue-200">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="font-extrabold text-xs text-slate-800">{language === 'en' ? 'Secure Payment' : 'Pembayaran Aman'}</span>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {language === 'en' ? 'Encrypted transactions with instantaneous receipting.' : 'Transaksi keuangan yang terjaga aman dan otomatis.'}
                </p>
              </div>

              {/* Card 6: Family Friendly */}
              {(property.guests != null && property.guests >= 4 || property.beds != null && property.beds >= 3) && (
                <div className="p-4 bg-teal-50/30 border border-teal-100/60 rounded-2xl flex flex-col gap-2 transition-all hover:shadow-xs hover:border-teal-200">
                  <Heart className="w-5 h-5 text-teal-600" />
                  <span className="font-extrabold text-xs text-slate-800">{language === 'en' ? 'Family Friendly' : 'Ramah Keluarga'}</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {language === 'en' ? 'Spacious configuration with child-safe features.' : 'Tersedia ruang yang lapang dan aman untuk seluruh keluarga.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 4. ABOUT/DESCRIPTION */}
          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-lg font-bold text-slate-800 mb-3 font-display">
              {language === 'en' ? 'About this premium stay' : 'Tentang hunian premium ini'}
            </h2>
            <div className="relative">
              <p className={`text-sm text-slate-600 leading-relaxed transition-all duration-300 ${!isDescExpanded ? 'line-clamp-3' : ''}`}>
                {property.description}
              </p>
              {property.description.length > 180 && (
                <button
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-1"
                >
                  {isDescExpanded ? (
                    <>
                      {language === 'en' ? 'Show Less' : 'Sembunyikan'}
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      {language === 'en' ? 'Read More' : 'Selengkapnya'}
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* 5. FACILITIES */}
          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 font-display">
              {language === 'en' ? 'Premium Amenities & Features' : 'Fasilitas & Fitur Premium'}
            </h2>
            {(!property.amenities || property.amenities.length === 0) ? (
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-slate-500 italic">
                {language === 'en' ? 'No amenities have been configured yet.' : 'Belum ada fasilitas yang dikonfigurasi.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {property.amenities.map((am, idx) => (
                  <div 
                    key={`amenity-${idx}`} 
                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-100 bg-slate-50/20 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all duration-200 hover:scale-[1.02]"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                      {getAmenityIcon(am)}
                    </div>
                    <span className="truncate text-xs font-bold text-slate-700">{formatAmenityLabel(am)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. ROOM SELECTION INVENTORY */}
          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1 font-display">{t.propertyDetail.selectSuites}</h2>
            <p className="text-xs text-slate-400 mb-5">{t.propertyDetail.availableSuitesDesc}</p>
            
            <div className="flex flex-col gap-4">
              {rooms.map((r, idx) => {
                const details = (() => {
                  try {
                    if (r.floor && r.floor.trim().startsWith('{')) {
                      return JSON.parse(r.floor);
                    }
                  } catch (e) {}
                  return { bedCount: 1, bathCount: 1, quantity: 1 };
                })();

                const remainingRooms = typeof r.remainingRooms === 'number' ? r.remainingRooms : 0;
                const availabilityStatus = r.availabilityStatus || 'Tersedia';

                let badgeText = '';
                let badgeClass = '';
                let isButtonEnabled = false;

                if (availabilityStatus === 'Tidak Tersedia') {
                  badgeText = language === 'en' ? 'Not Available' : 'Tidak Tersedia';
                  badgeClass = 'bg-slate-100 text-slate-600 border border-slate-200';
                  isButtonEnabled = false;
                } else if (availabilityStatus === 'Penuh') {
                  badgeText = language === 'en' ? 'Sold Out' : 'Penuh';
                  badgeClass = 'bg-red-50 text-red-700 border border-red-100';
                  isButtonEnabled = false;
                } else if (availabilityStatus === 'Hampir Habis') {
                  badgeText = language === 'en' ? `Almost Sold Out • Only ${remainingRooms} left` : `Hampir Habis • Sisa ${remainingRooms} kamar`;
                  badgeClass = 'bg-amber-50 text-amber-700 border border-amber-100';
                  isButtonEnabled = true;
                } else {
                  badgeText = language === 'en' ? `Available • Only ${remainingRooms} left` : `Tersedia • Sisa ${remainingRooms} kamar`;
                  badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                  isButtonEnabled = true;
                }

                const isSelected = selectedRoom?.id === r.id;

                return (
                  <div 
                    key={r.id ? `room-${r.id}-${idx}` : `room-${idx}`} 
                    onClick={() => {
                      if (isButtonEnabled) {
                        setSelectedRoom(r); 
                        setRoomUnavailableWarning(null);
                      } else {
                        setRoomUnavailableWarning(
                          language === 'en' 
                            ? 'Selected room is unavailable. Please choose another room.' 
                            : 'Kamar yang dipilih tidak tersedia. Silakan pilih kamar lain.'
                        );
                      }
                    }}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row gap-5 items-stretch md:items-center justify-between ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/10 shadow-xs scale-[1.01]' 
                        : !isButtonEnabled
                          ? 'border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed'
                          : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/30 hover:scale-[1.005]'
                    }`}
                  >
                    {/* Selected Banner Badge */}
                    {isSelected && (
                      <div className="absolute top-0 right-0 bg-indigo-600 text-white font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-xs">
                        {language === 'en' ? 'Selected' : 'Terpilih'}
                      </div>
                    )}

                    <div className="flex gap-4 items-center flex-1">
                      {r.image ? (
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-150 shadow-xs relative group">
                          <img src={r.image} alt={r.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100 text-indigo-500">
                          <BedDouble className="w-8 h-8" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">
                            {r.name}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold leading-none ${badgeClass}`}>
                            {badgeText}
                          </span>
                        </div>

                        <p className="text-xs text-indigo-950 font-bold mb-1.5">{r.type}</p>
                        
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold flex-wrap">
                          <span>{t.propertyDetail.capacityCount.replace('{count}', String(r.capacity))}</span>
                          <span>•</span>
                          <span>{details.bedCount || 1} {language === 'en' ? 'beds' : 'kasur'}</span>
                          <span>•</span>
                          <span>{details.bathCount || 1} {language === 'en' ? 'baths' : 'kamar mandi'}</span>
                        </div>
                        {r.wing && (
                          <p className="text-[10px] text-slate-400 mt-1 max-w-md leading-relaxed">
                            📍 {r.wing}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col items-end justify-between md:justify-center gap-3 mt-3 md:mt-0 border-t border-slate-100 md:border-none pt-3 md:pt-0">
                      <div className="text-left md:text-right">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'en' ? 'Price per night' : 'Harga per malam'}</span>
                        <span className="text-lg font-black text-indigo-950 block">{formatCurrencyIDR(r.basePrice)}</span>
                      </div>
                      <button 
                        disabled={!isButtonEnabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isButtonEnabled) {
                            setSelectedRoom(r); 
                            setRoomUnavailableWarning(null);
                          }
                        }} 
                        className={`text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-100' 
                            : !isButtonEnabled
                              ? 'bg-slate-150 text-slate-400 cursor-not-allowed'
                              : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100/70'
                        }`}
                      >
                        {isSelected ? (language === 'en' ? 'Selected' : 'Terpilih') : (language === 'en' ? 'Select Room' : 'Pilih Kamar')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7. DYNAMIC PRICE CALENDAR */}
          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1 font-display">
              {language === 'en' ? 'Price Calendar' : 'Kalender Harga'}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              {language === 'en' 
                ? 'Compare prices across dates before determining your stay date.' 
                : 'Bandingkan harga beberapa hari sebelum menentukan tanggal menginap.'}
            </p>
            
            {/* Horizontal list of cards */}
            <div className="flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-none sm:grid sm:grid-cols-5 sm:overflow-x-visible">
              {getDynamicRates(selectedRoom ? selectedRoom.basePrice : property.basePrice).map((dr) => {
                const isSelected = startDate === dr.isoDate;
                return (
                  <button
                    key={dr.isoDate}
                    onClick={() => handleSelectDate(dr.isoDate)}
                    className={`p-4 rounded-2xl flex flex-col justify-between text-left border cursor-pointer transition-all duration-250 hover:scale-[1.03] shrink-0 w-37.5 sm:w-auto ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-600/10 shadow-xs' 
                        : 'border-slate-150 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold text-slate-455 block uppercase tracking-wider mb-1">
                        {dr.date}
                      </span>
                      <div className="text-base font-black font-display text-indigo-950 mb-2 leading-none">
                        {formatCurrencyIDR(dr.rate)}
                      </div>
                    </div>

                    <div className="mt-2">
                      <span className={`inline-block text-[8.5px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${dr.badgeClass}`}>
                        {dr.badge}
                      </span>
                      <p className="text-[9px] text-slate-400 leading-tight mt-1">
                        {dr.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500 flex items-start gap-2 mt-2">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {language === 'en' 
                  ? 'Click on any date card above to automatically update your check-in date in the booking sidebar.' 
                  : 'Klik pada kartu tanggal di atas untuk memperbarui tanggal check-in secara otomatis di kolom pemesanan.'}
              </p>
            </div>
          </div>

          {/* 8. GUEST REVIEWS */}
          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 font-display">
              {t.propertyDetail.customerReviewsTitle}
            </h2>
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold italic bg-slate-50 p-4 rounded-xl border border-dashed text-center">
                {language === 'en' ? 'No reviews yet for this property.' : 'Belum ada ulasan untuk properti ini.'}
              </p>
            ) : (
              <div className="flex flex-col gap-5">
                {reviews.map((rv, idx) => {
                  const name = rv.guest?.name || rv.guestName || (language === 'en' ? 'Verified Guest' : 'Tamu Terverifikasi');
                  const avatar = rv.guest?.avatarUrl || rv.guestAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';
                  
                  return (
                    <div key={`review-${rv.id || idx}-${idx}`} className="p-5 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 transition-all duration-200 flex gap-4">
                      <img src={avatar} alt={name} className="w-11 h-11 rounded-full bg-slate-50 border object-cover shrink-0" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-sm text-slate-800">{name}</span>
                              <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 border border-emerald-100 rounded text-[9px] font-bold flex items-center gap-0.5 leading-none">
                                <Shield className="w-2.5 h-2.5" /> {language === 'en' ? 'Verified Guest' : 'Tamu Terverifikasi'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                              {new Date(rv.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center text-amber-500 text-xs font-bold gap-1 bg-amber-50/50 px-2 py-0.5 rounded-md border border-amber-100">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>{rv.rating}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-650 leading-relaxed font-medium mb-1 bg-slate-50/20 p-3 rounded-xl border border-slate-50 italic">
                          "{rv.comment}"
                        </p>
                        
                        {/* Host Reply Card / Form Area */}
                        {rv.replyComment ? (
                          <div className="bg-indigo-50/20 p-4 rounded-2xl border-l-4 border-l-indigo-500 border-t border-r border-b border-indigo-100 mt-3.5 ml-4 flex flex-col gap-2 relative">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-xs text-slate-800">
                                  {data?.property?.tenant?.name || (language === 'en' ? 'Host' : 'Pemilik Properti')}
                                </span>
                                <span className="bg-indigo-100 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider leading-none">
                                  Host
                                </span>
                                {rv.replyDate && (
                                  <span className="text-[10px] text-slate-400 font-semibold ml-1">
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
                            <p className="text-xs text-slate-600 leading-relaxed italic">"{rv.replyComment}"</p>
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
                  <div className="flex items-center justify-between mt-4 border-t border-slate-100 pt-4 font-sans">
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

          {/* 9. LOCATION & SURROUNDINGS */}
          {property.location && (
            <div className="border-t border-slate-100 pt-6">
              <h2 className="text-lg font-bold text-slate-800 mb-3 font-display">
                {language === 'en' ? 'Location & Surroundings' : 'Lokasi & Lingkungan'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                {/* Map Placeholder */}
                <div className="md:col-span-7 bg-slate-100 rounded-2xl overflow-hidden border border-slate-150 h-56 relative group shadow-xs">
                  {/* Styled simulated map */}
                  <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [bg-size:16px_16px] bg-slate-50 flex items-center justify-center">
                    <div className="text-center p-6 relative z-10">
                      <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-2 text-indigo-600 animate-bounce">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-extrabold text-slate-800 block mb-1">
                        {property.city || property.location}
                      </span>
                      <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                        {property.address || property.location}
                      </p>
                    </div>
                    {/* Simulated streets lines */}
                    <div className="absolute inset-0 opacity-10 border-t border-b border-indigo-300 transform -rotate-12 scale-110 pointer-events-none" />
                    <div className="absolute inset-0 opacity-10 border-l border-r border-indigo-300 transform rotate-45 scale-110 pointer-events-none" />
                  </div>
                </div>

                {/* Nearby landmarks list */}
                <div className="md:col-span-5 flex flex-col justify-between p-4 bg-slate-50/40 border border-slate-100 rounded-2xl">
                  <div>
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-2">
                      {language === 'en' ? 'What\'s Nearby' : 'Tempat Terdekat'}
                    </span>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">🏫</span>
                          <span>{language === 'en' ? 'City Center' : 'Pusat Kota'}</span>
                        </div>
                        <span className="text-slate-400 font-semibold">1.5 km</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">🚆</span>
                          <span>{language === 'en' ? 'Train Station' : 'Stasiun Kereta'}</span>
                        </div>
                        <span className="text-slate-400 font-semibold">3.2 km</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">✈️</span>
                          <span>{language === 'en' ? 'International Airport' : 'Bandara Internasional'}</span>
                        </div>
                        <span className="text-slate-400 font-semibold">12 km</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-450 leading-relaxed font-semibold">
                    ⭐ {language === 'en' ? 'Excellent location rating: 9.5/10 from guest reviews.' : 'Peringkat lokasi luar biasa: 9.5/10 dari ulasan tamu.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 10. RELATED PROPERTIES (PROPERTI SERUPA) */}
          {relatedProperties.length > 0 && (
            <div className="border-t border-slate-100 pt-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 font-display">
                {language === 'en' ? 'Similar Properties' : 'Properti Serupa'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedProperties.map((p) => (
                  <button 
                    key={p.id}
                    onClick={() => {
                      onNavigate(`/property/${p.slug || p.id}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-3 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:scale-[1.02] hover:shadow-xs transition-all duration-200 text-left cursor-pointer flex flex-col gap-2.5"
                  >
                    <div className="aspect-video w-full rounded-xl bg-slate-50 overflow-hidden border border-slate-50">
                      <img 
                        src={p.imageUrls?.[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'} 
                        alt={p.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="px-1">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">
                        {p.location}
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-xs line-clamp-1 mb-1">
                        {p.name}
                      </h4>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
                        <span className="text-[10px] font-black text-indigo-950 font-sans">
                          {formatCurrencyIDR(p.basePrice)} <span className="text-[9px] font-medium text-slate-400">/ {t.common.night}</span>
                        </span>
                        <div className="flex items-center gap-0.5 text-[10px] font-extrabold text-amber-500">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{parseFloat(p.rating.toString()).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* 11. STICKY BOOKING CALCULATOR SIDEBAR COLUMN */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm h-fit sticky top-28 self-start flex flex-col gap-5">
            {/* Top Section */}
            <div>
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-1">
                {language === 'en' ? 'BOOK YOUR STAY' : 'PILIH TANGGAL MENGINAP'}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 font-display line-clamp-1 leading-tight mb-1">
                {property.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mb-3">
                📍 {property.location}
              </p>

              {/* Selected Room Indicator Box */}
              <div className="bg-indigo-50/30 p-3.5 rounded-2xl border border-indigo-100 flex items-center gap-3 mb-3.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[8.5px] font-black text-slate-400 uppercase tracking-wider">{language === 'en' ? 'SELECTED ROOM' : 'KAMAR TERPILIH'}</span>
                  <span className="font-extrabold text-xs text-indigo-950 block truncate mt-0.5">
                    {selectedRoom?.name || (language === 'en' ? 'Please select a room' : 'Silakan pilih kamar')}
                  </span>
                </div>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-emerald-50 text-emerald-750 border border-emerald-150 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  {language === 'en' ? 'Verified' : 'Terverifikasi'}
                </span>
                <span className="bg-amber-50 text-amber-750 border border-amber-150 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 fill-amber-500/20" />
                  {language === 'en' ? 'Instant' : 'Instan'}
                </span>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Error/Warning area */}
            {(roomUnavailableWarning || (selectedRoom && !isRoomEnabled(selectedRoom))) && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 font-semibold p-3.5 rounded-2xl text-xs font-sans flex items-start gap-2 animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  {roomUnavailableWarning || (
                    language === 'en' 
                      ? 'Selected room is unavailable for these dates. Please choose another room.' 
                      : 'Kamar yang dipilih tidak tersedia untuk tanggal tersebut. Silakan pilih kamar lain.'
                  )}
                </span>
              </div>
            )}

            {/* Inputs Section */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-600/10 focus-within:border-indigo-600 transition-all">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">{language === 'en' ? 'Check In' : 'Check In'}</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => handleSelectDate(e.target.value)} 
                    className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer" 
                  />
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-600/10 focus-within:border-indigo-600 transition-all">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">{language === 'en' ? 'Check Out' : 'Check Out'}</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)} 
                    className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer" 
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-600/10 focus-within:border-indigo-600 transition-all">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">{language === 'en' ? 'Guests' : 'Tamu'}</label>
                <input 
                  type="number" 
                  min="1" 
                  value={guestCount} 
                  onChange={e => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))} 
                  className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none" 
                />
              </div>
            </div>

            {/* Price Displays and Details Breakdown */}
            {breakdown ? (
              <div className="flex flex-col gap-2.5 text-xs text-slate-600">
                {breakdown.peakMultiplier > 1 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex flex-col gap-2 text-xs text-[#78350f]">
                    <div className="flex items-center justify-between font-extrabold">
                      <span className="flex items-center gap-1.5 text-xs">
                        <Sparkles className="h-4 w-4 animate-pulse text-amber-500 shrink-0" />
                        {language === 'en' ? 'Peak Season Active' : 'Musim Liburan Aktif'}
                      </span>
                      <span className="font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[9px] font-black">
                        {breakdown.peakMultiplier.toFixed(2)}x
                      </span>
                    </div>
                    {breakdown.peakSeasonName && (
                      <div className="text-[10px] font-semibold leading-tight">
                        🎉 {breakdown.peakSeasonName}
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-2 border-t border-amber-200/50 pt-2 text-[10px]">
                      <div>
                        <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px]">{language === 'en' ? 'Base Price' : 'Harga Dasar'}</span>
                        <span className="font-bold text-slate-700">{formatCurrencyIDR(breakdown.nightlyRate)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px]">{language === 'en' ? 'Multiplier' : 'Pengali'}</span>
                        <span className="font-bold text-slate-700">{breakdown.peakMultiplier.toFixed(2)}x</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px]">{language === 'en' ? 'Final Price' : 'Harga Final'}</span>
                        <span className="font-extrabold text-indigo-950">{formatCurrencyIDR(breakdown.finalRoomPrice || breakdown.nightlyRate)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center font-semibold">
                  <span>{language === 'en' ? 'Nightly Rate' : 'Harga Per Malam'}</span>
                  <span className="font-extrabold text-slate-800">
                    {formatCurrencyIDR(Number.isFinite(breakdown.nightlyRate) ? breakdown.nightlyRate : 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center font-semibold">
                  <span>{language === 'en' ? 'Base Subtotal' : 'Subtotal Dasar'}</span>
                  <span className="font-extrabold text-slate-800">
                    {formatCurrencyIDR(Number.isFinite(breakdown.subtotal) ? breakdown.subtotal : 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center font-semibold">
                  <span>{language === 'en' ? 'Cleaning Fee' : 'Biaya Pembersihan'}</span>
                  <span className="font-extrabold text-slate-800">
                    {formatCurrencyIDR(Number.isFinite(breakdown.cleaningFee) ? breakdown.cleaningFee : 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center font-semibold">
                  <span>{language === 'en' ? 'Service Fee' : 'Biaya Layanan'}</span>
                  <span className="font-extrabold text-slate-800">
                    {formatCurrencyIDR(Number.isFinite(breakdown.serviceFee) ? breakdown.serviceFee : 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center font-semibold">
                  <span>{language === 'en' ? 'Taxes' : 'Pajak'}</span>
                  <span className="font-extrabold text-slate-800">
                    {formatCurrencyIDR(Number.isFinite(breakdown.taxes) ? breakdown.taxes : (Number.isFinite(breakdown.tax) ? breakdown.tax : 0))}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-lg font-black text-indigo-950 border-t border-slate-100 pt-3.5 mt-1.5">
                  <span className="text-sm font-bold">{language === 'en' ? 'Total Stay Price' : 'Total Pembayaran'}</span>
                  <span className="text-xl font-extrabold text-indigo-900 font-sans">
                    {formatCurrencyIDR(Number.isFinite(breakdown.total) ? breakdown.total : 0)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl">
                {language === 'en' ? 'Select room & dates to calculate price' : 'Pilih kamar & tanggal untuk estimasi harga'}
              </div>
            )}

            <button 
              disabled={!selectedRoom || !isRoomEnabled(selectedRoom) || !startDate || !endDate || (new Date(startDate) >= new Date(endDate)) || guestCount <= 0} 
              onClick={handleBook} 
              className="w-full bg-indigo-900 hover:bg-indigo-850 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold py-3.5 px-4 rounded-2xl text-sm cursor-pointer shadow-indigo-100 shadow-sm transition-all text-center hover:scale-[1.01] active:scale-[0.99]"
            >
              {!selectedRoom 
                ? (language === 'en' ? 'Please Select a Room First' : 'Silakan Pilih Kamar Dahulu')
                : !isRoomEnabled(selectedRoom) ? (language === 'en' ? 'Selected Room is Unavailable' : 'Kamar yang Dipilih Tidak Tersedia')
                : (!startDate || !endDate) ? (language === 'en' ? 'Select Valid Dates' : 'Pilih Tanggal Valid')
                : (new Date(startDate) >= new Date(endDate)) ? (language === 'en' ? 'Check-in must be before check-out' : 'Check-in harus sebelum check-out')
                : guestCount <= 0 ? (language === 'en' ? 'Guest count must be > 0' : 'Jumlah tamu harus > 0')
                : (language === 'en' ? 'Instantiate Booking' : 'Lanjutkan Pemesanan')}
            </button>

            {/* Trust Badges section */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-2.5">
              <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{language === 'en' ? 'Secure Encrypted Payment' : 'Pembayaran Terenkripsi & Aman'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500/10 shrink-0" />
                <span>{language === 'en' ? 'Instant Confirmation' : 'Konfirmasi Instan 100%'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600">
                <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>{language === 'en' ? 'Verified Quality Property' : 'Kualitas Properti Terverifikasi'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600">
                <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{language === 'en' ? '24/7 Priority Customer Support' : 'Layanan Pelanggan Prioritas 24/7'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
