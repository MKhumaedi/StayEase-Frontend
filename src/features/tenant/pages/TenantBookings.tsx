import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus } from '../../../types';
import { 
  Mail, 
  Phone, 
  Calendar, 
  Check, 
  X, 
  Loader2, 
  CalendarX, 
  Archive, 
  Clock, 
  Sliders, 
  ArrowRight,
  Sparkles,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import { useAuth } from '../../../shared/context/AuthContext';
import { formatWithSettings } from '../../../shared/services/dateService';

export default function TenantBookings() {
  const { user } = useAuth();
  const { language, formatCurrencyIDR } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'archive' | 'active' | 'status'>('active');
  const [archiveFilter, setArchiveFilter] = useState<string>('ALL');

  const en = language === 'en';

  const fetchBookings = () => {
    setLoading(true);
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => {
        setBookings(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/bookings/${id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true, status })
      });
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  // Archive lists all (with custom status fitlers)
  const filteredArchive = bookings.filter(b => {
    if (archiveFilter === 'ALL') return true;
    return (b.status as string) === archiveFilter;
  });

  // Active bookings are confirmed or currently checked in
  const activeBookings = bookings.filter(b => 
    (b.status as string) === 'CONFIRMED' || (b.status as string) === 'CHECKED_IN' || (b.status as string) === 'PENDING'
  );

  // Status management shows interactive cards for action-taking
  const statusManagementList = bookings.filter(b => 
    (b.status as string) === 'PENDING' || (b.status as string) === 'CONFIRMED' || (b.status as string) === 'CHECKED_IN' || (b.status as string) === 'CHECKED_OUT'
  );

  return (
    <div className="flex flex-col gap-6 font-sans">
      
      {/* Header section with tab metadata */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-indigo-950 font-display">
            {en ? 'Reservations Desk' : 'Pusat Reservasi & Kamar'}
          </h2>
          <p className="text-xs text-slate-500">
            {en 
              ? 'Oversee reservation pipelines, process check-ins, change occupancy status and audit history.' 
              : 'Pantau status reservasi tamu, jalankan proses check-in/out, perbarui status hunian dan lihat arsip.'}
          </p>
        </div>
      </div>

      {/* Segmented control tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-full lg:w-fit self-center border border-slate-200/50 overflow-x-auto text-[11px] font-bold">
        {[
          { id: 'active', name: en ? 'Active Reservations' : 'Reservasi Aktif', icon: Clock },
          { id: 'archive', name: en ? 'Booking Archive' : 'Arsip Riwayat', icon: Archive },
          { id: 'status', name: en ? 'Status Flow Management' : 'Manajemen Alur Status', icon: Sliders }
        ].map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border-0 ${
                activeSubTab === tab.id 
                  ? 'bg-indigo-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-indigo-900 hover:bg-slate-50'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-indigo-900">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-50 p-1">
          
          {/* ACTIVE RESERVATIONS TAB */}
          {activeSubTab === 'active' && (
            <div className="flex flex-col gap-4">
              <div className="px-3 pt-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{en ? 'Current Active Stays' : 'Penginapan Aktif Menunggu & Berlangsung'}</h3>
                <p className="text-[11px] text-slate-500">{en ? 'Bookings currently pending payment, confirmed, or checked-in.' : 'Reservasi tidur dalam status dikonfirmasi, tertunda pembayaran, atau sudah masuk kamar.'}</p>
              </div>

              {activeBookings.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6">
                  <CalendarX className="w-10 h-10 text-slate-300 mb-2" />
                  <span className="text-xs text-slate-400 font-bold">{en ? 'No active reservations found.' : 'Tidak ada reservasi aktif.'}</span>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {activeBookings.map((b, idx) => (
                    <div key={`${b.id}-${idx}`} className="bg-white p-5 rounded-2xl border border-slate-120 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-300 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-indigo-950 bg-slate-100 px-2.5 py-1 rounded-lg font-mono">{b.bookingCode}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            (b.status as string) === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' : 
                            (b.status as string) === 'CHECKED_IN' ? 'bg-blue-50 text-blue-600' :
                            'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-base font-display">{b.guestName}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-450 mt-2 font-semibold">
                          <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-indigo-650 shrink-0" /> {b.guestEmail}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-indigo-650 shrink-0" /> {b.guestPhone}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-indigo-650 shrink-0" /> {formatWithSettings(b.startDate, user?.settings)} {en ? 'to' : 'sampai'} {formatWithSettings(b.endDate, user?.settings)}</span>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-end gap-3 justify-between w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-slate-100">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">{en ? 'Total Price' : 'Harga Total'}</span>
                          <span className="text-lg font-black text-indigo-900 font-display">{formatCurrencyIDR(b.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BOOKING ARCHIVE TAB */}
          {activeSubTab === 'archive' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-3 pt-2 gap-3 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{en ? 'Booking Master Archive' : 'Master Database Rekaman Transaksi'}</h3>
                  <p className="text-[11px] text-slate-500">{en ? 'Comprehensive ledger of historical check-ins, check-outs, or cancellations.' : 'Seluruh basis data transaksi tamu yang telah selesai, batal, atau expired.'}</p>
                </div>

                {/* Filter state inside archive */}
                <select 
                  value={archiveFilter} 
                  onChange={e => setArchiveFilter(e.target.value)} 
                  className="text-xs font-bold border border-slate-200 p-2 rounded-xl bg-slate-50 focus:outline-hidden focus:bg-white text-slate-700 cursor-pointer"
                >
                  <option value="ALL">All Statuses / Semua Status</option>
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED (Ready)</option>
                  <option value="CHECKED_IN">CHECKED IN (Active)</option>
                  <option value="CHECKED_OUT">CHECKED OUT (Departed)</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELED">CANCELED</option>
                </select>
              </div>

              {filteredArchive.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6">
                  <Archive className="w-10 h-10 text-slate-300 mb-2" />
                  <span className="text-xs text-slate-400 font-bold">{en ? 'No records found matching filters.' : 'Arsip kosong untuk filter terpilih.'}</span>
                </div>
              ) : (
                <div className="flex flex-col gap-4 mt-2">
                  {filteredArchive.map((b, idx) => (
                    <div key={`${b.id}-${idx}`} className="bg-white p-5 rounded-2xl border border-slate-120 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-200 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-indigo-950 bg-slate-100 px-2.5 py-1 rounded-lg font-mono">{b.bookingCode}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            (b.status as string) === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 
                            (b.status as string) === 'CANCELED' || (b.status as string) === 'CANCELLED' ? 'bg-rose-50 text-rose-600' :
                            (b.status as string) === 'CHECKED_OUT' ? 'bg-slate-100 text-slate-600' : 
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-base font-display">{b.guestName}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-450 mt-2 font-semibold">
                          <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-indigo-650 shrink-0" /> {b.guestEmail}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-indigo-650 shrink-0" /> {b.guestPhone}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-indigo-650 shrink-0" /> {formatWithSettings(b.startDate, user?.settings)} {en ? 'to' : 'sampai'} {formatWithSettings(b.endDate, user?.settings)}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">{en ? 'Paid In Full' : 'Lunas Terbayar'}</span>
                        <span className="text-lg font-black text-indigo-900 font-display">{formatCurrencyIDR(b.totalAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STATUS FLOW MANAGEMENT TAB */}
          {activeSubTab === 'status' && (
            <div className="flex flex-col gap-4">
              <div className="px-3 pt-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{en ? 'Hotel Status Flow Controller' : 'Kontrol Status Alur Kamar'}</h3>
                <p className="text-[11px] text-slate-500">{en ? 'Update reservation lifecycles directly: Approve Payment -> Check-In -> Check-Out -> Complete Stay.' : 'Luncurkan tahap hunian kamar: Setujui Bayar -> Tamu Masuk (Check-In) -> Tamu Keluar (Check-Out) -> Selesaikan.'}</p>
              </div>

              {statusManagementList.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6">
                  <Sliders className="w-10 h-10 text-slate-300 mb-2" />
                  <span className="text-xs text-slate-400 font-bold">{en ? 'No manageable bookings found.' : 'Tidak ada transaksi dalam alur operasional aktif.'}</span>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {statusManagementList.map((b, idx) => {
                    // Logic to find next step
                    let nextActionText = '';
                    let targetStatus = '';
                    let actionColor = 'bg-indigo-900 hover:bg-slate-900';

                    const currentStatus = b.status as string;

                    if (currentStatus === 'PENDING') {
                      nextActionText = en ? 'Approve Transfer / Confirm Booking' : 'Setujui Transfer / Konfirmasi';
                      targetStatus = 'CONFIRMED';
                      actionColor = 'bg-emerald-600 hover:bg-emerald-700 text-white';
                    } else if (currentStatus === 'CONFIRMED') {
                      nextActionText = en ? 'Perform Check-In' : 'Proses Masuk Kamar (Check-In)';
                      targetStatus = 'CHECKED_IN';
                      actionColor = 'bg-indigo-900 hover:bg-indigo-950 text-white';
                    } else if (currentStatus === 'CHECKED_IN') {
                      nextActionText = en ? 'Perform Check-Out' : 'Proses Keluar Kamar (Check-Out)';
                      targetStatus = 'CHECKED_OUT';
                      actionColor = 'bg-amber-600 hover:bg-amber-700 text-white';
                    } else if (currentStatus === 'CHECKED_OUT') {
                      nextActionText = en ? 'Mark Stay as Completed' : 'Selesaikan & Berikan Kunci';
                      targetStatus = 'COMPLETED';
                      actionColor = 'bg-emerald-600 hover:bg-emerald-700 text-white';
                    }

                    return (
                      <div key={`${b.id}-${idx}`} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-white transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-indigo-950 bg-slate-100 px-2.5 py-1 rounded-lg font-mono">{b.bookingCode}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              (b.status as string) === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                              (b.status as string) === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600 font-black' :
                              (b.status as string) === 'CHECKED_IN' ? 'bg-blue-50 text-blue-600 animate-pulse' :
                              'bg-indigo-50 text-indigo-800'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-850 text-slate-800 text-md font-display leading-snug">{b.guestName}</h4>
                          <span className="text-[11px] text-indigo-650 font-bold block mt-1">Check-in: {formatWithSettings(b.startDate, user?.settings)}</span>
                        </div>

                        {/* Middle flow visual guide */}
                        <div className="hidden lg:flex items-center gap-2 text-[10px] text-slate-400 font-extrabold uppercase bg-slate-100 px-3 py-1.5 rounded-xl">
                          <span>{b.status}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span className="text-indigo-900 font-black">{targetStatus}</span>
                        </div>

                        {/* Action buttons trigger state changes */}
                        <div className="flex gap-2 w-full md:w-auto self-stretch md:self-auto justify-end">
                          {(b.status as string) === 'PENDING' && (
                            <button 
                              onClick={() => handleUpdateStatus(b.id, 'CANCELED')} 
                              className="px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-black cursor-pointer bg-white"
                            >
                              Reject/Cancel
                            </button>
                          )}
                          {nextActionText && (
                            <button 
                              onClick={() => handleUpdateStatus(b.id, targetStatus)}
                              className={`px-4 py-2 text-xs font-black rounded-xl shadow-3xs cursor-pointer flex items-center gap-1.5 border-0 ${actionColor}`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{nextActionText}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
