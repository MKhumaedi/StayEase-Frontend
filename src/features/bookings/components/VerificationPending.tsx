import React from 'react';
import { Loader2, ShieldCheck, CheckCircle } from 'lucide-react';

interface VerificationPendingProps {
  language: string;
  statusMessage: string;
  failed: boolean;
  onRetry: () => void;
  onGoToReservations: () => void;
}

export function VerificationPending({
  language, statusMessage, failed, onRetry, onGoToReservations
}: VerificationPendingProps) {
  return (
    <div className="text-center py-10 flex flex-col items-center gap-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 font-sans">
      
      {/* 
        * LOGIC: Indikator Visual / Ikon Status
        * Menampilkan animasi putar (spin) saat proses verifikasi berjalan, 
        * atau ikon cek berdenyut (pulse) jika verifikasi mengalami kendala/tertunda.
      */}
      {failed ? (
        <CheckCircle className="w-16 h-16 text-amber-500 animate-pulse" />
      ) : (
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
      )}

      {/* 
        * LOGIC: Judul Heading Multibahasa Dinamis
        * Menyesuaikan teks judul berdasarkan status (gagal/berjalan) dan preferensi bahasa (en/id).
      */}
      <h2 className="text-xl font-bold text-indigo-950 font-display">
        {failed 
          ? (language === 'en' ? 'Verification Taking Longer' : 'Verifikasi Memakan Waktu Lebih Lama')
          : (language === 'en' ? 'Verifying Secure Payment' : 'Memverifikasi Pembayaran Aman')}
      </h2>

      {/* 
        * LOGIC: Deskripsi Pesan Status
        * Menampilkan informasi detail tahapan verifikasi yang dikirimkan dari komponen induk.
      */}
      <p className="text-slate-500 text-xs max-w-sm leading-relaxed">
        {statusMessage}
      </p>
      
      {/* 
        * LOGIC: Tombol Interaktif Pemulihan vs Lencana Keamanan
        * Jika gagal, tampilkan tombol aksi untuk Coba Lagi atau Lihat Pesanan.
        * Jika sedang verifikasi normal, tampilkan lencana keamanan Midtrans.
      */}
      {failed ? (
        <div className="flex gap-2 w-full max-w-xs mt-2">
          <button 
            onClick={onRetry} 
            className="flex-1 bg-indigo-900 hover:bg-indigo-850 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all active:scale-95"
          >
            {language === 'en' ? 'Retry Verification' : 'Coba Lagi Verifikasi'}
          </button>
          <button 
            onClick={onGoToReservations} 
            className="flex-1 bg-slate-200 hover:bg-slate-300 text-indigo-950 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all active:scale-95"
          >
            {language === 'en' ? 'Go to Bookings' : 'Lihat Pesanan'}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-black tracking-widest mt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> SECURED BY MIDTRANS
        </div>
      )}
      
    </div>
  );
}