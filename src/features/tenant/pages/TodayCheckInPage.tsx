import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';

export default function TodayCheckInPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { token, user } = useAuth();
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

  // Load bookings
  const loadBookings = () => {
    setLoading(true);
    const authHeader: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch('/api/bookings?status=CONFIRMED&limit=100', { headers: authHeader })
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

  useEffect(() => {
    loadBookings();

    const handleRefresh = () => {
      const authHeader: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      fetch('/api/bookings?status=CONFIRMED&limit=100', { headers: authHeader })
        .then(res => res.json())
        .then(data => {
          setBookings(data.data || []);
        })
        .catch(err => {
          console.error('Error refreshing check-ins:', err);
        });
    };

    window.addEventListener('stayease:refresh_bookings', handleRefresh);
    return () => {
      window.removeEventListener('stayease:refresh_bookings', handleRefresh);
    };
  }, [token]);

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

  // Clean stop of camera on unmount or drawer close
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
  };

  // Trigger permission check and initiate device camera scan
  const startCameraScanning = async () => {
    setQrFileError('');
    setScannerError('');
    setScannedBookingData(null);
    try {
      // Prompt user using native mediaDevices API
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      // Permission granted! Release stream tracks so they are free for html5-qrcode
      stream.getTracks().forEach(track => track.stop());
      setPermissionState('granted');
    } catch (err: any) {
      console.error("Camera permission denied or error:", err);
      setPermissionState('denied');
      setScannerError(language === 'en' ? "Camera access is required to scan guest QR codes." : "Akses kamera diperlukan untuk memindai kode QR tamu.");
    }
  };

  // Fetch from /api/bookings/code/:code and run strict validation checks
  const validateAndShowBooking = async (codeStr: string) => {
    const formattedCode = codeStr.trim().toUpperCase();
    if (!formattedCode) {
      setQrFileError(language === 'en' ? "Please provide a booking code." : "Harap masukkan kode booking.");
      return;
    }

    setLoadingBookingDetails(true);
    setQrFileError('');
    try {
      const response = await fetch(`/api/bookings/code/${formattedCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(language === 'en' ? "Booking QR not recognized." : "Pemesanan tidak ditemukan atau Kode QR tidak dikenal.");
        }
        const data = await response.json();
        throw new Error(data.error || "Failed to validate booking");
      }

      const booking = await response.json();

      // Check validation constraints
      // Expired booking: AUTO_EXPIRED or if checkout date is passed
      const tzOffsetVal = new Date().getTimezoneOffset() * 60000;
      const todayStr = new Date(Date.now() - tzOffsetVal).toISOString().split('T')[0];
      if (booking.status === 'AUTO_EXPIRED' || todayStr > booking.endDate) {
        throw new Error(language === 'en' ? "Reservation already expired." : "Pemesanan sudah kedaluwarsa.");
      }

      // Cancelled booking: CANCELLED
      if (booking.status === 'CANCELLED') {
        throw new Error(language === 'en' ? "Reservation has been cancelled." : "Pemesanan telah dibatalkan.");
      }

      // Already checked-in: CHECKED_IN, CHECKED_OUT, COMPLETED
      if (booking.status === 'CHECKED_IN' || booking.status === 'CHECKED_OUT' || booking.status === 'COMPLETED') {
        throw new Error(language === 'en' ? "Guest already checked in." : "Tamu sudah melakukan check-in.");
      }

      // Check other status: Must be CONFIRMED
      if (booking.status !== 'CONFIRMED') {
        throw new Error(
          language === 'en' 
            ? `Reservation is not ready for check-in. (Status: ${booking.status})` 
            : `Pemesanan belum siap untuk check-in. (Status: ${booking.status})`
        );
      }

      // Date check: current date >= checkInDate (startDate)
      if (todayStr < booking.startDate) {
        throw new Error(
          language === 'en'
            ? `Reservation starts on ${booking.startDate}. Check-in is not allowed yet Today.`
            : `Pemesanan dimulai tanggal ${booking.startDate}. Check-in belum diperbolehkan.`
        );
      }

      // All checks passed! Play success vibration and show booking summary
      if (navigator.vibrate) {
        try {
          navigator.vibrate(200);
        } catch (e) {}
      }

      setScannedBookingData(booking);
      
      // Stop continuous scanning so camera turns off and user focuses on confirm actions
      if (scannerInstance && scannerInstance.isScanning) {
        await scannerInstance.stop();
      }
    } catch (err: any) {
      setQrFileError(err.message || (language === 'en' ? "Booking QR not recognized." : "Kode QR tidak dikenal."));
    } finally {
      setLoadingBookingDetails(false);
    }
  };

  // Real-time callback from Html5Qrcode when scan detects decoded text
  const handleQrDetected = (text: string) => {
    console.log("Decoded QR Code text:", text);
    try {
      let code = '';
      if (text.trim().startsWith('{')) {
        const payload = JSON.parse(text);
        if (payload && payload.bookingCode) {
          code = payload.bookingCode;
        } else {
          throw new Error("Booking QR not recognized.");
        }
      } else {
        // Fallback or raw format: check if it's the booking code directly (e.g. SE-XXXX)
        const matched = text.trim();
        if (matched.toUpperCase().startsWith('SE-')) {
          code = matched;
        } else {
          throw new Error("Booking QR not recognized.");
        }
      }

      validateAndShowBooking(code);
    } catch (err: any) {
      setQrFileError(language === 'en' ? "Booking QR not recognized." : "Kode QR tidak dikenali.");
    }
  };

  useEffect(() => {
    // If scanner modal is opened with granted camera, spawn continuous Html5Qrcode reader
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
          (decodedText) => {
            handleQrDetected(decodedText);
          },
          () => {
            // redundant/verbose failure scanner logs, skip
          }
        ).catch(err => {
          console.error("Html5Qrcode scanner failed to start:", err);
          setScannerError(language === 'en' ? "Failed to establish camera stream." : "Gagal membangun aliran kamera.");
        });
      }, 300);

      return () => {
        clearTimeout(delayTimer);
        if (qrcode.isScanning) {
          qrcode.stop().catch(e => console.error("Error on unmounting stop:", e));
        }
      };
    }
  }, [showScanner, permissionState, scannedBookingData]);

  const tzOffsetVal = new Date().getTimezoneOffset() * 60000;
  const todayStr = new Date(Date.now() - tzOffsetVal).toISOString().split('T')[0];

  // Filter: status === 'CONFIRMED' and startDate === todayStr
  const filteredBookings = bookings.filter(b => {
    const isTodayConfirmed = b.status === 'CONFIRMED' && b.startDate === todayStr;
    if (!isTodayConfirmed) return false;
    if (searchQuery) {
      const field = (b.guestName + ' ' + b.bookingCode + ' ' + (b.property?.name || '')).toLowerCase();
      return field.includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Check-In handler
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

      // Reload bookings and close modals
      loadBookings();
      setCheckInModalBooking(null);
      setScannedBookingData(null);
      closeScanner();

      // Trigger modern success toast
      const timeStr = new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setSuccessToast({
        bookingCode: targetBooking?.bookingCode || 'N/A',
        guestName: targetBooking?.guestName || 'N/A',
        property: targetBooking?.property?.name || 'N/A',
        time: timeStr
      });

      // Synchronize all operational dashboards instantly
      window.dispatchEvent(new CustomEvent('stayease:refresh_bookings'));
      window.dispatchEvent(new CustomEvent('stayease:refresh_notifications'));

    } catch (err: any) {
      setErrorToast(err.message || 'An error occurred during check-in');
    }
  };

  // Simulate scanning code or uploading scanned result
  const handleSimulateScan = () => {
    // Let tenant choose from any active confirmed booking to simulate scan
    const pool = bookings.filter(b => b.status === 'CONFIRMED');
    if (pool.length === 0) {
      setQrFileError(language === 'en' ? 'No active CONFIRMED bookings found to simulate. Create parts first.' : 'Tidak ada reservasi CONFIRMED aktif untuk disimulasikan.');
      return;
    }
    // Pick the first match or matching manualCode
    let match = pool[0];
    if (manualCode) {
      const found = pool.find(b => b.bookingCode.toUpperCase() === manualCode.toUpperCase().trim());
      if (found) {
        match = found;
      } else {
        setQrFileError(language === 'en' ? 'Invalid code typed. Must be an active CONFIRMED booking code.' : 'Kode salah. Harus kode reservasi CONFIRMED aktif.');
        return;
      }
    }

    validateAndShowBooking(match.bookingCode);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header operations area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-indigo-950 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            {language === 'en' ? "Today's Guest Check-Ins" : 'Check-In Hari Ini'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'en' 
              ? 'Displaying confirmed guest arrivals scheduled for today' 
              : 'Menampilkan kedatangan tamu terkonfirmasi yang dijadwalkan hari ini'}
          </p>
        </div>

        {/* QR Scanning & Manual buttons */}
        <button
          onClick={() => {
            setShowScanner(true);
            setScannedBookingData(null);
            setQrFileError('');
            setManualCode('');
            startCameraScanning();
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <QrCode className="w-4 h-4" />
          <span>{language === 'en' ? 'Scan Guest QR Code' : 'Pindai Kode QR Tamu'}</span>
        </button>
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
        <div className="text-center py-10 text-slate-500 text-xs">{language === 'en' ? 'Loading check-ins...' : 'Memuat check-in...'}</div>
      ) : filteredBookings.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">{language === 'en' ? 'No Check-Ins Today' : 'Tidak Ada Kedatangan Check-In Hari Ini'}</p>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en' ? 'All scheduled guests for today have either been handled or there are no confirmed reservations.' : 'Semua tamu terjadwal hari ini telah diproses atau tidak ada pemesanan terkonfirmasi.'}
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
                <th className="py-3 px-4">{language === 'en' ? 'Check-In Date' : 'Tgl Masuk'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'Arrival Time' : 'Waktu Datang'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'Payment Status' : 'Status Pembayaran'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'Phone' : 'Telepon'}</th>
                <th className="py-3 px-4 text-right">{language === 'en' ? 'Actions' : 'Aksi'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800">{b.guestName}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{b.bookingCode}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-700">{b.property?.name ?? 'N/A'}</div>
                    <div className="text-[10px] text-slate-400 font-medium">Room: {b.room?.name ?? 'General'}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{b.startDate}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-405" />
                    <span>From 14:00 PM</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      {language === 'en' ? 'CONFIRMED' : 'DIKONFIRMASI'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{b.guestPhone}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg cursor-pointer"
                        title={language === 'en' ? 'View Details' : 'Lihat Detail'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCheckInModalBooking(b)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                      >
                        {language === 'en' ? 'Check-In' : 'Check-In'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Code Scanner Drawer/Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-955 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md relative flex flex-col max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/25">
                  <QrCode className="w-5 h-5 text-indigo-405" />
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
                className="w-8 h-8 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-205 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Container */}
            <div className="p-6 flex flex-col gap-5">
              
              {/* Camera view area */}
              {!scannedBookingData && (
                <div className="relative aspect-square w-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center">
                  
                  {/* Camera prompt / checking permission */}
                  {permissionState === 'prompt' && !scannerError && (
                    <div className="text-center p-6 flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-4 border-indigo-500/30 border-t-indigo-400 animate-spin" />
                      <p className="text-xs font-semibold text-slate-350">
                        {language === 'en' ? 'Requesting Device Camera Permission...' : 'Meminta Izin Kamera Perangkat...'}
                      </p>
                      <p className="text-[10px] text-slate-500 max-w-xs text-center leading-relaxed">
                        {language === 'en' 
                          ? 'Please accept the camera prompt in your browser to activate scanning.' 
                          : 'Harap setujui permintaan kamera untuk mengaktifkan pemindaian.'}
                      </p>
                    </div>
                  )}

                  {/* Camera Access Denied */}
                  {(permissionState === 'denied' || scannerError) && (
                    <div className="text-center p-6 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/25">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                      </div>
                      <p className="text-xs font-bold text-red-200">
                        {language === 'en' ? 'Camera Access Required' : 'Akses Kamera Diperlukan'}
                      </p>
                      <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                        {scannerError || (language === 'en' 
                          ? "Camera access is required to scan guest QR codes." 
                          : "Akses kamera diperlukan untuk memindai kode QR tamu.")}
                      </p>
                      <button
                        onClick={startCameraScanning}
                        className="mt-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/15"
                      >
                        {language === 'en' ? 'Try Again' : 'Coba Lagi'}
                      </button>
                    </div>
                  )}

                  {/* Live Viewport with Target ID for Html5Qrcode */}
                  {permissionState === 'granted' && !scannerError && (
                    <>
                      {/* Html5Qrcode target hook */}
                      <div id="qr-scanner-view-element" className="w-full h-full object-cover relative z-10" />
                      
                      {/* Custom scanning viewfinder overlay */}
                      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6">
                        {/* corners indicators */}
                        <div className="flex justify-between">
                          <div className="w-6 h-6 border-t-2 border-l-2 border-indigo-400 rounded-tl-md" />
                          <div className="w-6 h-6 border-t-2 border-r-2 border-indigo-400 rounded-tr-md" />
                        </div>
                        
                        {/* laser scan bounce animation */}
                        <div className="relative w-full h-1/2 flex items-center justify-center">
                          <div className="absolute inset-x-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_12px_rgba(129,140,248,0.8)] animate-bounce" style={{ animationDuration: '4.5s' }} />
                          <Scan className="w-10 h-10 text-indigo-400/40" />
                        </div>

                        <div className="flex justify-between">
                          <div className="w-6 h-6 border-b-2 border-l-2 border-indigo-400 rounded-bl-md" />
                          <div className="w-6 h-6 border-b-2 border-r-2 border-indigo-400 rounded-br-md" />
                        </div>
                      </div>

                      {/* Decoded/validating loading overlay */}
                      {loadingBookingDetails && (
                        <div className="absolute inset-0 z-35 bg-slate-950/80 flex flex-col items-center justify-center gap-2">
                          <div className="w-10 h-10 rounded-full border-4 border-indigo-500/10 border-t-indigo-400 animate-spin" />
                          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest animate-pulse">
                            {language === 'en' ? 'Validating booking...' : 'Memvalidasi booking...'}
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-3 inset-x-0 text-center z-20">
                        <span className="text-[10px] text-indigo-300 font-bold bg-slate-900/85 px-3 py-1 rounded-full border border-indigo-500/15 tracking-wider uppercase">
                          {language === 'en' ? 'Real Camera Live' : 'Kamera Perangkat Aktif'}
                        </span>
                      </div>
                    </>
                  )}

                </div>
              )}

              {/* Error logs inside the scan viewport */}
              {qrFileError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex gap-2.5 items-start text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block text-red-200">
                      {language === 'en' ? 'Validation Error' : 'Kesalahan Validasi'}
                    </span>
                    <p className="mt-0.5 leading-relaxed">{qrFileError}</p>
                  </div>
                </div>
              )}

              {/* Show Scanned Booking Summary displaying details and action buttons */}
              {scannedBookingData && (
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col gap-4">
                  <div className="flex justify-between items-start pb-3 border-b border-slate-850">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">
                        {language === 'en' ? "Verified Reservation Summary" : 'Ringkasan Reservasi Terverifikasi'}
                      </span>
                      <h4 className="font-bold text-base text-slate-200 mt-0.5">{scannedBookingData.guestName}</h4>
                    </div>
                    <span className="font-mono font-bold text-indigo-405 text-xs bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                      {scannedBookingData.bookingCode}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
                    <div>
                      <span className="block text-[9px] text-slate-450 font-semibold uppercase tracking-wider">Property</span>
                      <strong className="block text-slate-200 truncate mt-0.5 font-bold">{scannedBookingData.property?.name ?? 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-450 font-semibold uppercase tracking-wider">Room Specified</span>
                      <strong className="block text-slate-200 truncate mt-0.5 font-bold">{scannedBookingData.room?.name ?? 'General'}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-450 font-semibold uppercase tracking-wider">Check-In Date</span>
                      <strong className="block text-slate-200 mt-0.5 font-semibold">{scannedBookingData.startDate}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-450 font-semibold uppercase tracking-wider">Check-Out Date</span>
                      <strong className="block text-slate-200 mt-0.5 font-semibold">{scannedBookingData.endDate}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-450 font-semibold uppercase tracking-wider">Guest Capacity Limit</span>
                      <strong className="block text-indigo-300 mt-0.5 font-bold">
                        {scannedBookingData.room?.capacity ?? 2} Guests Max
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-450 font-semibold uppercase tracking-wider">Payment Status</span>
                      <strong className="block text-emerald-400 mt-0.5 font-bold">
                        Paid ({scannedBookingData.status})
                      </strong>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-3 border-t border-slate-850">
                    <button
                      onClick={() => setScannedBookingData(null)}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-755 text-slate-300 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                    >
                      {language === 'en' ? 'Cancel / Scan Again' : 'Batal / Pindai Lagi'}
                    </button>
                    <button
                      onClick={() => handleConfirmCheckIn(scannedBookingData.id)}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-md shadow-indigo-600/15"
                    >
                      {language === 'en' ? 'Confirm Check-In' : 'Konfirmasi Check-In'}
                    </button>
                  </div>
                </div>
              )}

              {/* Fallback Option: Manual input of reservation code */}
              {!scannedBookingData && (
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    {language === 'en' ? 'Manual Booking Code Fallback' : 'Input Manual Kode Booking'}
                  </span>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                    {language === 'en'
                      ? 'Type guests booking code to search and check-in without device camera access.'
                      : 'Ketik kode booking tamu untuk memverifikasi dan memproses check-in tanpa akses kamera.'}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="e.g. SE-1024"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono font-bold uppercase flex-1 outline-none focus:border-indigo-500/50"
                    />
                    <button
                      onClick={() => validateAndShowBooking(manualCode)}
                      className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-550 text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      disabled={loadingBookingDetails}
                    >
                      {language === 'en' ? 'Validate Booking' : 'Validasi Booking'}
                    </button>
                  </div>
                </div>
              )}

              {/* Pre-existing Sandbox simulator section */}
              {!scannedBookingData && (
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 text-[10px] text-slate-400 flex flex-col gap-2 leading-relaxed">
                  <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-500/90">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    {language === 'en' ? 'Sandbox Simulation Utility' : 'Simulasi Pengujian Sandbox'}
                  </span>
                  <p>
                    {language === 'en' 
                      ? 'Selects the first active CONFIRMED reservation from todays scheduled database. To target a specific one, enter it above.' 
                      : 'Memilih reservasi CONFIRMED aktif pertama hari ini dari database. Untuk kode spesifik, ketik di atas.'}
                  </p>
                  <button
                    onClick={handleSimulateScan}
                    className="self-start mt-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-slate-100 rounded-lg font-bold text-[10px] transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'Simulate Scan Event' : 'Simulasikan Scan Tamu'}
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
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl w-full max-w-sm p-6 relative flex flex-col gap-5">
            <button 
              onClick={() => setCheckInModalBooking(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-indigo-950">
                {language === 'en' ? 'Confirm Guest Check-In' : 'Konfirmasi Check-In Tamu'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'en' ? 'Please verify reservation details prior to check-in' : 'Silakan verifikasi detail pemesanan sebelum check-in'}
              </p>
            </div>

            {/* Check-In card info */}
            <div className="bg-slate-50 p-4 rounded-2xl flex flex-col gap-2.5 text-xs text-slate-650">
              <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                <span className="text-slate-400 font-semibold">{language === 'en' ? 'Guest:' : 'Tamu:'}</span>
                <strong className="text-slate-800">{checkInModalBooking.guestName}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                <span className="text-slate-400 font-semibold">{language === 'en' ? 'Booking Code:' : 'Kode Pemesanan:'}</span>
                <strong className="text-indigo-600 font-mono font-bold">{checkInModalBooking.bookingCode}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                <span className="text-slate-400 font-semibold">{language === 'en' ? 'Property:' : 'Properti:'}</span>
                <strong className="text-slate-800">{checkInModalBooking.property?.name ?? 'N/A'}</strong>
              </div>
              <div className="flex justify-between pb-0.5">
                <span className="text-slate-400 font-semibold">{language === 'en' ? 'Room:' : 'Kamar:'}</span>
                <strong className="text-slate-800">{checkInModalBooking.room?.name ?? 'General'}</strong>
              </div>
            </div>

            <p className="text-center text-xs font-bold text-indigo-950">
              {language === 'en' ? 'Confirm guest arrival?' : 'Konfirmasi kedatangan tamu?'}
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setCheckInModalBooking(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-bold rounded-xl cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                onClick={() => handleConfirmCheckIn(checkInModalBooking.id)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                {language === 'en' ? 'Confirm Check-In' : 'Konfirmasi Check-In'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && renderBookingDetailModal(selectedBooking, () => setSelectedBooking(null), language, formatCurrencyIDR)}

      {/* Modern Success Toast / Modal */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-emerald-600 text-white rounded-2xl p-5 shadow-2xl max-w-sm border border-emerald-500 flex flex-col gap-3 relative">
            <button 
              onClick={() => setSuccessToast(null)}
              className="absolute top-3 right-3 text-emerald-100 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm tracking-tight">{language === 'en' ? 'Check-in Recorded' : 'Check-in Tercatat'}</h4>
                <p className="text-[11px] text-emerald-100">{language === 'en' ? 'Guest check-in session successfully completed.' : 'Sesi check-in tamu berhasil diselesaikan.'}</p>
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
                <span className="text-emerald-100 font-medium">{language === 'en' ? 'Check-in Time:' : 'Waktu Masuk:'}</span>
                <span className="font-bold">{successToast.time}</span>
              </div>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="w-full py-1.5 bg-white text-emerald-700 hover:bg-emerald-50 text-[11px] font-extrabold rounded-lg transition-colors cursor-pointer text-center"
            >
              {language === 'en' ? 'Close' : 'Tutup'}
            </button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-rose-600 text-white rounded-2xl p-4 shadow-2xl max-w-sm border border-rose-500 flex items-center gap-3 relative">
            <button 
              onClick={() => setErrorToast(null)}
              className="absolute top-2 right-2 text-rose-100 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="w-7 h-7 rounded-full bg-rose-550/30 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-white" />
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

// Global Reusable Booking Detail Modal with Timeline and QR Code
export function renderBookingDetailModal(booking: any, onClose: () => void, language: string, formatCurrencyIDR: (v: any) => string) {
  // Generate a real client-generated QR Code dataUrl
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  useEffect(() => {
    const payload = JSON.stringify({
      bookingCode: booking.bookingCode,
      guestId: booking.guestId,
      propertyId: booking.propertyId,
      roomId: booking.roomId,
      checkInDate: booking.startDate,
      checkOutDate: booking.endDate
    });
    QRCode.toDataURL(payload, { margin: 1, scale: 4 })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error(err));
  }, [booking]);

  // Build the Booking Timeline list
  // Reservation Created (createdAt of booking)
  // Payment Submitted (createdAt or log 'UPLOAD_PROOF')
  // Payment Confirmed (status = CONFIRMED, COMPLETED, CHECKED_IN, CHECKED_OUT)
  // Checked-In (checkedInAt field match)
  // Checked-Out (checkedOutAt field match)
  // Completed (status = COMPLETED / CHECKED_OUT etc)
  const tzOffsetVal = new Date().getTimezoneOffset() * 60000;
  const todayStr = new Date(Date.now() - tzOffsetVal).toISOString().split('T')[0];
  const isLateCheckOut = booking.status === 'CHECKED_IN' && todayStr > booking.endDate;

  const steps = [
    {
      title: language === 'en' ? 'Reservation Created' : 'Reservasi Dibuat',
      date: booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A',
      time: booking.createdAt ? new Date(booking.createdAt).toLocaleTimeString() : 'N/A',
      user: booking.guestName,
      done: true
    },
    {
      title: language === 'en' ? 'Payment Submitted' : 'Bukti Pembayaran Diunggah',
      date: booking.paymentProof?.createdAt ? new Date(booking.paymentProof.createdAt).toLocaleDateString() : '',
      time: booking.paymentProof?.createdAt ? new Date(booking.paymentProof.createdAt).toLocaleTimeString() : '',
      user: booking.guestName,
      done: !!booking.paymentProof
    },
    {
      title: language === 'en' ? 'Payment Confirmed' : 'Pembayaran Dikonfirmasi',
      date: (booking.status !== 'WAITING_PAYMENT' && booking.status !== 'WAITING_CONFIRMATION' && booking.status !== 'CANCELLED' && booking.status !== 'AUTO_EXPIRED') ? 'Confirmed' : '',
      time: '',
      user: 'Host',
      done: (booking.status !== 'WAITING_PAYMENT' && booking.status !== 'WAITING_CONFIRMATION' && booking.status !== 'CANCELLED' && booking.status !== 'AUTO_EXPIRED')
    },
    {
      title: language === 'en' ? 'Checked-In' : 'Checked-In',
      date: booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleDateString() : '',
      time: booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleTimeString() : '',
      user: 'Host',
      done: !!booking.checkedInAt || booking.status === 'CHECKED_IN' || booking.status === 'CHECKED_OUT' || booking.status === 'COMPLETED'
    },
    {
      title: language === 'en' ? 'Checked-Out' : 'Checked-Out',
      date: booking.checkedOutAt ? new Date(booking.checkedOutAt).toLocaleDateString() : '',
      time: booking.checkedOutAt ? new Date(booking.checkedOutAt).toLocaleTimeString() : '',
      user: 'Host',
      done: !!booking.checkedOutAt || booking.status === 'CHECKED_OUT' || booking.status === 'COMPLETED'
    },
    {
      title: language === 'en' ? 'Completed' : 'Selesai',
      date: booking.status === 'COMPLETED' ? 'Completed' : '',
      time: '',
      user: 'System',
      done: booking.status === 'COMPLETED'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl w-full max-w-2xl p-6 relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pb-3 border-b border-slate-100 flex justify-between items-start pr-8">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-indigo-950">
                {language === 'en' ? 'Booking Details & Timeline' : 'Detail Reservasi & Garis Waktu'}
              </h3>
              {isLateCheckOut && (
                <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide border border-red-200">
                  LATE CHECKOUT
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono font-semibold">Code: {booking.bookingCode}</p>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            booking.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' :
            booking.status === 'CHECKED_IN' ? 'bg-blue-50 text-blue-700' :
            booking.status === 'CHECKED_OUT' ? 'bg-indigo-50 text-indigo-700' :
            booking.status === 'COMPLETED' ? 'bg-purple-50 text-purple-700' :
            'bg-slate-50 text-slate-650'
          }`}>
            {booking.status}
          </span>
        </div>

        {/* Info Grid split with QR code generated */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          <div className="md:col-span-8 flex flex-col gap-4">
            
            {/* Primary Fields */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Guest Name</span>
                <span className="block font-bold text-slate-800 mt-0.5">{booking.guestName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mobile / Phone</span>
                <span className="block font-medium text-slate-800 mt-0.5">{booking.guestPhone}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address</span>
                <span className="block font-medium text-slate-800 mt-0.5">{booking.guestEmail}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Property</span>
                <span className="block font-semibold text-slate-800 mt-0.5 truncate">{booking.property?.name ?? 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Room Number</span>
                <span className="block font-medium text-slate-800 mt-0.5">{booking.room?.name ?? 'General'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Check-In Duration</span>
                <span className="block font-medium text-slate-800 mt-0.5">{booking.startDate} to {booking.endDate}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Amount Paid</span>
                <span className="block font-black text-indigo-700 mt-0.5">{formatCurrencyIDR(booking.totalAmount)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Invoice Link</span>
                <span className="block text-indigo-600 font-bold mt-0.5">
                  <a href={`/api/bookings/invoice/${booking.id}`} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Invoice</span>
                  </a>
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-2 pt-4 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">RESERVATION TIMELINE</span>
              
              <div className="flex flex-col gap-4">
                {steps.map((st, idx) => {
                  return (
                    <div key={idx} className="flex gap-4 items-start relative pb-1">
                      {/* Left Dot Guide */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 ${
                          st.done ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'
                        } z-10`} />
                        {idx !== steps.length - 1 && (
                          <div className={`w-0.5 h-10 ${
                            st.done && steps[idx+1].done ? 'bg-indigo-600' : 'bg-slate-150'
                          } -mb-4`} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <h4 className={`text-xs font-bold leading-none ${
                            st.done ? 'text-indigo-950 font-sans' : 'text-slate-400'
                          }`}>
                            {st.title}
                          </h4>
                          <span className="text-[10px] text-slate-450 font-medium font-mono shrink-0">
                            {st.date ? `${st.date} ${st.time}` : language === 'en' ? 'Awaiting' : 'Menunggu'}
                          </span>
                        </div>
                        {st.done && (
                          <div className="text-[10px] text-slate-500 font-semibold mt-1">
                            By: {st.user}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* QR Code Segment */}
          <div className="md:col-span-4 flex flex-col items-center gap-2.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest">Digital Boarding QR</span>
            
            {qrCodeUrl ? (
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
                <img src={qrCodeUrl} alt="Booking QR" className="w-36 h-36 border border-slate-50" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="w-36 h-36 bg-slate-100 rounded-xl flex items-center justify-center animate-pulse">
                <QrCode className="w-8 h-8 text-slate-300" />
              </div>
            )}

            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              {language === 'en' 
                ? 'Check-In agents can scan this QR code for instant, zero-touch boarding validation step.' 
                : 'Agen Check-In dapat memindai kode QR ini untuk verifikasi kedatangan instan.'}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
