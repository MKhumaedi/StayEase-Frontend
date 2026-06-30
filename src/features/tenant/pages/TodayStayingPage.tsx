import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/i18n';
import { 
  ClipboardList, 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Eye, 
  X,
  UserCheck,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { renderBookingDetailModal } from './TodayCheckInPage';

export default function TodayStayingPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { token } = useAuth();
  const { language, formatCurrencyIDR } = useLanguage();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [checkOutModalBooking, setCheckOutModalBooking] = useState<any>(null);

  // Load bookings
  const loadBookings = () => {
    setLoading(true);
    const authHeader: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch('/api/bookings', { headers: authHeader })
      .then(res => res.json())
      .then(data => {
        setBookings(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching bookings:', err);
        setLoading(false);
      });
  };

  const handleConfirmCheckOut = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check-out');
      }
      loadBookings();
      setCheckOutModalBooking(null);
      alert(language === 'en' ? 'Check-out recorded successfully!' : 'Check-out berhasil dicatat!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [token]);

  const tzOffset = new Date().getTimezoneOffset() * 60000;
  const todayStr = new Date(Date.now() - tzOffset).toISOString().split('T')[0];

  // Filters: status === 'CHECKED_IN' (displays every guest already checked in)
  const filteredBookings = bookings.filter(b => {
    const matchesCheckedIn = b.status === 'CHECKED_IN';
    if (!matchesCheckedIn) return false;

    if (searchQuery) {
      const field = (b.guestName + ' ' + b.bookingCode + ' ' + (b.property?.name || '')).toLowerCase();
      return field.includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6">

      {/* Header operations area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-indigo-950 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-650" />
            {language === 'en' ? "In-House Guests (Staying)" : 'Tamu Sedang Menginap'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'en' 
              ? 'Displaying all guests currently checked-in and staying in your properties' 
              : 'Menampilkan semua tamu yang saat ini telah check-in dan menginap di properti Anda'}
          </p>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search by Guest Name, Booking Code, Property...' : 'Cari Nama Tamu, Kode Reservasi, Properti...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white outline-none"
          />
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="text-center py-10 text-slate-500 text-xs">{language === 'en' ? 'Loading staying guests...' : 'Memuat tamu menginap...'}</div>
      ) : filteredBookings.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <UserCheck className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">{language === 'en' ? 'No Guests Staying' : 'Tidak Ada Tamu yang Sedang Menginap'}</p>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en' ? 'There are currently no active in-house checked-in guests.' : 'Saat ini tidak ada tamu aktif yang sudah check-in.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                <th className="py-3 px-4">{language === 'en' ? 'Guest Name' : 'Nama Tamu'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'Booking Code' : 'Kode Booking'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'Property & Room' : 'Properti & Kamar'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'Check-In' : 'Tgl Masuk'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'Check-Out' : 'Tgl Keluar'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'Status' : 'Status'}</th>
                <th className="py-3 px-4 text-right">{language === 'en' ? 'Actions' : 'Aksi'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((b) => {
                const isLateCheckOut = todayStr > b.endDate;
                return (
                  <tr key={b.id} className={`hover:bg-slate-55/50 transition-colors ${isLateCheckOut ? 'bg-red-50/20' : ''}`}>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 block">{b.guestName}</span>
                      <span className="text-[10px] text-slate-450 font-medium font-mono">{b.guestPhone}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{b.bookingCode}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-700">{b.property?.name ?? 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Room: {b.room?.name ?? 'General'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-650 font-medium">{b.startDate}</td>
                    <td className="py-3.5 px-4 text-slate-650 font-bold">{b.endDate}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[9px] font-bold">
                          {language === 'en' ? 'IN-HOUSE' : 'DI DALAM UNIT'}
                        </span>
                        {isLateCheckOut && (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide border border-red-200">
                            LATE CHECKOUT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg cursor-pointer"
                          title={language === 'en' ? 'View Details' : 'Lihat Detail'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCheckOutModalBooking(b)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-50 hover:bg-indigo-650 text-indigo-700 hover:text-white transition-all cursor-pointer"
                        >
                          {language === 'en' ? 'Check-Out' : 'Check-Out'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Check-Out Confirmation Modal */}
      {checkOutModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl w-full max-w-sm p-6 relative flex flex-col gap-5">
            <button 
              onClick={() => setCheckOutModalBooking(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-indigo-950">
                {language === 'en' ? 'Confirm Guest Departure' : 'Konfirmasi Keberangkatan Tamu'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'en' ? 'This will record checked-out metrics for this reservation' : 'Ini akan mencatat metrik keberangkatan tamu dari kamar'}
              </p>
            </div>

            {/* Content card */}
            <div className="bg-slate-50 p-4 rounded-2xl flex flex-col gap-2.5 text-xs text-slate-650">
              <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                <span className="text-slate-400 font-semibold">{language === 'en' ? 'Guest:' : 'Tamu:'}</span>
                <strong className="text-slate-800">{checkOutModalBooking.guestName}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                <span className="text-slate-400 font-semibold">{language === 'en' ? 'Booking Code:' : 'Pemesanan:'}</span>
                <strong className="text-indigo-600 font-mono font-bold">{checkOutModalBooking.bookingCode}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                <span className="text-slate-400 font-semibold">{language === 'en' ? 'Property:' : 'Properti:'}</span>
                <strong className="text-slate-800">{checkOutModalBooking.property?.name ?? 'N/A'}</strong>
              </div>
              <div className="flex justify-between pb-0.5">
                <span className="text-slate-400 font-semibold">{language === 'en' ? 'Room:' : 'Kamar:'}</span>
                <strong className="text-slate-800">{checkOutModalBooking.room?.name ?? 'General'}</strong>
              </div>
            </div>

            <p className="text-center text-xs font-bold text-indigo-950">
              {language === 'en' ? 'Confirm guest departure?' : 'Konfirmasi keberangkatan tamu?'}
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setCheckOutModalBooking(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-bold rounded-xl cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                onClick={() => handleConfirmCheckOut(checkOutModalBooking.id)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                {language === 'en' ? 'Confirm Check-Out' : 'Konfirmasi Check-Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && renderBookingDetailModal(selectedBooking, () => setSelectedBooking(null), language, formatCurrencyIDR)}

    </div>
  );
}
