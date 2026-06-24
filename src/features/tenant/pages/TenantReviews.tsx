import React, { useState, useEffect } from 'react';
import { Star, MessageSquareQuote, Send, Loader2, Calendar } from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';

export default function TenantReviews() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});
  const [editingReplyText, setEditingReplyText] = useState<{ [id: string]: string }>({});
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReviews = () => {
    if (!token) return;
    setLoading(true);
    fetch('/api/reviews/host', {
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

  useEffect(() => {
    if (token) {
      fetchReviews();
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

  // Live Database stats calculations
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(2))
    : 0.0;

  const fiveStarsCount = reviews.filter(r => r.rating === 5).length;
  const fourStarsCount = reviews.filter(r => r.rating === 4).length;
  const lowStarsCount = reviews.filter(r => r.rating <= 3).length;

  const pct5 = totalReviews > 0 ? Math.round((fiveStarsCount / totalReviews) * 100) : 0;
  const pct4 = totalReviews > 0 ? Math.round((fourStarsCount / totalReviews) * 100) : 0;
  const pctLow = totalReviews > 0 ? Math.round((lowStarsCount / totalReviews) * 100) : 0;

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
      ) : totalReviews === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center p-8 text-xs text-slate-400 font-bold select-none">
          <MessageSquareQuote className="w-10 h-10 text-indigo-400 mb-2" />
          <span>Belum ada ulasan</span>
        </div>
      ) : (
        <>
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
              <span className="text-xs text-slate-400 font-semibold">Based on {totalReviews} guest reviews</span>
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
            {reviews.map((r, idx) => {
                const guestName = r.guest?.name || r.guestName || 'Verified Guest';
                const guestAvatar = r.guest?.avatarUrl || r.guestAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';
                const propertyName = r.property?.name || 'Your Property';
                const dateString = new Date(r.createdAt).toLocaleDateString();

                return (
                  <div key={r.id || `review-${idx}`} className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex gap-4">
                    <img src={guestAvatar} alt={guestName} className="w-10 h-10 rounded-full bg-slate-50 border object-cover" referrerPolicy="no-referrer" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{guestName}</h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{propertyName} • Received {dateString}</span>
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
                                className="text-[10px] text-indigo-700 hover:text-indigo-950 font-bold hover:underline cursor-pointer"
                              >
                                Edit
                              </button>
                              <span className="text-slate-300 text-[10px]">|</span>
                              <button
                                onClick={() => handleDeleteReply(r.id)}
                                className="text-[10px] text-red-650 hover:text-red-800 font-bold hover:underline cursor-pointer"
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
                              className="bg-white border text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full px-2 py-1.5 rounded-md"
                            />
                            <button onClick={() => handleSendReply(r.id, true)} className="bg-indigo-900 text-white px-3 py-1.5 text-xs font-bold rounded-md hover:bg-indigo-850 cursor-pointer">
                              Save
                            </button>
                            <button onClick={() => setEditingReviewId(null)} className="bg-slate-200 text-slate-700 px-3 py-1.5 text-xs font-bold rounded-md hover:bg-slate-300 cursor-pointer">
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
                            className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full px-2"
                          />
                          <button onClick={() => handleSendReply(r.id, false)} className="bg-indigo-900 text-white p-1.5 rounded-md hover:bg-indigo-850 cursor-pointer">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
