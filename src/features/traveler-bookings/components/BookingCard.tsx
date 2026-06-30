import React from 'react';
import { TravelerBooking } from '../types/travelerBookings.types';
import { Calendar, ArrowRight, Star } from 'lucide-react';
import { DownloadInvoiceButton } from '../../invoices/components/DownloadInvoiceButton';
import { useAuth } from '../../../shared/context/AuthContext';

interface Props {
  booking: TravelerBooking;
  onDetail: (b: TravelerBooking) => void;
  onReview: (b: TravelerBooking) => void;
  formatCurrency: (val: number) => string;
  onReload?: () => void;
}

export function BookingCard({ booking, onDetail, onReview, formatCurrency, onReload }: Props) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 font-sans text-xs flex flex-col md:flex-row justify-between gap-4">
      <div className="flex gap-4">
        <BookingImage bk={booking} />
        <BookingMainInfo bk={booking} formatCurrency={formatCurrency} />
      </div>
      <div className="flex flex-col justify-between items-end gap-3 self-stretch">
        <StatusBadge booking={booking} />
        <ActionButtons bk={booking} onDetail={onDetail} onReview={onReview} onReload={onReload} />
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

function ActionButtons({ bk, onDetail, onReview, onReload }: { bk: TravelerBooking; onDetail: (b: TravelerBooking) => void; onReview: (b: TravelerBooking) => void; onReload?: () => void }) {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const isPending = bk.status === 'WAITING_PAYMENT';
  const showReview = (bk.status === 'COMPLETED' || bk.status === 'CHECKED_OUT') && !bk.review;
  const isOver = bk.status === 'CANCELLED' || bk.status === 'AUTO_EXPIRED' || bk.status === 'COMPLETED' || bk.status === 'CHECKED_OUT';
  const payUrl = `/bookings/detail/${bk.id}`;
  const rebookUrl = `/properties/${bk.property?.id || ''}`;

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
        alert('Check-out request submitted successfully! Waiting for host confirmation.');
        if (onReload) onReload();
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err.message);
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
      {showReview && <button onClick={() => onReview(bk)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer transition-colors flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-current" /> Tulis Review</button>}
      {isOver && bk.property?.id && <a href={rebookUrl} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-950 font-bold rounded-lg transition-colors">Pesan Lagi</a>}
    </div>
  );
}
