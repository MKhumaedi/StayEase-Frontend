import React from 'react';
import { ReceiptText, CheckCircle, Loader2 } from 'lucide-react';
import PaymentProofUploader from '../../payment-proof/components/PaymentProofUploader';

interface Props {
  booking: any;
  isGuest: boolean;
  paying: boolean;
  payWithMidtrans: () => void;
  submitManualProof: (info: any) => void;
  getProofSrc: () => string;
}

export default function PaymentAuditPanel({
  booking,
  isGuest,
  paying,
  payWithMidtrans,
  submitManualProof,
  getProofSrc
}: Props) {
  return (
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

      {/* Reservation Confirmed banner */}
      {booking.status === 'CONFIRMED' && (
        <div className="flex flex-col items-center justify-center gap-2 border-t pt-4 mt-2 text-emerald-600 font-bold text-center">
          <CheckCircle className="w-8 h-8 text-emerald-500 animate-bounce" />
          <span className="text-sm">Reservation Confirmed</span>
        </div>
      )}
    </div>
  );
}
