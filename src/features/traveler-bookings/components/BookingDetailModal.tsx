import React from 'react';
import { TravelerBooking } from '../types/travelerBookings.types';
import { X, User, MapPin } from 'lucide-react';

interface Props {
  booking: TravelerBooking;
  onClose: () => void;
  formatCurrency: (val: number) => string;
}

export function BookingDetailModal({ booking, onClose, formatCurrency }: Props) {
  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto font-sans text-xs">
        <ModalHeader bookingCode={booking.bookingCode} onClose={onClose} />
        <ModalBody booking={booking} formatCurrency={formatCurrency} />
      </div>
    </div>
  );
}

function ModalHeader({ bookingCode, onClose }: { bookingCode: string; onClose: () => void }) {
  return (
    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
      <div>
        <h3 className="text-base font-bold text-indigo-950 font-display">Detail Reservasi StayEase</h3>
        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{bookingCode}</span>
      </div>
      <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

function ModalBody({ booking, formatCurrency }: { booking: TravelerBooking; formatCurrency: (val: number) => string }) {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PropertySection booking={booking} />
        <GuestSection booking={booking} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PaymentSection booking={booking} formatCurrency={formatCurrency} />
        <TimelineSection booking={booking} />
      </div>
    </div>
  );
}

function PropertySection({ booking }: { booking: TravelerBooking }) {
  const imgUrl = booking.property.imageUrls?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';
  return (
    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
      <h4 className="font-bold text-indigo-950 mb-3 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">Akomodasi</h4>
      <div className="flex gap-3">
        <img src={imgUrl} alt={booking.property.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0 animate-fade-in" referrerPolicy="no-referrer" />
        <div>
          <p className="font-bold text-slate-800 text-sm font-display">{booking.property.name}</p>
          <p className="text-slate-500 font-semibold flex items-center gap-1 mt-0.5"><MapPin className="w-3.5 h-3.5 text-indigo-600" /> {booking.property.city}</p>
          <p className="text-slate-505 font-bold mt-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded w-fit text-[10px]">{booking.room?.name || 'Standard Package Suite'}</p>
        </div>
      </div>
    </div>
  );
}

function GuestSection({ booking }: { booking: TravelerBooking }) {
  return (
    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
      <h4 className="font-bold text-indigo-950 mb-3 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">Tamu</h4>
      <div className="space-y-2 font-semibold text-slate-600">
        <p className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-indigo-600" /> <span className="font-bold text-slate-800">{booking.guestName}</span></p>
        <p className="pl-5 text-[11px] text-slate-500">{booking.guestEmail}</p>
        <p className="pl-5 text-[11px] text-slate-500">{booking.guestPhone}</p>
        <p className="pl-5 text-[11px] text-indigo-950 font-bold bg-indigo-50/50 p-1.5 rounded-lg w-fit">{booking.guestCount} Tamu • {booking.nights} Malam</p>
      </div>
    </div>
  );
}

function PaymentSection({ booking, formatCurrency }: { booking: TravelerBooking; formatCurrency: (val: number) => string }) {
  const isMidtrans = booking.paymentProof?.proofUrl?.includes('midtrans') || !booking.paymentProof;
  return (
    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30 flex flex-col justify-between">
      <div>
        <h4 className="font-bold text-indigo-950 mb-3 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">Detail Pembayaran</h4>
        <div className="text-[11px] bg-slate-50/60 p-2.5 rounded-lg border border-slate-100/55 text-slate-500">
          {isMidtrans ? <MidtransInfo b={booking} /> : <ManualInfo b={booking} />}
        </div>
      </div>
      <div className="flex justify-between items-center border-t border-slate-100/80 pt-3 mt-3">
        <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Total Bayar:</span>
        <span className="text-sm font-black text-indigo-950 font-display">{formatCurrency(booking.totalAmount)}</span>
      </div>
    </div>
  );
}

function MidtransInfo({ b }: { b: TravelerBooking }) {
  return (
    <div className="space-y-1 font-semibold">
      <p>ID Transaksi: <span className="text-slate-800 font-bold">{b.id.slice(0, 8).toUpperCase()}</span></p>
      <p>Metode: <span className="text-slate-800 font-bold">Midtrans Secure Snap SDK</span></p>
      <p>Status: <span className="text-emerald-700 font-black">{b.status === 'CONFIRMED' || b.status === 'COMPLETED' ? 'Settled' : 'Unsettled'}</span></p>
    </div>
  );
}

function ManualInfo({ b }: { b: TravelerBooking }) {
  const getUrl = () => {
    const raw = b.paymentProof?.proofUrl;
    if (!raw) return '';
    if (raw.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(raw);
        return parsed.url || '';
      } catch {
        return raw;
      }
    }
    return raw;
  };

  return (
    <div className="space-y-1 font-semibold">
      <p>Status Verifikasi: <span className="text-slate-800 font-bold">{b.status === 'WAITING_CONFIRMATION' ? 'Menunggu Review Tenant' : b.status === 'WAITING_PAYMENT' ? 'Belum Diunggah' : 'Disetujui'}</span></p>
      {getUrl() && (
        <a href={getUrl()} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold block mt-1">Lihat Bukti Transfer ↗</a>
      )}
    </div>
  );
}

function TimelineSection({ booking }: { booking: TravelerBooking }) {
  const createdStr = new Date(booking.createdAt).toLocaleDateString();
  const conf = booking.status !== 'WAITING_PAYMENT' && booking.status !== 'WAITING_CONFIRMATION' && booking.status !== 'CANCELLED' ? 'Selesai' : '-';
  const pay = booking.paymentProof ? 'Selesai' : '-';
  return (
    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
      <h4 className="font-bold text-indigo-950 mb-3 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">Alur Reservasi</h4>
      <div className="space-y-2.5 relative before:absolute before:bottom-2 before:top-2 before:left-2 before:w-[2px] before:bg-slate-100 font-semibold text-slate-600 text-[11px]">
        <TimelineStep label="Reservasi Dibuat" val={createdStr} active={true} />
        <TimelineStep label="Pembayaran Diterima" val={pay} active={!!booking.paymentProof} />
        <TimelineStep label="Reservasi Dikonfirmasi" val={conf} active={conf !== '-'} />
        <TimelineStep label="Check-In" val={booking.startDate} active={booking.status === 'CONFIRMED' || booking.status === 'COMPLETED'} />
        <TimelineStep label="Check-Out" val={booking.endDate} active={booking.status === 'COMPLETED'} />
      </div>
    </div>
  );
}

function TimelineStep({ label, val, active }: { label: string; val: string; active: boolean }) {
  return (
    <div className="flex justify-between items-center pl-6 relative">
      <span className={`absolute left-1 w-2.5 h-2.5 rounded-full border-2 -translate-x-[3px] ${active ? 'bg-indigo-600 border-indigo-600 shadow-xs' : 'bg-white border-slate-200'}`} />
      <span className={active ? 'text-slate-800 font-bold' : 'text-slate-400 font-medium'}>{label}</span>
      <span className="text-slate-500 font-mono text-[10px]">{val}</span>
    </div>
  );
}
