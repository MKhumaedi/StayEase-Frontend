import React from 'react';
import { BookingStats } from '../types/travelerBookings.types';
import { Calendar, CheckCircle2, Clock, ListOrdered } from 'lucide-react';

interface Props {
  stats: BookingStats;
}

export function StatsSummary({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans text-xs">
      <StatCard label="Total Reservasi" val={stats.totalReservations} icon={<ListOrdered className="w-5 h-5 text-indigo-600" />} />
      <StatCard label="Reservasi Aktif" val={stats.activeReservations} icon={<Calendar className="w-5 h-5 text-emerald-600" />} />
      <StatCard label="Reservasi Selesai" val={stats.completedReservations} icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />} />
      <StatCard label="Menunggu Pembayaran" val={stats.waitingPaymentReservations} icon={<Clock className="w-5 h-5 text-amber-600" />} />
    </div>
  );
}

function StatCard({ label, val, icon }: { label: string; val: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 shadow-sm animate-fade-in">
      <div className="p-2.5 bg-slate-50 rounded-xl">{icon}</div>
      <div>
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</p>
        <p className="text-lg font-black text-indigo-950 font-display mt-0.5">{val}</p>
      </div>
    </div>
  );
}
