import React, { useState, useEffect } from 'react';
import { TravelerBooking } from '../types/travelerBookings.types';
import { X, User, MapPin, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

interface Props {
  booking: TravelerBooking;
  onClose: () => void;
  formatCurrency: (val: number) => string;
}

export function BookingDetailModal({ booking, onClose, formatCurrency }: Props) {
  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      {/* Container Modal dengan Custom Hidden Scrollbar */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden font-sans text-xs transition-all animate-in fade-in zoom-in-95 duration-200">
        <ModalHeader bookingCode={booking.bookingCode} onClose={onClose} />
        <ModalBody booking={booking} formatCurrency={formatCurrency} />
      </div>
    </div>
  );
}

function ModalHeader({ bookingCode, onClose }: { bookingCode: string; onClose: () => void }) {
  return (
    <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 sticky top-0 z-20 backdrop-blur-md">
      <div>
        <h3 className="text-base font-bold text-indigo-950 font-display">Detail Reservasi StayEase</h3>
        <span className="text-[10px] text-slate-400 font-mono font-bold block mt-0.5">{bookingCode}</span>
      </div>
      <button 
        onClick={onClose} 
        className="p-1.5 hover:bg-slate-200/70 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-0 bg-transparent"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

function ModalBody({ booking, formatCurrency }: { booking: TravelerBooking; formatCurrency: (val: number) => string }) {
  return (
    <div className="p-5 flex flex-col gap-4">
      {/* Banner Utama: Dynamic QR Code Header */}
      <QrCodeBanner booking={booking} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PropertySection booking={booking} />
        <GuestSection booking={booking} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PaymentSection booking={booking} formatCurrency={formatCurrency} />
        <TimelineSection booking={booking} />
      </div>
    </div>
  );
}

// Banner Dinamis Berdasarkan Status Booking (Ukuran Compact)
function QrCodeBanner({ booking }: { booking: TravelerBooking }) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loadingQr, setLoadingQr] = useState<boolean>(true);

  useEffect(() => {
    if (!booking || !booking.bookingCode) return;

    setLoadingQr(true);
    const payload = JSON.stringify({ bookingCode: booking.bookingCode });

    QRCode.toDataURL(payload, {
      margin: 1,
      scale: 5,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff'
      }
    })
      .then((url) => {
        setQrCodeUrl(url);
        setLoadingQr(false);
      })
      .catch((err) => {
        console.error('Failed to generate dynamic QR Code:', err);
        setLoadingQr(false);
      });
  }, [booking]);

  const isCheckedIn = booking.status === 'CHECKED_IN';
  const isCompleted = booking.status === 'COMPLETED';

  const bannerTitle = isCheckedIn 
    ? 'Pass Check-In Aktif' 
    : isCompleted 
      ? 'Pass Reservasi Selesai' 
      : 'Pass Check-In Digital';

  const bannerDesc = isCheckedIn
    ? 'Tamu saat ini sedang menginap. Tunjukkan kode QR ini jika memerlukan verifikasi fasilitas/front desk.'
    : isCompleted
      ? 'Masa menginap untuk reservasi ini telah selesai.'
      : 'Tunjukkan kode QR ini kepada resepsionis untuk pemindaian instan saat kedatangan.';

  return (
    <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3 text-center sm:text-left">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
          <QrCode className="w-5 h-5 text-indigo-300" />
        </div>
        <div>
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h4 className="font-bold text-xs text-slate-100 font-display">{bannerTitle}</h4>
            {isCheckedIn && (
              <span className="bg-blue-500/30 text-blue-300 border border-blue-400/30 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                In-House
              </span>
            )}
          </div>
          <p className="text-[11px] text-indigo-200/80 mt-0.5 leading-relaxed">
            {bannerDesc}
          </p>
        </div>
      </div>

      <div className="bg-white p-2 rounded-xl border border-white/20 shadow-md flex flex-col items-center shrink-0">
        {loadingQr ? (
          <div className="w-20 h-20 bg-slate-100 rounded-lg animate-pulse flex items-center justify-center">
            <span className="text-[8px] text-slate-400 font-bold">Memuat...</span>
          </div>
        ) : (
          <img
            src={qrCodeUrl}
            alt={`QR ${booking.bookingCode}`}
            className="w-20 h-20 object-contain rounded-md"
          />
        )}
        <span className="text-[9px] font-black uppercase tracking-wider text-indigo-950 mt-1 font-mono">
          {booking.bookingCode}
        </span>
      </div>
    </div>
  );
}

