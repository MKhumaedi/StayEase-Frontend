import React, { useEffect, useState, useRef } from 'react';
import { Property } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search as SearchIcon, 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  ArrowRight,
  Building2,
  ShieldCheck,
  Compass,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Clock,
  Lock,
  ChevronDown,
  Info,
  DollarSign,
  UserCheck,
  Percent,
  Plus,
  Minus,
  Heart
} from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import { usePropertyFilterOptions } from '../../../hooks/usePropertyFilterOptions';
import { useWishlist } from '../../../shared/context/WishlistContext';
import { useDocumentMetadata } from '../../../hooks/useDocumentMetadata';

interface HomeProps {
  onNavigate: (path: string, params?: any) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  useDocumentMetadata();
  const { t, language, formatCurrencyIDR } = useLanguage();
  const { isFavorited, toggleFavorite } = useWishlist();

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  const carouselSlides = [
    {
      title: language === 'en' ? "Find Exceptional Places To Stay" : "Temukan Tempat Hunian Luar Saya",
      subtitle: language === 'en' ? "Compare prices across dates and discover the best accommodation deals." : "Bandingkan harga lintas tanggal dan temukan penawaran akomodasi terbaik.",
      cta: language === 'en' ? "Explore Properties" : "Jelajahi Properti",
      action: "properties",
      bg: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80"
    },
    {
      title: language === 'en' ? "Smart Booking With Dynamic Pricing" : "Pemesanan Pintar Dengan Harga Dinamis",
      subtitle: language === 'en' ? "See price differences across dates and choose the best value." : "Bandingkan perbedaan harga antar tanggal penawaran dan pilih penawaran terbaik.",
      cta: language === 'en' ? "Compare Prices" : "Bandingkan Harga",
      action: "compare_section",
      bg: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80"
    },
    {
      title: language === 'en' ? "Verified Stays By Trusted Tenants" : "Hunian Terverifikasi Oleh Penyewa Terpercaya",
      subtitle: language === 'en' ? "Book safely with transparent pricing and real-time availability." : "Pesan dengan aman dengan harga transparan dan ketersediaan waktu nyata.",
      cta: language === 'en' ? "Book Now" : "Pesan Sekarang",
      action: "properties",
      bg: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80"
    }
  ];

  // Auto rotate carousel every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselSlides.length]);

  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % carouselSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

  // Search Section States
  const { cities, categories, minPrice, maxPrice } = usePropertyFilterOptions();
  const popularCities = cities;
  const [destQuery, setDestQuery] = useState('');
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [checkIn, setCheckIn] = useState('2026-10-12');
  const [duration, setDuration] = useState(7);
  
