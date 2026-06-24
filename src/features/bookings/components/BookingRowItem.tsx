import React from 'react';
import { Eye, Clock, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

interface BookingRowProps {
  booking: {
    id: string;
    bookingCode: string;
    guestName: string;
    guestEmail: string;
    startDate: string;
    endDate: string;
    nights: number;
    totalAmount: number | string;
    status: string;
    createdAt: string;
    property?: { name: string };
    room?: { name: string };
  };
  onViewDetails: (id: string) => void;
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-150';
    case 'COMPLETED':
      return 'bg-indigo-50 text-indigo-700 border-indigo-150';
    case 'WAITING_PAYMENT':
      return 'bg-amber-50 text-amber-700 border-amber-150';
    case 'WAITING_CONFIRMATION':
      return 'bg-blue-50 text-blue-700 border-blue-150';
    case 'CANCELLED':
    case 'CANCELED':
      return 'bg-rose-50 text-rose-700 border-rose-150';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-150';
  }
}

export default function BookingRowItem({ booking, onViewDetails }: BookingRowProps) {
  const { language, formatCurrencyIDR } = useLanguage();
  const styles = getStatusStyles(booking.status);
  const showProofBadge = booking.status === 'WAITING_CONFIRMATION';

  return (
    <tr className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 text-xs">
      <td className="p-4">
        <span className="font-mono font-bold text-indigo-950 bg-slate-100 px-2 py-0.5 rounded-sm">
          {booking.bookingCode}
        </span>
        <span className="block text-[10px] text-slate-400 mt-1">
          {new Date(booking.createdAt).toLocaleDateString()}
        </span>
      </td>

      <td className="p-4 font-bold text-slate-800">
        <div>{booking.guestName}</div>
        <div className="text-[10px] text-slate-450 font-normal">{booking.guestEmail}</div>
      </td>

      <td className="p-4">
        <div className="font-semibold text-slate-800 line-clamp-1">
          {booking.property?.name || 'StayEase Elite Stay'}
        </div>
        <div className="text-[10px] text-slate-450">
          {booking.room?.name || 'Standard Luxury Suite'}
        </div>
      </td>

      <td className="p-4 text-slate-600 font-semibold">
        <div>{booking.startDate}</div>
        <div className="text-[10px] text-slate-400">{language === 'en' ? 'Check In' : 'Masuk'}</div>
      </td>

      <td className="p-4 text-slate-600 font-semibold">
        <div>{booking.endDate}</div>
        <div className="text-[10px] text-slate-400">{language === 'en' ? 'Check Out' : 'Keluar'}</div>
      </td>

      <td className="p-4 text-center text-slate-700 font-bold">
        {booking.nights} {language === 'en' ? 'Nights' : 'Malam'}
      </td>

      <td className="p-4 font-black text-indigo-950 text-sm">
        {formatCurrencyIDR(Number(booking.totalAmount))}
      </td>

      <td className="p-4">
        <span className={`px-2 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider leading-none block w-fit ${styles}`}>
          {booking.status}
        </span>
        {showProofBadge && (
          <span className="text-[8px] text-blue-600 flex items-center gap-1 mt-1 font-bold">
            <ShieldAlert className="w-2.5 h-2.5" /> Proof Uploaded
          </span>
        )}
      </td>

      <td className="p-4 text-right">
        <button
          onClick={() => onViewDetails(booking.id)}
          className="p-1.5 hover:bg-indigo-50 text-indigo-650 hover:text-indigo-800 rounded-lg cursor-pointer inline-flex items-center gap-1 font-bold text-[11px]"
        >
          <Eye className="w-4 h-4" />
          {language === 'en' ? 'View' : 'Detail'}
        </button>
      </td>
    </tr>
  );
}
