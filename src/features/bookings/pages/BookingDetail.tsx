import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/i18n';
import { Loader2, ArrowLeft, ShieldAlert, CheckCircle, XCircle, Sparkles, ReceiptText } from 'lucide-react';
import GuestInfoSection from '../components/GuestInfoSection';
import PropertyInfoSection from '../components/PropertyInfoSection';
import PricingBreakdownSection from '../components/PricingBreakdownSection';
import TimelineSection from '../components/TimelineSection';
import PaymentProofUploader from '../../payment-proof/components/PaymentProofUploader';

export default function BookingDetail({ id, onNavigate }: { id: string; onNavigate: (p: string) => void }) {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proofInput, setProofInput] = useState('');
  const [uploading, setUploading] = useState(false);

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

  const [paying, setPaying] = useState(false);

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

  const payWithMidtrans = async () => {
    setPaying(true);
    try {
      const res = await fetch('/api/payments/midtrans/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ bookingId: id })
      });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.error || 'Failed to get payment token');

      if (!(window as any).snap) throw new Error('Payment secure gateway loading, try again.');
      (window as any).snap.pay(data.token, {
        onSuccess: () => fetchDetail(),
        onPending: () => fetchDetail(),
        onError: () => alert('Payment completed with error'),
        onClose: () => console.log('user closed pop-up')
      });
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

  const submitManualProof = (info: { url: string; originalName: string; webpName: string; size: number }) => {
    setUploading(true);
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    const payload = {
      url: info.url,
      originalName: info.originalName,
      webpName: info.webpName,
      size: info.size,
      status: 'PENDING',
      uploadedBy: user?.id,
      createdAt: new Date().toISOString()
    };
    fetch(`/api/bookings/${id}/payment`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ proofUrl: JSON.stringify(payload) })
    })
      .then(() => {
        setUploading(false);
        fetchDetail();
      })
      .catch(() => setUploading(false));
  };

  if (loading) return <div className="flex justify-center items-center py-24 text-indigo-900"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error || !booking) return <div className="text-center py-20 text-rose-600 font-bold p-6 border rounded-xl m-10 bg-rose-50/50">{error || 'Booking sheet not found.'}</div>;

  const isEn = language === 'en';
  const isGuest = booking.guestId === user?.id;
  const isHost = booking.property?.tenantId === user?.id;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 font-sans flex flex-col gap-6">
      {/* Back Header */}
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

      {/* Grid of details */}
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

          {/* Payment Proof verification panel */}
          <div className="bg-white border rounded-xl p-4 flex flex-col gap-3">
            <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1">
              <ReceiptText className="w-3.5 h-3.5 text-indigo-600" /> Payment & Voucher Audit
            </h3>
            {booking.paymentProof?.proofUrl ? (
              <div>
                <span className="text-[10px] text-slate-400 block pb-1">Uploaded bank voucher receipt:</span>
                <a href={getProofSrc()} target="_blank" rel="noopener noreferrer" className="block border rounded-lg overflow-hidden group hover:opacity-90">
                  <img src={getProofSrc()} alt="Transfer proof" className="w-full h-36 object-cover" referrerPolicy="no-referrer" />
                </a>
              </div>
            ) : (
              <div className="text-slate-400 text-[11px] font-semibold text-center py-4 border border-dashed rounded-lg">No payment receipts uploaded yet.</div>
            )}

            {/* Guest pays form */}
            {isGuest && booking.status === 'WAITING_PAYMENT' && (
              <div className="flex flex-col gap-3 border-t pt-3 mt-1">
                <button
                  type="button"
                  onClick={payWithMidtrans}
                  disabled={paying}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2 rounded-lg text-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1 shadow-xs"
                >
                  {paying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Pay Instantly with Midtrans
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-2 text-[10px] text-slate-400 font-bold uppercase">or upload slip</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase text-indigo-950 mb-1">Upload Payment Proof</span>
                  <PaymentProofUploader 
                    onUploadSuccess={submitManualProof}
                    onClear={() => {}}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Operational transition controls */}
      <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl flex flex-wrap gap-3 justify-between items-center font-semibold">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Actions desk</span>
          <span className="text-xs text-slate-600">Available operations based on permissions</span>
        </div>
        <div className="flex gap-2">
          {((isHost || isAdmin) && booking.status === 'WAITING_CONFIRMATION') && (
            <>
              <button onClick={() => updateStatus('CANCELLED')} className="px-4 py-2 border rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer flex items-center gap-1"><XCircle className="w-4 h-4" /> Reject & Cancel</button>
              <button onClick={() => updateStatus('CONFIRMED')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 cursor-pointer flex items-center gap-1 shadow-sm"><CheckCircle className="w-4 h-4" /> Approve & Confirm</button>
            </>
          )}
          {(isGuest && booking.status === 'CONFIRMED') && (
            <button onClick={() => updateStatus('COMPLETED')} className="px-4 py-2 bg-indigo-900 text-white rounded-xl text-xs font-black hover:bg-indigo-850 cursor-pointer flex items-center gap-1 shadow-sm"><Sparkles className="w-4 h-4" /> Complete Stay & Checkout</button>
          )}
          {(isAdmin && booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED') && (
            <>
              <button onClick={() => updateStatus('CANCELLED')} className="px-3 py-1.5 border border-rose-200 rounded text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer">Admin Cancel</button>
              <button onClick={() => updateStatus('CONFIRMED')} className="px-3 py-1.5 border border-indigo-200 rounded text-xs font-bold text-indigo-700 hover:bg-indigo-50 cursor-pointer">Admin Confirm</button>
              <button onClick={() => updateStatus('COMPLETED')} className="px-3 py-1.5 border border-emerald-200 rounded text-xs font-bold text-emerald-700 hover:bg-emerald-50 cursor-pointer">Admin Complete</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