function PropertySection({ booking }: { booking: TravelerBooking }) {
  const property = booking.property || { imageUrls: [], name: 'StayEase Elite Stay', city: 'Indonesia' };
  const imgUrl = property.imageUrls?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';
  return (
    <div className="border border-slate-100 rounded-2xl p-3.5 bg-slate-50/40">
      <h4 className="font-bold text-indigo-950 mb-2 flex items-center gap-1.5 uppercase tracking-wider text-[9px]">Akomodasi</h4>
      <div className="flex gap-3 items-center">
        <img src={imgUrl} alt={property.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-slate-200" referrerPolicy="no-referrer" />
        <div>
          <p className="font-bold text-slate-800 text-xs font-display">{property.name}</p>
          <p className="text-slate-500 font-semibold flex items-center gap-1 mt-0.5 text-[11px]"><MapPin className="w-3 h-3 text-indigo-600" /> {property.city || 'Indonesia'}</p>
          <p className="text-slate-500 font-bold mt-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md w-fit text-[9px]">{booking.room?.name || 'Standard Package Suite'}</p>
        </div>
      </div>
    </div>
  );
}

function GuestSection({ booking }: { booking: TravelerBooking }) {
  return (
    <div className="border border-slate-100 rounded-2xl p-3.5 bg-slate-50/40">
      <h4 className="font-bold text-indigo-950 mb-2 flex items-center gap-1.5 uppercase tracking-wider text-[9px]">Tamu</h4>
      <div className="space-y-1.5 font-semibold text-slate-600">
        <p className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-indigo-600" /> <span className="font-bold text-slate-800">{booking.guestName}</span></p>
        <p className="pl-5 text-[10px] text-slate-500">{booking.guestEmail}</p>
        <p className="pl-5 text-[10px] text-slate-500">{booking.guestPhone}</p>
        <p className="pl-5 text-[10px] text-indigo-950 font-bold bg-indigo-50/50 px-2 py-1 rounded-md w-fit">{booking.guestCount} Tamu • {booking.nights} Malam</p>
      </div>
    </div>
  );
}

function PaymentSection({ booking, formatCurrency }: { booking: TravelerBooking; formatCurrency: (val: number) => string }) {
  const isMidtrans = booking.paymentProof?.proofUrl?.includes('midtrans') || !booking.paymentProof;
  return (
    <div className="border border-slate-100 rounded-2xl p-3.5 bg-slate-50/40 flex flex-col justify-between">
      <div>
        <h4 className="font-bold text-indigo-950 mb-2 flex items-center gap-1.5 uppercase tracking-wider text-[9px]">Detail Pembayaran</h4>
        <div className="text-[10px] bg-slate-50/60 p-2 rounded-xl border border-slate-100/55 text-slate-500">
          {isMidtrans ? <MidtransInfo b={booking} /> : <ManualInfo b={booking} />}
        </div>
      </div>
      <div className="flex justify-between items-center border-t border-slate-100/80 pt-2 mt-2">
        <span className="font-bold text-slate-400 uppercase tracking-widest text-[8px]">Total Bayar:</span>
        <span className="text-xs font-black text-indigo-950 font-display">{formatCurrency(booking.totalAmount)}</span>
      </div>
    </div>
  );
}

function MidtransInfo({ b }: { b: TravelerBooking }) {
  return (
    <div className="space-y-0.5 font-semibold">
      <p>ID Transaksi: <span className="text-slate-800 font-bold">{b.id.slice(0, 8).toUpperCase()}</span></p>
      <p>Metode: <span className="text-slate-800 font-bold">Midtrans Secure Snap SDK</span></p>
      <p>Status: <span className="text-emerald-700 font-black">{b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' || b.status === 'COMPLETED' ? 'Settled' : 'Unsettled'}</span></p>
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
    <div className="space-y-0.5 font-semibold">
      <p>Status Verifikasi: <span className="text-slate-800 font-bold">{b.status === 'WAITING_CONFIRMATION' ? 'Menunggu Review Tenant' : b.status === 'WAITING_PAYMENT' ? 'Belum Diunggah' : 'Disetujui'}</span></p>
      {getUrl() && (
        <a href={getUrl()} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold block mt-0.5">Lihat Bukti Transfer ↗</a>
      )}
    </div>
  );
}

// LOGIKA TIMELINE DINAMIS DAN TYPE-SAFE
function TimelineSection({ booking }: { booking: TravelerBooking }) {
  const bAny = booking as any;
  const createdStr = new Date(booking.createdAt).toLocaleDateString();
  
  const isPayDone = !!booking.paymentProof || booking.status !== 'WAITING_PAYMENT';
  const isConfDone = booking.status !== 'WAITING_PAYMENT' && booking.status !== 'WAITING_CONFIRMATION' && booking.status !== 'CANCELLED';
  const isCheckedInDone = booking.status === 'CHECKED_IN' || booking.status === 'COMPLETED' || !!bAny.checkedInAt;
  const isCheckedOutDone = booking.status === 'COMPLETED' || !!bAny.checkedOutAt;

  const confVal = isConfDone ? 'Selesai' : '-';
  const payVal = isPayDone ? 'Selesai' : '-';
  const checkInVal = isCheckedInDone 
    ? (bAny.checkedInAt ? new Date(bAny.checkedInAt).toLocaleDateString() : 'Selesai') 
    : booking.startDate;
  const checkOutVal = isCheckedOutDone 
    ? (bAny.checkedOutAt ? new Date(bAny.checkedOutAt).toLocaleDateString() : 'Selesai') 
    : booking.endDate;

  return (
    <div className="border border-slate-100 rounded-2xl p-3.5 bg-slate-50/40">
      <h4 className="font-bold text-indigo-950 mb-2 flex items-center gap-1.5 uppercase tracking-wider text-[9px]">Alur Reservasi</h4>
      <div className="space-y-2 relative before:absolute before:bottom-1.5 before:top-1.5 before:left-2 before:w-[2px] before:bg-slate-100 font-semibold text-slate-600 text-[10px]">
        <TimelineStep label="Reservasi Dibuat" val={createdStr} active={true} />
        <TimelineStep label="Pembayaran Diterima" val={payVal} active={isPayDone} />
        <TimelineStep label="Reservasi Dikonfirmasi" val={confVal} active={isConfDone} />
        <TimelineStep label="Check-In" val={checkInVal} active={isCheckedInDone} />
        <TimelineStep label="Check-Out" val={checkOutVal} active={isCheckedOutDone} />
      </div>
    </div>
  );
}

function TimelineStep({ label, val, active }: { label: string; val: string; active: boolean }) {
  return (
    <div className="flex justify-between items-center pl-5 relative">
      <span className={`absolute left-1 w-2 h-2 rounded-full border-2 -translate-x-[2px] ${active ? 'bg-indigo-600 border-indigo-600 shadow-xs' : 'bg-white border-slate-200'}`} />
      <span className={active ? 'text-slate-800 font-bold' : 'text-slate-400 font-medium'}>{label}</span>
      <span className={`font-mono text-[9px] ${active ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>{val}</span>
    </div>
  );
}