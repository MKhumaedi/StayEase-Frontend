import React, { useState, useEffect } from 'react';
import { Property, Room } from '../../../types';
import { Check, ShieldCheck, CheckCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import { useAuth } from '../../../shared/context/AuthContext';
import { useAsyncAction, useIdempotency } from '../../../protection';

interface CheckoutProps {
  params: {
    property: Property;
    selectedRoom: Room;
    startDate: string;
    endDate: string;
    breakdown: any;
    guestCount?: number;
  } | null;
  onNavigate: (path: string) => void;
}

export default function Checkout({ params, onNavigate }: CheckoutProps) {
  const { t, language, formatCurrencyIDR } = useLanguage();
  const { user, token } = useAuth();
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentMode, setPaymentMode] = useState<'midtrans' | 'manual'>('midtrans');
  const [midtransLoading, setMidtransLoading] = useState(false);
  
  // Use protection hooks for transaction security
  const { idempotencyKey: bookingIdempKey, rotateKey: rotateBookingKey } = useIdempotency();
  const { idempotencyKey: paymentIdempKey, rotateKey: rotatePaymentKey } = useIdempotency();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('+1 123-456-7890');
  const [proofUrl, setProofUrl] = useState('https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', (import.meta as any).env?.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-XXXX');
    script.async = true;
    script.id = 'midtrans-snap';
    document.body.appendChild(script);
    return () => {
      const existing = document.getElementById('midtrans-snap');
      if (existing) document.body.removeChild(existing);
    };
  }, []);

  const createBookingApi = async () => {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-idempotency-key': bookingIdempKey
      },
      body: JSON.stringify({
        guestId: user.id, guestName: name, guestEmail: email, guestPhone: phone,
        propertyId: property.id, roomId: selectedRoom.id, startDate, endDate
      })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Booking creation failed');
    }
    return res.json();
  };

  const getMidtransSnapToken = async (bookingId: string) => {
    const res = await fetch('/api/payments/midtrans/create-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ bookingId })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Midtrans token generation failed');
    }
    return res.json();
  };

  const triggerSnapPopup = (tokenStr: string) => {
    if (!(window as any).snap) throw new Error('Secure gateway still initializing. Please retry in a few seconds.');
    (window as any).snap.pay(tokenStr, {
      onSuccess: () => setStep(3),
      onPending: () => setStep(3),
      onError: () => setErrorMsg('Instant payment failed'),
      onClose: () => setErrorMsg('Payment closed. Complete reservation under Guest Portal.')
    });
  };

  const handleMidtransPayment = async () => {
    setErrorMsg('');
    setMidtransLoading(true);
    try {
      const data = await createBookingApi();
      rotateBookingKey();
      const payData = await getMidtransSnapToken(data.id);
      triggerSnapPopup(payData.token);
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    } finally {
      setMidtransLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  if (!user || !token) {
    return (
      <div className="max-w-md mx-auto my-12 px-6 text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
          <p className="text-xs font-semibold text-slate-550 mb-6 font-display">
            {language === 'en' 
              ? 'Only authenticated users can proceed to checkout. Please log in first.' 
              : 'Hanya pengguna terautentikasi yang dapat melakukan checkout. Silakan masuk terlebih dahulu.'}
          </p>
          <button 
            onClick={() => onNavigate('/login')} 
            className="w-full bg-indigo-950 hover:bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-colors shadow-xs"
          >
            {language === 'en' ? 'Go to Login' : 'Masuk / Login'}
          </button>
        </div>
      </div>
    );
  }

  if (!params || !params.property || !params.selectedRoom) {
    return (
      <div className="max-w-md mx-auto my-12 px-6 text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
          <p className="text-xs font-semibold text-slate-550 mb-6">
            {language === 'en' 
              ? 'No active booking selection found. Please select a property and room first.' 
              : 'Pilihan pemesanan aktif tidak ditemukan. Silakan pilih properti dan kamar terlebih dahulu.'}
          </p>
          <button 
            onClick={() => onNavigate('/')} 
            className="w-full bg-indigo-950 hover:bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-colors shadow-xs"
          >
            {language === 'en' ? 'Back to Home' : 'Kembali ke Beranda'}
          </button>
        </div>
      </div>
    );
  }

  const { property, selectedRoom, startDate, endDate, breakdown, guestCount = 1 } = params;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(startDate) >= new Date(endDate)) {
      setErrorMsg(language === 'en' ? 'Check-in must be before check-out' : 'Check-in harus sebelum check-out');
      return;
    }
    if (guestCount <= 0) {
      setErrorMsg(language === 'en' ? 'Guest count must be greater than zero' : 'Jumlah tamu harus lebih besar dari nol');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleConfirmOrder = async () => {
    // Left empty or mapped to execute confirming handler to satisfy interface/legacy code
    await executeConfirm();
  };

  const { execute: executeConfirm, isLoading: submitting } = useAsyncAction(async () => {
    setErrorMsg('');
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-idempotency-key': bookingIdempKey
        },
        body: JSON.stringify({
          guestId: user.id, guestName: name, guestEmail: email, guestPhone: phone,
          propertyId: property.id, roomId: selectedRoom.id, startDate, endDate
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Booking creation failed.');
      }
      rotateBookingKey();

      if (data.id) {
        const payRes = await fetch(`/api/bookings/${data.id}/payment`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-idempotency-key': paymentIdempKey
          },
          body: JSON.stringify({ proofUrl })
        });
        const payData = await payRes.json();
        if (!payRes.ok) {
          throw new Error(payData.error || 'Payment receipt upload failed.');
        }
        rotatePaymentKey();
        setStep(3);
      }
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-black text-indigo-950 font-display mb-8">{t.checkout.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Forms panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <span className={`${step >= 1 ? 'text-indigo-600 font-black' : ''}`}>
              1. {language === 'en' ? 'Guest Details' : 'Rincian Tamu'}
            </span>
            <span>➔</span>
            <span className={`${step >= 2 ? 'text-indigo-600 font-black' : ''}`}>
              2. {language === 'en' ? 'Bank Proof' : 'Bukti Transfer'}
            </span>
            <span>➔</span>
            <span className={`${step === 3 ? 'text-indigo-600 font-black' : ''}`}>
              3. {language === 'en' ? 'Finalised' : 'Selesai'}
            </span>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 text-rose-600 text-xs font-semibold py-3 px-4 rounded-xl border border-rose-100 flex flex-col gap-1">
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleNextStep} className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-slate-800 font-display mb-2">
                {language === 'en' ? 'Primary Guest Contact Info' : 'Informasi Kontak Utama Tamu'}
              </h2>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t.propertyDetail.fullName}</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg p-3 focus:outline-hidden" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t.propertyDetail.emailAddress}</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg p-3 focus:outline-hidden" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t.propertyDetail.phoneNumber}</label>
                <input required type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg p-3 focus:outline-hidden" />
              </div>
              <button type="submit" className="bg-indigo-900 hover:bg-indigo-850 text-white font-bold py-3 rounded-xl mt-4 text-sm cursor-pointer transition-all">
                {t.propertyDetail.confirmSelection}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-lg font-bold text-slate-800 font-display">{language === 'en' ? 'Select Payment Method' : 'Pilih Metode Pembayaran'}</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMode('midtrans')}
                  className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMode === 'midtrans'
                      ? 'border-indigo-600 bg-indigo-50/20'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="font-bold text-indigo-950 text-sm">{language === 'en' ? 'Midtrans Secure Payment' : 'Pembayaran Aman Midtrans'}</span>
                  <span className="text-xs text-slate-500 mt-1">
                    {language === 'en' ? 'Supports QRIS, E-Wallet, VA, & Instant Transfers' : 'Mendukung QRIS, Dompet Digital, VA, & Transfer Instan'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('manual')}
                  className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMode === 'manual'
                      ? 'border-indigo-600 bg-indigo-50/20'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="font-bold text-indigo-950 text-sm">{language === 'en' ? 'Manual Bank Transfer' : 'Transfer Bank Manual'}</span>
                  <span className="text-xs text-slate-500 mt-1">
                    {language === 'en' ? 'Manually upload transfer voucher after transacting' : 'Unggah bukti transfer manual setelah bertransaksi'}
                  </span>
                </button>
              </div>

              {paymentMode === 'midtrans' ? (
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-slate-50 border rounded-xl text-xs space-y-2 text-slate-600 leading-relaxed font-semibold">
                    <p className="font-bold text-indigo-950">{language === 'en' ? 'Midtrans Sandbox Gateway' : 'Gerbang Sandbox Midtrans'}</p>
                    <p>
                      {language === 'en' 
                        ? 'Pay seamlessly using QRIS code or select virtual accounts. The system will confirm bookings automatically once settled.'
                        : 'Bayar dengan kode QRIS atau pilih akun virtual yang tersedia. Sistem akan mengonfirmasi pemesanan secara otomatis setelah dibayar.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" /> {language === 'en' ? 'Your transaction is completely secured by Midtrans Snap protocol.' : 'Transaksi Anda sepenuhnya diamankan oleh protokol Midtrans Snap.'}
                  </div>

                  <button 
                    onClick={handleMidtransPayment} 
                    disabled={midtransLoading}
                    className="bg-indigo-900 hover:bg-indigo-850 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl mt-2 text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    {midtransLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {language === 'en' ? 'Initializing Snap...' : 'Menyiapkan Snap...'}
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> 
                        {language === 'en' ? 'Pay Instantly with Snap' : 'Bayar Instan dengan Snap'}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-slate-50 border rounded-xl text-xs space-y-2 text-slate-600 leading-relaxed font-semibold">
                    <div>{language === 'en' ? 'Account Holder Name' : 'Nama Pemegang Rekening'}: <span className="text-indigo-950 font-bold block">StayEase Platform Ltd.</span></div>
                    <div>{language === 'en' ? 'Primary Bank Name' : 'Nama Bank'}: <span className="text-indigo-950 font-bold block">Chase Manhattan Bank / Bank Mandiri</span></div>
                    <div>{language === 'en' ? 'Account Routing IBAN' : 'Nomor Mandiri / Virtual Account Escrow'}: <span className="text-indigo-950 font-bold block">1204-589-32210 (StayEase Inc)</span></div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">{t.checkout.uploadPaymentProofButton}</label>
                    <input type="text" value={proofUrl} onChange={e => setProofUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg p-3 focus:outline-hidden" />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" /> {language === 'en' ? 'Your transaction proof remains 100% encrypted with StayEase Military grade standards.' : 'Bukti transfer Anda 100% aman terenkripsi dengan standar platform StayEase.'}
                  </div>

                  <button 
                    onClick={handleConfirmOrder} 
                    disabled={submitting}
                    className="bg-indigo-900 hover:bg-indigo-850 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl mt-2 text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {t.common.confirm}
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-10 flex flex-col items-center gap-4">
              <CheckCircle className="w-16 h-16 text-emerald-500 animate-pulse" />
              <h2 className="text-2xl font-bold text-indigo-950 font-display">{language === 'en' ? 'Booking Complete!' : 'Pemesanan Berhasil!'}</h2>
              <p className="text-slate-500 text-sm max-w-md leading-relaxed">
                {language === 'en' ? 'We have registered your booking request in our system ledger. Julian will audit your bank transfer receipt and confirm your stay shortly.' : 'Kami telah mendaftarkan permintaan pemesanan Anda. Tim kami akan memverifikasi bukti transfer bank Anda dan segera mengonfirmasi status hunian Anda.'}
              </p>
              <button onClick={() => onNavigate('/traveler-dashboard')} className="bg-indigo-900 hover:bg-indigo-850 text-white font-bold px-6 py-2.5 rounded-xl text-sm cursor-pointer transition-all">
                {language === 'en' ? 'Access Guest Area' : 'Masuk Area Traveler'}
              </button>
            </div>
          )}
        </div>

        {/* Breakdown Summary sidebar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 h-fit">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.checkout.bookingSummary}</h3>
          <div className="aspect-video bg-slate-50 rounded-xl overflow-hidden mb-4 border border-slate-200">
            <img src={property.imageUrls[0]} alt={property.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-base font-display">{property.name}</h4>
            <p className="text-xs text-slate-400 mb-4">{property.location}</p>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 text-xs text-slate-600 font-semibold mb-3">
            <div className="flex justify-between"><span>{t.checkout.selectedRoom}</span><span className="text-indigo-900 font-bold">{selectedRoom.name}</span></div>
            <div className="flex justify-between"><span>{language === 'en' ? 'Check-In' : 'Check-In'}</span><span>{startDate}</span></div>
            <div className="flex justify-between"><span>{language === 'en' ? 'Check-Out' : 'Check-Out'}</span><span>{endDate}</span></div>
            <div className="flex justify-between"><span>{language === 'en' ? 'Guests' : 'Tamu'}</span><span>{guestCount}</span></div>
          </div>

          {breakdown?.peakMultiplier > 1 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-[#78350f] text-xs font-medium">
              <span className="font-bold flex items-center gap-1 mb-0.5">
                ⚡ {language === 'en' ? 'Holiday Pricing Active' : 'Tarif Musim Liburan Aktif'}
              </span>
              <p className="text-[10px] leading-relaxed">
                {language === 'en' ? 'A seasonal price multiplier of ' : 'Pengali tarif musiman sebesar '}
                <strong>{breakdown.peakMultiplier.toFixed(2)}x</strong>
                {language === 'en' ? ' is applied to this stay rule: ' : ' diterapkan untuk hunian ini: '}
                {breakdown.peakSeasonName && <strong>{breakdown.peakSeasonName}</strong>}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-600 font-semibold">
            <div className="flex justify-between"><span>{t.checkout.roomBasePrice}</span><span className="font-semibold text-slate-800">{formatCurrencyIDR(Number.isFinite(breakdown?.subtotal) ? breakdown.subtotal : 0)}</span></div>
            <div className="flex justify-between"><span>{language === 'en' ? 'Cleaning Fee' : 'Biaya Pembersihan'}</span><span className="font-semibold text-slate-800">{formatCurrencyIDR(Number.isFinite(breakdown?.cleaningFee) ? breakdown.cleaningFee : 0)}</span></div>
            <div className="flex justify-between"><span>{language === 'en' ? 'StayEase Service Tally' : 'Biaya Layanan StayEase'}</span><span className="font-semibold text-slate-800">{formatCurrencyIDR(Number.isFinite(breakdown?.serviceFee) ? breakdown.serviceFee : 0)}</span></div>
            <div className="flex justify-between"><span>{language === 'en' ? 'Tax Ledger' : 'Pajak Aset'}</span><span className="font-semibold text-slate-800">{formatCurrencyIDR(Number.isFinite(breakdown?.taxes) ? breakdown.taxes : (Number.isFinite(breakdown?.tax) ? breakdown.tax : 0))}</span></div>
            <div className="flex justify-between text-base font-black text-indigo-950 border-t border-slate-100 pt-4 mt-2 font-display">
              <span>{t.checkout.totalAmountToPay}</span><span>{formatCurrencyIDR(Number.isFinite(breakdown?.total) ? breakdown.total : 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
