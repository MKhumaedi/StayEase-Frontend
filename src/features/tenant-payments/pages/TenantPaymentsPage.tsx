import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/i18n';
import { CheckCircle2, XCircle, Eye, AlertCircle, Calendar, DollarSign, ArrowLeft } from 'lucide-react';

interface PaymentInfo {
  id: string;
  url: string;
  originalName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export function parseProof(rawUrl: string): PaymentInfo {
  // 1. Antisipasi jika data berasal dari Payment Gateway Midtrans Otomatis
  if (rawUrl && rawUrl.startsWith('midtrans://')) {
    return { 
      id: 'midtrans_auto', 
      url: '#', 
      originalName: 'Midtrans Gateway', 
      status: 'APPROVED' 
    };
  }

  // 2. Logika untuk parsing data JSON dari Bukti Transfer Manual Bank
  if (rawUrl && rawUrl.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawUrl);
      return { 
        id: parsed.webpName, url: parsed.url, originalName: parsed.originalName, 
        status: parsed.status || 'PENDING', rejectionReason: parsed.rejectionReason 
      };
    } catch {}
  }
  return { id: 'legacy', url: rawUrl, originalName: 'uploaded_proof.webp', status: 'PENDING' };
}

export default function TenantPaymentsPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { token } = useAuth();
  const { language, formatCurrencyIDR } = useLanguage();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = () => {
    const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch('/api/tenant/payments', { headers: authHeader })
      .then(res => res.json())
      .then((data) => {
        setBookings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, [token]);

  const handleAction = async (endpoint: string, method = 'POST', body?: any) => {
    try {
      setError(null);
      const res = await fetch(`/api/tenant/payments/${endpoint}`, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: body ? JSON.stringify(body) : undefined
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Request failed');
      }
      fetchPayments();
      setRejectId(null);
      setReasonInput('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApprove = (bookingId: string) => {
    handleAction(`${bookingId}/approve`);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonInput.trim() || !rejectId) return;
    handleAction(`${rejectId}/reject`, 'POST', { reason: reasonInput.trim() });
  };

  if (loading) {
    return <div className="text-center py-24 font-bold text-slate-500 text-xs">Retrieving verification ledger...</div>;
  }

  const en = language === 'en';

  return (
    <div className="max-w-7xl mx-auto px-6 py-4 font-sans text-xs">
      {/* Header Block */}
      <div className="flex items-center gap-3 mb-6 bg-white p-4 border border-slate-150 rounded-2xl shadow-2xs">
        <button onClick={() => onNavigate('/dashboard')} className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight font-display">
            {en ? 'Incoming Traveler Transfers' : 'Persetujuan Bukti Transfer Manual'}
          </h1>
          <p className="text-[10px] text-slate-450 font-semibold mt-0.5">
            {en ? 'Verify and reconcile guest bank transfer receipts securely.' : 'Audit dan verifikasi resi/slip transfer bank para tamu.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-rose-700 font-bold">
          <AlertCircle className="w-4 h-4 flex-none" /> {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-150 rounded-2xl text-slate-400 font-bold">
          {en ? 'No transfer receipts found.' : 'Belum terdapat unggahan bukti transfer.'}
        </div>
      ) : (
        <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-150 text-slate-500 font-black tracking-wider uppercase text-[9px]">
                <th className="p-4">{en ? 'Booking Ref' : 'No. Booking'}</th>
                <th className="p-4">{en ? 'Property' : 'Properti & Room'}</th>
                <th className="p-4">{en ? 'Traveler' : 'Nama Tamu'}</th>
                <th className="p-4">{en ? 'Amount' : 'Total Bayar'}</th>
                <th className="p-4">{en ? 'Proof Image' : 'Bukti Transfer'}</th>
                <th className="p-4 text-center">{en ? 'Status & Actions' : 'Status & Opsi'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {bookings.map((b, idx) => {
                const proof = parseProof(b.paymentProof?.proofUrl);
                const isPending = proof.status === 'PENDING' && b.status === 'WAITING_CONFIRMATION';
                return (
                  <tr key={`${b.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-black text-slate-800">{b.bookingCode}</td>
                    <td className="p-4">
                      <p className="text-slate-800 font-bold">{b.property.name}</p>
                      <span className="text-[10px] text-slate-450 block font-medium">Checkout Date: {new Date(b.endDate).toLocaleDateString()}</span>
                    </td>
                    <td className="p-4">{b.guestName}</td>
                    <td className="p-4 text-indigo-750 font-black">{formatCurrencyIDR(b.totalAmount)}</td>
                    <td className="p-4">
                      {proof.id === 'midtrans_auto' ? (
                        <span className="text-slate-400 italic font-medium">Automatic System Verification</span>
                      ) : (
                        <button onClick={() => setSelectedProof(proof.url)} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100/80 hover:bg-slate-200 border border-slate-200 rounded-xl font-bold text-slate-750 transition-all cursor-pointer">
                          <Eye className="w-3.5 h-3.5" /> {en ? 'View Slip' : 'Lihat Detail'}
                        </button>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {isPending ? (
                          <>
                            <button onClick={() => handleApprove(b.id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1 font-black">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {en ? 'Approve' : 'Setujui'}
                            </button>
                            <button onClick={() => setRejectId(b.id)} className="px-3 py-1.5 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-rose-650 rounded-xl cursor-pointer flex items-center gap-1 font-black">
                              <XCircle className="w-3.5 h-3.5" /> {en ? 'Reject' : 'Tolak'}
                            </button>
                          </>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            proof.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            proof.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {proof.status === 'APPROVED' ? (en ? 'Approved' : 'Disetujui') :
                             proof.status === 'REJECTED' ? (en ? 'Rejected' : 'Ditolak') : (en ? 'Pending' : 'Diproses')}
                          </span>
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

      {/* Proof Modal Overlay */}
      {selectedProof && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 border shadow-2xl relative">
            <h3 className="font-black text-sm text-slate-800 mb-4 font-display">{en ? 'Traveler Payment Proof Receipt' : 'Resi Slip Transfer Bank'}</h3>
            <img src={selectedProof} alt="Bank Receipt" className="max-h-[60vh] w-full object-contain rounded-xl border mb-4 bg-slate-50" />
            <div className="text-right">
              <button onClick={() => setSelectedProof(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-950 text-white font-bold rounded-xl cursor-pointer shadow-xs">
                {en ? 'Close Preview' : 'Tutup Resi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal Option dialog */}
      {rejectId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleRejectSubmit} className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-100 shadow-2xl">
            <h3 className="font-black text-sm text-rose-700 mb-3 flex items-center gap-1.5">
              <XCircle className="w-4 h-4" /> {en ? 'Decline Payment Transfer' : 'Tolak Pembayaran Bank'}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mb-4 leading-relaxed">
              {en ? 'Please explain why this payment setup was rejected.' : 'Berikan penjelasan pembatalan agar traveler dapat mengunggah bukti yang benar.'}
            </p>
            <textarea required value={reasonInput} onChange={e => setReasonInput(e.target.value)} placeholder={en ? 'E.g., Transfer amount does not match booking invoice.' : 'Contoh: Jumlah transfer kurang dari invoice booking.'} className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 min-h-[90px] focus:outline-hidden font-semibold text-slate-700 mb-4" />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setRejectId(null); setReasonInput(''); }} className="px-4 py-2 hover:bg-slate-100 rounded-xl font-bold text-slate-500 cursor-pointer">Batal</button>
              <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black shadow-xs cursor-pointer">
                {en ? 'Submit Decline' : 'Tolak Bukti'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}