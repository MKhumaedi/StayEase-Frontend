import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/i18n';
import { 
  LogOut, 
  Search, 
  MapPin, 
  Clock, 
  AlertTriangle,
  CheckCircle2, 
  Eye, 
  X, 
  Calendar,
  Filter,
  RotateCcw,
  Loader2,
  QrCode
} from 'lucide-react';
import QRCode from 'qrcode';

// Deklarasi Interface Properti Komponen Modal Detail
interface BookingDetailModalProps {
  booking: any;
  onClose: () => void;
  language: string;
  formatCurrencyIDR: (v: any) => string;
}

// 1. TRANSFORMASI MENJADI STANDALONE REACT COMPONENT UNTUK MENGHINDARI EROR HOOKS
export function BookingDetailModal({ booking, onClose, language, formatCurrencyIDR }: BookingDetailModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (!booking) return;
    const payload = JSON.stringify({ bookingCode: booking.bookingCode });
    QRCode.toDataURL(payload, { margin: 1, scale: 4 })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error(err));
  }, [booking]);

  const tzOffsetVal = new Date().getTimezoneOffset() * 60000;
  const todayStr = new Date(Date.now() - tzOffsetVal).toISOString().split('T')[0];
  const isLateCheckOut = booking.status === 'CHECKED_IN' && todayStr > booking.endDate;

  const steps = [
    { title: language === 'en' ? 'Reservation Created' : 'Reservasi Dibuat', date: booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A', done: true },
    { title: language === 'en' ? 'Payment Confirmed' : 'Pembayaran Dikonfirmasi', date: booking.status !== 'WAITING_PAYMENT' ? 'Confirmed' : '', done: booking.status !== 'WAITING_PAYMENT' },
    { title: language === 'en' ? 'Checked-In' : 'Checked-In', date: booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleDateString() : '', done: !!booking.checkedInAt }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl w-full max-w-2xl p-6 relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="pb-2 border-b border-slate-100 flex justify-between items-start">
          <div>
            <h3 className="font-bold text-base text-indigo-950 flex items-center gap-2 font-display">
              {language === 'en' ? 'Booking Profile & Timeline' : 'Profil Reservasi & Garis Waktu'}
              {isLateCheckOut && <span className="bg-red-50 text-red-600 text-[9px] px-2 py-0.5 rounded font-black tracking-wide border border-red-200">LATE</span>}
            </h3>
            <p className="text-xs text-slate-400 font-mono font-bold mt-0.5">Code: {booking.bookingCode}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start text-xs font-semibold text-slate-600">
          <div className="md:col-span-8 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block tracking-wider">Guest Name</span>
                <span className="text-slate-800 font-bold block mt-0.5">{booking.guestName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block tracking-wider">Phone</span>
                <span className="text-slate-800 font-bold block mt-0.5">{booking.guestPhone}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 uppercase block tracking-wider">Property Context</span>
                <span className="text-slate-800 font-bold block mt-0.5">{booking.property?.name ?? 'N/A'} (Room: {booking.room?.name ?? 'General'})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block tracking-wider">Check-In Schedule</span>
                <span className="text-slate-800 block mt-0.5 font-normal">{booking.startDate} to {booking.endDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block tracking-wider">Total Amount</span>
                <span className="text-indigo-600 font-black block mt-0.5">{formatCurrencyIDR(booking.totalAmount)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-3">Live Progress Timeline</span>
              <div className="flex flex-col gap-3">
                {steps.map((st, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${st.done ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                    <div className="flex-1 flex justify-between text-xs">
                      <span className={st.done ? 'text-slate-800 font-bold' : 'text-slate-400'}>{st.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{st.date || '--'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center gap-2">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Boarding Token QR</span>
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR" className="w-32 h-32 bg-white p-1 rounded-xl border border-slate-200" />
            ) : (
              <div className="w-32 h-32 bg-slate-200 rounded-xl flex items-center justify-center animate-pulse">
                <QrCode className="w-6 h-6 text-slate-400" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. MAIN PAGE COMPONENT
export default function TodayCheckOutPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { token } = useAuth();
  const { language, formatCurrencyIDR } = useLanguage();
  const [bookings, setBookings] = useState<any[]>([]);
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

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('CHECKED_IN'); 
  const [propertyId, setPropertyId] = useState('ALL');
  const [properties, setProperties] = useState<any[]>([]);

  const loadBookings = () => {
    if (!token) return;
    setLoading(true);
    const authHeader: HeadersInit = { 'Authorization': `Bearer ${token}` };
    
    const queryParams = new URLSearchParams();
    queryParams.set('status', status);
    if (status === 'CHECKED_IN') {
      queryParams.set('checkoutRequested', 'true');
      queryParams.set('checkedOutAtNull', 'true');
    }
    queryParams.set('limit', '100');

    if (startDate) queryParams.set('startDate', startDate);
    if (endDate) queryParams.set('endDate', endDate);
    if (propertyId && propertyId !== 'ALL') queryParams.set('propertyId', propertyId);
    if (searchQuery) queryParams.set('search', searchQuery);

    const url = `/api/bookings?${queryParams.toString()}`;
    fetch(url, { headers: authHeader })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch checkout records');
        return res.json();
      })
      .then(data => {
        setBookings(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('[BOOKING FRONTEND AUDIT] Error fetching bookings:', err);
        setLoading(false);
      });
  };

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
      loadBookings();
    };

    window.addEventListener('stayease:refresh_bookings', handleRefresh);
    return () => {
      window.removeEventListener('stayease:refresh_bookings', handleRefresh);
    };
  }, [token, startDate, endDate, status, propertyId, searchQuery]);

  // Auto-close success toast after 3 seconds
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => {
        setSuccessToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Auto-close error toast after 3 seconds
  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => {
        setErrorToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatus('CHECKED_IN');
    setPropertyId('ALL');
    setSearchQuery('');
  };

  const tzOffset = new Date().getTimezoneOffset() * 60000;
  const todayStr = new Date(Date.now() - tzOffset).toISOString().split('T')[0];

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

  return (
    <div className="flex flex-col gap-6 text-slate-800 font-sans">

      {/* Header operations area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-indigo-950 flex items-center gap-2 font-display">
            <LogOut className="w-5 h-5 text-indigo-600" />
            {language === 'en' ? "Guest Departures Ledger" : 'Daftar Keberangkatan Tamu'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'en' 
              ? 'Displaying guests currently staying and scheduled to depart' 
              : 'Menampilkan tamu yang saat ini menginap dan dijadwalkan keluar'}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
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
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
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
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3 text-indigo-500" />
              <span>{language === 'en' ? 'Status' : 'Status'}</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
            >
              <option value="CHECKED_IN">{language === 'en' ? 'Active In House' : 'Dalam Kamar (Aktif)'}</option>
              <option value="CHECKED_OUT">{language === 'en' ? 'Checked-Out' : 'Sudah Keluar'}</option>
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
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
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
                placeholder={language === 'en' ? 'Guest, Code...' : 'Tamu, Kode...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pr-8"
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
            {language === 'en' ? `Found ${bookings.length} matching entries` : `Ditemukan ${bookings.length} entri yang sesuai`}
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

      {/* Main Data Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-indigo-900 gap-2 font-bold text-xs">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{language === 'en' ? 'Loading departures ledger...' : 'Memuat data keberangkatan...'}</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="border border-dashed border-slate-200 bg-white rounded-2xl p-14 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-700">{language === 'en' ? 'No Stays to Checkout' : 'Tidak Ada Tamu yang Perlu Check-Out'}</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-normal">
            {language === 'en' ? 'All active checked-in travelers have already departed or no stays match filters.' : 'Semua wisatawan aktif telah keluar atau tidak ada menginap yang cocok dengan kriteria filter.'}
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
                <th className="py-3 px-4 w-40">{language === 'en' ? 'Status' : 'Status'}</th>
                <th className="py-3 px-4 text-right w-28">{language === 'en' ? 'Actions' : 'Aksi'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
              {bookings.map((b) => {
                const isLateCheckOut = todayStr > b.endDate;
                const isTodayCheckOut = b.endDate === todayStr;

                return (
                  <tr key={b.id} className={`hover:bg-slate-50/40 transition-colors ${isLateCheckOut ? 'bg-red-50/10' : ''}`}>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{b.guestName}</span>
                      <span className="text-[10px] text-slate-400 font-normal font-mono">{b.guestPhone}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{b.bookingCode}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-700">{b.property?.name ?? 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 font-normal">Room: {b.room?.name ?? 'General'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-650 font-normal">{b.startDate}</td>
                    <td className="py-3.5 px-4 text-slate-650 font-bold">{b.endDate}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border uppercase tracking-wider ${
                          b.status === 'CHECKED_OUT' 
                            ? 'bg-slate-100 text-slate-700 border-slate-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {b.status === 'CHECKED_OUT' ? (language === 'en' ? 'CHECKED OUT' : 'SUDAH KELUAR') : (language === 'en' ? 'IN HOUSE' : 'DALAM KAMAR')}
                        </span>
                        
                        {b.status !== 'CHECKED_OUT' && isLateCheckOut && (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide border border-red-200 animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            LATE CHECKOUT
                          </span>
                        )}

                        {b.status !== 'CHECKED_OUT' && isTodayCheckOut && (
                          <span className="bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide">
                            {language === 'en' ? 'DEPARTURE TODAY' : 'DEPARTUR HARI INI'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg cursor-pointer border-0 bg-transparent"
                          title={language === 'en' ? 'View Details' : 'Lihat Detail'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {b.status === 'CHECKED_IN' && (
                          <button
                            onClick={() => setCheckOutModalBooking(b)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wide transition-all cursor-pointer border-0 shadow-3xs ${
                              isLateCheckOut 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : 'bg-indigo-900 hover:bg-indigo-950 text-white'
                            }`}
                          >
                            {language === 'en' ? 'Check-Out' : 'Check-Out'}
                          </button>
                        )}
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
          <div className="bg-white rounded-3xl border border-slate-150 shadow-xl w-full max-w-sm p-6 relative flex flex-col gap-4">
            <button 
              onClick={() => setCheckOutModalBooking(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-indigo-950 font-display">
                {language === 'en' ? 'Confirm Guest Departure' : 'Konfirmasi Keberangkatan Tamu'}
              </h3>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl flex flex-col gap-2 text-xs font-semibold text-slate-600">
              <div className="flex justify-between border-b border-slate-200/40 pb-1.5">
                <span>Guest:</span>
                <strong className="text-slate-900">{checkOutModalBooking.guestName}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/40 pb-1.5">
                <span>Code:</span>
                <strong className="text-indigo-600 font-mono font-bold">{checkOutModalBooking.bookingCode}</strong>
              </div>
              <div className="flex justify-between">
                <span>Room:</span>
                <strong className="text-slate-900">{checkOutModalBooking.room?.name ?? 'General'}</strong>
              </div>
            </div>

            <div className="flex gap-2.5 mt-2">
              <button
                onClick={() => setCheckOutModalBooking(null)}
                className="flex-1 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border-0 cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                onClick={() => handleConfirmCheckOut(checkOutModalBooking.id)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl border-0 cursor-pointer shadow-3xs"
              >
                {language === 'en' ? 'Confirm Check-Out' : 'Konfirmasi Check-Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PEMANGGILAN KOMPONEN MODAL SEBAGAI STANDALONE COMPONENT (<BookingDetailModal />) */}
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
          <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow-2xl max-w-sm border border-emerald-500 flex flex-col gap-3 relative">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-black text-xs tracking-tight">{language === 'en' ? 'Check-out Confirmed' : 'Check-out Dikonfirmasi'}</h4>
                <p className="text-[10px] text-emerald-100 font-semibold">{successToast.guestName} ({successToast.bookingCode})</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-rose-600 text-white rounded-2xl p-4 shadow-2xl max-w-sm border border-rose-500 flex items-center gap-3 relative">
            <X className="w-4 h-4 text-white shrink-0" />
            <p className="text-[11px] font-bold">{errorToast}</p>
          </div>
        </div>
      )}

    </div>
  );
}