  // Guest Stepper States
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);

  // Property Filters, Pagination & Sorting
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [cityFilter, setCityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dbMinPrice, setDbMinPrice] = useState(500000);
  const [dbMaxPrice, setDbMaxPrice] = useState(4000000);
  const [maxPriceFilter, setMaxPriceFilter] = useState(4000000);
  const [sortOrder, setSortOrder] = useState('price_asc');
  const [page, setPage] = useState(1);
  const limit = 6;

  // Debouncing for keyword search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 450);
    return () => clearTimeout(handler);
  }, [keyword]);

  const handleResetFilters = () => {
    setKeyword('');
    setCityFilter('all');
    setCategoryFilter('all');
    setMaxPriceFilter(dbMaxPrice);
    setSortOrder('price_asc');
    setPage(1);
  };

  // Selected property for dynamic price comparison preview
  const [selectedCompareProp, setSelectedCompareProp] = useState<Property | null>(null);

  const destRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setShowDestDropdown(false);
      }
      if (guestRef.current && !guestRef.current.contains(event.target as Node)) {
        setShowGuestDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter cities as destination query updates
  useEffect(() => {
    if (destQuery.trim() === '') {
      setFilteredCities(popularCities);
    } else {
      setFilteredCities(
        popularCities.filter(c => c.toLowerCase().includes(destQuery.toLowerCase()))
      );
    }
  }, [destQuery, cities]);

  useEffect(() => {
    if (minPrice !== undefined && maxPrice !== undefined) {
      let minVal = minPrice !== undefined ? minPrice : 500000;
      let maxVal = maxPrice !== undefined ? maxPrice : 5000000;
      
      // Normalize low (scaled-down) database prices
      if (minVal < 50000) minVal = minVal * 1000;
      if (maxVal < 50000) maxVal = maxVal * 1000;

      setDbMinPrice(minVal);
      setDbMaxPrice(maxVal);
      setMaxPriceFilter(maxVal);
    }
  }, [minPrice, maxPrice]);

  // Fetch paginated & filtered property listings from Server
  const fetchProperties = () => {
    setLoading(true);
    const cityString = cityFilter !== 'all' ? cityFilter : '';
    const categoryString = categoryFilter !== 'all' ? categoryFilter : '';
    
    fetch(`/api/properties?city=${encodeURIComponent(cityString)}&search=${encodeURIComponent(debouncedKeyword.trim())}&category=${categoryString}&maxPrice=${maxPriceFilter}&sort=${sortOrder}&page=${page}&limit=${limit}`)
      .then(res => res.json())
      .then(resData => {
        const fetchedList = resData.data || [];
        setProperties(fetchedList);
        setTotalCount(resData.total || 0);
        setLoading(false);
        // Default the dynamic rate compare widget to the first fetched item
        if (fetchedList.length > 0 && !selectedCompareProp) {
          setSelectedCompareProp(fetchedList[0]);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProperties();
  }, [cityFilter, categoryFilter, maxPriceFilter, sortOrder, page, debouncedKeyword]);

  // Reset page to 1 when filters are updated
  useEffect(() => {
    setPage(1);
  }, [cityFilter, categoryFilter, maxPriceFilter, sortOrder, debouncedKeyword]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('/search', { 
      location: destQuery || 'All', 
      checkIn,
      duration,
      guests: `${adults} Adults, ${children} Children`
    });
  };

  const handleCarouselAction = (slideAction: string) => {
    if (slideAction === 'properties') {
      const el = document.getElementById('property-grid-anchor');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        onNavigate('/search');
      }
    } else if (slideAction === 'compare_section') {
      const el = document.getElementById('pricing-highlight-anchor');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Safe Math helper for dynamic rates calendar
  const getDynamicRates = (base: number) => {
    return [
      { date: "12 Oct", rate: Math.round(base), label: language === 'en' ? "Standard Rate" : "Tarif Dasar", isPromo: false, isPeak: false },
      { date: "13 Oct", rate: Math.round(base * 1.25), label: language === 'en' ? "Weekend Markup" : "Tarif Akhir Pekan", isPromo: false, isPeak: true },
      { date: "14 Oct", rate: Math.round(base * 1.5), label: language === 'en' ? "Peak Demand Block" : "Tarif Musim Ramai", isPromo: false, isPeak: true },
      { date: "15 Oct", rate: Math.round(base * 0.9), label: language === 'en' ? "Special Promo -10%" : "Promo Khusus -10%", isPromo: true, isPeak: false },
      { date: "16 Oct", rate: Math.round(base * 1.1), label: language === 'en' ? "High demand" : "Permintaan Tinggi", isPromo: false, isPeak: false }
    ];
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="font-sans text-slate-800 antialiased bg-slate-50/50 pb-20">
      
      {/* 1. HERO CAROUSEL SECTION */}
      <div className="relative h-[580px] sm:h-[640px] md:h-[700px] w-full overflow-hidden bg-slate-950 mt-[-76px]">
        
        {/* Carousel Background Slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-900/60 z-10" />
            <img 
              src={carouselSlides[currentSlide].bg} 
              alt={carouselSlides[currentSlide].title} 
              className="w-full h-full object-cover select-none"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>

        {/* Carousel Slide Texts */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-wider text-indigo-200 backdrop-blur-md mb-6 animate-pulse">
            <Compass className="w-3.5 h-3.5 text-indigo-300" /> {t.home.carouselTag}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-5 leading-[1.1] font-display min-h-[140px] sm:min-h-[120px] md:min-h-[140px]">
            {carouselSlides[currentSlide].title}
          </h1>
          <p className="text-slate-200/90 text-sm sm:text-base max-w-xl mb-8 leading-relaxed font-normal">
            {carouselSlides[currentSlide].subtitle}
          </p>
          <button 
            onClick={() => handleCarouselAction(carouselSlides[currentSlide].action)}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-sm tracking-wide rounded-2xl shadow-xl transition-all hover:scale-103 cursor-pointer inline-flex items-center gap-2 group border border-indigo-400/40 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <span>{carouselSlides[currentSlide].cta}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Manual Navigation Controls */}
        <button 
          onClick={handlePrevSlide}
          className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/20 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md cursor-pointer transition-all border border-white/10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={handleNextSlide}
          className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/20 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md cursor-pointer transition-all border border-white/10"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-10 left-0 right-0 z-30 flex justify-center gap-2">
          {carouselSlides.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-indigo-500' : 'w-2 bg-white/40 hover:bg-white/60'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 2. ADVANCED SEARCH FORM COMPONENT */}
      <div className="max-w-6xl mx-auto px-6 relative z-30 -mt-16 sm:-mt-20">
        <form 
          onSubmit={handleSearchSubmit}
          className="bg-white p-5 rounded-3xl shadow-xl border border-slate-100 flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Search Destination city Input */}
            <div className="flex flex-col relative" ref={destRef}>
              <label id="dest-label" className="text-[10px] font-black text-indigo-950 uppercase tracking-wider mb-2 flex items-center gap-1.5 p-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" /> {t.home.destinationCity}
              </label>
              <div className="flex items-center border border-slate-200/80 rounded-xl px-3 py-2 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white transition-all">
                <input 
                  type="text" 
                  aria-labelledby="dest-label"
                  placeholder={t.home.whereTo} 
                  value={destQuery} 
                  onChange={(e) => {
                    setDestQuery(e.target.value);
                    setShowDestDropdown(true);
                  }}
                  onFocus={() => setShowDestDropdown(true)}
                  className="bg-transparent text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden w-full"
                />
                <ChevronDown className="w-4 h-4 text-slate-400 cursor-pointer" onClick={() => setShowDestDropdown(!showDestDropdown)} />
              </div>

              {/* Autocomplete Dropdown List */}
              {showDestDropdown && (
                <div className="absolute top-[68px] left-0 right-0 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2.5 z-40 animate-fade-in-down">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block px-2.5 mb-1.5">{t.home.matchingCities}</span>
                  {filteredCities.length === 0 ? (
                    <div className="text-slate-400 text-xs p-2 text-center">No cities found</div>
                  ) : (
                    filteredCities.map(city => (
                      <button 
                        type="button"
                        key={city}
                        onClick={() => {
                          setDestQuery(city);
                          setShowDestDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2.5 text-xs text-left font-semibold text-slate-705 hover:bg-slate-50 rounded-xl cursor-pointer hover:text-indigo-600 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{city}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Check-In Datepicker */}
            <div className="flex flex-col">
              <label id="check-in-label" className="text-[10px] font-black text-indigo-950 uppercase tracking-wider mb-2 flex items-center gap-1.5 p-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> {t.home.checkInDate}
              </label>
              <div className="flex items-center border border-slate-200/80 rounded-xl px-3 py-2 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white transition-all">
                <input 
                  type="date" 
                  aria-labelledby="check-in-label"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-805 cursor-pointer focus:outline-hidden w-full"
                />
              </div>
            </div>

            {/* Duration select */}
            <div className="flex flex-col">
              <label id="duration-label" className="text-[10px] font-black text-indigo-950 uppercase tracking-wider mb-2 flex items-center gap-1.5 p-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> {t.home.durationNights}
              </label>
              <div className="flex items-center border border-slate-200/80 rounded-xl px-3 py-2 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white transition-all">
                <select 
                  aria-labelledby="duration-label"
                  value={duration} 
                  onChange={(e) => setDuration(Number(e.target.value))} 
                  className="bg-transparent text-xs font-bold text-slate-805 cursor-pointer focus:outline-hidden w-full"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? (language === 'en' ? 'Night' : 'Malam') : (language === 'en' ? 'Nights' : 'Malam')}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Guest Selector Counter Panel */}
            <div className="flex flex-col relative" ref={guestRef}>
              <label id="guests-label" className="text-[10px] font-black text-indigo-950 uppercase tracking-wider mb-2 flex items-center gap-1.5 p-1">
                <Users className="w-3.5 h-3.5 text-indigo-600" /> {t.home.guestCount}
              </label>
              <div 
                onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                className="flex items-center justify-between border border-slate-200/80 rounded-xl px-3 py-2 bg-slate-50 hover:border-indigo-300 transition-all cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-800">
                  {adults + children} {language === 'en' ? 'Guests' : 'Tamu'} ({adults} A, {children} C)
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>

              {/* Guest Increments Panel Dropdown */}
              {showGuestDropdown && (
                <div className="absolute top-[68px] left-0 right-0 bg-white border border-slate-100 shadow-2xl rounded-2xl p-4.5 z-40 flex flex-col gap-3.5 animate-fade-in-down text-slate-800">
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t.home.configureOccupants}</h4>
                  </div>
                  
                  {/* Adults Counter */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{t.home.adults}</div>
                      <div className="text-[9.5px] text-slate-450">{t.home.adultsAge}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={() => setAdults(prev => Math.max(1, prev - 1))}
                        className="w-7 h-7 rounded-lg border border-slate-250 flex items-center justify-center hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black min-w-[14px] text-center">{adults}</span>
                      <button 
                        type="button"
                        onClick={() => setAdults(prev => Math.min(10, prev + 1))}
                        className="w-7 h-7 rounded-lg border border-slate-250 flex items-center justify-center hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Children Counter */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{t.home.children}</div>
                      <div className="text-[9.5px] text-slate-450">{t.home.childrenAge}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={() => setChildren(prev => Math.max(0, prev - 1))}
                        className="w-7 h-7 rounded-lg border border-slate-250 flex items-center justify-center hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black min-w-[14px] text-center">{children}</span>
                      <button 
                        type="button"
                        onClick={() => setChildren(prev => Math.min(10, prev + 1))}
                        className="w-7 h-7 rounded-lg border border-slate-250 flex items-center justify-center hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-1 text-right">
                    <button 
                      type="button" 
                      onClick={() => setShowGuestDropdown(false)}
                      className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg uppercase tracking-wider hover:bg-indigo-100 cursor-pointer transition-colors"
                    >
                      {t.common.confirm}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100/60">
            <button 
              type="submit"
              className="px-8 py-3 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md font-bold text-xs"
            >
              <SearchIcon className="w-4 h-4" />
              <span>{t.home.searchProperties}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16" id="property-grid-anchor">
        
        {/* 3. SERVER-SIDE PROPERTY LIST SECTION */}
        <div className="flex flex-col gap-3 mb-8">
          <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{t.home.premiumPortfolios}</span>
          <h2 className="text-3xl font-black text-slate-900 font-display">{t.home.discoverAccommodations}</h2>
          <p className="text-slate-500 text-sm max-w-xl">
            {t.home.discoverDesc}
          </p>
        </div>

        {/* Filter Management Console */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs mb-8 flex flex-wrap gap-5 items-center justify-between">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            
            {/* Search Property keyword input */}
            <div className="flex flex-col w-full md:w-auto md:min-w-[180px] lg:min-w-[240px]">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                {language === 'en' ? 'Search Property' : 'Cari Properti'}
              </span>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 w-4 h-4 text-slate-400 pointer-events-none -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder={language === 'en' ? 'Search property, city, or category...' : 'Cari properti, kota, destinasi atau kategori...'}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl shadow-sm pl-9 pr-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* City select dropdown */}
            <div className="flex flex-col min-w-[140px]">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t.home.cityLabel}</span>
              <select 
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-indigo-400 cursor-pointer"
              >
                <option value="all">{t.home.allCities}</option>
                {popularCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Category select dropdown */}
            <div className="flex flex-col min-w-[155px]">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t.home.categoryLabel}</span>
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-705 focus:outline-hidden focus:border-indigo-400 cursor-pointer"
              >
                <option value="all">{t.home.allCategories}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Price slider */}
            <div className="flex flex-col min-w-[180px]">
              <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                <span>{t.home.maxPriceLimit}</span>
                <span className="text-indigo-600 font-mono text-xs font-bold">{formatCurrencyIDR(maxPriceFilter)}</span>
              </div>
              <input 
                type="range" 
                min={dbMinPrice}
                max={dbMaxPrice}
                step={Math.max(50000, Math.floor((dbMaxPrice - dbMinPrice) / 100))}
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                className="w-full accent-indigo-650 h-1 bg-slate-100 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Sort selection */}
          <div className="flex flex-col min-w-[150px]">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t.home.sortOutput}</span>
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-indigo-400 cursor-pointer"
            >
              <option value="price_asc">{t.home.lowestPriceFirst}</option>
              <option value="price_desc">{t.home.highestPriceFirst}</option>
              <option value="name_asc">{t.home.nameAZ}</option>
              <option value="name_desc">{t.home.nameZA}</option>
            </select>
          </div>
        </div>

        {/* Dynamic Results Counter */}
        {!loading && (
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6 px-1">
            <span className="text-sm font-bold text-slate-800">
              {language === 'en' ? `${totalCount} Properties Found` : `${totalCount} Properti Ditemukan`}
            </span>
          </div>
        )}

        {/* Paginated Property Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-indigo-950">
            <Clock className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.common.loading}</span>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center p-8 shadow-sm">
            <SearchIcon className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {language === 'en' ? 'No matching properties found' : 'Tidak ditemukan properti yang sesuai'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {language === 'en' ? 'Try changing your keyword or search filters' : 'Coba ubah kata kunci atau filter pencarian'}
            </p>
            <button 
              onClick={handleResetFilters} 
              className="bg-indigo-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
            >
              {language === 'en' ? 'Reset Filters' : 'Reset Filter'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map(p => (
              <div 
                key={p.id} 
                onClick={() => onNavigate(`/property/${p.slug || p.id}`)}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-100/70 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Image Showcase */}
                <div className="relative aspect-video overflow-hidden bg-slate-50">
                  <img 
                    src={(p.imageUrls && p.imageUrls.length > 0) ? p.imageUrls[0] : 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'} 
                    alt={p.name} 
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-4 left-4 bg-slate-900/90 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl backdrop-blur-xs shadow-md">
                    {p.category?.name || (p.categoryId === 'cat-luxury' ? (language === 'en' ? 'Villa' : 'Villa') : (language === 'en' ? 'Apartment' : 'Apartemen'))}
                  </span>
                  
                  {/* Status Indicator */}
                  <span className="absolute top-4 right-14 bg-emerald-500/90 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg backdrop-blur-xs shadow-md">
                    {t.common.available}
                  </span>

                  {/* Heart button */}
                  <button
                    type="button"
                    title={isFavorited(p.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                    aria-label={isFavorited(p.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(p);
                    }}
                    className={`absolute top-3.5 right-4.5 p-2 rounded-full backdrop-blur-md transition-all duration-300 cursor-pointer shadow-md flex items-center justify-center hover:scale-110 active:scale-95 z-20 ${
                      isFavorited(p.id)
                        ? 'bg-rose-50 border border-rose-100 text-rose-500'
                        : 'bg-white/80 border border-white/60 text-slate-700 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    <Heart 
                      className={`w-4.5 h-4.5 transition-transform duration-300 ${
                        isFavorited(p.id) 
                          ? 'fill-current scale-110' 
                          : 'scale-100'
                      }`} 
                    />
                  </button>
                </div>

                {/* Body Details */}
                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-420 font-semibold mb-2 flex-wrap">
                      <span className="tracking-wide uppercase text-indigo-950/80 font-black">{p.location}</span>
                      
                      {/* Rating display */}
                      {!p.reviewCount || p.reviewCount === 0 ? (
                        <span className="text-slate-400 font-semibold italic text-[11px] normal-case">
                          {language === 'en' ? 'No reviews yet' : 'Belum ada ulasan'}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-500 font-bold leading-none">
                          <Star className="w-3.5 h-3.5 fill-current shrink-0" />
                          <span className="text-slate-800">
                            {parseFloat(p.rating.toString()).toFixed(1)}
                          </span>
                          <span className="text-slate-400 font-medium font-sans">
                            ({p.reviewCount} {language === 'en' ? 'reviews' : 'ulasan'})
                          </span>
                        </div>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-indigo-600 transition-colors font-display line-clamp-1 leading-snug">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-450 line-clamp-2 mb-5 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  {/* Cash Rate line */}
                  <div className="border-t border-slate-50 pt-5 flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{t.home.lowestRoomNightly}</span>
                      <div className="text-xl font-black text-indigo-950 font-display">
                        {formatCurrencyIDR(p.basePrice)} <span className="text-xs font-normal text-slate-400 font-sans">/ {t.common.night}</span>
                      </div>
                    </div>
                    <button className="h-9 px-4 bg-slate-50 hover:bg-indigo-50 border border-slate-100 text-indigo-650 hover:text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1.5 group-hover:translate-x-1 transition-all">
                      {t.common.details} <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12 mb-16">
            <button 
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-655 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
              {t.home.pageCount.replace('{page}', String(page)).replace('{total}', String(totalPages))}
            </span>
            <button 
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-655 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 4. DYNAMIC PRICE COMPARISON HIGHLIGHT SECTION */}
        <div 
          className="bg-indigo-950 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden mb-16 mt-20"
          id="pricing-highlight-anchor"
        >
          {/* Subtle decoration vector lines */}
          <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none scale-125">
            <Compass className="w-96 h-96" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
            <div className="lg:col-span-5 flex flex-col justify-center gap-4">
              <span className="text-[10px] uppercase tracking-widest font-black text-indigo-300 block">{t.home.compareDatesTitle}</span>
              <h2 className="text-2xl sm:text-3xl font-black font-display leading-tight">{t.home.compareDatesTitle}</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                {t.home.compareDatesDesc}
              </p>

              {/* Property Select Dropdown */}
              {properties.length > 0 && (
                <div className="flex flex-col gap-2 max-w-sm">
                  <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">{t.home.selectSampleProperty}</span>
                  <div className="relative">
                    <select
                      value={selectedCompareProp?.id || ''}
                      onChange={(e) => {
                        const match = properties.find(p => p.id === e.target.value);
                        if (match) setSelectedCompareProp(match);
                      }}
                      className="bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-400 w-full cursor-pointer"
                    >
                      {properties.map(p => (
                        <option key={p.id} value={p.id} className="text-slate-800">{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Price Preview Cards */}
            <div className="lg:col-span-7 flex flex-col justify-center gap-4">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                <span>{t.home.selectedAssetLedger}</span>
                <span className="text-emerald-400 font-bold">{selectedCompareProp?.name || 'Beverly Hills Estate'}</span>
              </div>
              
              {/* Timeline Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {getDynamicRates(selectedCompareProp?.basePrice || 350).map((dr, idx) => (
                  <div 
                    key={dr.date}
                    className={`p-4 rounded-2xl flex flex-col justify-between text-center border relative transition-all duration-300 ${
                      dr.isPromo 
                        ? 'bg-emerald-900/40 border-emerald-500/50 hover:bg-emerald-900/50' 
                        : dr.isPeak 
                          ? 'bg-indigo-900/40 border-indigo-500/40 hover:bg-indigo-900/50' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <span className="text-[11px] font-bold text-slate-350 block uppercase tracking-wider mb-1">{dr.date}</span>
                      <div className="text-sm font-black font-display text-white mb-2 leading-none">
                        {formatCurrencyIDR(dr.rate)}
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                        dr.isPromo 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : dr.isPeak 
                            ? 'bg-amber-500/20 text-amber-300' 
                            : 'bg-white/10 text-slate-300'
                      }`}>
                        {dr.isPromo ? t.home.bestValue : dr.isPeak ? t.home.weekend : t.home.base}
                      </span>
                      <p className="text-[9px] text-slate-400 leading-tight mt-1 px-1">{dr.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 flex items-start gap-2 max-w-md">
                <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {t.home.dynamicEngineNote}
                </p>
              </div>

            </div>

          </div>
        </div>

        {/* 5. WHY CHOOSE STAYEASE SECTION */}
        <div className="flex flex-col gap-3 mb-10 text-center items-center mt-20">
          <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{t.home.whyChooseSubtitle}</span>
          <h2 className="text-3xl font-black text-slate-900 font-display">{t.home.whyChooseTitle}</h2>
          <p className="text-slate-500 text-sm max-w-xl">
            {t.home.whyChooseDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Dynamic Pricing */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 mb-4 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 animate-bounce-slow" />
            </div>
            <h3 className="font-black text-slate-950 text-sm uppercase tracking-wide mb-2">{t.home.feature1Title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              {t.home.feature1Desc}
            </p>
          </div>

          {/* Card 2: Real-time Availability */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-4 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-950 text-sm uppercase tracking-wide mb-2">{t.home.feature2Title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              {t.home.feature2Desc}
            </p>
          </div>

          {/* Card 3: Verified Stays */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 mb-4 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-950 text-sm uppercase tracking-wide mb-2">{t.home.feature3Title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              {t.home.feature3Desc}
            </p>
          </div>

          {/* Card 4: Secure Escrows */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 mb-4 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-950 text-sm uppercase tracking-wide mb-2">{t.home.feature4Title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              {t.home.feature4Desc}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
