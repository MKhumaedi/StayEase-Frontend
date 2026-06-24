import React, { useState } from 'react';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../../lib/api';
import { generateInvoicePdf } from '../services/PdfInvoiceService';
import { InvoiceBooking } from '../types/invoice.types';

interface Props {
  bookingId: string;
  status: string;
}

export function DownloadInvoiceButton({ bookingId, status }: Props) {
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const isAllowed = status === 'CONFIRMED' || status === 'COMPLETED';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchAndDownload = async () => {
    const { data } = await api.get<InvoiceBooking>(`/bookings/${bookingId}`);
    await generateInvoicePdf(data);
  };

  const handleDownload = async () => {
    if (!isAllowed) {
      showToast('Invoice tersedia setelah pembayaran berhasil diverifikasi.');
      return;
    }
    setLoading(true);
    try {
      await fetchAndDownload();
    } catch (err: any) {
      showToast(err?.message || 'Gagal memuat data billing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="px-3 py-1.5 border border-slate-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 disabled:opacity-50 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all duration-200"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        <span>Invoice</span>
      </button>

      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-slate-100 text-[11px] font-bold py-3.5 px-4.5 rounded-2xl shadow-xl flex items-center gap-2.5 z-50 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </>
  );
}
