import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus } from '../../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Building2, 
  DoorOpen, 
  DollarSign, 
  CalendarDays, 
  Percent, 
  UserCheck, 
  LogOut, 
  Users, 
  AlertCircle,
  TrendingUp,
  LayoutDashboard,
  CalendarRange
} from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import { useAuth } from '../../../shared/context/AuthContext';
import { formatWithSettings } from '../../../shared/services/dateService';

// Import local components for modular tab integrations
import TenantReports from './TenantReports';
import TodayCheckInPage from './TodayCheckInPage';
import TodayCheckOutPage from './TodayCheckOutPage';

export default function TenantDashboard({ onNavigate }: { onNavigate?: (p: string) => void }) {
  const { user, token } = useAuth();
  const { language, formatCurrencyIDR } = useLanguage();
  const [reports, setReports] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'analytics'>('overview');
  const [reportSegment, setReportSegment] = useState<'revenue' | 'bookings' | 'occupancy'>('revenue');

  const en = language === 'en';

  useEffect(() => {
    const authHeader: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

    const loadStats = () => {
      fetch('/api/reports', { headers: authHeader })
        .then(res => res.json())
        .then(data => setReports(data))
        .catch(err => console.error(err));

      fetch('/api/bookings', { headers: authHeader })
        .then(res => res.json())
        .then(data => setBookings(data.data || []))
        .catch(err => console.error(err));
    };

    loadStats();

    // Listen for custom check-out sync events to trigger immediate, instant visual refresh
    window.addEventListener('stayease:refresh_bookings', loadStats);

    const interval = setInterval(() => {
      fetch('/api/reports', { headers: authHeader })
        .then(res => res.json())
        .then(data => setReports(data))
        .catch(() => {});
      fetch('/api/bookings', { headers: authHeader })
        .then(res => res.json())
        .then(data => setBookings(data.data || []))
        .catch(() => {});
    }, 5000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('stayease:refresh_bookings', loadStats);
    };
  }, [token]);

  // Handle fallback navigation for embedded components
  const handleEmbeddedNavigate = (customPath: string) => {
    if (onNavigate) {
      onNavigate(customPath);
    } else {
      window.history.pushState({}, '', customPath);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  if (!reports) return <div className="text-center py-10 text-xs font-bold text-slate-500">Retrieving operational parameters ...</div>;

  // Calculate booking growth MoM
  const now = new Date();
  const curMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = curMonthStart;

  const curMonthBookingsCount = bookings.filter(b => {
    const d = new Date(b.createdAt);
    return d >= curMonthStart && b.status !== BookingStatus.CANCELED;
  }).length;

  const prevMonthBookingsCount = bookings.filter(b => {
    const d = new Date(b.createdAt);
    return d >= prevMonthStart && d < prevMonthEnd && b.status !== BookingStatus.CANCELED;
  }).length;

  const bookingGrowth = prevMonthBookingsCount > 0
    ? Number((((curMonthBookingsCount - prevMonthBookingsCount) / prevMonthBookingsCount) * 100).toFixed(1))
    : (curMonthBookingsCount > 0 ? 100.0 : 0.0);

  const formatIDRCompact = (value: number) => {
    const absVal = Math.abs(value);
    const prefix = value < 0 ? '-' : '';
    let formatted = '';
    
    const localeStr = (num: number, digits: number) => {
      return num.toLocaleString(language === 'en' ? 'en-US' : 'id-ID', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      });
    };

    if (absVal >= 1e12) {
      const raw = absVal / 1e12;
      const rounded = Math.round(raw * 10) / 10;
      formatted = `${localeStr(rounded, rounded % 1 === 0 ? 0 : 1)} T`;
    } else if (absVal >= 1e9) {
      const raw = absVal / 1e9;
      const rounded = Math.round(raw * 10) / 10;
      formatted = `${localeStr(rounded, rounded % 1 === 0 ? 0 : 1)} M`;
    } else if (absVal >= 1e6) {
      const raw = absVal / 1e6;
      const rounded = Math.round(raw * 10) / 10;
      formatted = `${localeStr(rounded, rounded % 1 === 0 ? 0 : 1)} Jt`;
    } else if (absVal >= 1e3) {
      const raw = absVal / 1e3;
      const rounded = Math.round(raw * 10) / 10;
      formatted = `${localeStr(rounded, rounded % 1 === 0 ? 0 : 1)} K`;
    } else {
      formatted = absVal.toLocaleString(language === 'en' ? 'en-US' : 'id-ID');
    }
    return `${prefix}Rp ${formatted}`;
  };

  const cardItems = [
    { 
      title: en ? 'Total Properties' : 'Total Properti', 
      score: `${reports.totalProperties ?? 0}`, 
      color: 'text-indigo-650 bg-indigo-50/50 border-indigo-100', 
      icon: Building2,
      desc: en ? 'Active listed complexes' : 'Kompleks aktif terdaftar',
      trend: null
    },
    { 
      title: en ? 'Active Rooms' : 'Kamar Aktif', 
      score: `${reports.activeRooms ?? 0}`, 
      color: 'text-emerald-700 bg-emerald-50/50 border-emerald-100', 
      icon: DoorOpen,
      desc: en ? 'Sourced for booking' : 'Tersedia untuk disewa',
      trend: null
    },
    { 
      title: en ? 'Monthly Revenue' : 'Pendapatan Bulanan', 
      score: formatIDRCompact(reports.totalRevenue ?? 0), 
      rawValue: reports.totalRevenue ?? 0,
      isFinancial: true,
      color: 'text-amber-700 bg-amber-50/50 border-amber-100', 
      icon: DollarSign,
      desc: en ? 'Revenue this month' : 'Sewa bruto bulan ini',
      trend: {
        value: reports.growthRate ?? 0,
        label: en ? 'vs last month' : 'vs bulan lalu'
      }
    },
    { 
      title: en ? 'Monthly Bookings' : 'Pemesanan Bulanan', 
      score: `${reports.monthlyBookings ?? 0}`, 
      rawValue: reports.monthlyBookings ?? 0,
      color: 'text-cyan-700 bg-cyan-50/50 border-cyan-100', 
      icon: CalendarDays,
      desc: en ? 'Confirmed check-ins' : 'Kunjungan terkonfirmasi',
      trend: {
        value: bookingGrowth,
        label: en ? 'vs last month' : 'vs bulan lalu'
      }
    },
    { 
      title: en ? 'Occupancy Rate' : 'Tingkat Okupansi', 
      score: `${reports.occupancyRate ?? 0}%`, 
      color: 'text-teal-700 bg-teal-50/50 border-teal-100', 
      icon: Percent,
      desc: en ? 'Room utilization rate' : 'Rasio utilisasi kamar',
      trend: {
        value: 1.8,
        label: en ? 'MoM trend' : 'tren MoM'
      }
    }
  ];

  const operationsCardItems = [
    { 
      title: en ? "Today's Check-Ins" : "Check-In Hari Ini", 
      score: `${reports.operations?.todayCheckIns ?? 0}`, 
      color: 'text-indigo-700 bg-indigo-50 border-indigo-100/60', 
      icon: UserCheck,
      tabId: 'checkin' as const,
      desc: en ? 'Awaiting arrival protocol' : 'Menunggu kedatangan'
    },
    { 
      title: en ? "Today's Check-Outs" : "Check-Out Hari Ini", 
      score: `${reports.operations?.todayCheckOuts ?? 0}`, 
      color: 'text-rose-700 bg-rose-50 border-rose-100/60', 
      icon: LogOut,
      tabId: 'checkout' as const,
      desc: en ? 'Guests departing today' : 'Keberangkatan tamu'
    },
    { 
      title: en ? "Guests Staying Now" : "Tamu Menginap Sekarang", 
      score: `${reports.operations?.guestsStayingNow ?? 0}`, 
      color: 'text-emerald-700 bg-emerald-50 border-emerald-100/60', 
      icon: Users,
      tabId: 'overview' as const,
      desc: en ? 'In-house occupancy' : 'Tamu aktif menginap'
    },
    { 
      title: en ? "Late Check-Outs" : "Late Check-Out", 
      score: `${reports.operations?.lateCheckOuts ?? 0}`, 
      color: 'text-amber-700 bg-amber-50 border-amber-100/60', 
      icon: AlertCircle,
      tabId: 'checkout' as const,
      desc: en ? 'Rooms past schedule' : 'Kamar lewat waktu'
    },
    { 
      title: en ? "Occupancy Rate" : "Tingkat Okupansi", 
      score: `${reports.occupancyRate ?? 0}%`, 
      color: 'text-teal-700 bg-teal-50 border-teal-100/60', 
      icon: Percent,
      tabId: 'analytics' as const,
      segment: 'occupancy' as const,
      desc: en ? 'Overall host health ratio' : 'Rasio kesehatan host'
    }
  ];

  const hasChartData = reports.revenueAnalytics && reports.revenueAnalytics.some((item: any) => item.amt > 0);

  return (
    <div className="flex flex-col gap-6 font-sans">
      
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-indigo-950 font-display">
            {en ? 'Host Dashboard' : 'Konsol Dasbor Utama'}
          </h2>
          <p className="text-xs text-slate-500">
            {en 
              ? 'Consolidated partner analytics, real-time hotel checking calendars, and revenue parameters.' 
              : 'Analisis mitra terpadu, kalender pengecekan penginapan real-time, dan pendapatan operasional.'}
          </p>
        </div>
      </div>

      {/* Horizontal mini navigation for unified dashboard modules */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-full lg:w-fit self-center border border-slate-200/50 overflow-x-auto text-[11px] font-bold">
        {[
          { id: 'overview', name: en ? 'Overview' : 'Ikhtisar', icon: LayoutDashboard },
          { id: 'analytics', name: en ? 'Analytics' : 'Analisis Tren', icon: CalendarRange }
        ].map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'analytics') {
                  setReportSegment('revenue');
                }
                setActiveSubTab(tab.id as any);
              }}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border-0 ${
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

      {/* RENDER ACTIVE TAB VIEW */}
      <div className="bg-white rounded-2xl border border-slate-50 p-1">
        
        {/* OVERVIEW TAB */}
        {activeSubTab === 'overview' && (
          <div className="flex flex-col gap-6">
            
            {/* Analytics Cards Grid with exactly 5 items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 items-stretch">
              {cardItems.map((c, i) => {
                const Icon = c.icon;
                const isPositive = c.trend ? c.trend.value >= 0 : true;
                return (
                  <div 
                    key={i} 
                    title={c.isFinancial ? formatCurrencyIDR(c.rawValue) : undefined}
                    className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-slate-300 shadow-2xs hover:shadow-xs flex flex-col justify-between h-full min-h-36.25 transition-all duration-300 relative group select-none"
                  >
                    {/* Beautiful Hover Tooltip */}
                    {c.isFinancial && (
                      <div className="absolute opacity-0 group-hover:opacity-100 pointer-events-none bg-slate-950 text-white text-[10px] py-1.5 px-3 rounded-2xl font-bold font-mono -top-12 left-1/2 -translate-x-1/2 transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
                        {formatCurrencyIDR(c.rawValue)}
                        <div className="w-2 h-2 bg-slate-950 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                      </div>
                    )}

                    <div>
                      {/* Top Row: title and Icon */}
                      <div className="flex items-center justify-between gap-2.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block truncate">{c.title}</span>
                        <span className={`p-2 rounded-xl shrink-0 border ${c.color}`}><Icon className="w-4 h-4" /></span>
                      </div>

                      {/* Main Metric Segment */}
                      <div className="mt-3">
                        <span className="text-2xl font-black text-indigo-950 font-display block leading-none tracking-tight whitespace-nowrap truncate">{c.score}</span>
                      </div>
                    </div>

                    {/* Footer Row: Growth Indicator & Description */}
                    <div className="mt-4 pt-3 border-t border-slate-50 flex flex-col gap-1.5">
                      {c.trend && (
                        <div className="flex items-center gap-1.5">
                          <span className={`flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                            isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            <TrendingUp className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`} />
                            {isPositive ? '+' : ''}{c.trend.value}%
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{c.trend.label}</span>
                        </div>
                      )}
                      <span className="text-[9.5px] font-bold text-slate-450 leading-relaxed block text-slate-500">{c.desc}</span>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Today's operations sector */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5">
                {en ? "Today's Front Desk Operations" : 'Operasional Front Desk Hari Ini'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 items-stretch">
                {operationsCardItems.map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <button 
                      key={i} 
                      onClick={() => {
                        if ('segment' in c && c.segment) {
                          setReportSegment(c.segment);
                        }
                        if (c.tabId === 'checkin' || c.tabId === 'checkout') {
                          handleEmbeddedNavigate(c.tabId === 'checkin' ? '/check-in' : '/check-out');
                        } else {
                          setActiveSubTab(c.tabId as any);
                        }
                      }}
                      className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-xs flex flex-col justify-between h-full min-h-36.25 text-left transition-all duration-300 cursor-pointer outline-hidden relative group"
                    >
                      <div>
                        {/* Top Row: title and Icon */}
                        <div className="flex items-center justify-between gap-2.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block truncate">{c.title}</span>
                          <span className={`p-2 rounded-xl shrink-0 border ${c.color}`}><Icon className="w-4 h-4" /></span>
                        </div>
                        {/* Main Metric Segment */}
                        <div className="mt-3">
                          <span className="text-2xl font-black text-indigo-950 font-display block leading-none tracking-tight whitespace-nowrap truncate">{c.score}</span>
                        </div>
                      </div>

                      {/* Description Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-50 w-full">
                        <span className="text-[9.5px] font-bold text-slate-450 leading-relaxed block text-slate-500">{c.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Property Performance Widgets */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5">
                {en ? 'Property Performance Metrics' : 'Metrik Kinerja Properti'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
                
                {/* Top Performing */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-slate-300 shadow-2xs hover:shadow-xs flex flex-col justify-between h-full min-h-33.75 transition-all duration-300">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      {en ? 'Top Performing' : 'Performa Terbaik (Booking)'}
                    </span>
                    <span className="text-[13px] font-medium text-indigo-950 block mt-1 truncate font-display">
                      {reports.performance?.topPerforming?.name || (en ? 'N/A' : 'Tidak Ada')}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[11px] font-black text-indigo-650">
                      {reports.performance?.topPerforming 
                        ? `${reports.performance.topPerforming.bookingsCount} ${en ? 'stays' : 'pemesanan'}`
                        : '—'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      {en ? 'Orders count' : 'Volume order'}
                    </span>
                  </div>
                </div>

                {/* Least Active */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-slate-300 shadow-2xs hover:shadow-xs flex flex-col justify-between h-full min-h-33.75 transition-all duration-300">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      {en ? 'Least Active' : 'Performa Terendah (Booking)'}
                    </span>
                    <span className="text-[13px] font-medium text-slate-800 block mt-1 truncate font-display">
                      {reports.performance?.lowestPerforming?.name || (en ? 'N/A' : 'Tidak Ada')}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[11px] font-black text-amber-700">
                      {reports.performance?.lowestPerforming 
                        ? `${reports.performance.lowestPerforming.bookingsCount} ${en ? 'stays' : 'pemesanan'}`
                        : '—'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      {en ? 'Needs attention' : 'Butuh perhatian'}
                    </span>
                  </div>
                </div>

                {/* Highest Occupancy */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-slate-300 shadow-2xs hover:shadow-xs flex flex-col justify-between h-full min-h-33 transition-all duration-300">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      {en ? 'Highest Occupancy' : 'Okupansi Tertinggi'}
                    </span>
                    <span className="text-[13px] font-medium text-indigo-950 block mt-1 truncate font-display">
                      {reports.performance?.highestOccupancy?.name || (en ? 'N/A' : 'Tidak Ada')}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[11px] font-black text-teal-700">
                      {reports.performance?.highestOccupancy 
                        ? `${reports.performance.highestOccupancy.occupancyRate}%`
                        : '—'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      {en ? 'Monthly rate' : 'Rasio bulanan'}
                    </span>
                  </div>
                </div>

                {/* Highest Revenue Maker */}
                <div 
                  title={reports.performance?.highestRevenue ? formatCurrencyIDR(reports.performance.highestRevenue.revenue) : undefined}
                  className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-slate-300 shadow-2xs hover:shadow-xs flex flex-col justify-between h-full min-h-33.75 transition-all duration-300 relative group"
                >
                  {reports.performance?.highestRevenue && (
                    <div className="absolute opacity-0 group-hover:opacity-100 pointer-events-none bg-slate-950 text-white text-[10px] py-1.5 px-3 rounded-2xl font-bold font-mono -top-12 left-1/2 -translate-x-1/2 transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
                      {formatCurrencyIDR(reports.performance.highestRevenue.revenue)}
                      <div className="w-2 h-2 bg-slate-950 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      {en ? 'Highest Revenue Maker' : 'Pendapatan Tertinggi'}
                    </span>
                    <span className="text-[13px] font-bold text-indigo-950 block mt-1 truncate font-display">
                      {reports.performance?.highestRevenue?.name || (en ? 'N/A' : 'Tidak Ada')}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[11px] font-black text-emerald-700 whitespace-nowrap truncate shrink-0">
                      {reports.performance?.highestRevenue 
                        ? formatIDRCompact(reports.performance.highestRevenue.revenue)
                        : '—'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate pl-2">
                      {en ? 'Total yield' : 'Total sewa'}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Bar Chart Section */}
            <div className="bg-white p-5 rounded-2xl border border-slate-120 shadow-xs">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                {en ? 'Cash Inflow Analytics' : 'Analisis Arus Kas'}
              </h4>
              {hasChartData ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reports.revenueAnalytics}>
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f1f5f9' }} />
                      <Bar dataKey="amt" fill="#312e81" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col justify-center items-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <DollarSign className="w-8 h-8 mb-2 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-500">
                    {en ? 'No revenue transactions recorded yet' : 'Belum ada transaksi untuk periode ini'}
                  </p>
                </div>
              )}
            </div>

            {/* Recent Bookings Ledger */}
            <div className="bg-white p-5 rounded-2xl border border-slate-120 shadow-xs">
              <h4 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">
                {en ? 'Recent Bookings Ledger' : 'Buku Catatan Penyewaan Terbaru'}
              </h4>
              {bookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-550">
                    <thead className="text-[10px] uppercase text-slate-400 bg-slate-50 border-b border-slate-100 font-extrabold">
                      <tr>
                        <th className="p-3">Guest Name</th>
                        <th className="p-3">Ref Code</th>
                        <th className="p-3">Dates</th>
                        <th className="p-3">Total Amount</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-semibold">
                      {bookings.slice(0, 8).map((b, idx) => (
                        <tr key={`${b.id}-${idx}`} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-805 text-slate-800 font-bold">{b.guestName}</td>
                          <td className="p-3 text-slate-500 font-mono">{b.bookingCode}</td>
                          <td className="p-3 text-slate-500">{formatWithSettings(b.startDate, user?.settings)} {en ? 'to' : 'sampai'} {formatWithSettings(b.endDate, user?.settings)}</td>
                          <td className="p-3 text-slate-805 text-slate-800 font-black">{formatCurrencyIDR(b.totalAmount)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${b.status === 'CONFIRMED' || b.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{b.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 flex flex-col justify-center items-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <CalendarDays className="w-8 h-8 mb-2 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-500">
                    {en ? 'No bookings found' : 'Belum ada pemesanan'}
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeSubTab === 'analytics' && (
          <TenantReports initialSegment={reportSegment} />
        )}

      </div>

    </div>
  );
}
