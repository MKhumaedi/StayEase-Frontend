import React from 'react';
import { BookingFilters } from '../types/travelerBookings.types';
import { Search, RefreshCw } from 'lucide-react';

interface Props {
  filters: BookingFilters;
  onChange: (field: keyof BookingFilters, val: any) => void;
  onReset: () => void;
}

export function FilterSection({ filters, onChange, onReset }: Props) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm font-sans text-xs flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <SearchInput val={filters.search} onChange={(v) => onChange('search', v)} />
        <StatusSelect val={filters.status} onChange={(v) => onChange('status', v)} />
        <DateInput label="Check-In" val={filters.startDate} onChange={(v) => onChange('startDate', v)} />
        <DateInput label="Check-Out" val={filters.endDate} onChange={(v) => onChange('endDate', v)} />
      </div>
      <div className="flex justify-end">
        <ResetButton onReset={onReset} />
      </div>
    </div>
  );
}

function SearchInput({ val, onChange }: { val: string; onChange: (s: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
      <input
        type="text"
        placeholder="Cari Kode Reservasi (SE-xxxx)..."
        value={val}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
      />
    </div>
  );
}

function StatusSelect({ val, onChange }: { val: string; onChange: (s: string) => void }) {
  return (
    <select
      value={val}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
    >
      <option value="">Semua Status</option>
      <option value="WAITING_PAYMENT">Menunggu Pembayaran</option>
      <option value="WAITING_CONFIRMATION">Menunggu Konfirmasi</option>
      <option value="CONFIRMED">Dikonfirmasi</option>
      <option value="COMPLETED">Selesai</option>
      <option value="CANCELLED">Dibatalkan</option>
      <option value="AUTO_EXPIRED">Kadaluarsa</option>
    </select>
  );
}

function DateInput({ label, val, onChange }: { label: string; val: string; onChange: (v: string) => void }) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider pr-2 border-r border-slate-100">{label}</span>
      <input
        type="date"
        value={val}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-20 pr-3 py-2 border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans cursor-pointer min-w-0"
      />
    </div>
  );
}

function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <button
      onClick={onReset}
      className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-bold cursor-pointer transition-colors"
    >
      <RefreshCw className="w-3.5 h-3.5" /> Atur Ulang Filter
    </button>
  );
}
