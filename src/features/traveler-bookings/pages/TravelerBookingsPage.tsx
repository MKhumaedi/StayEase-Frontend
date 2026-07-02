import React, { useState } from 'react';
import { useTravelerBookings } from '../hooks/useTravelerBookings';
import { StatsSummary } from '../components/StatsSummary';
import { FilterSection } from '../components/FilterSection';
import { BookingCard } from '../components/BookingCard';
import { EmptyState } from '../components/EmptyState';
import { BookingDetailModal } from '../components/BookingDetailModal';
import { TravelerBooking } from '../types/travelerBookings.types';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';

interface Props {
  token: string | null;
  onReview: (b: any) => void;
  onNavigate?: (path: string, params?: any) => void;
}

export function TravelerBookingsPage({ token, onReview, onNavigate }: Props) {
  const { data, total, stats, loading, filters, changeFilter, resetFilters, reload } = useTravelerBookings(token);
  const [selectedBooking, setSelectedBooking] = useState<TravelerBooking | null>(null);
  const { formatCurrencyIDR } = useLanguage();
  const totalPages = Math.ceil(total / filters.limit) || 1;

  return (
    <div className="space-y-6">
      <StatsSummary stats={stats} />
      <FilterSection filters={filters} onChange={changeFilter} onReset={resetFilters} />
      <MainContent
        loading={loading}
        data={data}
        isSearchActive={!!(filters.search || filters.status || filters.startDate || filters.endDate)}
        onReset={resetFilters}
        setSelectedBooking={setSelectedBooking}
        onReview={onReview}
        formatCurrencyIDR={formatCurrencyIDR}
        onReload={reload}
        onNavigate={onNavigate}
      />
      {data.length > 0 && totalPages > 1 && (
        <Pagination page={filters.page} totalPages={totalPages} onPageChange={(p) => changeFilter('page', p)} />
      )}
      {selectedBooking && <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} formatCurrency={formatCurrencyIDR} />}
    </div>
  );
}

function MainContent({ loading, data, isSearchActive, onReset, setSelectedBooking, onReview, formatCurrencyIDR, onReload, onNavigate }: {
  loading: boolean;
  data: TravelerBooking[];
  isSearchActive: boolean;
  onReset: () => void;
  setSelectedBooking: (b: TravelerBooking) => void;
  onReview: (b: TravelerBooking) => void;
  formatCurrencyIDR: (v: number) => string;
  onReload: () => void;
  onNavigate?: (path: string, params?: any) => void;
}) {
  if (loading) return <LoadingIndicator />;
  if (data.length === 0) return <EmptyState isSearch={isSearchActive} onClear={onReset} />;
  return <BookingList data={data} onDetail={setSelectedBooking} onReview={onReview} formatCurrency={formatCurrencyIDR} onReload={onReload} onNavigate={onNavigate} />;
}

function LoadingIndicator() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-indigo-900 bg-white border border-slate-100 rounded-xl">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}

function BookingList({ data, onDetail, onReview, formatCurrency, onReload, onNavigate }: {
  data: TravelerBooking[];
  onDetail: (b: TravelerBooking) => void;
  onReview: (b: TravelerBooking) => void;
  formatCurrency: (val: number) => string;
  onReload: () => void;
  onNavigate?: (path: string, params?: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {data.map((b, idx) => (
        <BookingCard
          key={`${b.id}-${idx}`}
          booking={b}
          onDetail={onDetail}
          onReview={onReview}
          formatCurrency={formatCurrency}
          onReload={onReload}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  return (
    <div className="flex justify-between items-center bg-white border border-slate-100 rounded-lg p-3 font-sans text-xs">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 cursor-pointer transition-colors flex items-center gap-1 font-bold"
      >
        <ChevronLeft className="w-4 h-4" /> Buka Sebelumnya
      </button>
      <span className="font-extrabold text-slate-500">Halaman {page} dari {totalPages}</span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 cursor-pointer transition-colors flex items-center gap-1 font-bold"
      >
        Lanjut <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
