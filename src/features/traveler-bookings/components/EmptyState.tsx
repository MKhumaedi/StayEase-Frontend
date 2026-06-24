import React from 'react';
import { Compass } from 'lucide-react';

interface Props {
  isSearch: boolean;
  onClear?: () => void;
}

export function EmptyState({ isSearch, onClear }: Props) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-12 text-center shadow-sm font-sans text-xs flex flex-col items-center justify-center gap-4">
      <Compass className="w-12 h-12 text-slate-300" />
      <EmptyStateTitle isSearch={isSearch} />
      <EmptyStateAction isSearch={isSearch} onClear={onClear} />
    </div>
  );
}

function EmptyStateTitle({ isSearch }: { isSearch: boolean }) {
  return (
    <div>
      <h4 className="text-sm font-bold text-indigo-950 font-display">
        {isSearch ? 'Tidak Ada Reservasi Cocok' : 'Belum Ada Reservasi'}
      </h4>
      <p className="text-slate-400 mt-1 max-w-xs font-semibold mx-auto">
        {isSearch ? 'Silakan sesuaikan kriteria pencarian atau hapus filter Anda.' : 'Jelajahi penginapan indah di StayEase dan lakukan pemesanan pertama Anda.'}
      </p>
    </div>
  );
}

function EmptyStateAction({ isSearch, onClear }: { isSearch: boolean; onClear?: () => void }) {
  if (isSearch && onClear) {
    return (
      <button onClick={onClear} className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer transition-colors">
        Hapus Filter & Pencarian
      </button>
    );
  }
  return (
    <a href="/" className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors">
      Cari Penginapan Sekarang
    </a>
  );
}
