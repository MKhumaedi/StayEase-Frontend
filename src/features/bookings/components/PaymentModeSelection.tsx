import React from 'react';
import { ShieldCheck, Loader2, Check } from 'lucide-react';

interface PaymentModeSelectionProps {
  paymentMode: 'midtrans' | 'manual';
  setPaymentMode: (val: 'midtrans' | 'manual') => void;
  midtransLoading: boolean;
  submitting: boolean;
  onPayMidtrans: () => void;
  onConfirmManual: () => void;
  proofUrl: string;
  setProofUrl: (val: string) => void;
  language: string;
  t: any;
}

export function PaymentModeSelection({
  paymentMode, setPaymentMode, midtransLoading, submitting, onPayMidtrans, onConfirmManual, proofUrl, setProofUrl, language, t
}: PaymentModeSelectionProps) {
  const isMidtrans = paymentMode === 'midtrans';

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-bold text-slate-800 font-display">{language === 'en' ? 'Select Payment Method' : 'Pilih Metode Pembayaran'}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setPaymentMode('midtrans')}
          className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
            isMidtrans ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-100 hover:border-slate-200'
          }`}
        >
          <span className="font-bold text-indigo-950 text-sm">{language === 'en' ? 'Midtrans Secure Payment' : 'Pembayaran Aman Midtrans'}</span>
          <span className="text-xs text-slate-500 mt-1">{language === 'en' ? 'Supports QRIS, E-Wallet, VA, & Instant' : 'Mendukung QRIS, Dompet, VA, & Transfer'}</span>
        </button>

        <button
          type="button"
          onClick={() => setPaymentMode('manual')}
          className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
            !isMidtrans ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-100 hover:border-slate-200'
          }`}
        >
          <span className="font-bold text-indigo-950 text-sm">{language === 'en' ? 'Manual Bank Transfer' : 'Transfer Bank Manual'}</span>
          <span className="text-xs text-slate-500 mt-1">{language === 'en' ? 'Manually upload transfer voucher' : 'Unggah bukti transfer manual'}</span>
        </button>
      </div>

      {isMidtrans ? (
        <MidtransPaymentSection loading={midtransLoading} onPay={onPayMidtrans} language={language} />
      ) : (
        <ManualPaymentSection
          submitting={submitting}
          onConfirm={onConfirmManual}
          proofUrl={proofUrl}
          setProofUrl={setProofUrl}
          language={language}
          t={t}
        />
      )}
    </div>
  );
}

function MidtransPaymentSection({ loading, onPay, language }: { loading: boolean; onPay: () => void; language: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 bg-slate-50 border rounded-xl text-xs space-y-2 text-slate-600 leading-relaxed font-semibold">
        <p className="font-bold text-indigo-950">{language === 'en' ? 'Midtrans Sandbox Gateway' : 'Gerbang Sandbox Midtrans'}</p>
        <p>{language === 'en' ? 'Pay seamlessly using QRIS or select virtual accounts.' : 'Bayar dengan kode QRIS atau akun virtual yang tersedia.'}</p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" /> {language === 'en' ? 'Secured by Midtrans Snap protocol.' : 'Diamankan oleh protokol Midtrans Snap.'}
      </div>
      <button 
        onClick={onPay} 
        disabled={loading}
        className="bg-indigo-900 hover:bg-indigo-850 disabled:bg-slate-200 text-white font-bold py-3 rounded-xl text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        {loading ? (language === 'en' ? 'Initializing Snap...' : 'Menyiapkan Snap...') : (language === 'en' ? 'Pay Instantly with Snap' : 'Bayar Instan dengan Snap')}
      </button>
    </div>
  );
}

function ManualPaymentSection({
  submitting, onConfirm, proofUrl, setProofUrl, language, t
}: { submitting: boolean; onConfirm: () => void; proofUrl: string; setProofUrl: (v: string) => void; language: string; t: any }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 bg-slate-50 border rounded-xl text-xs space-y-2 text-slate-600 leading-relaxed font-semibold">
        <div>{language === 'en' ? 'Account Holder Name' : 'Nama Pemegang Rekening'}: <span className="text-indigo-950 font-bold block">StayEase Platform Ltd.</span></div>
        <div>{language === 'en' ? 'Account Routing IBAN' : 'Nomor Mandiri / VA'}: <span className="text-indigo-950 font-bold block">1204-589-32210 (StayEase Inc)</span></div>
      </div>
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">{t.checkout.uploadPaymentProofButton}</label>
        <input type="text" value={proofUrl} onChange={e => setProofUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg p-3 focus:outline-hidden" />
      </div>
      <button 
        onClick={onConfirm} 
        disabled={submitting}
        className="bg-indigo-900 hover:bg-indigo-850 text-white font-bold py-3 rounded-xl text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {t.common.confirm}
      </button>
    </div>
  );
}
