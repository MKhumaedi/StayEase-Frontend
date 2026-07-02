import React, { useState, useMemo } from 'react';
import { 
  Search, Star, MessageSquare, Eye, EyeOff, Trash2, Edit, 
  Calendar, X, FileText, CheckCircle, SlidersHorizontal, History, 
  User, MapPin, Hash, ShieldCheck, HelpCircle, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Review {
  id: string;
  rating: number;
  comment: string;
  guestName: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt: string | null;
  property: { id: string; name: string } | null;
  booking?: { id: string; bookingCode: string } | null;
  guest?: { id: string; name: string; email: string; avatarUrl: string | null } | null;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
}

interface ReviewManagementProps {
  reviews: Review[];
  auditLogs: AuditLog[];
  onToggleReviewVisibility: (reviewId: string, isHidden: boolean, reason?: string) => Promise<void>;
  onUpdateReview: (reviewId: string, rating: number, comment: string, reason?: string) => Promise<void>;
  onDeleteReview: (reviewId: string, reason?: string) => Promise<void>;
}

export default function ReviewManagement({ 
  reviews, 
  auditLogs, 
  onToggleReviewVisibility, 
  onUpdateReview, 
  onDeleteReview 
}: ReviewManagementProps) {
  // Filters & Search
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | 'PUBLIC' | 'HIDDEN'>('ALL');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [viewReview, setViewReview] = useState<Review | null>(null);
  const [editReview, setEditReview] = useState<Review | null>(null);
  
  // Edit review form state
  const [editRating, setEditRating] = useState<number>(5);
  const [editComment, setEditComment] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Action/Reason prompt state
  const [actionPrompt, setActionPrompt] = useState<{
    review: Review;
    actionType: 'HIDE' | 'RESTORE' | 'DELETE';
  } | null>(null);
  const [actionReason, setActionReason] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Stats Counters
  const stats = useMemo(() => {
    const total = reviews.length;
    const publicCount = reviews.filter(r => !r.deletedAt).length;
    const hiddenCount = reviews.filter(r => r.deletedAt).length;
    
    const sumRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = total > 0 ? (sumRatings / total).toFixed(2) : '0.00';

    return { total, publicCount, hiddenCount, avgRating };
  }, [reviews]);

  // Review Filter & Search Logic
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const matchesSearch = 
        r.comment.toLowerCase().includes(search.toLowerCase()) || 
        r.guestName.toLowerCase().includes(search.toLowerCase()) ||
        (r.guest?.email && r.guest.email.toLowerCase().includes(search.toLowerCase())) ||
        (r.property?.name && r.property.name.toLowerCase().includes(search.toLowerCase())) ||
        (r.booking?.bookingCode && r.booking.bookingCode.toLowerCase().includes(search.toLowerCase())) ||
        r.id.toLowerCase().includes(search.toLowerCase());

      const matchesRating = ratingFilter === 'ALL' || r.rating === Number(ratingFilter);
      
      const isHidden = !!r.deletedAt;
      const matchesVisibility = 
        visibilityFilter === 'ALL' ||
        (visibilityFilter === 'PUBLIC' && !isHidden) ||
        (visibilityFilter === 'HIDDEN' && isHidden);

      return matchesSearch && matchesRating && matchesVisibility;
    });
  }, [reviews, search, ratingFilter, visibilityFilter]);

  // Pagination bounds
  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredReviews.slice(startIndex, startIndex + pageSize);
  }, [filteredReviews, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredReviews.length / pageSize) || 1;

  // Filter audit logs relevant to reviews
  const reviewAuditLogs = useMemo(() => {
    return auditLogs.filter(log => 
      log.module === 'REVIEW' || 
      log.action.includes('REVIEW') || 
      log.action.includes('REPLY')
    );
  }, [auditLogs]);

  // Get specific logs for a single review details page
  const getLogsForReview = (reviewId: string) => {
    return reviewAuditLogs.filter(log => log.details.includes(reviewId) || log.details.toLowerCase().includes(reviewId.slice(0, 8)));
  };

  // Reset pagination on filter change
  const handleFilterChange = (filterType: 'rating' | 'visibility' | 'search', value: string) => {
    if (filterType === 'rating') setRatingFilter(value);
    if (filterType === 'visibility') setVisibilityFilter(value as any);
    if (filterType === 'search') setSearch(value);
    setCurrentPage(1);
  };

  // Open Edit Dialog
  const handleOpenEdit = (review: Review) => {
    setEditReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setEditReason('');
  };

  // Submit Edit Review Content
  const handleSaveEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReview) return;
    if (!editComment.trim()) {
      alert('Review comment text cannot be blank.');
      return;
    }

    setIsSavingEdit(true);
    try {
      await onUpdateReview(
        editReview.id, 
        editRating, 
        editComment.trim(), 
        editReason.trim() || 'Administrator edited rating/comment'
      );
      setEditReview(null);
    } catch (err: any) {
      alert(err.message || 'Error occurred while editing review.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Open action prompt dialog
  const handleOpenActionPrompt = (review: Review, actionType: 'HIDE' | 'RESTORE' | 'DELETE') => {
    setActionPrompt({ review, actionType });
    setActionReason('');
  };

  // Handle Action Prompt Submission
  const handleActionPromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionPrompt) return;

    const { review, actionType } = actionPrompt;
    setIsSubmittingAction(true);
    
    try {
      const reasonStr = actionReason.trim() || `Administrative ${actionType.toLowerCase()} action`;
      if (actionType === 'HIDE') {
        await onToggleReviewVisibility(review.id, true, reasonStr);
      } else if (actionType === 'RESTORE') {
        await onToggleReviewVisibility(review.id, false, reasonStr);
      } else if (actionType === 'DELETE') {
        await onDeleteReview(review.id, reasonStr);
      }
      setActionPrompt(null);
    } catch (err: any) {
      alert(err.message || 'Error performing administrative action.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6" id="review-management-container">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="reviews-header-block">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-display flex items-center gap-2" id="review-heading">
            Review & Reputation Management
          </h2>
          <p className="mt-1 text-sm text-slate-500" id="review-subheading">
            Redesign, secure, audit and moderate Traveler experience feedback to preserve platform hospitality standards.
          </p>
        </div>
      </div>

      {/* Stats Summary Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="review-stats-grid">
        <div className="bg-white p-5 rounded-2xl border border-slate-150/80 shadow-xs flex flex-col justify-between" id="stat-total-reviews">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Feedback</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800">{stats.total}</span>
            <span className="text-xs text-slate-400">reviews</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-150/80 shadow-xs flex flex-col justify-between" id="stat-average-rating">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Rating</span>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-3xl font-extrabold text-slate-800">{stats.avgRating}</span>
            <div className="flex items-center text-amber-400">
              <Star className="h-5 w-5 fill-current" />
            </div>
          </div>
        </div>

        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/80 shadow-xs flex flex-col justify-between" id="stat-public-reviews">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Published Reviews</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-emerald-800">{stats.publicCount}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">Active</span>
          </div>
        </div>

        <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100/80 shadow-xs flex flex-col justify-between" id="stat-hidden-reviews">
          <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Hidden Reviews</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-rose-800">{stats.hiddenCount}</span>
            <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-bold">Moderated</span>
          </div>
        </div>
      </div>

      {/* Advanced Filter, Search and Toolbar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4" id="review-toolbar">
        <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
          {/* Left search */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input 
              id="review-search-bar"
              type="text" 
              placeholder="Search by review ID, comment content, guest name/email, property, code..." 
              value={search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-slate-50/50"
            />
          </div>

          {/* Right Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-400 shrink-0" />
              <select 
                id="filter-rating-select"
                value={ratingFilter} 
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="text-xs border border-slate-200 rounded-xl py-2 px-3 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
              >
                <option value="ALL">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            {/* Visibility Toggle Buttons */}
            <div className="flex border border-slate-200 rounded-xl p-0.5 bg-slate-50" id="filter-visibility-group">
              <button
                id="btn-filter-all"
                onClick={() => handleFilterChange('visibility', 'ALL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  visibilityFilter === 'ALL' 
                    ? 'bg-white text-purple-700 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All
              </button>
              <button
                id="btn-filter-public"
                onClick={() => handleFilterChange('visibility', 'PUBLIC')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  visibilityFilter === 'PUBLIC' 
                    ? 'bg-white text-emerald-700 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Public
              </button>
              <button
                id="btn-filter-hidden"
                onClick={() => handleFilterChange('visibility', 'HIDDEN')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  visibilityFilter === 'HIDDEN' 
                    ? 'bg-white text-rose-700 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Hidden
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Reviews Table List */}
      <div className="overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-sm" id="reviews-table-container">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" id="reviews-management-table">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-4">Review ID</th>
                <th className="px-5 py-4">Traveler / Guest</th>
                <th className="px-5 py-4">Property</th>
                <th className="px-5 py-4">Booking Code</th>
                <th className="px-5 py-4">Rating</th>
                <th className="px-5 py-4">Created Date</th>
                <th className="px-5 py-4">Updated Date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Moderator Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600" id="reviews-management-tbody">
              {paginatedReviews.length === 0 ? (
                <tr id="empty-reviews-placeholder">
                  <td colSpan={9} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-slate-300" />
                      <p className="font-semibold text-sm">No reviews matching the filters.</p>
                      <p className="text-xs text-slate-400">Try adjusting your search criteria or filter tabs.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReviews.map((r) => {
                  const isHidden = !!r.deletedAt;
                  const displayId = r.id.substring(0, 8).toUpperCase();
                  
                  return (
                    <tr 
                      key={r.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isHidden ? 'bg-rose-50/10' : ''
                      }`}
                      id={`review-row-${r.id}`}
                    >
                      {/* 1. Review ID */}
                      <td className="px-5 py-4 font-mono font-bold text-slate-400" title={r.id}>
                        {displayId}
                      </td>

                      {/* 2. Traveler */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          {r.guest?.avatarUrl ? (
                            <img 
                              src={r.guest.avatarUrl} 
                              alt={r.guestName} 
                              className="w-7 h-7 rounded-full object-cover border border-slate-200" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-7 h-7 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 font-bold border border-purple-100">
                              <User className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-800">{r.guestName}</p>
                            <p className="text-[10px] text-slate-400">{r.guest?.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>

                      {/* 3. Property */}
                      <td className="px-5 py-4 font-semibold text-slate-700 max-w-[140px] truncate" title={r.property?.name}>
                        {r.property?.name || 'Deleted Property'}
                      </td>

                      {/* 4. Booking Code */}
                      <td className="px-5 py-4 font-mono font-semibold text-slate-500">
                        {r.booking?.bookingCode ? (
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                            {r.booking.bookingCode}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* 5. Rating */}
                      <td className="px-5 py-4">
                        <div className="flex items-center text-amber-500 gap-0.5" title={`${r.rating} / 5 stars`}>
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="font-bold text-slate-700 ml-1">{r.rating}</span>
                        </div>
                      </td>

                      {/* 6. Created Date */}
                      <td className="px-5 py-4 text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>

                      {/* 7. Updated Date */}
                      <td className="px-5 py-4 text-slate-400">
                        {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '-'}
                      </td>

                      {/* 8. Visibility / Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isHidden 
                            ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isHidden ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          {isHidden ? 'Hidden' : 'Public'}
                        </span>
                      </td>

                      {/* 9. Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. View Button */}
                          <button
                            id={`btn-view-${r.id}`}
                            onClick={() => setViewReview(r)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200/50 transition cursor-pointer"
                            title="View review details & history"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>

                          {/* 2. Edit Button */}
                          <button
                            id={`btn-edit-${r.id}`}
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-150 transition cursor-pointer"
                            title="Edit content or rating"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          {/* 3. Hide/Restore Toggle */}
                          <button
                            id={`btn-toggle-vis-${r.id}`}
                            onClick={() => handleOpenActionPrompt(r, isHidden ? 'RESTORE' : 'HIDE')}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isHidden 
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-150' 
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-150'
                            }`}
                            title={isHidden ? "Restore to Public View" : "Hide from Public View"}
                          >
                            {isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>

                          {/* 4. Delete/Archive Button */}
                          <button
                            id={`btn-delete-${r.id}`}
                            onClick={() => handleOpenActionPrompt(r, 'DELETE')}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-150 transition cursor-pointer"
                            title="Archive / Soft Delete permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Fluid Pagination Toolbar */}
        {filteredReviews.length > 0 && (
          <div className="bg-slate-50/50 px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500" id="pagination-toolbar">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select 
                id="page-size-selector"
                value={pageSize} 
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded-lg p-1.5 bg-white font-medium"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
              <span>of <strong>{filteredReviews.length}</strong> reviews</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="btn-prev-page"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      id={`btn-page-${pNum}`}
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-8 h-8 rounded-xl font-bold transition flex items-center justify-center ${
                        currentPage === pNum 
                          ? 'bg-purple-600 text-white shadow-sm' 
                          : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                id="btn-next-page"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Moderation History Component Section */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6" id="moderation-history-section">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1.5">
          <History className="h-4 w-4 text-purple-600" /> Administrative Moderation Trail
        </h3>
        <p className="text-xs text-slate-500 mb-4">Real-time audit log recording every admin modification, deletion, and visibility transition.</p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" id="moderation-history-table">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                <th className="py-2.5">Date & Time</th>
                <th className="py-2.5">Administrator</th>
                <th className="py-2.5">Action Type</th>
                <th className="py-2.5">Module</th>
                <th className="py-2.5">Activity Details / Mod Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] text-slate-600" id="moderation-history-tbody">
              {reviewAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">
                    No moderation logs recorded yet.
                  </td>
                </tr>
              ) : (
                reviewAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/30 transition-colors" id={`log-row-${log.id}`}>
                    <td className="py-3 pr-4 font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 font-bold text-slate-700">
                      {log.userName}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider ${
                        log.action.includes('HIDE') ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        log.action.includes('RESTORE') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        log.action.includes('EDIT') ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        log.action.includes('DELETE') ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-bold text-slate-400">
                      {log.module}
                    </td>
                    <td className="py-3 text-slate-700 leading-relaxed font-medium">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: VIEW DETAILS MODAL */}
      <AnimatePresence>
        {viewReview && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-xl overflow-hidden font-sans text-xs"
              id="view-review-modal"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600" /> Review Detailed Sheet
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {viewReview.id}</p>
                </div>
                <button 
                  onClick={() => setViewReview(null)}
                  className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  id="btn-close-view-modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Visual Header */}
                <div className="flex gap-4 items-start pb-4 border-b border-slate-100">
                  {viewReview.guest?.avatarUrl ? (
                    <img 
                      src={viewReview.guest.avatarUrl} 
                      alt={viewReview.guestName} 
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-xs" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 font-bold border border-purple-100">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-800">{viewReview.guestName}</span>
                      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 leading-none">
                        <ShieldCheck className="w-2.5 h-2.5" /> Verified Stay
                      </span>
                    </div>
                    <p className="text-slate-400">{viewReview.guest?.email || 'No email registered'}</p>
                  </div>

                  <div className="flex items-center text-amber-500 font-extrabold text-sm gap-0.5 bg-amber-50 px-2 py-1 rounded-xl border border-amber-100">
                    <Star className="w-4 h-4 fill-current" /> {viewReview.rating} / 5
                  </div>
                </div>

                {/* Properties details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                  <div className="space-y-1 flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Stay Location</p>
                      <p className="font-bold text-slate-700">{viewReview.property?.name || 'StayEase Lodge'}</p>
                    </div>
                  </div>

                  <div className="space-y-1 flex items-start gap-2">
                    <Hash className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Booking Code</p>
                      <p className="font-mono font-bold text-slate-700">{viewReview.booking?.bookingCode || '-'}</p>
                    </div>
                  </div>

                  <div className="space-y-1 flex items-start gap-2 mt-2">
                    <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Review Submitted</p>
                      <p className="font-semibold text-slate-700">{new Date(viewReview.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-1 flex items-start gap-2 mt-2">
                    <SlidersHorizontal className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Status / Visibility</p>
                      <span className={`inline-flex items-center gap-1.5 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        viewReview.deletedAt ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {viewReview.deletedAt ? 'Hidden (Moderated)' : 'Public (Active)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Comment text */}
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Traveler Comment</p>
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-xs text-slate-700 font-medium italic leading-relaxed">
                    "{viewReview.comment}"
                  </div>
                </div>

                {/* Traceability Audit Trail for this specific review */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <History className="h-3.5 w-3.5" /> Moderation Log History (For this Review)
                  </p>
                  
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {getLogsForReview(viewReview.id).length === 0 ? (
                      <p className="text-slate-400 text-center py-4 italic">No admin operations have been performed on this review yet.</p>
                    ) : (
                      getLogsForReview(viewReview.id).map((log) => (
                        <div key={log.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg space-y-1 text-[11px]">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-slate-700">{log.userName}</span>
                            <span className="text-[9px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-500 font-medium">
                            <span className="bg-slate-200 px-1 py-0.2 rounded font-bold uppercase text-[8px] tracking-wider text-slate-700 mr-1.5">{log.action}</span>
                            {log.details}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  id="btn-close-view-sheet"
                  onClick={() => setViewReview(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Close Detailed Sheet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: EDIT CONTENT & RATING MODAL */}
      <AnimatePresence>
        {editReview && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden font-sans text-xs"
              id="edit-review-modal"
            >
              <form onSubmit={handleSaveEditSubmit}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Edit className="h-4 w-4 text-purple-600" /> Edit Traveler Review
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Edit submitted review comment and rating parameters.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setEditReview(null)}
                    className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    id="btn-close-edit-modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                  {/* Warning banner */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-bold">Administrative Correction</p>
                      <p className="text-[10px] leading-relaxed text-amber-700/90 mt-0.5">Editing is restricted to administrative compliance tasks (e.g. removing obscene phrases). Changes will be recorded in the security audit trail.</p>
                    </div>
                  </div>

                  {/* Rating selection stars */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Review Rating</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setEditRating(star)}
                          className="p-1 hover:scale-110 transition cursor-pointer"
                          id={`star-select-${star}`}
                        >
                          <Star className={`h-6 w-6 ${
                            star <= editRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`} />
                        </button>
                      ))}
                      <span className="font-extrabold text-sm text-slate-700 ml-2">({editRating} out of 5)</span>
                    </div>
                  </div>

                  {/* Comment textarea */}
                  <div className="space-y-1.5">
                    <label htmlFor="edit-comment-area" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Review Comment</label>
                    <textarea
                      id="edit-comment-area"
                      rows={4}
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      className="w-full p-3 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-5/50 font-medium text-slate-700"
                      placeholder="Type review text..."
                      required
                    />
                  </div>

                  {/* Audit Reason */}
                  <div className="space-y-1.5">
                    <label htmlFor="edit-reason-input" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Reason for Modification</label>
                    <input
                      id="edit-reason-input"
                      type="text"
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      className="w-full p-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-5/50 font-medium text-slate-700"
                      placeholder="e.g. Removed profanity / inappropriate words"
                      required
                    />
                    <p className="text-[10px] text-slate-400">This explanation is required and will be logged in the public system audit trail.</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditReview(null)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-submit-edit-review"
                    type="submit"
                    disabled={isSavingEdit || !editReason.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {isSavingEdit ? 'Saving Edits...' : 'Save Adjustments'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: REASON PROMPT FOR HIDE / RESTORE / DELETE */}
      <AnimatePresence>
        {actionPrompt && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-sm overflow-hidden font-sans text-xs"
              id="action-reason-modal"
            >
              <form onSubmit={handleActionPromptSubmit}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-purple-600" /> Confirm Administration Task
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Please provide audit details for the requested action.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setActionPrompt(null)}
                    className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    id="btn-close-action-modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                  <p className="text-slate-600 font-medium leading-relaxed">
                    You are performing a <strong className="text-slate-900 font-extrabold uppercase bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{actionPrompt.actionType}</strong> operation on the review submitted by <strong>{actionPrompt.review.guestName}</strong>.
                  </p>

                  <div className="space-y-1.5">
                    <label htmlFor="action-reason-input" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Moderation Reason</label>
                    <input
                      id="action-reason-input"
                      type="text"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="w-full p-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-5/50 font-medium text-slate-700"
                      placeholder="e.g., Guest requested deletion / Spammed rating"
                      required
                    />
                    <p className="text-[10px] text-slate-400">Explain why this action is necessary. It will be stored in the permanent audit trail.</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActionPrompt(null)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-submit-action-prompt"
                    type="submit"
                    disabled={isSubmittingAction || !actionReason.trim()}
                    className={`px-4 py-2 text-white font-bold rounded-xl shadow-xs transition cursor-pointer ${
                      actionPrompt.actionType === 'DELETE' 
                        ? 'bg-rose-600 hover:bg-rose-700 disabled:opacity-40' 
                        : actionPrompt.actionType === 'HIDE'
                          ? 'bg-amber-600 hover:bg-amber-700 disabled:opacity-40'
                          : 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40'
                    }`}
                  >
                    {isSubmittingAction ? 'Executing...' : 'Confirm Moderation'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
