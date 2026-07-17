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
  AlertTriangle,
  Calendar,
  Filter,
  RotateCcw
} from 'lucide-react';
import { BookingDetailModal } from './TodayCheckInPage';

export default function TodayStayingPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { token } = useAuth();
  const { language, formatCurrencyIDR } = useLanguage();
  const [bookings, setBookings] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [checkOutModalBooking, setCheckOutModalBooking] = useState<any>(null);
  const [successToast, setSuccessToast] = useState<{
    bookingCode: string;
    guestName: string;
    property: string;
    time: string;
  } | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Operational Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [propertyId, setPropertyId] = useState('ALL');
  const [stayStatus, setStayStatus] = useState('ALL'); // ALL, LATE_CHECKOUT, NORMAL

  // Load bookings using database-level filtering for precise operational alignment
  const loadBookings = () => {
    setLoading(true);
    const authHeader: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch('/api/bookings?status=CHECKED_IN&limit=100', { headers: authHeader })
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

  // Fetch properties for dropdown on mount
  useEffect(() => {
    if (!token) return;
    const authHeader: HeadersInit = { 'Authorization': `Bearer ${token}` };
    fetch('/api/properties?byTenant=true', { headers: authHeader })
      .then(res => res.json())
      .then(data => {
        setProperties(data.data || []);
      })
      .catch(err => console.error('Error fetching tenant properties:', err));
  }, [token]);

  useEffect(() => {
    loadBookings();

    const handleRefresh = () => {
      const authHeader: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      fetch('/api/bookings?status=CHECKED_IN&limit=100', { headers: authHeader })
        .then(res => res.json())
        .then(data => {
          setBookings(data.data || []);
        })
        .catch(err => {
          console.error('Error refreshing bookings:', err);
        });
    };

    window.addEventListener('stayease:refresh_bookings', handleRefresh);
    return () => {
      window.removeEventListener('stayease:refresh_bookings', handleRefresh);
    };
  }, [token]);

  // Auto-close toasts
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setPropertyId('ALL');
    setStayStatus('ALL');
    setSearchQuery('');
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
      
      const targetBooking = bookings.find(b => b.id === bookingId) || checkOutModalBooking;
      setCheckOutModalBooking(null);
      loadBookings();

      const timeStr = new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      setSuccessToast({
        bookingCode: targetBooking?.bookingCode || 'N/A',
        guestName: targetBooking?.guestName || 'N/A',
        property: targetBooking?.property?.name || 'N/A',
        time: timeStr
      });

      window.dispatchEvent(new CustomEvent('stayease:refresh_bookings'));
      window.dispatchEvent(new CustomEvent('stayease:refresh_notifications'));
    } catch (err: any) {
      setErrorToast(err.message || 'An error occurred during check-out');
    }
  };

  const tzOffset = new Date().getTimezoneOffset() * 60000;
  const todayStr = new Date(Date.now() - tzOffset).toISOString().split('T')[0];

  // Client-side composite filtering
  const filteredBookings = bookings.filter(b => {
    if (b.status !== 'CHECKED_IN') return false;

    const isLateCheckOut = todayStr > b.endDate;

    // Filter by Stay Status
    if (stayStatus === 'LATE_CHECKOUT' && !isLateCheckOut) return false;
    if (stayStatus === 'NORMAL' && isLateCheckOut) return false;

    // Filter by Property
    if (propertyId !== 'ALL' && b.property?.id !== propertyId) return false;

    // Filter by Start/End Dates (Operational range checking)
    if (startDate && b.startDate < startDate) return false;
    if (endDate && b.endDate > endDate) return false;

    // Filter by Search Query
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

      {/* Unified Filter Toolbar */}
      <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5 text-xs">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-indigo-500" />
              <span>{language === 'en' ? 'Start Date' : 'Tgl Mulai'}</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-indigo-500" />
              <span>{language === 'en' ? 'End Date' : 'Tgl Selesai'}</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3 text-indigo-500" />
              <span>{language === 'en' ? 'Stay Status' : 'Status In-House'}</span>
            </label>
            <select
              value={stayStatus}
              onChange={(e) => setStayStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">{language === 'en' ? 'All In-House' : 'Semua yang Menginap'}</option>
              <option value="NORMAL">{language === 'en' ? 'Active Session' : 'Sesi Aktif Normal'}</option>
              <option value="LATE_CHECKOUT">{language === 'en' ? 'Late Check-Out' : 'Terlambat Check-Out'}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-indigo-500" />
              <span>{language === 'en' ? 'Property' : 'Properti'}</span>
            </label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">{language === 'en' ? 'All Properties' : 'Semua Properti'}</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2 md:col-span-4 lg:col-span-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Search className="w-3 h-3 text-indigo-500" />
              <span>{language === 'en' ? 'Search' : 'Cari'}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={language === 'en' ? 'Guest Name, Code...' : 'Nama Tamu, Kode...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pr-8"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
          <div className="text-[11px] text-slate-500 font-semibold">
            {language === 'en' ? `Found ${filteredBookings.length} matching entries` : `Ditemukan ${filteredBookings.length} entri yang sesuai`}
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Clear Filters' : 'Bersihkan Filter'}</span>
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div className="text-center py-20 text-indigo-900 text-xs font-bold">{language === 'en' ? 'Loading staying guests...' : 'Memuat tamu menginap...'}</div>
      ) : filteredBookings.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-2xl p-14 text-center bg-white">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <UserCheck className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-700">{language === 'en' ? 'No Guests Staying' : 'Tidak Ada Tamu yang Sedang Menginap'}</p>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'en' ? 'Try adjusting your operational filter matrix.' : 'Coba ubah kombinasi filter operasional Anda.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-150 rounded-xl bg-white shadow-3xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-black text-[9px]">
                <th className="py-3 px-4">{language === 'en' ? 'Guest Name' : 'Nama Tamu'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'Booking Code' : 'Kode Booking'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'Property & Room' : 'Properti & Kamar'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'Check-In' : 'Tgl Masuk'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'Check-Out' : 'Tgl Keluar'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'Status' : 'Status'}</th>
                <th className="py-3 px-4 text-right w-28">{language === 'en' ? 'Actions' : 'Aksi'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
              {filteredBookings.map((b) => {
                const isLateCheckOut = todayStr > b.endDate;
                return (
                  <tr key={b.id} className={`hover:bg-slate-50/40 transition-colors ${isLateCheckOut ? 'bg-red-50/10' : ''}`}>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <span>{b.guestName}</span>
                      <span className="text-[10px] text-slate-400 font-mono block font-normal mt-0.5">{b.guestPhone}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{b.bookingCode}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-700">{b.property?.name ?? 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 font-normal">Room: {b.room?.name ?? 'General'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{b.startDate}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-bold">{b.endDate}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                          {language === 'en' ? 'IN-HOUSE' : 'DI DALAM UNIT'}
                        </span>
                        {isLateCheckOut && (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide border border-red-200 animate-pulse">
                            LATE CHECKOUT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg cursor-pointer border-0 bg-transparent"
                          title={language === 'en' ? 'View Details' : 'Lihat Detail'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCheckOutModalBooking(b)}
                          className="px-2.5 py-1 rounded-md text-[10px] font-black tracking-wide bg-indigo-50 hover:bg-indigo-650 text-indigo-700 hover:text-white transition-all cursor-pointer border-0 shadow-3xs"
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
          <div className="bg-white rounded-3xl border border-slate-150 shadow-xl w-full max-w-sm p-6 relative flex flex-col gap-5">
            <button 
              onClick={() => setCheckOutModalBooking(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer"
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

            <div className="bg-slate-50 p-4 rounded-2xl flex flex-col gap-2.5 text-xs text-slate-600 font-semibold">
              <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                <span className="text-slate-400">{language === 'en' ? 'Guest:' : 'Tamu:'}</span>
                <strong className="text-slate-800">{checkOutModalBooking.guestName}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                <span className="text-slate-400">{language === 'en' ? 'Booking Code:' : 'Pemesanan:'}</span>
                <strong className="text-indigo-600 font-mono font-bold">{checkOutModalBooking.bookingCode}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                <span className="text-slate-400">{language === 'en' ? 'Property:' : 'Properti:'}</span>
                <strong className="text-slate-800">{checkOutModalBooking.property?.name ?? 'N/A'}</strong>
              </div>
              <div className="flex justify-between pb-0.5">
                <span className="text-slate-400">{language === 'en' ? 'Room:' : 'Kamar:'}</span>
                <strong className="text-slate-800">{checkOutModalBooking.room?.name ?? 'General'}</strong>
              </div>
            </div>

            <p className="text-center text-xs font-bold text-indigo-950">
              {language === 'en' ? 'Confirm guest departure?' : 'Konfirmasi keberangkatan tamu?'}
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setCheckOutModalBooking(null)}
                className="flex-1 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border-0 cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                onClick={() => handleConfirmCheckOut(checkOutModalBooking.id)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer border-0"
              >
                {language === 'en' ? 'Confirm Check-Out' : 'Konfirmasi Check-Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Detail Modal Component */}
      {selectedBooking && (
        <BookingDetailModal 
          booking={selectedBooking} 
          onClose={() => setSelectedBooking(null)} 
          language={language} 
          formatCurrencyIDR={formatCurrencyIDR} 
        />
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-emerald-600 text-white rounded-2xl p-5 shadow-2xl max-w-sm border border-emerald-500 flex flex-col gap-3 relative">
            <button 
              onClick={() => setSuccessToast(null)}
              className="absolute top-3 right-3 text-emerald-100 hover:text-white cursor-pointer border-0 bg-transparent"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm tracking-tight">{language === 'en' ? 'Check-out Confirmed' : 'Check-out Dikonfirmasi'}</h4>
                <p className="text-[11px] text-emerald-100">{language === 'en' ? 'Guest check-out session successfully archived.' : 'Sesi check-out tamu berhasil disimpan.'}</p>
              </div>
            </div>
            <div className="bg-emerald-700/30 rounded-xl p-3 flex flex-col gap-1.5 text-[11px] border border-emerald-500/20">
              <div className="flex justify-between">
                <span className="text-emerald-100 font-medium">{language === 'en' ? 'Guest:' : 'Tamu:'}</span>
                <span className="font-bold">{successToast.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-100 font-medium">{language === 'en' ? 'Booking Code:' : 'Pemesanan:'}</span>
                <span className="font-mono font-bold">{successToast.bookingCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-100 font-medium">{language === 'en' ? 'Property:' : 'Properti:'}</span>
                <span className="font-semibold">{successToast.property}</span>
              </div>
              <div className="flex justify-between border-t border-emerald-500/20 pt-1.5 mt-0.5">
                <span className="text-emerald-100 font-medium">{language === 'en' ? 'Checkout Time:' : 'Waktu Keluar:'}</span>
                <span className="font-bold">{successToast.time}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-rose-600 text-white rounded-2xl p-4 shadow-2xl max-w-sm border border-rose-500 flex items-center gap-3 relative">
            <button 
              onClick={() => setErrorToast(null)}
              className="absolute top-2 right-2 text-rose-100 hover:text-white cursor-pointer border-0 bg-transparent"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="w-7 h-7 rounded-full bg-rose-550/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div className="pr-4">
              <h5 className="font-bold text-xs">{language === 'en' ? 'Error' : 'Kesalahan'}</h5>
              <p className="text-[10px] text-rose-100">{errorToast}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}