import React from 'react';
import { TravelerBooking } from '../types/travelerBookings.types';
import { Calendar, ArrowRight, Star } from 'lucide-react';
import { DownloadInvoiceButton } from '../../invoices/components/DownloadInvoiceButton';

interface Props {
  booking: TravelerBooking;
  onDetail: (b: TravelerBooking) => void;
  onReview: (b: TravelerBooking) => void;
  formatCurrency: (val: number) => string;
}

export function BookingCard({ booking, onDetail, onReview, formatCurrency }: Props) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 font-sans text-xs flex flex-col md:flex-row justify-between gap-4">
      <div className="flex gap-4">
        <BookingImage bk={booking} />
        <BookingMainInfo bk={booking} formatCurrency={formatCurrency} />
      </div>
      <div className="flex flex-col justify-between items-end gap-3 self-stretch">
        <StatusBadge status={booking.status} />
        <ActionButtons bk={booking} onDetail={onDetail} onReview={onReview} />
      </div>
    </div>
  );
}

function BookingImage({ bk }: { bk: TravelerBooking }) {
  const imgUrl = bk.property.imageUrls?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';
  return (
    <img
      src={imgUrl}
      alt={bk.property.name}
      className="w-24 h-24 rounded-lg object-cover flex-shrink-0 animate-fade-in border border-slate-100"
      referrerPolicy="no-referrer"
    />
  );
}

function BookingMainInfo({ bk, formatCurrency }: { bk: TravelerBooking; formatCurrency: (val: number) => string }) {
  return (
    <div className="space-y-1.5 font-semibold text-slate-600">
      <h3 className="text-sm font-bold text-indigo-950 font-display leading-tight">{bk.property.name}</h3>
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

function StatusBadge({ status }: { status: string }) {
  const cfg = badgeConfig(status);
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs border ${cfg.cls}`}>
      {cfg.lbl}
    </span>
  );
}

function badgeConfig(status: string) {
  const map: Record<string, { lbl: string; cls: string }> = {
    WAITING_PAYMENT: { lbl: 'Menunggu Pembayaran', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    WAITING_CONFIRMATION: { lbl: 'Menunggu Konfirmasi', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    CONFIRMED: { lbl: 'Dikonfirmasi', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    COMPLETED: { lbl: 'Selesai', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    CANCELLED: { lbl: 'Dibatalkan', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    AUTO_EXPIRED: { lbl: 'Kadaluarsa', cls: 'bg-slate-50 text-slate-600 border-slate-200' }
  };
  return map[status] || { lbl: status, cls: 'bg-slate-50 text-slate-650' };
}

function ActionButtons({ bk, onDetail, onReview }: { bk: TravelerBooking; onDetail: (b: TravelerBooking) => void; onReview: (b: TravelerBooking) => void }) {
  const isPending = bk.status === 'WAITING_PAYMENT';
  const showReview = bk.status === 'COMPLETED' && !bk.review;
  const isOver = bk.status === 'CANCELLED' || bk.status === 'AUTO_EXPIRED';
  const payUrl = `/bookings/detail/${bk.id}`;
  const rebookUrl = `/properties/${bk.property.id}`;

  return (
    <div className="flex gap-2 flex-wrap justify-end">
      <button onClick={() => onDetail(bk)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 bg-white font-bold cursor-pointer transition-colors">Detail</button>
      {isPending && <a href={payUrl} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold transition-colors">Bayar / Unggah Bukti</a>}
      <DownloadInvoiceButton bookingId={bk.id} status={bk.status} />
      {showReview && <button onClick={() => onReview(bk)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer transition-colors flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-current" /> Tulis Review</button>}
      {(bk.status === 'COMPLETED' || isOver) && <a href={rebookUrl} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-950 font-bold rounded-lg transition-colors">Pesan Lagi</a>}
    </div>
  );
}
