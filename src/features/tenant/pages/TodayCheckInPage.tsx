import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/i18n';
import { formatWithSettings } from '../../../shared/services/dateService';
import { 
  UserCheck, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  QrCode, 
  Eye, 
  X, 
  FileText,
  Scan,
  AlertCircle,
  Calendar,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';

export default function TodayCheckInPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { token, user } = useAuth();
  const isValidatingRef = React.useRef(false);
  const { language, formatCurrencyIDR } = useLanguage();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [checkInModalBooking, setCheckInModalBooking] = useState<any>(null);
  const [successToast, setSuccessToast] = useState<{
    bookingCode: string;
    guestName: string;
    property: string;
    time: string;
  } | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  
  // QR scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [qrFileError, setQrFileError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [scannedBookingData, setScannedBookingData] = useState<any>(null);

  // Real camera scan states
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [scannerInstance, setScannerInstance] = useState<Html5Qrcode | null>(null);
  const [loadingBookingDetails, setLoadingBookingDetails] = useState(false);
  const [scannerError, setScannerError] = useState('');

  // Enhanced Filter & Pagination States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('WAITING_CHECKIN');
  const [propertyId, setPropertyId] = useState('ALL');
  const [properties, setProperties] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Load bookings from Server-side
  const loadBookings = () => {
    if (!token) return;
    setLoading(true);
    const authHeader: HeadersInit = { 'Authorization': `Bearer ${token}` };
    
    const queryParams = new URLSearchParams();
    queryParams.set('page', page.toString());
    queryParams.set('limit', limit.toString());
    queryParams.set('checkInOnly', 'true');

    if (startDate) queryParams.set('startDate', startDate);
    if (endDate) queryParams.set('endDate', endDate);
    if (status && status !== 'ALL') queryParams.set('status', status);
    if (propertyId && propertyId !== 'ALL') queryParams.set('propertyId', propertyId);
    if (searchQuery) queryParams.set('search', searchQuery);

    fetch(`/api/bookings?${queryParams.toString()}`, { headers: authHeader })
      .then(res => {
        if (!res.ok) throw new Error('Network response error');
        return res.json();
      })
      .then(data => {
        setBookings(data.data || []);
        setTotal(data.total || 0);
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

  // Handle auto reload on changes or manual refresh event
  useEffect(() => {
    loadBookings();

    const handleRefresh = () => {
      loadBookings();
    };

    window.addEventListener('stayease:refresh_bookings', handleRefresh);
    return () => {
      window.removeEventListener('stayease:refresh_bookings', handleRefresh);
    };
  }, [token, page, limit, startDate, endDate, status, propertyId, searchQuery]);

  // Helpers to reset page to 1 on filter adjustments
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setPage(1);
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setPage(1);
  };

  const handlePropertyChange = (val: string) => {
    setPropertyId(val);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatus('WAITING_CHECKIN');
    setPropertyId('ALL');
    setSearchQuery('');
    setPage(1);
  };

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

  const closeScanner = async () => {
    if (scannerInstance) {
      try {
        if (scannerInstance.isScanning) {
          await scannerInstance.stop();
        }
      } catch (e) {
        console.error("Error stopping scanner:", e);
      }
      setScannerInstance(null);
    }
    setShowScanner(false);
    setPermissionState('prompt');
    setQrFileError('');
    setScannedBookingData(null);
    setScannerError('');
    setManualCode('');
    isValidatingRef.current = false;
  };

  const startCameraScanning = async () => {
    setQrFileError('');
    setScannerError('');
    setScannedBookingData(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      stream.getTracks().forEach(track => track.stop());
      setPermissionState('granted');
    } catch (err: any) {
      console.error("Camera permission denied or error:", err);
      setPermissionState('denied');
      setScannerError(language === 'en' ? "Camera access is required to scan guest QR codes." : "Akses kamera diperlukan untuk memindai kode QR tamu.");
    }
  };

  const validateAndShowBooking = async (codeStr: string) => {
    let decoded = codeStr;
    try { decoded = decodeURIComponent(codeStr); } catch (e) {}

    const cleaned = decoded.trim()
      .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "")
      .replace(/\r?\n|\r/g, "");

    let extractedCode = '';

    if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === 'object') {
          const keys = Object.keys(parsed);
          const bkCodeKey = keys.find(k => k.toLowerCase() === 'bookingcode');
          const codeKey = keys.find(k => k.toLowerCase() === 'code');
          
          if (bkCodeKey) extractedCode = String(parsed[bkCodeKey]);
          else if (codeKey) extractedCode = String(parsed[codeKey]);
        }
      } catch (jsonErr) {}
    }

    if (!extractedCode) {
      const urlMatch = cleaned.match(/\/checkin\/([A-Za-z0-9-]+)/i) || 
                      cleaned.match(/\/bookings\/([A-Za-z0-9-]+)/i) ||
                      cleaned.match(/\/code\/([A-Za-z0-9-]+)/i);
      if (urlMatch && urlMatch[1]) extractedCode = urlMatch[1];
    }

    if (!extractedCode) {
      const lineMatch = cleaned.match(/Booking Code:\s*([A-Za-z0-9-]+)/i);
      if (lineMatch && lineMatch[1]) extractedCode = lineMatch[1];
    }

    if (!extractedCode) {
      const genericMatch = cleaned.match(/(SE-[A-Za-z0-9-]+)/i) || 
                          cleaned.match(/(BK-[A-Za-z0-9-]+)/i) || 
                          cleaned.match(/(SE-\d+)/i) ||
                          cleaned.match(/(BK-\d+)/i);
      if (genericMatch && genericMatch[1]) extractedCode = genericMatch[1];
    }

    if (!extractedCode) extractedCode = cleaned;

    const normalizedCode = extractedCode.trim().toUpperCase();

    if (!normalizedCode) {
      setQrFileError(language === 'en' ? "Please provide a booking code." : "Harap masukkan kode booking.");
      return;
    }

    setLoadingBookingDetails(true);
    setQrFileError('');
    isValidatingRef.current = true;

    try {
      const payload = { bookingCode: normalizedCode };
      const formattedCode = encodeURIComponent(JSON.stringify(payload));

      const response = await fetch(`/api/bookings/code/${formattedCode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(language === 'en' ? "Booking QR not recognized." : "Pemesanan tidak ditemukan atau Kode QR tidak dikenal.");
        }
        const data = await response.json();
        throw new Error(data.error || "Failed to validate booking");
      }

      const booking = await response.json();

      if (booking.status === 'AUTO_EXPIRED') {
        throw new Error(language === 'en' ? "Reservation already expired." : "Pemesanan sudah kedaluwarsa.");
      }

      if (booking.status === 'CANCELLED') {
        throw new Error(language === 'en' ? "Reservation has been cancelled." : "Pemesanan telah dibatalkan.");
      }

      if (booking.status === 'CHECKED_IN' || booking.status === 'CHECKED_OUT' || booking.status === 'COMPLETED') {
        throw new Error(language === 'en' ? "Guest already checked in." : "Tamu sudah melakukan check-in.");
      }

      if (booking.status !== 'CONFIRMED' && booking.status !== 'WAITING_CHECKIN') {
        throw new Error(
          language === 'en' 
            ? `Reservation is not ready for check-in. (Status: ${booking.status})` 
            : `Pemesanan belum siap untuk check-in. (Status: ${booking.status})`
        );
      }

      if (navigator.vibrate) {
        try { navigator.vibrate(200); } catch (e) {}
      }

      setScannedBookingData(booking);
      
      if (scannerInstance && scannerInstance.isScanning) {
        await scannerInstance.stop();
      }
    } catch (err: any) {
      setQrFileError(err.message || (language === 'en' ? "Booking QR not recognized." : "Kode QR tidak dikenal."));
      isValidatingRef.current = false;
      if (scannerInstance && scannerInstance.isScanning) {
        try { scannerInstance.resume(); } catch (e) {}
      }
    } finally {
      setLoadingBookingDetails(false);
    }
  };

  const handleQrDetected = async (text: string) => {
    if (isValidatingRef.current) return;
    isValidatingRef.current = true;

    if (scannerInstance && scannerInstance.isScanning) {
      try { scannerInstance.pause(true); } catch (e) {}
    }

    try {
      if (!text) throw new Error(language === 'en' ? "QR content is empty." : "Konten QR kosong.");

      let decoded = text;
      try { decoded = decodeURIComponent(text); } catch (e) {}

      let cleaned = decoded.trim()
        .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "")
        .replace(/\r?\n|\r/g, " ");

      let code = '';
      const jsonMatch = cleaned.match(/\{.*\}/);
      if (jsonMatch) {
        try {
          const payload = JSON.parse(jsonMatch[0]);
          if (payload && typeof payload === 'object') {
            code = payload.bookingCode || payload.code || '';
          }
        } catch (jsonErr) {}
      }

      if (!code) {
        const urlMatch = cleaned.match(/\/checkin\/([A-Za-z0-9-]+)/i) || 
                        cleaned.match(/\/bookings\/([A-Za-z0-9-]+)/i) ||
                        cleaned.match(/\/code\/([A-Za-z0-9-]+)/i);
        if (urlMatch && urlMatch[1]) code = urlMatch[1];
      }

      if (!code) {
        const lineMatch = cleaned.match(/Booking Code:\s*([A-Za-z0-9-]+)/i);
        if (lineMatch && lineMatch[1]) code = lineMatch[1];
      }

      if (!code) {
        const seMatch = cleaned.match(/(SE-[A-Za-z0-9-]+)/i) || cleaned.match(/(SE-\d+)/i);
        if (seMatch && seMatch[1]) code = seMatch[1];
      }

      if (!code) code = cleaned;

      const normalizedCode = code.trim().toUpperCase();
      if (!normalizedCode) throw new Error("Invalid payload format");

      await validateAndShowBooking(normalizedCode);
    } catch (err: any) {
      setQrFileError(err.message || "Error parsing QR");
      isValidatingRef.current = false;
      if (scannerInstance && scannerInstance.isScanning) {
        try { scannerInstance.resume(); } catch (e) {}
      }
    }
  };

  useEffect(() => {
    if (showScanner && permissionState === 'granted' && !scannedBookingData) {
      const qrcode = new Html5Qrcode("qr-scanner-view-element");
      setScannerInstance(qrcode);

      const delayTimer = setTimeout(() => {
        qrcode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            },
            aspectRatio: 1.0
          },
          (decodedText) => { handleQrDetected(decodedText); },
          () => {}
        ).catch(err => {
          console.error("Scanner failed to start:", err);
          setScannerError(language === 'en' ? "Failed to establish camera stream." : "Gagal membangun aliran kamera.");
        });
      }, 300);

      return () => {
        clearTimeout(delayTimer);
        if (qrcode.isScanning) {
          qrcode.stop().catch(e => console.error(e));
        }
      };
    }
  }, [showScanner, permissionState, scannedBookingData]);

  const handleConfirmCheckIn = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check-in');
      }

      const targetBooking = bookings.find(b => b.id === bookingId) || checkInModalBooking || scannedBookingData;

      loadBookings();
      setCheckInModalBooking(null);
      setScannedBookingData(null);
      closeScanner();

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
      setErrorToast(err.message || 'An error occurred during check-in');
    }
  };

  const handleSimulateScan = () => {
    const pool = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'WAITING_CHECKIN');
    if (pool.length === 0) {
      setQrFileError(language === 'en' ? 'No active arrivals found to simulate.' : 'Tidak ada reservasi aktif untuk disimulasikan.');
      return;
    }
    let match = pool[0];
    if (manualCode) {
      const found = pool.find(b => b.bookingCode.toUpperCase() === manualCode.toUpperCase().trim());
      if (found) match = found;
      else {
        setQrFileError(language === 'en' ? 'Invalid code typed.' : 'Kode salah.');
        return;
      }
    }
    validateAndShowBooking(match.bookingCode);
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const startEntry = total === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header operations area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-indigo-950 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            {language === 'en' ? "Guest Arrivals Ledger" : 'Daftar Kedatangan Tamu'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'en' 
              ? 'Displaying confirmed guest arrivals scheduled for processing' 
              : 'Menampilkan kedatangan tamu terkonfirmasi yang dijadwalkan untuk diproses'}
          </p>
        </div>

        <button
          onClick={() => {
            setShowScanner(true);
            setScannedBookingData(null);
            setQrFileError('');
            setManualCode('');
            startCameraScanning();
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer border-0"
        >
          <QrCode className="w-4 h-4" />
          <span>{language === 'en' ? 'Scan Guest QR Code' : 'Pindai Kode QR Tamu'}</span>
        </button>
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
              onChange={(e) => handleStartDateChange(e.target.value)}
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
              onChange={(e) => handleEndDateChange(e.target.value)}
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
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
            >
              <option value="WAITING_CHECKIN">{language === 'en' ? 'Waiting Check-In' : 'Menunggu Check-In'}</option>
              <option value="CHECKED_IN">{language === 'en' ? 'Checked-In' : 'Sudah Masuk'}</option>
              <option value="CANCELLED">{language === 'en' ? 'Cancelled' : 'Dibatalkan'}</option>
              <option value="ALL">{language === 'en' ? 'All Status' : 'Semua Status'}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-indigo-500" />
              <span>{language === 'en' ? 'Property' : 'Properti'}</span>
            </label>
            <select
              value={propertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
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
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pr-8"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
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
            {language === 'en' ? `Found ${total} matching entries` : `Ditemukan ${total} entri yang sesuai`}
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
        <div className="flex justify-center items-center py-20 text-indigo-900 gap-2 font-bold text-xs">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{language === 'en' ? 'Loading check-ins dynamic ledger...' : 'Memuat data kedatangan dinamis...'}</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="border border-dashed border-slate-200 bg-white rounded-2xl p-14 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-700">
            {language === 'en' ? 'No Check-Ins Found' : 'Tidak Ada Check-In Ditemukan'}
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {language === 'en' 
              ? 'Try modifying your search query or filters to find specific guest check-ins.' 
              : 'Coba ubah kata kunci pencarian atau filter Anda untuk menemukan check-in tamu tertentu.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto border border-slate-150 rounded-xl bg-white shadow-3xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-black text-[9px]">
                  <th className="py-3 px-4">{language === 'en' ? 'Guest Name' : 'Nama Tamu'}</th>
                  <th className="py-3 px-4">{language === 'en' ? 'Booking Code' : 'Kode Booking'}</th>
                  <th className="py-3 px-4">{language === 'en' ? 'Property & Room' : 'Properti & Kamar'}</th>
                  <th className="py-3 px-4">{language === 'en' ? 'Check-In Date' : 'Tgl Masuk'}</th>
                  <th className="py-3 px-4">{language === 'en' ? 'Arrival Time' : 'Waktu Datang'}</th>
                  <th className="py-3 px-4">{language === 'en' ? 'Booking Status' : 'Status Booking'}</th>
                  <th className="py-3 px-4">{language === 'en' ? 'Phone' : 'Telepon'}</th>
                  <th className="py-3 px-4 text-right w-28">{language === 'en' ? 'Actions' : 'Aksi'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-55/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{b.guestName}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{b.bookingCode}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-700">{b.property?.name ?? 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 font-normal">Room: {b.room?.name ?? 'General'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{b.startDate}</td>
                    <td className="py-3.5 px-4">
                      {b.checkedInAt ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="text-blue-700 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(b.checkedInAt).toLocaleTimeString(language === 'en' ? 'en-US' : 'id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {b.checkedInBy && (
                            <span className="text-[10px] text-slate-400 font-normal truncate max-w-[120px]">
                              By: {b.checkedInBy}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-500 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>From 14:00 PM</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        b.status === 'CONFIRMED' || b.status === 'WAITING_CHECKIN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        b.status === 'CHECKED_IN' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        b.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-100' :
                        'bg-slate-50 text-slate-600 border border-slate-100'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {b.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 font-normal">{b.guestPhone}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg cursor-pointer border-0 bg-transparent"
                          title={language === 'en' ? 'View Details' : 'Lihat Detail'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(b.status === 'CONFIRMED' || b.status === 'WAITING_CHECKIN') && (
                          <button
                            onClick={() => setCheckInModalBooking(b)}
                            className="px-2.5 py-1 bg-indigo-900 hover:bg-indigo-950 text-white rounded-md text-[10px] font-black tracking-wide border-0 cursor-pointer shadow-3xs"
                          >
                            Check-In
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Block */}
          {total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs">
              <div className="text-slate-500 font-bold">
                {language === 'en'
                  ? `Showing ${startEntry} to ${endEntry} of ${total} entries`
                  : `Menampilkan ${startEntry} sampai ${endEntry} dari ${total} entri`}
              </div>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 bg-white hover:bg-slate-50 text-slate-655 disabled:opacity-40 disabled:hover:bg-white rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => handlePageChange(pNum)}
                      className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        page === pNum
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 bg-white hover:bg-slate-50 text-slate-655 disabled:opacity-40 disabled:hover:bg-white rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR Code Scanner Overlay */}
      {showScanner && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md relative flex flex-col max-h-[90vh] overflow-y-auto">
            
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/25">
                  <QrCode className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    {language === 'en' ? 'StayEase Front Desk Check-In' : 'Front Desk Check-In StayEase'}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {language === 'en' ? 'Continuous real-time device camera scanning' : 'Pemindaian kamera perangkat real-time kontinu'}
                  </p>
                </div>
              </div>
              <button 
                onClick={closeScanner}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors border-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-5">
              
              {!scannedBookingData && (
                <div className="relative aspect-square w-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center">
                  
                  {permissionState === 'prompt' && !scannerError && (
                    <div className="text-center p-6 flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-4 border-indigo-500/30 border-t-indigo-400 animate-spin" />
                      <p className="text-xs font-semibold text-slate-300">
                        {language === 'en' ? 'Requesting Device Camera Permission...' : 'Meminta Izin Kamera Perangkat...'}
                      </p>
                    </div>
                  )}

                  {(permissionState === 'denied' || scannerError) && (
                    <div className="text-center p-6 flex flex-col items-center gap-3">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                      <p className="text-xs font-bold text-red-200">
                        {language === 'en' ? 'Camera Access Required' : 'Akses Kamera Diperlukan'}
                      </p>
                      <button
                        onClick={startCameraScanning}
                        className="mt-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold border-0 cursor-pointer"
                      >
                        {language === 'en' ? 'Try Again' : 'Coba Lagi'}
                      </button>
                    </div>
                  )}

                  {permissionState === 'granted' && !scannerError && (
                    <>
                      <div id="qr-scanner-view-element" className="w-full h-full object-cover relative z-10" />
                      
                      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6">
                        <div className="flex justify-between">
                          <div className="w-6 h-6 border-t-2 border-l-2 border-indigo-400 rounded-tl-md" />
                          <div className="w-6 h-6 border-t-2 border-r-2 border-indigo-400 rounded-tr-md" />
                        </div>
                        <div className="relative w-full h-1/2 flex items-center justify-center">
                          <div className="absolute inset-x-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_12px_rgba(129,140,248,0.8)] animate-bounce" style={{ animationDuration: '4.5s' }} />
                          <Scan className="w-8 h-8 text-indigo-400/30" />
                        </div>
                        <div className="flex justify-between">
                          <div className="w-6 h-6 border-b-2 border-l-2 border-indigo-400 rounded-bl-md" />
                          <div className="w-6 h-6 border-b-2 border-r-2 border-indigo-400 rounded-br-md" />
                        </div>
                      </div>

                      {loadingBookingDetails && (
                        <div className="absolute inset-0 z-35 bg-slate-950/80 flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                            {language === 'en' ? 'Validating booking...' : 'Memvalidasi booking...'}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {qrFileError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex gap-2.5 items-start text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="leading-relaxed">{qrFileError}</p>
                  </div>
                </div>
              )}

              {scannedBookingData && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-4">
                  <div className="flex justify-between items-start pb-2.5 border-b border-slate-800">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">Verified Arrival Profile</span>
                      <h4 className="font-bold text-base text-slate-200 mt-0.5">{scannedBookingData.guestName}</h4>
                    </div>
                    <span className="font-mono font-bold text-indigo-400 text-xs bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                      {scannedBookingData.bookingCode}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                    <div>
                      <span className="block text-[9px] text-slate-500 font-semibold uppercase">Property</span>
                      <strong className="block text-slate-200 truncate font-bold">{scannedBookingData.property?.name ?? 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-500 font-semibold uppercase">Room Spec</span>
                      <strong className="block text-slate-200 truncate font-bold">{scannedBookingData.room?.name ?? 'General'}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-500 font-semibold uppercase">Duration</span>
                      <strong className="block text-slate-300 font-semibold">{scannedBookingData.startDate} ~ {scannedBookingData.endDate}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-500 font-semibold uppercase">Status</span>
                      <strong className="block text-emerald-400 font-bold">{scannedBookingData.status}</strong>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      onClick={() => {
                        setScannedBookingData(null);
                        isValidatingRef.current = false;
                      }}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border-0 cursor-pointer transition-colors"
                    >
                      {language === 'en' ? 'Scan Again' : 'Pindai Lagi'}
                    </button>
                    <button
                      onClick={() => handleConfirmCheckIn(scannedBookingData.id)}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl border-0 cursor-pointer transition-colors"
                    >
                      {language === 'en' ? 'Confirm Check-In' : 'Konfirmasi Check-In'}
                    </button>
                  </div>
                </div>
              )}

              {!scannedBookingData && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-300 flex items-center gap-1.5">
                    {language === 'en' ? 'Manual Booking Code Entry' : 'Input Manual Kode Booking'}
                  </span>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="e.g. SE-1024"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono font-bold uppercase flex-1 outline-hidden focus:border-indigo-500/50"
                    />
                    <button
                      onClick={() => validateAndShowBooking(manualCode)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold border-0 cursor-pointer"
                      disabled={loadingBookingDetails}
                    >
                      {language === 'en' ? 'Validate' : 'Validasi'}
                    </button>
                  </div>
                </div>
              )}

              {!scannedBookingData && (
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 text-[10px] text-slate-400 flex flex-col gap-1.5 leading-relaxed">
                  <span className="font-bold uppercase tracking-wider text-amber-500/90 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {language === 'en' ? 'Sandbox Testing Simulator' : 'Simulasi Sandbox'}
                  </span>
                  <p>{language === 'en' ? 'Triggers scanning simulation using the current active array.' : 'Simulasikan pembacaan event QR menggunakan data kedatangan yang terdaftar.'}</p>
                  <button
                    onClick={handleSimulateScan}
                    className="self-start px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-md font-bold text-slate-300 border-0 cursor-pointer text-[10px]"
                  >
                    {language === 'en' ? 'Simulate Active Scan' : 'Simulasikan Scan'}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Check-In Action Modal */}
      {checkInModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-xl w-full max-w-sm p-6 relative flex flex-col gap-4">
            <button 
              onClick={() => setCheckInModalBooking(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-indigo-950">
                {language === 'en' ? 'Confirm Guest Check-In' : 'Konfirmasi Check-In Tamu'}
              </h3>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl flex flex-col gap-2 text-xs font-semibold text-slate-600">
              <div className="flex justify-between border-b border-slate-200/40 pb-1.5">
                <span>Guest:</span>
                <strong className="text-slate-900">{checkInModalBooking.guestName}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/40 pb-1.5">
                <span>Code:</span>
                <strong className="text-indigo-600 font-mono font-bold">{checkInModalBooking.bookingCode}</strong>
              </div>
              <div className="flex justify-between">
                <span>Room:</span>
                <strong className="text-slate-900">{checkInModalBooking.room?.name ?? 'General'}</strong>
              </div>
            </div>

            <div className="flex gap-2.5 mt-2">
              <button
                onClick={() => setCheckInModalBooking(null)}
                className="flex-1 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border-0 cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                onClick={() => handleConfirmCheckIn(checkInModalBooking.id)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl border-0 cursor-pointer shadow-3xs"
              >
                {language === 'en' ? 'Confirm Check-In' : 'Konfirmasi Check-In'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Component modal secara aman */}
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
                <h4 className="font-black text-xs tracking-tight">{language === 'en' ? 'Check-in Recorded' : 'Check-in Tercatat'}</h4>
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
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
            <p className="text-[11px] font-bold">{errorToast}</p>
          </div>
        </div>
      )}

    </div>
  );
}

// 1. KOMPONEN UTAMA DENGAN STRUKTUR REACT HOOK YANG BENAR
export function BookingDetailModal({ booking, onClose, language, formatCurrencyIDR }: { booking: any, onClose: () => void, language: string, formatCurrencyIDR: (v: any) => string }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  useEffect(() => {
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
            <h3 className="font-bold text-base text-indigo-950 flex items-center gap-2">
              {language === 'en' ? 'Booking Profile & Timeline' : 'Profil Reservasi & Garis Waktu'}
              {isLateCheckOut && <span className="bg-red-50 text-red-600 text-[9px] px-2 py-0.5 rounded font-bold">LATE</span>}
            </h3>
            <p className="text-xs text-slate-400 font-mono font-bold mt-0.5">Code: {booking.bookingCode}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start text-xs font-semibold text-slate-600">
          <div className="md:col-span-8 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Guest Name</span>
                <span className="text-slate-800 font-bold block mt-0.5">{booking.guestName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Phone</span>
                <span className="text-slate-800 font-bold block mt-0.5">{booking.guestPhone}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 uppercase block">Property Context</span>
                <span className="text-slate-800 font-bold block mt-0.5">{booking.property?.name ?? 'N/A'} (Room: {booking.room?.name ?? 'General'})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Check-In Schedule</span>
                <span className="text-slate-800 block mt-0.5">{booking.startDate} to {booking.endDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Total Amount</span>
                <span className="text-indigo-600 font-black block mt-0.5">{formatCurrencyIDR(booking.totalAmount)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-3">Live Progress Timeline</span>
              <div className="flex flex-col gap-3">
                {steps.map((st, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <div className={`w-3 h-3 rounded-full ${st.done ? 'bg-indigo-600' : 'bg-slate-200'}`} />
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
              <div className="w-32 h-32 bg-slate-200 rounded-xl animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. FUNGSI JAMBATAN AGAR HALAMAN LAIN YANG MASIH MEMANGGIL SEBAGAI FUNGSI TIDAK CRASH
export function renderBookingDetailModal(booking: any, onClose: () => void, language: string, formatCurrencyIDR: (v: any) => string) {
  return (
    <BookingDetailModal 
      booking={booking}
      onClose={onClose}
      language={language}
      formatCurrencyIDR={formatCurrencyIDR}
    />
  );
}