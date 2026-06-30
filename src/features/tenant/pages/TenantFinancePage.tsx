import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/i18n';
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  ArrowLeft, 
  ArrowUpRight, 
  CreditCard, 
  Briefcase, 
  TrendingUp, 
  DownloadCloud, 
  FileText,
  BadgeAlert
} from 'lucide-react';
import { parseProof } from '../../tenant-payments/pages/TenantPaymentsPage';

interface FinanceProps {
  onNavigate: (p: string) => void;
  initialTab?: 'midtrans' | 'manual' | 'settlements' | 'revenue';
}

export default function TenantFinancePage({ onNavigate, initialTab }: FinanceProps) {
  const { token, user } = useAuth();
  const { language, formatCurrencyIDR } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'midtrans' | 'manual' | 'settlements' | 'revenue'>(initialTab || 'midtrans');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Settlement-specific states
  const [isSettling, setIsSettling] = useState(false);
  const [settledSuccess, setSettledSuccess] = useState(false);

  const fetchPayments = () => {
    setLoading(true);
    const authHeader: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
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
    const interval = setInterval(() => {
      const authHeader: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      fetch('/api/tenant/payments', { headers: authHeader })
        .then(res => res.json())
        .then((data) => {
          setBookings(Array.isArray(data) ? data : []);
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
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

  const triggerSettlement = () => {
    setIsSettling(true);
    setTimeout(() => {
      setIsSettling(false);
      setSettledSuccess(true);
      setTimeout(() => setSettledSuccess(false), 4000);
    }, 1200);
  };

  // Split calculations
  const midtransBookings = bookings.filter(b => b.paymentProof?.proofUrl?.includes('midtrans') || !b.paymentProof);
  const manualBookings = bookings.filter(b => b.paymentProof?.proofUrl && !b.paymentProof.proofUrl.includes('midtrans'));

  const midtransTotal = midtransBookings
    .filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  const manualTotal = manualBookings
    .filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  const pendingManualReviewCount = bookings.filter(b => {
    const proof = parseProof(b.paymentProof?.proofUrl);
    return proof.status === 'PENDING' && b.status === 'WAITING_CONFIRMATION';
  }).length;

  const totalRevenue = midtransTotal + manualTotal;
  const serviceFees = Math.round(midtransTotal * 0.02); // 2% Midtrans processing fee
  const netSettled = totalRevenue - serviceFees;

  const en = language === 'en';

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800">
      
      {/* Header operations area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-indigo-950 font-display">
            {en ? 'Finance Ledger' : 'Manajemen Keuangan'}
          </h2>
          <p className="text-xs text-slate-500">
            {en 
              ? 'Consolidated partner financial module tracking Midtrans merchant portal, manual bank transfer receipts, and settlement disbursements.' 
              : 'Modul keuangan mitra terintegrasi untuk melacak transfer Midtrans, verifikasi slip manual, dan pencairan deposit harian.'}
          </p>
        </div>
        {activeTab === 'revenue' && (
          <button className="text-xs bg-indigo-900 text-white font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-900 cursor-pointer shadow-xs transition-all">
            <DownloadCloud className="w-4 h-4" /> {en ? 'Export General Ledger (CSV)' : 'Ekspor Buku Kas (CSV)'}
          </button>
        )}
      </div>

      {/* Top level stats belt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-120 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              {en ? 'Total Partner Revenue' : 'Total Pendapatan'}
            </span>
            <span className="text-lg font-black text-slate-800 font-display">
              {formatCurrencyIDR(totalRevenue)}
            </span>
          </div>
          <span className="p-3 rounded-xl bg-indigo-50 text-indigo-700 shrink-0"><DollarSign className="w-5 h-5" /></span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-120 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              {en ? 'Midtrans Channel' : 'Metode Online Midtrans'}
            </span>
            <span className="text-lg font-black text-emerald-700 font-display">
              {formatCurrencyIDR(midtransTotal)}
            </span>
          </div>
          <span className="p-3 rounded-xl bg-emerald-50 text-emerald-700 shrink-0"><CreditCard className="w-5 h-5" /></span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-120 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              {en ? 'Manual Bank Inbound' : 'Metode Manual Bank'}
            </span>
            <span className="text-lg font-black text-blue-700 font-display">
              {formatCurrencyIDR(manualTotal)}
            </span>
          </div>
          <span className="p-3 rounded-xl bg-blue-50 text-blue-700 shrink-0"><Briefcase className="w-5 h-5" /></span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-120 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              {en ? 'Manual Approvals Queue' : 'Antrean Pembayaran'}
            </span>
            <span className="text-lg font-black text-amber-700 font-display">
              {pendingManualReviewCount} {en ? 'Pending' : 'Tertunda'}
            </span>
          </div>
          <span className="p-3 rounded-xl bg-amber-50 text-amber-750 shrink-0"><BadgeAlert className="w-5 h-5" /></span>
        </div>
      </div>

      {/* Segmented Horizontal Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-fit self-center border border-slate-200/50">
        {[
          { id: 'midtrans', name: en ? 'Midtrans Payments' : 'Gerbang Online Midtrans' },
          { id: 'manual', name: en ? 'Manual Transfers' : 'Transfer Manual' },
          { id: 'settlements', name: en ? 'SaaS Settlements' : 'Pencairan Dana' },
          { id: 'revenue', name: en ? 'Revenue Records' : 'Arsip Pembukuan' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer focus:outline-hidden ${
              activeTab === tab.id 
                ? 'bg-indigo-900 text-white shadow-xs' 
                : 'text-slate-600 hover:text-indigo-900 hover:bg-slate-50'
            }`}
          >
            {tab.name}
            {tab.id === 'manual' && pendingManualReviewCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-rose-600 text-[9px] text-white rounded-full font-black animate-pulse">
                {pendingManualReviewCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-rose-700 font-bold text-xs">
          <AlertCircle className="w-4 h-4 flex-none" /> {error}
        </div>
      )}

      {/* Main rendering block */}
      <div className="bg-white rounded-2xl border border-slate-100 p-1 shadow-2xs">
        
        {/* TAB 1: Midtrans Payments */}
        {activeTab === 'midtrans' && (
          <div className="p-4 flex flex-col gap-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {en ? 'Automated Midtrans Snap Operations' : 'Operasional Gerbang Transaksi Online Midtrans'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {en 
                    ? 'Credit cards, virtual accounts, and GoPay QRIS processed instantly with automated callback registers' 
                    : 'Detail transaksi kartu kredit, akun virtual, dan GoPay QRIS yang diproses secara instan melalui webhook'}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center font-bold text-slate-450 text-xs">Loading operational transaction database...</div>
            ) : midtransBookings.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-xs">
                {en ? 'No Midtrans transactions recorded yet.' : 'Belum ada transaksi melalui Midtrans.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-150 text-slate-500 font-black tracking-wider uppercase text-[9px]">
                      <th className="p-3">Ref Code</th>
                      <th className="p-3">Property</th>
                      <th className="p-3">Guest</th>
                      <th className="p-3">Amount Paid</th>
                      <th className="p-3">Channel Provider</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-650">
                    {midtransBookings.map((b, idx) => {
                      const proofUrl = b.paymentProof?.proofUrl || '';
                      let midtransId = 'SNAP-TRX-' + b.bookingCode;
                      if (proofUrl) {
                        if (proofUrl.trim().startsWith('{')) {
                          try {
                            const parsed = JSON.parse(proofUrl);
                            const url = parsed.url || '';
                            if (url.includes('midtrans://')) {
                              midtransId = url.replace('midtrans://', '');
                            } else if (parsed.id) {
                              midtransId = parsed.id;
                            }
                          } catch {}
                        } else if (proofUrl.includes('midtrans://')) {
                          midtransId = proofUrl.replace('midtrans://', '');
                        }
                      }
                      return (
                        <tr key={`${b.id}-${idx}`} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">
                            <div>{b.bookingCode}</div>
                            <span className="text-[9px] font-mono text-slate-400 font-normal">{midtransId}</span>
                          </td>
                          <td className="p-3">{b.property?.name ?? 'StayEase Listing'}</td>
                          <td className="p-3">{b.guestName}</td>
                          <td className="p-3 text-indigo-750 font-bold">{formatCurrencyIDR(b.totalAmount)}</td>
                          <td className="p-3">
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase">MIDTRANS SNAP</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${b.status === 'CONFIRMED' || b.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {b.status === 'CONFIRMED' ? 'Paid' : b.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Manual Transfers (The receipt review section) */}
        {activeTab === 'manual' && (
          <div className="p-4 flex flex-col gap-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {en ? 'Manual Bank Transfer Approvals Panel' : 'Panel Peninjauan Slip Manual Bank'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {en 
                    ? 'Manually audit and reconcile physical photos, screenshots, and bank slip uploads for bookings' 
                    : 'Tinjau secara manual resi transfer fisik, m-banking screenshot, dan slip cetak yang diunggah oleh penyewa'}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center font-bold text-slate-450 text-xs">Reconciling manual verification register...</div>
            ) : manualBookings.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-xs">
                {en ? 'No manual bank receipts uploaded yet.' : 'Belum terdapat unggahan bukti transfer manual.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-150 text-slate-500 font-black tracking-wider uppercase text-[9px]">
                      <th className="p-3">Ref Code</th>
                      <th className="p-3">Property</th>
                      <th className="p-3">Traveler</th>
                      <th className="p-3">Billing Invoice</th>
                      <th className="p-3">Slip Receipt</th>
                      <th className="p-3 text-center">Verification Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-650">
                    {manualBookings.map((b, idx) => {
                      const proof = parseProof(b.paymentProof?.proofUrl);
                      const isPending = b.status === 'WAITING_CONFIRMATION';
                      const isApproved = b.status === 'CONFIRMED' || b.status === 'COMPLETED';
                      const isRejected = b.status === 'WAITING_PAYMENT' && proof.status === 'REJECTED';
                      return (
                        <tr key={`${b.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-bold text-slate-800">{b.bookingCode}</td>
                          <td className="p-3">
                            <p className="text-slate-800 font-bold leading-tight">{b.property?.name}</p>
                            <span className="text-[10px] text-slate-450 font-normal">Until: {new Date(b.endDate).toLocaleDateString()}</span>
                          </td>
                          <td className="p-3">{b.guestName}</td>
                          <td className="p-3 text-indigo-750 font-bold">{formatCurrencyIDR(b.totalAmount)}</td>
                          <td className="p-3">
                            <button 
                              onClick={() => setSelectedProof(proof.url)} 
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg font-bold text-slate-700 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-600" /> {en ? 'View Slip' : 'Lihat Rekening'}
                            </button>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1.5">
                              {isPending ? (
                                <>
                                  <button 
                                    onClick={() => handleApprove(b.id)} 
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1 font-bold"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> {en ? 'Approve' : 'Setujui'}
                                  </button>
                                  <button 
                                    onClick={() => setRejectId(b.id)} 
                                    className="px-3 py-1.5 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-rose-600 rounded-xl cursor-pointer flex items-center gap-1 font-bold"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> {en ? 'Reject' : 'Tolak'}
                                  </button>
                                </>
                              ) : (
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isApproved ? 'bg-emerald-100 text-emerald-800' :
                                  isRejected ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {isApproved ? (en ? 'Approved' : 'Disetujui') :
                                   isRejected ? (en ? 'Rejected' : 'Ditolak') : (en ? 'Pending' : 'Diproses')}
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
          </div>
        )}

        {/* TAB 3: Settlements (Pencairan Dana) */}
        {activeTab === 'settlements' && (
          <div className="p-6 flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-bold text-indigo-950 uppercase tracking-wider block">
                {en ? 'Daily Settlement & Revenue Disbursements' : 'Pencairan Arus Kas Harian & Dana Deposit'}
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                {en 
                  ? 'All funds received from platform bookings are settled to your listed corporate bank account daily. Payout standard cycle runs every morning at 08:00 AM UTC.' 
                  : 'Seluruh dana yang masuk dari reservasi tamu akan otomatis dicairkan ke rekening bank terdaftar Anda secara instan atau harian pada pukul 08:00 WIB.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Account summary left side */}
              <div className="md:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-200/60 flex flex-col gap-4">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">{en ? 'Designated Payee Bank Profile' : 'Profil Bank Penerima Manfaat'}</span>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Bank Institution</span>
                    <strong className="text-slate-800 text-sm">PT Bank Central Asia Tbk. (BCA)</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Account Number</span>
                    <strong className="text-slate-800 text-sm font-mono tracking-wider">8291-0391-77</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Account Holder Name</span>
                    <strong className="text-slate-800 text-sm block uppercase mt-0.5">{user?.name ?? 'DEFAULT PARTNER HOST'}</strong>
                  </div>
                </div>

                <div className="border-t border-slate-200/80 pt-4 mt-2 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Gross Sales Volume</span>
                    <span className="font-bold text-slate-800">{formatCurrencyIDR(totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Merchant Platform Services (2% Midtrans Snap)</span>
                    <span className="font-semibold text-rose-600">-{formatCurrencyIDR(serviceFees)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-200/50 pt-2.5">
                    <span className="font-bold text-slate-800 text-sm">{en ? 'Net Settled Account funds' : 'Net Dana Dapat Dicairkan'}</span>
                    <span className="font-black text-emerald-650 text-base font-display">{formatCurrencyIDR(netSettled)}</span>
                  </div>
                </div>
              </div>

              {/* Settlement trigger right side */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col justify-between gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-300 block">{en ? 'SaaS Immediate Transfer' : 'Pencairan Instan Real-time'}</span>
                  <div className="text-2xl font-black font-display text-white mt-1.5">{formatCurrencyIDR(netSettled)}</div>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-2.5 font-semibold">
                    {en 
                      ? 'Reconcile ledger accounts and disburse your current earnings instantly to PT Bank Central Asia.' 
                      : 'Cairkan saldo pendapatan kotor hasil reservasi penginapan Anda langsung ke rekening bank BCA secara instan.'}
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button 
                    disabled={isSettling || netSettled <= 0}
                    onClick={triggerSettlement}
                    className="w-full py-2.5 bg-indigo-505 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-indigo-600/15"
                  >
                    {isSettling ? (en ? 'Processing Settlement...' : 'Sedang Memproses...') : (en ? 'Withdraw Funds Now' : 'Tarik Saldo Sekarang')}
                  </button>
                  <span className="text-[9px] text-center text-slate-450 font-normal">
                    {en 
                      ? 'Withdrawal settled in seconds. BCA networks active 24/7.' 
                      : 'Dana cair dalam hitungan detik. Transaksi otomatis diproses Bank.'}
                  </span>
                </div>
              </div>

            </div>

            {settledSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4 text-emerald-350 flex items-center gap-3 animate-bounce">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <div className="text-xs font-semibold">
                  <strong>{en ? 'Disbursement Initiated Successfully!' : 'Pencairan Saldo Berhasil!'}</strong>
                  <p className="font-normal mt-0.5">{en ? 'Bank BCA is processing PT StayEase Auto-Settlement. Receipt should arrive shortly.' : 'Bank BCA sedang memproses Auto-Settlement dari StayEase. Resi pengiriman akan tiba sebentar lagi.'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Revenue Records (Arsip Pembukuan) */}
        {activeTab === 'revenue' && (
          <div className="p-4 flex flex-col gap-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {en ? 'Historical Revenue Records & Receipt Invoices' : 'Dokumen Riwayat Transaksi Pendapatan & Invoice'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {en 
                    ? 'Archive list detailing successful rent out bookings, channel values, service splits, and ledger statuses.' 
                    : 'Dokumen arsip lengkap penyewaan unit penginapan, biaya administrasi, potongan, dan status pembayaran.'}
                </p>
              </div>
            </div>

            {bookings.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-xs">
                {en ? 'No revenue records found.' : 'Belum ada records pembukuan.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-150 text-slate-500 font-black tracking-wider uppercase text-[9px]">
                      <th className="p-3">Booking Code</th>
                      <th className="p-3">Property</th>
                      <th className="p-3">Guest</th>
                      <th className="p-3">Payment Method</th>
                      <th className="p-3">Provider</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Paid At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-650">
                    {bookings.map((b, idx) => {
                      const proof = parseProof(b.paymentProof?.proofUrl);
                      const isMidtr = b.paymentProof?.proofUrl?.includes('midtrans');
                      const payMethod = isMidtr ? 'Midtrans' : b.paymentProof ? 'Manual' : 'None';
                      const payProvider = isMidtr ? 'SNAP Online' : b.paymentProof ? 'Bank Transfer' : '-';
                      const paidAtTime = b.paymentProof?.createdAt 
                        ? new Date(b.paymentProof.createdAt).toLocaleString() 
                        : (b.status === 'CONFIRMED' || b.status === 'COMPLETED') 
                          ? new Date(b.updatedAt).toLocaleString() 
                          : '-';
                      return (
                        <tr key={`${b.id}-${idx}`} className="hover:bg-slate-55/50 transition-colors">
                          <td className="p-3 font-bold text-slate-800">{b.bookingCode}</td>
                          <td className="p-3 text-slate-700">{b.property?.name ?? 'StayEase Listing'}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{b.guestName}</div>
                            <span className="text-[9px] text-slate-400 font-normal">{b.guestEmail}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              payMethod === 'Midtrans' ? 'bg-emerald-50 text-emerald-700' :
                              payMethod === 'Manual' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-500'
                            }`}>
                              {payMethod}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{payProvider}</td>
                          <td className="p-3 text-indigo-950 font-extrabold">{formatCurrencyIDR(b.totalAmount)}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              b.status === 'CONFIRMED' || b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                              b.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="p-3 text-right text-slate-500 font-normal">{paidAtTime}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Proof Modal Overlay */}
      {selectedProof && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in animate-duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border shadow-2xl relative">
            <h3 className="font-bold text-base text-slate-850 mb-4 font-display">{en ? 'Traveler Payment Proof Receipt' : 'Detail Slip Resi Transfer'}</h3>
            <img src={selectedProof} alt="Bank Receipt" className="max-h-[55vh] w-full object-contain rounded-2xl border mb-4 bg-slate-50" referrerPolicy="no-referrer" />
            <div className="text-right">
              <button onClick={() => setSelectedProof(null)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold rounded-xl cursor-pointer text-xs transition-colors shadow-xs">
                {en ? 'Close Preview' : 'Tutup Resi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal dialog */}
      {rejectId && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleRejectSubmit} className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-100 shadow-2xl">
            <h3 className="font-bold text-base text-rose-700 mb-2 flex items-center gap-1.5">
              <XCircle className="w-5 h-5" /> {en ? 'Decline Payment Transfer' : 'Tolak Pembayaran Bank'}
            </h3>
            <p className="text-[11px] text-slate-450 font-normal mb-4 leading-relaxed">
              {en ? 'Please explain why this payment setup was rejected.' : 'Berikan penjelasan agar traveler dapat mengunggah bukti/slip dengan benar.'}
            </p>
            <textarea required value={reasonInput} onChange={e => setReasonInput(e.target.value)} placeholder={en ? 'E.g., Transfer amount does not match booking invoice.' : 'Contoh: Jumlah transfer kurang dari invoice booking.'} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50 min-h-[90px] focus:outline-hidden font-semibold text-slate-700 mb-4 focus:ring-1 focus:ring-indigo-500" />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setRejectId(null); setReasonInput(''); }} className="px-4 py-2 hover:bg-slate-100 rounded-xl font-bold text-xs text-slate-500 cursor-pointer">Batal</button>
              <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-750 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer">
                {en ? 'Submit Decline' : 'Tolak Bukti'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
