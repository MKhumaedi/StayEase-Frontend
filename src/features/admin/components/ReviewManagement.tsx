import React, { useState } from 'react';
import { Search, Star, MessageSquare, ShieldAlert, EyeOff, Eye } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  guestName: string;
  createdAt: string;
  deletedAt: string | null;
  property: { name: string } | null;
}

interface ReviewManagementProps {
  reviews: Review[];
  onToggleReviewVisibility: (reviewId: string, isHidden: boolean) => Promise<void>;
}

export default function ReviewManagement({ reviews, onToggleReviewVisibility }: ReviewManagementProps) {
  const [search, setSearch] = useState('');

  const filteredReviews = reviews.filter(r => 
    r.comment.toLowerCase().includes(search.toLowerCase()) || 
    r.guestName.toLowerCase().includes(search.toLowerCase()) ||
    r.property?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (review: Review) => {
    const isHidden = !!review.deletedAt;
    const actionLabel = isHidden ? 'Restore Public' : 'Hide / Soft-delete';
    
    if (window.confirm(`Are you sure you want to perform "${actionLabel}" on this review?`)) {
      try {
        await onToggleReviewVisibility(review.id, !isHidden);
      } catch (err: any) {
        alert(err.message || 'Action failed');
      }
    }
  };

  return (
    <div className="space-y-6" id="review-management-container">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900" id="review-heading">Review Moderation</h2>
        <p className="mt-1 text-sm text-gray-500" id="review-subheading">Monitor public commentary, hide offensive/fraudulent reviews, or restore flag reports.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs" id="review-filters-bar">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input 
            id="review-search"
            type="text" 
            placeholder="Search comment, guest name, property..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-gray-50"
          />
        </div>
      </div>

      {/* Table listing */}
      <div className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-xs" id="reviews-table-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" id="reviews-table">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-4">Guest Info</th>
                <th className="px-6 py-4">Property</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Comments</th>
                <th className="px-6 py-4">Posted Date</th>
                <th className="px-6 py-4">Visibility</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm" id="reviews-table-body">
              {filteredReviews.length === 0 ? (
                <tr id="empty-review-row">
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No guest reviews match current filters.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((r) => {
                  const isHidden = !!r.deletedAt;
                  return (
                    <tr 
                      key={r.id} 
                      className={`hover:bg-gray-50/40 transition-colors ${isHidden ? 'bg-red-50/10' : ''}`}
                      id={`review-row-${r.id}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="font-bold text-gray-800">{r.guestName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-semibold line-clamp-1 max-w-[150px]">
                        {r.property?.name || 'StayEase Lodges'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-amber-500 font-bold gap-0.5">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-current" />
                          ))}
                          <span className="text-xs text-gray-400 ml-1">({r.rating})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-sm truncate" title={r.comment}>
                        {r.comment}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isHidden ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isHidden ? 'Hidden' : 'Public'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleToggle(r)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition ${
                            isHidden ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-110' : 'bg-red-50 text-red-700 hover:bg-red-110'
                          }`}
                        >
                          {isHidden ? (
                            <>
                              <Eye className="h-3.5 w-3.5" /> Restore Post
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3.5 w-3.5" /> Moderation Hide
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
