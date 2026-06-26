import React, { useState, useEffect } from 'react';
import { Property } from '../../../types';
import { Star, SlidersHorizontal, ArrowUpDown, X, Loader2, SearchX, Calendar, Moon, Users, Search as SearchIcon, Heart, Sparkles } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import { usePropertyFilterOptions } from '../../../hooks/usePropertyFilterOptions';
import { useWishlist } from '../../../shared/context/WishlistContext';
import { useDocumentMetadata } from '../../../hooks/useDocumentMetadata';

interface SearchProps {
  initialLocation?: string;
  initialQuery?: string;
  initialCategory?: string;
  initialCheckIn?: string;
  initialDuration?: number | string;
  initialGuests?: number | string;
  onNavigate: (path: string, params?: any) => void;
}

export default function Search({ 
  initialLocation = 'All', 
  initialQuery = '', 
  initialCategory = '', 
  initialCheckIn = '', 
  initialDuration = '', 
  initialGuests = '', 
  onNavigate 
}: SearchProps) {
  const { language, formatCurrencyIDR } = useLanguage();
  useDocumentMetadata({
    title: language === 'en' ? 'Explore Properties' : 'Cari Akomodasi',
    description: language === 'en'
      ? 'Browse and book premium hotels, villas, apartments, and luxury guest houses at StayEase with dynamic pricing and instant confirmation.'
      : 'Cari dan pesan hotel, vila, apartemen, dan guest house mewah premium di StayEase dengan harga dinamis dan konfirmasi instan.'
  });
  const { isFavorited, toggleFavorite } = useWishlist();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Parse initial values from URL on mount first, with prop fallbacks
  const urlParams = new URL(window.location.href).searchParams;
  
  const [search, setSearch] = useState(() => urlParams.get('search') || initialQuery);
  const [location, setLocation] = useState(() => {
    const uCity = urlParams.get('city');
    if (uCity) return uCity;
    return !initialLocation ? 'All' : initialLocation;
  });
  const [category, setCategory] = useState(() => urlParams.get('category') || initialCategory);
  const [sortBy, setSortBy] = useState(() => urlParams.get('sort') || 'price_asc');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(() => {
    const uAmen = urlParams.get('amenities');
    return uAmen ? uAmen.split(',') : [];
  });
  
  const [checkIn, setCheckIn] = useState(() => urlParams.get('checkIn') || initialCheckIn);
  const [duration, setDuration] = useState(() => urlParams.get('duration') || String(initialDuration || ''));
  const [guests, setGuests] = useState(() => urlParams.get('guests') || String(initialGuests || ''));
  
  // Price boundaries from database
  const [dbMinPrice, setDbMinPrice] = useState(50000);
  const [dbMaxPrice, setDbMaxPrice] = useState(5000000);
  const [maxPrice, setMaxPrice] = useState<string>(() => urlParams.get('maxPrice') || '');

  const { cities, categories, amenities: amenitiesOptions, loading: filtersLoading, minPrice, maxPrice: hookMaxPrice } = usePropertyFilterOptions();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(() => {
    const p = urlParams.get('page');
    return p ? Number(p) : 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Debounced states for text query and maximum price bounds
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(maxPrice);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMaxPrice(maxPrice);
    }, 400);
    return () => clearTimeout(handler);
  }, [maxPrice]);

  // Fetch filters and boundaries from hook updates
  useEffect(() => {
    if (minPrice !== undefined && hookMaxPrice !== undefined) {
      let minVal = minPrice !== undefined ? minPrice : 50000;
      let maxVal = hookMaxPrice !== undefined ? hookMaxPrice : 5000000;
      
      if (minVal < 50000) minVal = minVal * 1000;
      if (maxVal < 50000) maxVal = maxVal * 1000;

      setDbMinPrice(minVal);
      setDbMaxPrice(maxVal);

      const currentUrlParams = new URL(window.location.href).searchParams;
      if (!currentUrlParams.get('maxPrice')) {
        setMaxPrice(String(maxVal));
      }
    }
  }, [minPrice, hookMaxPrice]);

  // When filters or sorting change, always reset search to first page
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, location, category, debouncedMaxPrice, sortBy, selectedAmenities, checkIn, duration, guests]);

  // Update browser URL query search parameters to ensure sharing/reliability works instantly
  useEffect(() => {
    const queryParts: string[] = [];
    if (search.trim()) queryParts.push(`search=${encodeURIComponent(search.trim())}`);
    if (location !== 'All') queryParts.push(`city=${encodeURIComponent(location)}`);
    if (category) queryParts.push(`category=${category}`);
    if (maxPrice && Number(maxPrice) !== dbMaxPrice) queryParts.push(`maxPrice=${maxPrice}`);
    if (sortBy) queryParts.push(`sort=${sortBy}`);
    if (selectedAmenities.length > 0) queryParts.push(`amenities=${selectedAmenities.join(',')}`);
    if (checkIn) queryParts.push(`checkIn=${checkIn}`);
    if (duration) queryParts.push(`duration=${duration}`);
    if (guests) queryParts.push(`guests=${guests}`);
    if (currentPage > 1) queryParts.push(`page=${currentPage}`);

    const newSearch = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const newUrl = `${window.location.pathname}${newSearch}`;
    if (window.location.search !== newSearch) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [search, location, category, maxPrice, sortBy, selectedAmenities, checkIn, duration, guests, currentPage, dbMaxPrice]);

  // Fetch active properties matching full database-driven parameters
  useEffect(() => {
    setLoading(true);
    const queryParts: string[] = [];
    
    const activeSearch = debouncedSearch.trim();
    const activeCity = location !== 'All' ? location : '';
    
    if (activeSearch) {
      queryParts.push(`search=${encodeURIComponent(activeSearch)}`);
    }
    
    if (activeCity) {
      queryParts.push(`city=${encodeURIComponent(activeCity)}`);
    }
    
    if (category) queryParts.push(`category=${category}`);
    if (debouncedMaxPrice) queryParts.push(`maxPrice=${debouncedMaxPrice}`);
    if (sortBy) queryParts.push(`sort=${sortBy}`);
    if (selectedAmenities.length > 0) queryParts.push(`amenities=${selectedAmenities.join(',')}`);
    if (checkIn) queryParts.push(`checkIn=${checkIn}`);
    if (duration) queryParts.push(`duration=${duration}`);
    if (guests) queryParts.push(`guests=${guests}`);

    queryParts.push(`limit=6`);
    queryParts.push(`page=${currentPage}`);

    fetch(`/api/properties?${queryParts.join('&')}`)
      .then(res => res.json())
      .then(data => {
        setProperties(data.data || []);
        const total = data.total || 0;
        setTotalItems(total);
        setTotalPages(Math.ceil(total / 6) || 1);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [debouncedSearch, location, category, debouncedMaxPrice, sortBy, selectedAmenities, checkIn, duration, guests, currentPage]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleReset = () => {
    setSearch('');
    setLocation('All');
    setCategory('');
    setMaxPrice(String(dbMaxPrice));
    setSortBy('price_asc');
    setSelectedAmenities([]);
    setCheckIn('');
    setDuration('');
    setGuests('');
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-indigo-950 font-display">StayEase Luxury Collection</h1>
          <p className="text-sm text-slate-500">Discover premium stays matching your specific executive lifestyle standards</p>
        </div>
        <button onClick={handleReset} className="text-xs text-indigo-600 hover:text-indigo-805 font-bold cursor-pointer flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-150 transition-all">
          <X className="w-3 h-3" /> {language === 'en' ? 'Reset Filter Matrix' : 'Atur Ulang Filter'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col gap-6 h-fit shadow-xs">
          
          {/* Keyword Search */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 api-form-label uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <SearchIcon className="w-3.5 h-3.5" /> {language === 'en' ? 'Search Keyword' : 'Kata Kunci'}
            </h3>
            <input 
              type="text" 
              placeholder={language === 'en' ? 'Search property, city, or category...' : 'Cari properti, kota, destinasi atau kategori...'}
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-400 transition-all focus:ring-1 focus:ring-primary focus:border-primary shadow-xs"
            />
          </div>

          {/* Destination */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" /> {language === 'en' ? 'Destination Filters' : 'Filter Destinasi'}
            </h3>
            <select value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-400 transition-all cursor-pointer">
              <option value="All">{language === 'en' ? 'All Destinations' : 'Semua Destinasi'}</option>
              {filtersLoading ? (
                <option value="" disabled>{language === 'en' ? 'Loading destinations...' : 'Memuat destinasi...'}</option>
              ) : cities.length === 0 ? (
                <option value="" disabled>{language === 'en' ? 'No destinations available' : 'Tidak ada destinasi tersedia'}</option>
              ) : (
                cities.map(ct => (
                  <option key={ct} value={ct}>{ct}</option>
                ))
              )}
            </select>
          </div>

          {/* Check-In Date */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {language === 'en' ? 'Check-In Date' : 'Tanggal Check-In'}
            </h3>
            <input 
              type="date" 
              value={checkIn} 
              onChange={e => setCheckIn(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-400 transition-all cursor-pointer"
            />
          </div>

          {/* Duration in Nights */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-slate-400" /> {language === 'en' ? 'Duration (Nights)' : 'Durasi (Malam)'}
            </h3>
            <input 
              type="number" 
              min="1" 
              placeholder={language === 'en' ? 'e.g. 2' : 'misal 2'}
              value={duration} 
              onChange={e => setDuration(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-400 transition-all"
            />
          </div>

          {/* Guest Count Constraint */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" /> {language === 'en' ? 'Guest Count' : 'Jumlah Tamu'}
            </h3>
            <input 
              type="number" 
              min="1" 
              placeholder={language === 'en' ? 'e.g. 2' : 'misal 2'}
              value={guests} 
              onChange={e => setGuests(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-400 transition-all"
            />
          </div>

          {/* Category List */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              {language === 'en' ? 'Category' : 'Kategori'}
            </h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-indigo-900 transition-colors">
                <input type="radio" name="category" checked={category === ''} onChange={() => setCategory('')} className="accent-indigo-900 cursor-pointer" />
                {language === 'en' ? 'All Types' : 'Semua Tipe'}
              </label>
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-indigo-900 transition-colors">
                  <input type="radio" name="category" checked={category === cat.id || category === cat.slug} onChange={() => setCategory(cat.id)} className="accent-indigo-900 cursor-pointer" />
                  {cat.name}
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              {language === 'en' ? 'Max Price' : 'Harga Maksimal'}
            </h3>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {language === 'en' ? 'Max Price:' : 'Harga Maksimal:'}
              </span>
              <span className="text-sm font-black text-indigo-950 font-display">
                {formatCurrencyIDR(Number(maxPrice || dbMaxPrice))}
              </span>
              <input 
                type="range" 
                min={dbMinPrice} 
                max={dbMaxPrice} 
                step={Math.max(50000, Math.floor((dbMaxPrice - dbMinPrice) / 100))}
                value={maxPrice || dbMaxPrice} 
                onChange={e => setMaxPrice(e.target.value)}
                className="w-full accent-indigo-900 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none mt-1"
              />
            </div>
          </div>

          {/* Facilities / Amenities */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {language === 'en' ? 'Amenities' : 'Fasilitas'}
            </h3>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 font-sans">
              {(amenitiesOptions.length > 0 ? amenitiesOptions : ['Private Pool', 'Air Conditioning', 'Free WiFi', 'Gym & Wellness Studio', 'Ocean View', 'Climate-Controlled Wine Cellar']).map(am => (
                <label key={am} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-indigo-900 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={selectedAmenities.includes(am)} 
                    onChange={() => toggleAmenity(am)}
                    className="rounded-sm border-slate-300 accent-indigo-900 cursor-pointer text-indigo-950"
                  />
                  {am}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Listings Display */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-sm font-bold text-slate-800">
              {language === 'en' ? `${totalItems} Properties Found` : `${totalItems} Properti Ditemukan`}
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> {language === 'en' ? 'Sort:' : 'Urutkan:'}
              </span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-transparent font-bold text-slate-700 cursor-pointer focus:outline-hidden">
                <option value="price_asc">{language === 'en' ? 'Price: Low to High' : 'Harga Terendah'}</option>
                <option value="price_desc">{language === 'en' ? 'Price: High to Low' : 'Harga Tertinggi'}</option>
                <option value="rating_desc">{language === 'en' ? 'Highest Rating' : 'Rating Tertinggi'}</option>
                <option value="reviews_desc">{language === 'en' ? 'Most Reviews' : 'Ulasan Terbanyak'}</option>
                <option value="created_desc">{language === 'en' ? 'Newest' : 'Terbaru'}</option>
                <option value="name_asc">{language === 'en' ? 'Alphabetical: A to Z' : 'Nama A-Z'}</option>
                <option value="name_desc">{language === 'en' ? 'Alphabetical: Z to A' : 'Nama Z-A'}</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-indigo-900">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <span className="text-sm font-semibold text-slate-500">{language === 'en' ? 'Querying platform assets...' : 'Mencari aset StayEase...'}</span>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center p-8 shadow-sm">
              <SearchIcon className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-base font-bold text-slate-800 mb-1">
                {language === 'en' ? 'No matching properties found' : 'Tidak ditemukan properti yang sesuai'}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {language === 'en' ? 'Try changing your keyword or search filters' : 'Coba ubah kata kunci atau filter pencarian'}
              </p>
              <button 
                onClick={handleReset} 
                className="bg-indigo-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
              >
                {language === 'en' ? 'Reset Filters' : 'Reset Filter'}
              </button>
            </div>
          ) : (
            <>
              {/* Product cards list: 6 cards per page layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {properties.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => onNavigate(`/property/${p.slug || p.id}`)}
                    className="group bg-white rounded-xl border border-slate-100 hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full"
                  >
                    <div className="relative h-48 bg-slate-100">
                      <img 
                        src={(p.imageUrls && p.imageUrls.length > 0) ? p.imageUrls[0] : 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'} 
                        alt={p.name} 
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-3 left-3 bg-slate-900/90 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md backdrop-blur-xs">
                        {p.category?.name || 'Stay'}
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
                        className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-md transition-all duration-300 cursor-pointer shadow-md flex items-center justify-center hover:scale-110 active:scale-95 z-20 ${
                          isFavorited(p.id)
                            ? 'bg-rose-50 border border-rose-100 text-rose-500'
                            : 'bg-white/80 border border-white/60 text-slate-700 hover:bg-white hover:text-slate-900'
                        }`}
                      >
                        <Heart 
                          className={`w-4 h-4 transition-transform duration-300 ${
                            isFavorited(p.id) 
                              ? 'fill-current scale-110' 
                              : 'scale-100'
                          }`} 
                        />
                      </button>
                    </div>
                    <div className="p-4 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1 flex-wrap">
                          <span>{p.location}</span>
                          {!p.reviewCount || p.reviewCount === 0 ? (
                            <span className="text-slate-400/80 font-semibold italic text-[11px] normal-case">
                              {language === 'en' ? 'No reviews yet' : 'Belum ada ulasan'}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1 text-amber-500 font-bold leading-none select-none">
                              <Star className="w-3.5 h-3.5 fill-current shrink-0 text-amber-500" />
                              <span className="text-slate-800 font-mono">
                                {parseFloat(p.rating.toString()).toFixed(1)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                ({p.reviewCount} {language === 'en' ? 'reviews' : 'ulasan'})
                              </span>
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-800 text-base mb-1 font-display group-hover:text-indigo-600 transition-colors line-clamp-1">{p.name}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">{p.description}</p>
                      </div>
                      <div className="border-t border-slate-50 pt-3">
                        {p.peakMultiplier > 1 && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="bg-amber-100 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                              <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500 animate-pulse" />
                              {language === 'en' ? 'Holiday Season' : 'Musim Liburan'}
                            </span>
                            {p.peakSeasonName && (
                              <span className="text-[9px] text-amber-600 font-semibold truncate max-w-[120px]">
                                {p.peakSeasonName}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-black text-indigo-950 font-display">
                            {p.peakMultiplier > 1 && p.originalBasePrice && (
                              <span className="text-[10px] text-slate-305 text-slate-400 line-through font-normal mr-1.5 block leading-none mb-0.5">
                                {formatCurrencyIDR(p.originalBasePrice)}
                              </span>
                            )}
                            <span className="text-sm font-black text-indigo-950">{formatCurrencyIDR(p.basePrice)}</span>
                            <span className="text-[10px] font-normal text-slate-400"> / {language === 'en' ? 'night' : 'malam'}</span>
                          </div>
                          <button className="bg-indigo-900 hover:bg-indigo-850 text-white text-[10px] uppercase font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs">
                            {language === 'en' ? 'Book Stay' : 'Pesan Hunian'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Next/Previous Pagination row */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-4 border-dashed">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                    currentPage === 1
                      ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-indigo-900 border-indigo-150 hover:bg-indigo-50 cursor-pointer shadow-2xs'
                  }`}
                >
                  {language === 'en' ? 'Previous' : 'Sebelumnya'}
                </button>
                
                <span className="text-xs font-semibold text-slate-500">
                  {language === 'en' 
                    ? `Page ${currentPage} of ${totalPages}` 
                    : `Halaman ${currentPage} dari ${totalPages}`}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                    currentPage === totalPages
                      ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-indigo-900 border-indigo-150 hover:bg-indigo-50 cursor-pointer shadow-2xs'
                  }`}
                >
                  {language === 'en' ? 'Next' : 'Selanjutnya'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
