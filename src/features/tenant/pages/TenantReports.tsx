import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, 
  BarChart, Bar, 
  LineChart, Line, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, CalendarCheck, Percent, Layers, DownloadCloud, DollarSign, ArrowUpRight, ArrowDownRight, Clock, Building
} from 'lucide-react';
import { useLanguage } from '../../../shared/i18n';
import { useAuth } from '../../../shared/context/AuthContext';

export default function TenantReports({ initialSegment }: { initialSegment?: 'revenue' | 'bookings' | 'occupancy' }) {
  const { language, formatCurrencyIDR } = useLanguage();
  const { token } = useAuth();
  const [reports, setReports] = useState<any>(null);
  const [activeSegment, setActiveSegment] = useState<'revenue' | 'bookings' | 'occupancy'>(initialSegment || 'revenue');

  useEffect(() => {
    if (initialSegment) {
      setActiveSegment(initialSegment);
    }
  }, [initialSegment]);

  useEffect(() => {
    const authHeader: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

    fetch('/api/reports', { headers: authHeader })
      .then(res => res.json())
      .then(data => setReports(data))
      .catch(err => console.error("Error retrieving operations report data:", err));
  }, [token]);

  if (!reports) {
    return (
      <div className="text-center py-12 text-slate-500 font-semibold font-sans">
        {language === 'en' ? 'Retrieving operational telemetry reports ...' : 'Sedang mengambil laporan operasional ...'}
      </div>
    );
  }

  const dataset = reports.revenueAnalytics || [];

  const averageOccupancy = dataset.length > 0 
    ? Math.round(dataset.reduce((acc: number, curr: any) => acc + (curr.rate || 0), 0) / dataset.length) 
    : 0;
  
  const totalAnnualRevenue = dataset.reduce((acc: number, curr: any) => acc + (curr.revenue || 0), 0);
  
  const averageBookingLeadTime = dataset.length > 0 
    ? Math.round(dataset.reduce((acc: number, curr: any) => acc + (curr.leadTime || 0), 0) / dataset.length) 
    : 0;
  
  const averageLengthOfStay = dataset.length > 0
    ? (dataset.reduce((acc: number, curr: any) => acc + (curr.lengthOfStay || 0), 0) / dataset.length).toFixed(1)
    : '0.0';

  // Overall metrics:
  // ADR overall:
  const totalBookingsCount = dataset.reduce((acc: number, curr: any) => acc + (curr.bookings || 0), 0);
  const avgAdr = totalBookingsCount > 0
    ? Math.round(dataset.reduce((acc: number, curr: any) => acc + (curr.adr || 0), 0) / dataset.length)
    : 0;

  // RevPAR overall:
  // RevPAR = ADR * OccupancyRate
  const avgRevPAR = Math.round(avgAdr * (averageOccupancy / 105)); // Soft divisor to reflect active vs maintenance

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800">
      
      {/* Header section with minimal & sophisticated Airbnb style */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-105 gap-4">
        <div>
          <h2 className="text-xl font-bold text-indigo-950 font-display">
            {language === 'en' ? 'Performance & Operational Reports' : 'Laporan Kinerja & Operasional'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'en' ? 'Enterprise diagnostics: Track revenue aggregates, booking metrics, and active occupancy rates.' : 'Diagnosis tingkat lanjut: Telusuri agregat pendapatan, metrik pemesanan, dan tingkat okupansi aktif.'}
          </p>
        </div>
        <button className="text-xs bg-indigo-900 text-white font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-900 cursor-pointer shadow-sm transition-all focus:outline-hidden">
          <DownloadCloud className="w-4 h-4" /> {language === 'en' ? 'Export Partner CSV Spreadsheet' : 'Ekspor Laporan CSV Mitra'}
        </button>
      </div>

      {/* Strategic business high-level metrics cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: ADR */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              {language === 'en' ? 'Avg Daily Rate (ADR)' : 'Rata-rata Tarif Harian'}
            </span>
            <span className="text-lg font-black text-slate-800 font-display">
              {formatCurrencyIDR(avgAdr)}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" /> {language === 'en' ? 'Computed from listings' : 'Dihitung dari listings'}
            </span>
          </div>
          <span className="p-3 rounded-xl bg-indigo-50 text-indigo-700 shrink-0"><DollarSign className="w-5 h-5" /></span>
        </div>

        {/* Metric 2: RevPAR */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              {language === 'en' ? 'Revenue Per Room (RevPAR)' : 'Pendapatan Per Kamar'}
            </span>
            <span className="text-lg font-black text-slate-800 font-display">
              {formatCurrencyIDR(avgRevPAR)}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" /> {language === 'en' ? 'Reflecting active occupancy' : 'Merefleksikan okupansi aktif'}
            </span>
          </div>
          <span className="p-3 rounded-xl bg-emerald-50 text-emerald-700 shrink-0"><Building className="w-5 h-5" /></span>
        </div>

        {/* Metric 3: Lead Time */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              {language === 'en' ? 'Avg Lead Time' : 'Rata-rata Waktu Libur'}
            </span>
            <span className="text-lg font-black text-slate-800 font-display">
              {averageBookingLeadTime} {language === 'en' ? 'Days' : 'Hari'}
            </span>
            <span className="text-[10px] text-indigo-650 font-bold flex items-center gap-0.5 mt-1">
              <Clock className="w-3 h-3" /> {language === 'en' ? 'Days booked in advance' : 'Hari dipesan awal'}
            </span>
          </div>
          <span className="p-3 rounded-xl bg-amber-50 text-amber-600 shrink-0"><Clock className="w-5 h-5" /></span>
        </div>

        {/* Metric 4: Length of Stay */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              {language === 'en' ? 'Length of Stay (ALoS)' : 'Lama Tamu Menginap'}
            </span>
            <span className="text-lg font-black text-slate-800 font-display">
              {averageLengthOfStay} {language === 'en' ? 'Nights' : 'Malam'}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" /> {language === 'en' ? 'Average duration' : 'Durasi rata-rata'}
            </span>
          </div>
          <span className="p-3 rounded-xl bg-cyan-50 text-cyan-700 shrink-0"><CalendarCheck className="w-5 h-5" /></span>
        </div>

      </div>

      {/* Modern segmented tab selector to focus on specific report categories */}
      <div className="flex bg-slate-100/85 p-1 rounded-2xl w-fit self-center border border-slate-200/50 mt-2">
        <button
          onClick={() => setActiveSegment('revenue')}
          className={`px-6 py-2 rounded-xl text-xs font-black transition-all cursor-pointer focus:outline-hidden ${
            activeSegment === 'revenue' 
              ? 'bg-indigo-900 text-white shadow-sm' 
              : 'text-slate-600 hover:text-indigo-900 hover:bg-slate-50/50'
          }`}
        >
          {language === 'en' ? 'Revenue Overview' : 'Ikhtisar Pendapatan'}
        </button>
        <button
          onClick={() => setActiveSegment('bookings')}
          className={`px-6 py-2 rounded-xl text-xs font-black transition-all cursor-pointer focus:outline-hidden ${
            activeSegment === 'bookings' 
              ? 'bg-indigo-900 text-white shadow-sm' 
              : 'text-slate-600 hover:text-indigo-900 hover:bg-slate-50/50'
          }`}
        >
          {language === 'en' ? 'Booking Trends' : 'Tren Pemesanan'}
        </button>
        <button
          onClick={() => setActiveSegment('occupancy')}
          className={`px-6 py-2 rounded-xl text-xs font-black transition-all cursor-pointer focus:outline-hidden ${
            activeSegment === 'occupancy' 
              ? 'bg-indigo-900 text-white shadow-sm' 
              : 'text-slate-600 hover:text-indigo-900 hover:bg-slate-50/50'
          }`}
        >
          {language === 'en' ? 'Occupancy Rate' : 'Tingkat Okupansi'}
        </button>
      </div>

      {/* Main reports visualization container */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
        
        {activeSegment === 'revenue' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1">
                  {language === 'en' ? 'Revenue Overview_D' : 'Ikhtisar Pendapatan Aktual'}
                </h3>
                <p className="text-[11px] text-slate-450 font-semibold mb-4">
                  {language === 'en' ? 'Analyzing monthly gross receipts against targets.' : 'Analisis penerimaan kotor bulanan terhadap target.'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">{language === 'en' ? 'Annual Aggregate' : 'Total Agregat Tahunan'}</span>
                <span className="text-xl font-extrabold text-indigo-900 font-display">{formatCurrencyIDR(totalAnnualRevenue)}</span>
              </div>
            </div>

            <div className="h-80 w-full mt-2">
              {dataset.length > 0 && dataset.some((item: any) => item.revenue > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataset} margin={{ top: 20, right: 10, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `Rp${val / 1000000}M`} />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrencyIDR(value), '']}
                      contentStyle={{ borderRadius: '12px', borderColor: '#f1f5f9', fontSize: '11px', fontWeight: 'bold' }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar name={language === 'en' ? 'Actual Revenue' : 'Pendapatan Aktual'} dataKey="revenue" fill="#312e81" radius={[4, 4, 0, 0]} />
                    <Bar name={language === 'en' ? 'Target Revenue' : 'Target Penerimaan'} dataKey="target" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.65} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <DollarSign className="w-8 h-8 mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">{language === 'en' ? 'No revenue data recorded' : 'Belum ada data pendapatan'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSegment === 'bookings' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1">
                  {language === 'en' ? 'Booking Volume & Retention Trends' : 'Volume Pemesanan & Tren Retensi'}
                </h3>
                <p className="text-[11px] text-slate-450 font-semibold mb-4">
                  {language === 'en' ? 'Distribution of customer bookings and length of stay durations per month.' : 'Distribusi pesanan tamu dan durasi sewa per bulan.'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">{language === 'en' ? 'Average Leadtime' : 'Waktu Pemesanan Rata-Rata'}</span>
                <span className="text-xl font-extrabold text-teal-700 font-display">+{averageBookingLeadTime} {language === 'en' ? 'Days' : 'Hari'}</span>
              </div>
            </div>

            <div className="h-80 w-full mt-2">
              {dataset.length > 0 && dataset.some((item: any) => item.bookings > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dataset} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#f1f5f9', fontSize: '11px', fontWeight: 'bold' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Line name={language === 'en' ? 'Bookings Volume' : 'Jumlah Pemesanan'} type="monotone" dataKey="bookings" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line name={language === 'en' ? 'Avg Stay Duration (Nights)' : 'Rata Menginap (Malam)'} type="monotone" dataKey="lengthOfStay" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Layers className="w-8 h-8 mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">{language === 'en' ? 'No bookings recorded' : 'Belum ada data pemesanan'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSegment === 'occupancy' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1">
                  {language === 'en' ? 'Occupancy Rate Diagnostics (%)' : 'Metrik Tingkat Okupansi (%)'}
                </h3>
                <p className="text-[11px] text-slate-450 font-semibold mb-4">
                  {language === 'en' ? 'Tracking weekend surges against weekday occupancy levels.' : 'Memantau lonjakan akhir pekan terhadap level okupansi hari biasa.'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">{language === 'en' ? 'Yearly Average' : 'Rata-rata Tahunan'}</span>
                <span className="text-xl font-extrabold text-amber-700 font-display">{averageOccupancy}%</span>
              </div>
            </div>

            <div className="h-80 w-full mt-2">
              {dataset.length > 0 && dataset.some((item: any) => item.rate > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dataset} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#f1f5f9', fontSize: '11px', fontWeight: 'bold' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Area type="monotone" name={language === 'en' ? 'Base Occupancy' : 'Okupansi Dasar'} dataKey="rate" stroke="#0369a1" fill="#f0f9ff" strokeWidth={2} />
                    <Area type="monotone" name={language === 'en' ? 'Weekend Outliers' : 'Okupansi Akhir Pekan'} dataKey="weekendRate" stroke="#b45309" fill="#fffbeb" strokeWidth={2} opacity={0.4} />
                    <ReferenceLine y={80} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'Target: 80%', fill: '#dc2626', fontSize: 10, position: 'top', fontWeight: 'bold' }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Percent className="w-8 h-8 mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">{language === 'en' ? 'No occupancy rate recorded' : 'Belum ada data okupansi'}</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
