import React, { useState, useEffect, useMemo } from 'react';
import { Star, MessageSquareQuote, Send, Loader2, Calendar, Filter, RotateCcw, Building, MessageSquare, Search, X } from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';

export default function TenantReviews() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});
  const [editingReplyText, setEditingReplyText] = useState<{ [id: string]: string }>({});
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter States
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all'); // 'all', '5', '4', '3', '2', '1'
  const [selectedReplyStatus, setSelectedReplyStatus] = useState<string>('all'); // 'all', 'replied', 'unreplied'
  const [dateFilterType, setDateFilterType] = useState<string>('all'); // 'all', 'today', '7days', '30days', 'custom'
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');

  // Search debounce handler
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchReviews = () => {
    if (!token) return;
    setLoading(true);
    fetch('/api/reviews/host?limit=1000', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setReviews(data.reviews || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchProperties = () => {
    if (!token) return;
    fetch('/api/properties?byTenant=true', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(payload => {
        setProperties(payload.data || []);
      })
      .catch(err => {
        console.error('Error fetching properties for filter:', err);
      });
  };

  useEffect(() => {
    if (token) {
      fetchReviews();
      fetchProperties();
    }
  }, [token]);

  const handleSendReply = async (id: string, isUpdate = false) => {
    const comment = isUpdate ? editingReplyText[id]?.trim() : replyText[id]?.trim();
    if (!comment) return;

    try {
      setErrorMsg(null);
      const url = `/api/reviews/${id}/reply`;
      const method = isUpdate ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ replyComment: comment })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reply to review');
      }

      if (isUpdate) {
        setEditingReplyText(p => ({ ...p, [id]: '' }));
        setEditingReviewId(null);
      } else {
        setReplyText(p => ({ ...p, [id]: '' }));
      }
      fetchReviews();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteReply = async (id: string) => {
    try {
      setErrorMsg(null);
      const res = await fetch(`/api/reviews/${id}/reply`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete reply');
      }

      fetchReviews();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleResetFilters = () => {
    setSelectedPropertyId('all');
    setSelectedRating('all');
    setSelectedReplyStatus('all');
    setDateFilterType('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSearchQuery('');
    setDebouncedSearchQuery('');
  };

  // 1. Filter by Property ID (Used to calculate Aggregate Statistics & Sentiment distribution dynamically)
  const propertyFilteredReviews = useMemo(() => {
    if (selectedPropertyId === 'all') {
      return reviews;
    }
    return reviews.filter(r => r.propertyId === selectedPropertyId);
  }, [reviews, selectedPropertyId]);

  // Derived metrics from propertyFilteredReviews
  const totalPropertyReviews = propertyFilteredReviews.length;
  const averageRating = totalPropertyReviews > 0
    ? Number((propertyFilteredReviews.reduce((sum, r) => sum + r.rating, 0) / totalPropertyReviews).toFixed(2))
    : 0.0;

  const fiveStarsCount = useMemo(() => propertyFilteredReviews.filter(r => r.rating === 5).length, [propertyFilteredReviews]);
  const fourStarsCount = useMemo(() => propertyFilteredReviews.filter(r => r.rating === 4).length, [propertyFilteredReviews]);
  const lowStarsCount = useMemo(() => propertyFilteredReviews.filter(r => r.rating <= 3).length, [propertyFilteredReviews]);

  const pct5 = totalPropertyReviews > 0 ? Math.round((fiveStarsCount / totalPropertyReviews) * 100) : 0;
  const pct4 = totalPropertyReviews > 0 ? Math.round((fourStarsCount / totalPropertyReviews) * 100) : 0;
  const pctLow = totalPropertyReviews > 0 ? Math.round((lowStarsCount / totalPropertyReviews) * 100) : 0;

  // 2. Filter Review List top-level (Applies rating, reply status, date range, search query on top of property filtering)
  const finalFilteredReviews = useMemo(() => {
    let list = [...propertyFilteredReviews];

    // Filter by Rating
    if (selectedRating !== 'all') {
      const ratingVal = Number(selectedRating);
      list = list.filter(r => r.rating === ratingVal);
    }

    // Filter by Reply Status
    if (selectedReplyStatus === 'replied') {
      list = list.filter(r => r.replyComment && r.replyComment.trim() !== '');
    } else if (selectedReplyStatus === 'unreplied') {
      list = list.filter(r => !r.replyComment || r.replyComment.trim() === '');
    }

    // Filter by Date
    if (dateFilterType !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      list = list.filter(r => {
        const rDate = new Date(r.createdAt);
        if (dateFilterType === 'today') {
          return rDate >= today;
        } else if (dateFilterType === '7days') {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          return rDate >= sevenDaysAgo;
        } else if (dateFilterType === '30days') {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - 30);
          return rDate >= thirtyDaysAgo;
        } else if (dateFilterType === 'custom') {
          let matches = true;
          if (customStartDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            matches = matches && rDate >= start;
          }
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            matches = matches && rDate <= end;
          }
          return matches;
        }
        return true;
      });
    }

    // Filter by Search Query
    if (debouncedSearchQuery.trim() !== '') {
      const query = debouncedSearchQuery.toLowerCase().trim();
      list = list.filter(r => {
        const guestMatch = (r.guest?.name || r.guestName || '').toLowerCase().includes(query);
        const codeMatch = (r.booking?.bookingCode || '').toLowerCase().includes(query);
        const propMatch = (r.property?.name || '').toLowerCase().includes(query);
        const textMatch = (r.comment || '').toLowerCase().includes(query);
        const replyMatch = (r.replyComment || '').toLowerCase().includes(query);
        return guestMatch || codeMatch || propMatch || textMatch || replyMatch;
      });
    }

    return list;
  }, [propertyFilteredReviews, selectedRating, selectedReplyStatus, dateFilterType, customStartDate, customEndDate, debouncedSearchQuery]);

  const ratingOptions = [
    { value: 'all', label: 'All Ratings' },
    { value: '5', label: '★★★★★ (5 Stars)' },
    { value: '4', label: '★★★★☆ (4 Stars)' },
    { value: '3', label: '★★★☆☆ (3 Stars)' },
    { value: '2', label: '★★☆☆☆ (2 Stars)' },
    { value: '1', label: '★☆☆☆☆ (1 Star)' },
  ];

  const replyStatusOptions = [
    { value: 'all', label: 'All' },
    { value: 'replied', label: 'Already Replied' },
    { value: 'unreplied', label: 'Not Replied' },
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: 'custom', label: 'Custom Range...' },
  ];

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-indigo-950 font-display">Customer Reviews</h2>
          <p className="text-xs text-slate-500">Monitor client experience logs, star aggregates, and leave direct reply remarks</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-650 p-3 rounded-lg text-xs font-bold">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-indigo-900">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center p-8 text-xs text-slate-400 font-bold select-none">
          <MessageSquareQuote className="w-10 h-10 text-indigo-400 mb-2" />
          <span>Belum ada ulasan</span>
        </div>
      ) : (
        <>
          {/* Dynamic Interactive Filter Toolbar */}
          <div id="review-filters-bar" className="sticky top-0 lg:static z-20 bg-slate-50/95 backdrop-blur-md lg:bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-indigo-950 font-display">Filter reviews</h3>
                  <p className="text-[10px] text-slate-400">Search and refine the review log dynamically</p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleResetFilters}
                className="self-start sm:self-auto flex items-center gap-1 text-xs font-bold text-indigo-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3 h-3" />
                Reset All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row lg:flex-wrap items-center gap-3">
              {/* Property Dropdown */}
              <div className="flex flex-col flex-1 min-w-[180px]">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 mb-1 flex items-center gap-1 select-none">
                  <Building className="w-3 h-3" /> Property
                </label>
                <select
                  id="filter-property"
                  value={selectedPropertyId}
                  onChange={e => setSelectedPropertyId(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-600 outline-hidden cursor-pointer shadow-2xs"
                >
                  <option value="all">🏢 All Properties</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Rating Dropdown */}
              <div className="flex flex-col flex-1 min-w-[140px]">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 mb-1 flex items-center gap-1 select-none">
                  <Star className="w-3 h-3 text-amber-500 fill-current" /> Rating
                </label>
                <select
                  id="filter-rating"
                  value={selectedRating}
                  onChange={e => setSelectedRating(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-600 outline-hidden cursor-pointer shadow-2xs"
                >
                  {ratingOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Reply Status Dropdown */}
              <div className="flex flex-col flex-1 min-w-[140px]">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 mb-1 flex items-center gap-1 select-none">
                  <MessageSquare className="w-3 h-3 text-indigo-500" /> Reply Status
                </label>
                <select
                  id="filter-reply-status"
                  value={selectedReplyStatus}
                  onChange={e => setSelectedReplyStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-600 outline-hidden cursor-pointer shadow-2xs"
                >
                  {replyStatusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Date Filter Dropdown */}
              <div className="flex flex-col flex-1 min-w-[140px]">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 mb-1 flex items-center gap-1 select-none">
                  <Calendar className="w-3 h-3 text-emerald-500" /> Date Period
                </label>
                <select
                  id="filter-date-period"
                  value={dateFilterType}
                  onChange={e => setDateFilterType(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-600 outline-hidden cursor-pointer shadow-2xs"
                >
                  {dateRangeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Search Input */}
              <div className="flex flex-col flex-1 min-w-[200px]">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 mb-1 flex items-center gap-1 select-none">
                  <Search className="w-3 h-3 text-slate-450" /> Search
                </label>
                <div className="relative">
                  <input
                    id="filter-search"
                    type="text"
                    placeholder="Guest, code, property..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs font-semibold rounded-xl pl-9 pr-8 p-2.5 focus:ring-2 focus:ring-indigo-600 outline-hidden shadow-2xs"
                  />
                  <Search className="absolute left-3 top-3.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer border-0 bg-transparent"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Date Pickers displayed dynamically if 'custom' date period is active */}
            {dateFilterType === 'custom' && (
              <div className="flex flex-wrap gap-3 items-center bg-white p-3 rounded-xl border border-slate-100 max-w-fit transition-all">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase">From</span>
                  <input
                    id="custom-start-date"
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs font-semibold p-1.5 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-hidden"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase">To</span>
                  <input
                    id="custom-end-date"
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs font-semibold p-1.5 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Rating Metrics card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-center items-center text-center">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Aggregate Rating</span>
              <span className="text-5xl font-black text-indigo-950 font-display my-2">{averageRating.toFixed(1)}</span>
              <div className="flex gap-1 text-amber-500 mb-1">
                {[1, 2, 3, 4, 5].map(x => (
                  <Star 
                    key={x} 
                    className={`w-4 h-4 ${x <= Math.round(averageRating) ? 'fill-current' : 'text-slate-200'}`} 
                  />
                ))}
              </div>
              <span className="text-xs text-slate-400 font-semibold">Based on {totalPropertyReviews} guest reviews</span>
            </div>

            {/* Sentiment card */}
            <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-3 justify-center text-xs text-slate-500">
              <span className="font-bold text-slate-450 uppercase tracking-widest block mb-1">Star Distribution Matrix</span>
              <div className="flex items-center gap-3">
                <span className="w-10 font-bold text-slate-650">5 Stars</span>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct5}%` }}></div>
                </div>
                <span className="w-8 text-right font-semibold">{pct5}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-10 font-bold text-slate-650">4 Stars</span>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct4}%` }}></div>
                </div>
                <span className="w-8 text-right font-semibold">{pct4}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-10 font-bold text-slate-400">1-3 Stars</span>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full" style={{ width: `${pctLow}%` }}></div>
                </div>
                <span className="w-8 text-right font-semibold">{pctLow}%</span>
              </div>
            </div>
          </div>

          {/* Reviews feed */}
          <div className="flex flex-col gap-4">
            {finalFilteredReviews.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center p-8 text-xs text-slate-450 font-bold">
                <MessageSquareQuote className="w-10 h-10 text-indigo-400 mb-3" />
                <span className="mb-4">No reviews match the selected filters.</span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5 text-xs font-black text-indigo-900 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Filters
                </button>
              </div>
            ) : (
              finalFilteredReviews.map((r, idx) => {
                const guestName = r.guest?.name || r.guestName || 'Verified Guest';
                const guestAvatar = r.guest?.avatarUrl || r.guestAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';
                const propertyName = r.property?.name || 'Your Property';
                const dateString = new Date(r.createdAt).toLocaleDateString();
                const bCode = r.booking?.bookingCode;

                return (
                  <div key={r.id || `review-${idx}`} className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex gap-4">
                    <img src={guestAvatar} alt={guestName} className="w-10 h-10 rounded-full bg-slate-50 border object-cover" referrerPolicy="no-referrer" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{guestName}</h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {propertyName} {bCode ? `• Book Code: ${bCode}` : ''} • Received {dateString}
                          </span>
                        </div>
                        <div className="flex text-amber-500">
                          {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold italic">"{r.comment}"</p>

                      {r.replyComment && editingReviewId !== r.id ? (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 mt-1 flex flex-col gap-1 relative group">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-bold text-indigo-950 block">Host Response ({r.replyDate}):</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingReviewId(r.id);
                                  setEditingReplyText(p => ({ ...p, [r.id]: r.replyComment || '' }));
                                }}
                                className="text-[10px] text-indigo-700 hover:text-indigo-950 font-bold hover:underline cursor-pointer border-0 bg-transparent"
                              >
                                Edit
                              </button>
                              <span className="text-slate-300 text-[10px]">|</span>
                              <button
                                onClick={() => handleDeleteReply(r.id)}
                                className="text-[10px] text-red-650 hover:text-red-800 font-bold hover:underline cursor-pointer border-0 bg-transparent"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-550 leading-relaxed italic">"{r.replyComment}"</p>
                        </div>
                      ) : editingReviewId === r.id ? (
                        <div className="flex flex-col gap-2 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-150">
                          <span className="text-[10px] font-bold text-indigo-950">Edit Response</span>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={editingReplyText[r.id] || ''}
                              onChange={e => setEditingReplyText(p => ({ ...p, [r.id]: e.target.value }))}
                              className="bg-white border text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden w-full px-2 py-1.5 rounded-md"
                            />
                            <button onClick={() => handleSendReply(r.id, true)} className="bg-indigo-900 text-white px-3 py-1.5 text-xs font-bold rounded-md hover:bg-indigo-850 cursor-pointer border-0">
                              Save
                            </button>
                            <button onClick={() => setEditingReviewId(null)} className="bg-slate-200 text-slate-700 px-3 py-1.5 text-xs font-bold rounded-md hover:bg-slate-300 cursor-pointer border-0">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-150">
                          <input 
                            type="text" 
                            placeholder="Type professional response..." 
                            value={replyText[r.id] || ''}
                            onChange={e => setReplyText(p => ({ ...p, [r.id]: e.target.value }))}
                            className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden w-full px-2"
                          />
                          <button onClick={() => handleSendReply(r.id, false)} className="bg-indigo-900 text-white p-1.5 rounded-md hover:bg-indigo-850 cursor-pointer border-0">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
