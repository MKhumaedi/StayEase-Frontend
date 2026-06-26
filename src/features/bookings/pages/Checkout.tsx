import React, { useState, useEffect } from 'react';
import { Property, Room } from '../../../types';
import { useLanguage } from '../../../shared/i18n';
import { useAuth } from '../../../shared/context/AuthContext';
import { useAsyncAction, useIdempotency } from '../../../protection';
import { Step1Form } from '../components/Step1Form';
import { CheckoutSummary } from '../components/CheckoutSummary';
import { PaymentModeSelection } from '../components/PaymentModeSelection';
import { VerificationPending } from '../components/VerificationPending';
import { useDocumentMetadata } from '../../../hooks/useDocumentMetadata';

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

  useDocumentMetadata({
    title: language === 'en' ? 'Checkout' : 'Selesaikan Pemesanan',
    description: language === 'en'
      ? 'Complete your booking reservation securely on StayEase.'
      : 'Selesaikan pemesanan akomodasi Anda dengan aman di StayEase.'
  });
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentMode, setPaymentMode] = useState<'midtrans' | 'manual'>('midtrans');
  const [midtransLoading, setMidtransLoading] = useState(false);
  
  const { idempotencyKey: bookingIdempKey, rotateKey: rotateBookingKey } = useIdempotency();
  const { idempotencyKey: paymentIdempKey, rotateKey: rotatePaymentKey } = useIdempotency();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('+1 123-456-7890');
  const [proofUrl, setProofUrl] = useState('https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80');

  const [verifying, setVerifying] = useState(false);
  const [verifyFailed, setVerifyFailed] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    s.setAttribute('data-client-key', (import.meta as any).env?.VITE_MIDTRANS_CLIENT_KEY || '');
    s.async = true;
    s.id = 'midtrans-snap';
    document.body.appendChild(s);
    return () => {
      const el = document.getElementById('midtrans-snap');
      if (el) document.body.removeChild(el);
    };
  }, []);

  const getBookingPayload = () => ({
    guestId: user?.id, guestName: name, guestEmail: email, guestPhone: phone,
    propertyId: params?.property?.id, roomId: params?.selectedRoom?.id,
    startDate: params?.startDate, endDate: params?.endDate
  });

  const createBookingApi = async () => {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-idempotency-key': bookingIdempKey
      },
      body: JSON.stringify(getBookingPayload())
    });
    if (!res.ok) throw new Error('Booking creation failed');
    return res.json();
  };

  const getMidtransSnapToken = async (bookingId: string) => {
    const res = await fetch('/api/payments/midtrans/create-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ bookingId })
    });
    if (!res.ok) throw new Error('Midtrans token generation failed');
    return res.json();
  };

  const uploadProofApi = async (bookingId: string) => {
    const payRes = await fetch(`/api/bookings/${bookingId}/payment`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-idempotency-key': paymentIdempKey
      },
      body: JSON.stringify({ proofUrl })
    });
    if (!payRes.ok) throw new Error('Payment proof upload failed.');
    return payRes.json();
  };

  const handlePollResponse = (data: any, interval: any, attempts: number) => {
    if (data.status === 'CONFIRMED' || data.status === 'PAID') {
      clearInterval(interval);
      onNavigate('/reservations?payment=success');
    } else if (attempts >= 15) {
      clearInterval(interval);
      setVerifyFailed(true);
      setVerifyMsg(language === 'en' 
        ? 'Midtrans is taking longer to settle the payment. You can find your booking in your Dashboard shortly.' 
        : 'Midtrans membutuhkan waktu lebih lama. Pesanan Anda akan segera muncul di Dasbor.');
    }
  };

  const triggerBackendSync = async (bookingId: string) => {
    await fetch('/api/payments/midtrans/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ bookingId })
    }).catch(err => console.error('Sync error:', err));
  };

  const checkStatusOnce = async (bookingId: string, interval: any, attemptsRef: { current: number }) => {
    try {
      attemptsRef.current++;
      await triggerBackendSync(bookingId);
      const res = await fetch(`/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        handlePollResponse(await res.json(), interval, attemptsRef.current);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pollBookingStatus = (bookingId: string) => {
    setCreatedBookingId(bookingId);
    setVerifying(true);
    setVerifyFailed(false);
    setVerifyMsg(language === 'en' ? 'Synchronizing payment with Midtrans...' : 'Sinkronisasi pembayaran dengan Midtrans...');
    const attemptsRef = { current: 0 };
    const interval = setInterval(() => {
      checkStatusOnce(bookingId, interval, attemptsRef);
    }, 2000);
  };

  const triggerSnapPopup = (tokenStr: string, bookingId: string) => {
    if (!(window as any).snap) throw new Error('Secure gateway still initializing. Please retry in a few seconds.');
    (window as any).snap.pay(tokenStr, {
      onSuccess: () => pollBookingStatus(bookingId),
      onPending: () => pollBookingStatus(bookingId),
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
      triggerSnapPopup(payData.token, data.id);
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    } finally {
      setMidtransLoading(false);
    }
  };

  const { execute: executeConfirm, isLoading: submitting } = useAsyncAction(async () => {
    setErrorMsg('');
    try {
      const data = await createBookingApi();
      rotateBookingKey();
      await uploadProofApi(data.id);
      rotatePaymentKey();
      onNavigate('/reservations?payment=success');
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    }
  });

  if (!user || !token) return <p className="text-center py-10">Access Denied</p>;
  if (!params || !params.property || !params.selectedRoom) return <p className="text-center py-10">No Active Booking Selection</p>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100">
          {errorMsg && <div className="mb-4 text-xs font-bold text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">{errorMsg}</div>}
          
          {verifying ? (
            <VerificationPending 
              language={language} 
              statusMessage={verifyMsg} 
              failed={verifyFailed} 
              onRetry={() => pollBookingStatus(createdBookingId!)}
              onGoToReservations={() => onNavigate('/reservations')}
            />
          ) : (
            <>
              {step === 1 && (
                <Step1Form 
                  name={name} setName={setName} email={email} setEmail={setEmail} phone={phone} setPhone={setPhone} 
                  language={language} onNext={() => setStep(2)} t={t} 
                />
              )}
              {step === 2 && (
                <PaymentModeSelection
                  paymentMode={paymentMode} setPaymentMode={setPaymentMode}
                  midtransLoading={midtransLoading} submitting={submitting}
                  onPayMidtrans={handleMidtransPayment} onConfirmManual={executeConfirm}
                  proofUrl={proofUrl} setProofUrl={setProofUrl} language={language} t={t}
                />
              )}
            </>
          )}
        </div>
        <CheckoutSummary
          property={params.property} selectedRoom={params.selectedRoom}
          startDate={params.startDate} endDate={params.endDate} guestCount={params.guestCount || 1}
          breakdown={params.breakdown} language={language} t={t} formatCurrencyIDR={formatCurrencyIDR}
        />
      </div>
    </div>
  );
}
