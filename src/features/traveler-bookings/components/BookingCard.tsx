import React from 'react';
import { TravelerBooking } from '../types/travelerBookings.types';
import { Calendar, ArrowRight, Star, AlertTriangle, X } from 'lucide-react';
import { DownloadInvoiceButton } from '../../invoices/components/DownloadInvoiceButton';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/i18n';

interface Props {
  booking: TravelerBooking;
  onDetail: (b: TravelerBooking) => void;
  onReview: (b: TravelerBooking) => void;
  formatCurrency: (val: number) => string;
  onReload?: () => void;
  onNavigate?: (path: string, params?: any) => void;
}

export function BookingCard({ booking, onDetail, onReview, formatCurrency, onReload, onNavigate }: Props) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 font-sans text-xs flex flex-col md:flex-row justify-between gap-4">
      <div className="flex gap-4">
        <BookingImage bk={booking} />
        <BookingMainInfo bk={booking} formatCurrency={formatCurrency} />
      </div>
      <div className="flex flex-col justify-between items-end gap-3 self-stretch">
        <StatusBadge booking={booking} />
        <ActionButtons bk={booking} onDetail={onDetail} onReview={onReview} onReload={onReload} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function BookingImage({ bk }: { bk: TravelerBooking }) {
  const prop = bk.property || { imageUrls: [], name: 'StayEase Property' };
  const imgUrl = prop.imageUrls?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';
  return (
    <img
      src={imgUrl}
      alt={prop.name}
      className="w-24 h-24 rounded-lg object-cover flex-shrink-0 animate-fade-in border border-slate-100"
      referrerPolicy="no-referrer"
    />
  );
}

function BookingMainInfo({ bk, formatCurrency }: { bk: TravelerBooking; formatCurrency: (val: number) => string }) {
  const propName = bk.property?.name || 'StayEase Elite Stay';
  return (
    <div className="space-y-1.5 font-semibold text-slate-600">
      <h3 className="text-sm font-bold text-indigo-950 font-display leading-tight">{propName}</h3>
      <p className="text-slate-500 text-[11px] font-bold">{bk.room?.name || 'Standard Package Suite'}</p>
      <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] mt-1 pl-0.5">
        <span>{bk.bookingCode}</span> • <span>{bk.guestCount} Tamu</span> • <span>{bk.nights} Malam</span>
      </div>
      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-1">
        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
        <span>{bk.startDate}</span> <ArrowRight className="w-3" /> <span>{bk.endDate}</span>
      </div>
    </div>
  );
}

