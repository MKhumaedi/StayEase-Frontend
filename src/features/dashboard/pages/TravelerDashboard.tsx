import React, { useState } from 'react';
import { Gift, Wallet, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import { useAuth } from '../../../shared/context/AuthContext';
import { useAsyncAction, useIdempotency } from '../../../protection';
import { TravelerBookingsPage } from '../../traveler-bookings/pages/TravelerBookingsPage';
import { ReviewModal } from '../components/ReviewModal';

function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'SE';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface TravelerDashboardProps {
  onNavigate?: (path: string, params?: any) => void;
}

export default function TravelerDashboard({ onNavigate }: TravelerDashboardProps) {
  const { user, token } = useAuth();
  const { language, formatCurrencyIDR } = useLanguage();
  const [activeReviewBooking, setActiveReviewBooking] = useState<any | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [commentText, setCommentText] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const { idempotencyKey: reviewIdempKey, rotateKey: rotateReviewKey } = useIdempotency();

  const handleOpenReviewModal = (booking: any) => {
    setActiveReviewBooking(booking);
    setSelectedRating(5);
    setCommentText('');
    setModalError(null);
  };

  const { execute: handleSubmitReview, isLoading: submittingReview } = useAsyncAction(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setModalError(language === 'en' ? 'Review comment is required!' : 'Komentar ulasan wajib diisi!');
      return;
    }
    await performReviewSubmission();
  });

  const performReviewSubmission = async () => {
    try {
      setModalError(null);
      await sendReview(activeReviewBooking.id, selectedRating, commentText, reviewIdempKey, token);
      rotateReviewKey();
      setActiveReviewBooking(null);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      const msg = err.message || '';
      if (
        msg.includes('Authorization token required') || 
        msg.includes('authorization token') || 
        msg.includes('expired') || 
        msg.includes('Unauthorized')
      ) {
        setModalError(
          language === 'en'
            ? 'Your login session has expired. Please sign in again to continue.'
            : 'Sesi login Anda telah berakhir. Silakan masuk kembali untuk melanjutkan.'
        );
      } else {
        setModalError(err.message || 'An error occurred.');
      }
    }
  };

  const userName = user?.name || 'Traveler';
  const userLoyalty = user?.loyaltyPoints !== undefined ? user.loyaltyPoints : 0;
  const userCredits = user?.credits !== undefined ? Number(user.credits) : 0;
  const hasAvatar = user?.avatarUrl && !user.avatarUrl.includes('dicebear.com');

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 font-sans">
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 p-8 rounded-2xl border border-slate-800 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-400 bg-indigo-600 text-white font-black flex items-center justify-center select-none text-xl">
            {hasAvatar ? (
              <img src={user?.avatarUrl} alt={userName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span>{getInitials(userName)}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black font-display tracking-tight">{userName}</h1>
            <p className="text-xs text-indigo-300 font-semibold mt-0.5">StayEase Elite Traveler Tier</p>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="bg-white/10 p-4 rounded-xl border border-white/5 backdrop-blur-sm flex items-center gap-3">
            <Gift className="w-8 h-8 text-indigo-300 flex-shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-300 block">
                {language === 'en' ? 'Loyalty Points' : 'Poin Loyalitas'}
              </span>
              <span className="text-lg font-black font-display">
                {userLoyalty.toLocaleString()} <span className="text-xs font-semibold">pts</span>
              </span>
            </div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl border border-white/5 backdrop-blur-sm flex items-center gap-3">
            <Wallet className="w-8 h-8 text-indigo-300 flex-shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-300 block">
                {language === 'en' ? 'Available Credits' : 'Kredit Tersedia'}
              </span>
              <span className="text-lg font-black font-display">{formatCurrencyIDR(userCredits)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-indigo-950 font-display">
              {language === 'en' ? 'My Bookings & Reservations' : 'Pemesanan & Reservasi Saya'}
            </h2>
          </div>

          <TravelerBookingsPage key={refreshKey} token={token} onReview={handleOpenReviewModal} onNavigate={onNavigate} />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 h-fit">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-indigo-600 font-bold" /> {language === 'en' ? 'StayEase Travel Desk' : 'Layanan Informasi StayEase'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4 font-semibold">
            {language === 'en' 
              ? 'Stays marked as PENDING are processed within 30 minutes. Ensure bank transfers match the exact checkout amount to secure reservation.' 
              : 'Pemesanan berstatus MENUNGGU akan diproses dalam waktu 30 menit. Pastikan pengiriman dana transfer bank sesuai dengan nominal checkout agar reservasi lancar.'}
          </p>
          <div className="p-3 border rounded-xl text-[11px] font-bold text-slate-600 leading-relaxed mb-4">
            {language === 'en' ? 'Need support? Call our Elite support desk available 24/7' : 'Perlu bantuan? Telpon layanan pelanggan 24/7 kami di'} <span className="text-indigo-950 block mt-0.5 font-black">+62 831 204795 94</span>
          </div>
        </div>
      </div>

      {activeReviewBooking && (
        <ReviewModal
          booking={activeReviewBooking}
          rating={selectedRating}
          setRating={setSelectedRating}
          comment={commentText}
          setComment={setCommentText}
          error={modalError}
          onClose={() => setActiveReviewBooking(null)}
          onSubmit={handleSubmitReview}
          submitting={submittingReview}
          language={language}
        />
      )}
    </div>
  );
}

async function sendReview(bookingId: string, rating: number, comment: string, key: string, token?: string | null) {
  const headers: HeadersInit = { 
    'Content-Type': 'application/json', 
    'x-idempotency-key': key 
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers,
    body: JSON.stringify({ bookingId, rating, comment: comment.trim() })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit review');
  return data;
}
