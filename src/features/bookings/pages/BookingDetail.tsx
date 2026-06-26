import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/i18n';
import { Loader2, ArrowLeft } from 'lucide-react';
import GuestInfoSection from '../components/GuestInfoSection';
import PropertyInfoSection from '../components/PropertyInfoSection';
import PricingBreakdownSection from '../components/PricingBreakdownSection';
import TimelineSection from '../components/TimelineSection';
import PaymentAuditPanel from '../components/PaymentAuditPanel';
import OperationalControls from '../components/OperationalControls';
import { useDocumentMetadata } from '../../../hooks/useDocumentMetadata';

export default function BookingDetail({ id, onNavigate }: { id: string; onNavigate: (p: string) => void }) {
  const { user, token } = useAuth();
  const { language } = useLanguage();

  useDocumentMetadata({
    title: language === 'en' ? `Booking Invoice #${id}` : `Faktur Pemesanan #${id}`,
    description: language === 'en'
      ? `View details and invoice for booking confirmation #${id} on StayEase.`
      : `Lihat detail dan faktur untuk konfirmasi pemesanan #${id} di StayEase.`
  });
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [paying, setPaying] = useState(false);

  const fetchDetail = () => {
    setLoading(true);
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch(`/api/bookings/${id}`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setBooking(data);
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Error occurred');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDetail();
  }, [id, token]);

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

  const syncAndPollDetail = async (headers: any) => {
    try {
      await fetch('/api/payments/midtrans/sync', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id })
      }).catch(err => console.error('Sync error:', err));
      const res = await fetch(`/api/bookings/${id}`, { headers });
      const data = await res.json();
      if (data && data.status !== 'WAITING_PAYMENT') setBooking(data);
    } catch (err) {
      console.error('Polling error:', err);
    }
  };

  useEffect(() => {
    if (booking?.status !== 'WAITING_PAYMENT') return;
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const interval = setInterval(() => syncAndPollDetail(headers), 4000);
    return () => clearInterval(interval);
  }, [id, token, booking?.status]);

  const fetchSnapToken = async () => {
    const res = await fetch('/api/payments/midtrans/create-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ bookingId: id })
    });
    const data = await res.json();
    if (!res.ok || !data.token) throw new Error(data.error || 'Failed');
    return data.token;
  };

  const openSnapUI = (snapToken: string) => {
    if (!(window as any).snap) throw new Error('Secure gateway loading...');
    (window as any).snap.pay(snapToken, {
      onSuccess: () => fetchDetail(),
      onPending: () => fetchDetail(),
      onError: () => alert('Payment failed'),
      onClose: () => console.log('closed')
    });
  };

  const payWithMidtrans = async () => {
    setPaying(true);
    try {
      const snapToken = await fetchSnapToken();
      openSnapUI(snapToken);
    } catch (err: any) {
      alert(err.message || String(err));
    } finally {
      setPaying(false);
    }
  };

  const updateStatus = (status: string) => {
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    fetch(`/api/bookings/${id}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status })
    })
      .then(res => res.json())
      .then(() => fetchDetail())
      .catch(err => alert(err.message));
  };

  const getProofSrc = () => {
    const raw = booking?.paymentProof?.proofUrl;
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

  const buildManualProofPayload = (info: any) => JSON.stringify({
    url: info.url,
    originalName: info.originalName,
    webpName: info.webpName,
    size: info.size,
    status: 'PENDING',
    uploadedBy: user?.id,
    createdAt: new Date().toISOString()
  });

  const submitManualProof = (info: any) => {
    setUploading(true);
    const body = JSON.stringify({ proofUrl: buildManualProofPayload(info) });
    fetch(`/api/bookings/${id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body
    })
      .then(() => fetchDetail())
      .catch(e => alert(e.message))
      .finally(() => setUploading(false));
  };

  if (loading) return <div className="flex justify-center items-center py-24 text-indigo-900"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error || !booking) return <div className="text-center py-20 text-rose-600 font-bold p-6 border rounded-xl m-10 bg-rose-50/50">{error || 'Booking sheet not found.'}</div>;

  const isGuest = booking.guestId === user?.id;
  const isHost = booking.property?.tenantId === user?.id;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 font-sans flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button onClick={() => onNavigate('/bookings')} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reservation Record Details</span>
          <h1 className="text-xl font-bold text-slate-800 font-display flex items-center gap-2 mt-0.5">
            {booking.bookingCode} <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-indigo-600">{booking.status}</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-6">
          <GuestInfoSection name={booking.guestName} email={booking.guestEmail} phone={booking.guestPhone} />
          <PropertyInfoSection propertyName={booking.property?.name || 'StayEase Elite Stay'} roomName={booking.room?.name || 'Standard Package Suite'} startDate={booking.startDate} endDate={booking.endDate} nights={booking.nights} />
          <PricingBreakdownSection basePrice={booking.room?.basePrice} nights={booking.nights} cleaningFee={booking.property?.cleaningFee} serviceFee={booking.property?.serviceFee} securityDeposit={booking.property?.securityDeposit} totalAmount={booking.totalAmount} />
        </div>

        <div className="flex flex-col gap-6">
          <TimelineSection 
            status={booking.status} 
            createdAt={booking.createdAt} 
            checkedInAt={booking.checkedInAt}
            checkedOutAt={booking.checkedOutAt}
          />

          <PaymentAuditPanel
            booking={booking}
            isGuest={isGuest}
            paying={paying}
            payWithMidtrans={payWithMidtrans}
            submitManualProof={submitManualProof}
            getProofSrc={getProofSrc}
          />
        </div>
      </div>

      <OperationalControls
        booking={booking}
        isHost={isHost}
        isGuest={isGuest}
        isAdmin={isAdmin}
        updateStatus={updateStatus}
      />
    </div>
  );
}