function StatusBadge({ booking }: { booking: TravelerBooking }) {
  const cfg = badgeConfig(booking);
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs border ${cfg.cls}`}>
      {cfg.lbl}
    </span>
  );
}

function badgeConfig(bk: TravelerBooking) {
  const status = bk.status;
  if (status === 'CHECKED_IN' && bk.checkoutRequested) {
    return { lbl: 'Menunggu Konfirmasi Keluar', cls: 'bg-purple-50 text-purple-700 border-purple-200' };
  }
  const map: Record<string, { lbl: string; cls: string }> = {
    WAITING_PAYMENT: { lbl: 'Menunggu Pembayaran', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    WAITING_CONFIRMATION: { lbl: 'Menunggu Konfirmasi', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    CONFIRMED: { lbl: 'Dikonfirmasi', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    CHECKED_IN: { lbl: 'Sedang Menginap', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
    CHECKED_OUT: { lbl: 'Selesai', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    COMPLETED: { lbl: 'Selesai', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    CANCELLED: { lbl: 'Dibatalkan', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    AUTO_EXPIRED: { lbl: 'Kadaluarsa', cls: 'bg-slate-50 text-slate-600 border-slate-200' }
  };
  return map[status] || { lbl: status, cls: 'bg-slate-50 text-slate-650' };
}

function ActionButtons({ bk, onDetail, onReview, onReload, onNavigate }: { bk: TravelerBooking; onDetail: (b: TravelerBooking) => void; onReview: (b: TravelerBooking) => void; onReload?: () => void; onNavigate?: (path: string, params?: any) => void }) {
  const { token } = useAuth();
  const { language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [successToast, setSuccessToast] = React.useState(false);
  const [errorToast, setErrorToast] = React.useState<string | null>(null);

  const [isRebooking, setIsRebooking] = React.useState(false);
  const [showRebookModal, setShowRebookModal] = React.useState(false);
  const [showPropertyUnavailableModal, setShowPropertyUnavailableModal] = React.useState(false);

  const isPending = bk.status === 'WAITING_PAYMENT';
  const isReviewEligible = bk.status === 'COMPLETED' || bk.status === 'CHECKED_OUT';
  const hasReviewed = !!bk.review;
  const showReview = isReviewEligible && !hasReviewed;
  const isOver = bk.status === 'CANCELLED' || bk.status === 'AUTO_EXPIRED' || bk.status === 'COMPLETED' || bk.status === 'CHECKED_OUT';
  const payUrl = `/bookings/detail/${bk.id}`;

  React.useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => {
        setSuccessToast(false);
        if (onReload) onReload();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  React.useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => {
        setErrorToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  const handleRequestCheckOut = async () => {
    if (!token || isSubmitting || isSuccess) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${bk.id}/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to request check-out');
      }
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setSuccessToast(true);
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorToast(err.message || 'An error occurred during check-out request');
    }
  };

  const handleRebook = async () => {
    if (isRebooking) return;
    setIsRebooking(true);
    try {
      const res = await fetch(`/api/properties/${bk.property?.id}`);
      if (!res.ok) {
        setShowRebookModal(false);
        setShowPropertyUnavailableModal(true);
        setIsRebooking(false);
        return;
      }
      const resData = await res.json();
      if (!resData || !resData.property) {
        setShowRebookModal(false);
        setShowPropertyUnavailableModal(true);
        setIsRebooking(false);
        return;
      }
      setIsRebooking(false);
      setShowRebookModal(false);
      const targetSlugOrId = bk.property?.slug || bk.property?.id;
      if (onNavigate) {
        onNavigate(`/property/${targetSlugOrId}`, {
          prefill: {
            roomId: bk.room?.id,
            guestCount: bk.guestCount
          }
        });
      } else {
        window.history.pushState({
          prefill: {
            roomId: bk.room?.id,
            guestCount: bk.guestCount
          }
        }, '', `/property/${targetSlugOrId}`);
        window.dispatchEvent(new Event('popstate'));
      }
    } catch (err) {
      console.error(err);
      setShowRebookModal(false);
      setShowPropertyUnavailableModal(true);
      setIsRebooking(false);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap justify-end items-center">
      <button onClick={() => onDetail(bk)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 bg-white font-bold cursor-pointer transition-colors">
        {bk.status === 'CONFIRMED' || bk.status === 'CHECKED_IN' ? 'View Reservation' : 'Detail'}
      </button>
      {isPending && <a href={payUrl} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold transition-colors">Bayar / Unggah Bukti</a>}
      {bk.status === 'CONFIRMED' && (
        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs">
          Reservation Confirmed
        </span>
      )}
      {bk.status === 'CHECKED_IN' && !bk.checkoutRequested && (
        <button
          onClick={handleRequestCheckOut}
          disabled={isSubmitting || isSuccess}
          className={`px-3 py-1.5 text-white font-bold text-xs rounded-xl shadow-xs transition-all duration-300 ease-out flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 select-none
            ${isSuccess 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg scale-100 cursor-default' 
              : isSubmitting
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 opacity-50 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:brightness-105 hover:scale-105 hover:-translate-y-0.5 active:scale-95 cursor-pointer'
            }
          `}
        >
          {isSubmitting && (
            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {isSuccess && (
            <svg className="h-3.5 w-3.5 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span>
            {isSuccess ? 'Success!' : isSubmitting ? 'Submitting...' : 'Check-Out'}
          </span>
        </button>
      )}
      {bk.status === 'CHECKED_IN' && bk.checkoutRequested && (
        <span className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg font-bold text-xs">
          Checkout Requested
        </span>
      )}
      <DownloadInvoiceButton bookingId={bk.id} status={bk.status} />
      {showReview && (
        <button 
          onClick={() => onReview(bk)} 
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold cursor-pointer transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-1 shadow-sm hover:shadow-md"
        >
          <Star className="w-3.5 h-3.5 fill-current" /> Tulis Review
        </button>
      )}
      {isReviewEligible && hasReviewed && (
        <div className="relative group inline-block">
          <button
            disabled
            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs flex items-center gap-1 cursor-not-allowed select-none opacity-95 transition-all duration-200"
          >
            ✓ Review Submitted
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 font-sans leading-relaxed text-center animate-in fade-in slide-in-from-bottom-1 duration-150">
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
            Your review has been successfully published. This review can no longer be modified.
          </div>
        </div>
      )}
      {isOver && bk.property?.id && (
        <button
          onClick={() => setShowRebookModal(true)}
          className="px-3.5 py-1.5 bg-purple-50 text-purple-700 font-bold rounded-xl border border-purple-100/35 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:bg-purple-600 hover:text-white active:scale-95 cursor-pointer flex items-center justify-center gap-1"
        >
          <span>{language === 'en' ? 'Book Again' : 'Pesan Lagi'}</span>
        </button>
      )}

      {/* Rebook Confirmation Modal */}
      {showRebookModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md p-6 font-sans text-xs relative animate-in zoom-in-95 duration-200 text-left">
            <button 
              onClick={() => setShowRebookModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-indigo-950 mb-2 font-display">
              {language === 'en' ? 'Book this property again?' : 'Pesan properti ini lagi?'}
            </h3>
            <p className="text-slate-500 mb-4 leading-relaxed font-sans font-medium">
              {language === 'en' 
                ? 'We will take you to the latest property page to create a new reservation.' 
                : 'Kami akan membawa Anda ke halaman properti terbaru untuk membuat reservasi baru.'}
            </p>
            
            <div className="border border-slate-150 rounded-xl p-3.5 bg-slate-50 mb-5 flex flex-col gap-2 font-sans text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">{language === 'en' ? 'Property:' : 'Properti:'}</span>
                <span className="text-slate-800 font-extrabold">{bk.property?.name || 'StayEase Accommodation'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">{language === 'en' ? 'Room Category:' : 'Kategori Kamar:'}</span>
                <span className="text-slate-800 font-extrabold">{bk.room?.name || 'Standard Package Suite'}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRebookModal(false)}
                disabled={isRebooking}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 bg-white font-bold cursor-pointer transition-all active:scale-95 disabled:opacity-50 text-[11px]"
              >
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                onClick={handleRebook}
                disabled={isRebooking}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1.5 transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed text-[11px]"
              >
                {isRebooking && (
                  <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <span>{isRebooking ? (language === 'en' ? 'Preparing...' : 'Menyiapkan...') : (language === 'en' ? 'Continue Booking' : 'Lanjutkan Pemesanan')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Unavailable Modal */}
      {showPropertyUnavailableModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md p-6 font-sans text-xs relative animate-in zoom-in-95 duration-200 text-left">
            <button 
              onClick={() => setShowPropertyUnavailableModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2.5 mb-3 text-amber-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-indigo-950 font-display">
                {language === 'en' ? 'Property is no longer available' : 'Properti tidak lagi tersedia'}
              </h3>
            </div>
            
            <p className="text-slate-500 mb-5 leading-relaxed font-sans font-medium">
              {language === 'en' 
                ? 'This accommodation has been removed or is unavailable.' 
                : 'Akomodasi ini telah dihapus atau sedang tidak tersedia.'}
            </p>

            <div className="flex gap-3 justify-end text-[11px]">
              <button
                onClick={() => setShowPropertyUnavailableModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 bg-white font-bold cursor-pointer transition-all active:scale-95"
              >
                {language === 'en' ? 'Close' : 'Tutup'}
              </button>
              <button
                onClick={() => {
                  setShowPropertyUnavailableModal(false);
                  if (onNavigate) {
                    onNavigate('/search');
                  } else {
                    window.history.pushState(null, '', '/search');
                    window.dispatchEvent(new Event('popstate'));
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
              >
                {language === 'en' ? 'Browse Similar Properties' : 'Cari Properti Serupa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Success Toast / Modal */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-emerald-600 text-white rounded-2xl p-5 shadow-2xl max-w-sm border border-emerald-500 flex flex-col gap-3 relative text-left">
            <button 
              onClick={() => { setSuccessToast(false); if (onReload) onReload(); }}
              className="absolute top-3 right-3 text-emerald-100 hover:text-white cursor-pointer font-sans"
            >
              <span className="text-xs">✕</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-extrabold text-sm tracking-tight">Check-out Requested</h4>
                <p className="text-[11px] text-emerald-100 font-sans">Your check-out request has been logged successfully.</p>
              </div>
            </div>
            <div className="bg-emerald-700/30 rounded-xl p-3 flex flex-col gap-1.5 text-[11px] border border-emerald-500/20">
              <div className="flex justify-between font-sans">
                <span className="text-emerald-100 font-medium">Booking Code:</span>
                <span className="font-mono font-bold">{bk.bookingCode}</span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-emerald-100 font-medium">Property:</span>
                <span className="font-semibold">{bk.property?.name || 'StayEase Unit'}</span>
              </div>
              <div className="flex justify-between border-t border-emerald-500/20 pt-1.5 mt-0.5 font-sans">
                <span className="text-emerald-100 font-medium">Request Time:</span>
                <span className="font-bold">
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
            <button
              onClick={() => { setSuccessToast(false); if (onReload) onReload(); }}
              className="w-full py-1.5 bg-white text-emerald-700 hover:bg-emerald-50 text-[11px] font-extrabold rounded-lg transition-colors cursor-pointer text-center font-sans"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-rose-600 text-white rounded-2xl p-4 shadow-2xl max-w-sm border border-rose-500 flex items-center gap-3 relative text-left">
            <button 
              onClick={() => setErrorToast(null)}
              className="absolute top-2 right-2 text-rose-100 hover:text-white cursor-pointer font-sans"
            >
              <span className="text-xs">✕</span>
            </button>
            <div className="w-7 h-7 rounded-full bg-rose-550/30 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="pr-4">
              <h5 className="font-bold text-xs font-sans">Error</h5>
              <p className="text-[10px] text-rose-100 font-sans">{errorToast}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
