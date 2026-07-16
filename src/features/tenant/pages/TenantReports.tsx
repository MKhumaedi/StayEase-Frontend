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
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSegment, setActiveSegment] = useState<'revenue' | 'bookings' | 'occupancy'>(initialSegment || 'revenue');

  // Interactive filters
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [period, setPeriod] = useState<string>('this_year');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Export Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('xlsx');
  const [exportPeriod, setExportPeriod] = useState<string>('this_year');
  const [exportStartDate, setExportStartDate] = useState<string>('');
  const [exportEndDate, setExportEndDate] = useState<string>('');
  const [exportPropertyId, setExportPropertyId] = useState<string>('');
  const [exportReportType, setExportReportType] = useState<'revenue' | 'booking' | 'occupancy' | 'operational'>('revenue');
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleOpenExportModal = () => {
    setExportFormat('xlsx');
    setExportPeriod(period || 'this_year');
    setExportStartDate(startDate);
    setExportEndDate(endDate);
    setExportPropertyId(selectedPropertyId);
    
    if (activeSegment === 'revenue') {
      setExportReportType('revenue');
    } else if (activeSegment === 'bookings') {
      setExportReportType('booking');
    } else if (activeSegment === 'occupancy') {
      setExportReportType('occupancy');
    } else {
      setExportReportType('operational');
    }
    
    setIsExportModalOpen(true);
  };

  const handleExportReport = async () => {
    setExportLoading(true);
    try {
      const authHeader: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      const params = new URLSearchParams();
      params.append('format', exportFormat);
      params.append('period', exportPeriod);
      if (exportStartDate) params.append('startDate', exportStartDate);
      if (exportEndDate) params.append('endDate', exportEndDate);
      if (exportPropertyId) params.append('propertyId', exportPropertyId);
      params.append('reportType', exportReportType);

      const response = await fetch(`/api/reports/export?${params.toString()}`, {
        headers: authHeader,
      });

      if (!response.ok) {
        const errObj = await response.json().catch(() => ({}));
        throw new Error(errObj.error || (language === 'en' ? 'Failed to export report' : 'Gagal mengekspor laporan'));
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `report_${exportReportType}_${exportPeriod}.${exportFormat}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showNotification(
        'success',
        language === 'en'
          ? `Successfully generated and downloaded ${filename}`
          : `Laporan ${filename} berhasil dibuat dan diunduh`
      );
      setIsExportModalOpen(false);
    } catch (err: any) {
      console.error('Export error:', err);
      showNotification('error', err.message || (language === 'en' ? 'Failed to generate report' : 'Gagal menghasilkan laporan'));
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    if (initialSegment) {
      setActiveSegment(initialSegment);
    }
  }, [initialSegment]);

  useEffect(() => {
    setLoading(true);
    const authHeader: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

    const params = new URLSearchParams();
    if (selectedPropertyId) params.append('propertyId', selectedPropertyId);
    if (period) params.append('period', period);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    fetch(`/api/reports?${params.toString()}`, { headers: authHeader })
      .then(res => res.json())
      .then(data => {
        setReports(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error retrieving operations report data:", err);
        setLoading(false);
      });
  }, [token, selectedPropertyId, period, startDate, endDate]);

  if (!reports) {
    return (
      <div className="text-center py-12 text-slate-500 font-semibold font-sans">
        {language === 'en' ? 'Retrieving operational telemetry reports ...' : 'Sedang mengambil laporan operasional ...'}
      </div>
    );
  }

  const dataset = reports.revenueAnalytics || [];
  const propertyList = reports.properties || [];

  const averageOccupancy = reports.occupancyRate ?? 0;
  const totalAnnualRevenue = reports.thisYearRevenue ?? 0;
  const averageBookingLeadTime = reports.averageBookingLeadTime ?? 0;
  const averageLengthOfStay = reports.averageLengthOfStay ?? 0;
  const avgAdr = reports.adr ?? 0;
  const avgRevPAR = reports.revpar ?? 0;

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800">
      
      {/* Header section with minimal & sophisticated Airbnb style */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200/50 gap-4">
        <div>
          <h2 className="text-xl font-bold text-indigo-950 font-display">
            {language === 'en' ? 'Performance & Operational Reports' : 'Laporan Kinerja & Operasional'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'en' ? 'Enterprise diagnostics: Track revenue aggregates, booking metrics, and active occupancy rates.' : 'Diagnosis tingkat lanjut: Telusuri agregat pendapatan, metrik pemesanan, dan tingkat okupansi aktif.'}
          </p>
        </div>
        <button 
          onClick={handleOpenExportModal}
          className="text-xs bg-indigo-900 text-white font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-900 cursor-pointer shadow-sm transition-all focus:outline-hidden"
        >
          <DownloadCloud className="w-4 h-4" /> {language === 'en' ? 'Export Operational Report' : 'Ekspor Laporan Operasional'}
        </button>
      </div>

      {/* 1. Dynamic Report Controls & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Property Dropdown Selector */}
          <div className="flex flex-col flex-1 sm:max-w-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              {language === 'en' ? 'Filter Property' : 'Filter Properti'}
            </span>
            <div className="relative">
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl pl-3 pr-10 py-2.5 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 appearance-none cursor-pointer"
              >
                <option value="">{language === 'en' ? 'All Properties' : 'Semua Properti'}</option>
                {propertyList.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <Building className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Period Dropdown Selector */}
          <div className="flex flex-col flex-1 sm:max-w-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              {language === 'en' ? 'Report Period' : 'Periode Laporan'}
            </span>
            <div className="relative">
              <select
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value);
                  if (e.target.value !== 'custom') {
                    setStartDate('');
                    setEndDate('');
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl pl-3 pr-10 py-2.5 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 appearance-none cursor-pointer"
              >
                <option value="this_year">{language === 'en' ? 'This Year' : 'Tahun Ini'}</option>
                <option value="today">{language === 'en' ? 'Today' : 'Hari Ini'}</option>
                <option value="this_week">{language === 'en' ? 'This Week' : 'Minggu Ini'}</option>
                <option value="this_month">{language === 'en' ? 'This Month' : 'Bulan Ini'}</option>
                <option value="custom">{language === 'en' ? 'Custom Date Range' : 'Kustom Rentang Tanggal'}</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Custom Date Range Pickers (Visible when period === 'custom') */}
        {period === 'custom' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                {language === 'en' ? 'Start Date' : 'Tanggal Mulai'}
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 cursor-pointer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                {language === 'en' ? 'End Date' : 'Tanggal Selesai'}
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Snapshot KPI Cards */}
      <div>
        <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-widest mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-650" />
          {language === 'en' ? 'Revenue Metrics snapshot' : 'Snapshot Metrik Pendapatan'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          {/* Card 1: Total Revenue (All-Time) */}
          <div className="bg-linear-to-br from-indigo-950 to-slate-900 p-4 rounded-xl border border-indigo-900 flex flex-col justify-between shadow-xs text-white">
            <div>
              <span className="text-[9px] font-black text-indigo-200 uppercase tracking-widest block mb-1">
                {language === 'en' ? 'Total Revenue (All Time)' : 'Pendapatan Total'}
              </span>
              <span className="text-lg font-black font-display tracking-tight text-indigo-5 block truncate">
                {formatCurrencyIDR(reports.totalRevenueAllTime ?? 0)}
              </span>
            </div>
            <span className="text-[10px] text-indigo-300 font-bold flex items-center gap-0.5 mt-2">
              <ArrowUpRight className="w-3 h-3 text-emerald-400" /> {language === 'en' ? 'Successful payments' : 'Pembayaran sukses'}
            </span>
          </div>

          {/* Card 2: Today's Revenue */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-between shadow-2xs">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                {language === 'en' ? "Today's Revenue" : 'Pendapatan Hari Ini'}
              </span>
              <span className="text-lg font-black text-slate-800 font-display block truncate">
                {formatCurrencyIDR(reports.todayRevenue ?? 0)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse mr-1"></span>
              {language === 'en' ? 'Real-time updates' : 'Update langsung'}
            </span>
          </div>

          {/* Card 3: This Week Revenue */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-between shadow-2xs">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                {language === 'en' ? 'This Week Revenue' : 'Pendapatan Minggu Ini'}
              </span>
              <span className="text-lg font-black text-slate-800 font-display block truncate">
                {formatCurrencyIDR(reports.thisWeekRevenue ?? 0)}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5 mt-2">
              <TrendingUp className="w-3 h-3 text-emerald-600" /> {language === 'en' ? 'Current cycle' : 'Siklus berjalan'}
            </span>
          </div>

          {/* Card 4: This Month Revenue */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-between shadow-2xs">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                {language === 'en' ? 'This Month Revenue' : 'Pendapatan Bulan Ini'}
              </span>
              <span className="text-lg font-black text-indigo-900 font-display block truncate">
                {formatCurrencyIDR(reports.thisMonthRevenue ?? 0)}
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-2">
              <ArrowUpRight className="w-3 h-3" /> {language === 'en' ? 'Active month' : 'Bulan aktif'}
            </span>
          </div>

          {/* Card 5: This Year Revenue */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-between shadow-2xs">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                {language === 'en' ? 'This Year Revenue' : 'Pendapatan Tahun Ini'}
              </span>
              <span className="text-lg font-black text-slate-800 font-display block truncate">
                {formatCurrencyIDR(reports.thisYearRevenue ?? 0)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5 mt-2">
              {language === 'en' ? 'Annual totals' : 'Total tahunan'}
            </span>
          </div>

        </div>
      </div>

      {/* Modern segmented tab selector to focus on specific report categories */}
      <div className="flex bg-slate-100/85 p-1 rounded-2xl w-fit self-center border border-slate-200/50 mt-2 relative">
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
        {loading && (
          <div className="absolute -right-12 inset-y-0 flex items-center">
            <div className="w-4 h-4 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Main reports visualization container */}
      <div className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs transition-opacity duration-300 ${loading ? 'opacity-70' : 'opacity-100'}`}>
        
        {/* 3. Revenue Analytics */}
        {activeSegment === 'revenue' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1">
                  {language === 'en' ? 'Revenue Overview' : 'Ikhtisar Pendapatan Aktual'}
                </h3>
                <p className="text-[11px] text-slate-450 font-semibold mb-4">
                  {language === 'en' ? 'Analyzing periodic gross receipts against targets.' : 'Analisis penerimaan kotor periodik terhadap target.'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">{language === 'en' ? 'Period Total' : 'Total Periode'}</span>
                <span className="text-xl font-extrabold text-indigo-900 font-display">{formatCurrencyIDR(totalAnnualRevenue)}</span>
              </div>
            </div>

            <div className="h-80 w-full mt-2">
              {dataset.length > 0 && dataset.some((item: any) => item.revenue > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataset} margin={{ top: 20, right: 10, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `Rp${val >= 1000000 ? (val / 1000000).toFixed(0) + 'jt' : val}`} />
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
                  <DollarSign className="w-8 h-8 mb-2 text-slate-300 animate-pulse" />
                  <p className="text-xs font-semibold">{language === 'en' ? 'No revenue data recorded' : 'Belum ada data pendapatan'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Booking Trend Analytics */}
        {activeSegment === 'bookings' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1">
                  {language === 'en' ? 'Booking Volume & Retention Trends' : 'Volume Pemesanan & Tren Retensi'}
                </h3>
                <p className="text-[11px] text-slate-450 font-semibold mb-4">
                  {language === 'en' ? 'Distribution of customer bookings and length of stay durations.' : 'Distribusi pesanan tamu dan durasi sewa.'}
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

        {/* 5. Occupancy Analytics */}
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
                <span className="text-[10px] text-slate-400 font-bold block uppercase">{language === 'en' ? 'Period Average' : 'Rata-rata Periode'}</span>
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

      {/* 6. Additional KPI Section (Operational Metrics) */}
      <div>
        <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-650" />
          {language === 'en' ? 'Operational Performance' : 'Kinerja Operasional'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: ADR */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                {language === 'en' ? 'Avg Daily Rate (ADR)' : 'Rata-rata Tarif Harian'}
              </span>
              <span className="text-lg font-black text-slate-800 font-display block truncate">
                {formatCurrencyIDR(avgAdr)}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                <ArrowUpRight className="w-3 h-3" /> {language === 'en' ? 'Computed from bookings' : 'Dihitung dari pesanan'}
              </span>
            </div>
            <span className="p-3 rounded-xl bg-indigo-50 text-indigo-700 shrink-0"><DollarSign className="w-5 h-5" /></span>
          </div>

          {/* Card 2: RevPAR */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                {language === 'en' ? 'Revenue Per Room (RevPAR)' : 'Pendapatan Per Kamar'}
              </span>
              <span className="text-lg font-black text-slate-800 font-display block truncate">
                {formatCurrencyIDR(avgRevPAR)}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                <ArrowUpRight className="w-3 h-3" /> {language === 'en' ? 'Reflecting occupancy' : 'Merefleksikan okupansi'}
              </span>
            </div>
            <span className="p-3 rounded-xl bg-emerald-50 text-emerald-700 shrink-0"><Building className="w-5 h-5" /></span>
          </div>

          {/* Card 3: Lead Time */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                {language === 'en' ? 'Avg Lead Time' : 'Rata-rata Waktu Libur'}
              </span>
              <span className="text-lg font-black text-slate-800 font-display block truncate">
                {averageBookingLeadTime} {language === 'en' ? 'Days' : 'Hari'}
              </span>
              <span className="text-[10px] text-indigo-650 font-bold flex items-center gap-0.5 mt-1">
                <Clock className="w-3 h-3" /> {language === 'en' ? 'Days booked in advance' : 'Hari dipesan awal'}
              </span>
            </div>
            <span className="p-3 rounded-xl bg-amber-50 text-amber-600 shrink-0"><Clock className="w-5 h-5" /></span>
          </div>

          {/* Card 4: Length of Stay */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                {language === 'en' ? 'Length of Stay (ALoS)' : 'Lama Tamu Menginap'}
              </span>
              <span className="text-lg font-black text-slate-800 font-display block truncate">
                {averageLengthOfStay} {language === 'en' ? 'Nights' : 'Malam'}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                <ArrowUpRight className="w-3 h-3" /> {language === 'en' ? 'Average duration' : 'Durasi rata-rata'}
              </span>
            </div>
            <span className="p-3 rounded-xl bg-cyan-50 text-cyan-700 shrink-0"><CalendarCheck className="w-5 h-5" /></span>
          </div>

        </div>
      </div>

      {/* Export Confirmation Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-md border border-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-black text-indigo-950 font-display">
                {language === 'en' ? 'Export Operational Report' : 'Ekspor Laporan Operasional'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-semibold">
                {language === 'en' 
                  ? 'Choose the report format and period before generating the report.' 
                  : 'Pilih format ekspor dan periode sebelum membuat laporan.'}
              </p>
            </div>

            <hr className="border-slate-100" />

            <div className="flex flex-col gap-4">
              {/* Report Type */}
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  {language === 'en' ? 'Report Type' : 'Jenis Laporan'}
                </label>
                <select
                  value={exportReportType}
                  onChange={(e) => setExportReportType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 appearance-none cursor-pointer"
                >
                  <option value="revenue">{language === 'en' ? 'Revenue Performance' : 'Kinerja Pendapatan'}</option>
                  <option value="booking">{language === 'en' ? 'Booking Volume & Trends' : 'Volume & Tren Pemesanan'}</option>
                  <option value="occupancy">{language === 'en' ? 'Occupancy Rate Diagnostics' : 'Diagnostik Tingkat Okupansi'}</option>
                  <option value="operational">{language === 'en' ? 'Property Operational Summary' : 'Ringkasan Operasional Properti'}</option>
                </select>
              </div>

              {/* Export Format */}
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  {language === 'en' ? 'Export Format' : 'Format Ekspor'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFormat('xlsx')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      exportFormat === 'xlsx'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-extrabold'
                        : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('csv')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      exportFormat === 'csv'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-extrabold'
                        : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    CSV
                  </button>
                </div>
              </div>

              {/* Report Period */}
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  {language === 'en' ? 'Report Period' : 'Periode Laporan'}
                </label>
                <select
                  value={exportPeriod}
                  onChange={(e) => {
                    setExportPeriod(e.target.value);
                    if (e.target.value !== 'custom') {
                      setExportStartDate('');
                      setExportEndDate('');
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 appearance-none cursor-pointer"
                >
                  <option value="this_year">{language === 'en' ? 'This Year' : 'Tahun Ini'}</option>
                  <option value="today">{language === 'en' ? 'Today' : 'Hari Ini'}</option>
                  <option value="this_week">{language === 'en' ? 'This Week' : 'Minggu Ini'}</option>
                  <option value="this_month">{language === 'en' ? 'This Month' : 'Bulan Ini'}</option>
                  <option value="custom">{language === 'en' ? 'Custom Date Range' : 'Kustom Rentang Tanggal'}</option>
                </select>
              </div>

              {/* Custom Dates */}
              {exportPeriod === 'custom' && (
                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {language === 'en' ? 'Start Date' : 'Tanggal Mulai'}
                    </label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-hidden focus:border-indigo-600 cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {language === 'en' ? 'End Date' : 'Tanggal Selesai'}
                    </label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-hidden focus:border-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Property */}
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  {language === 'en' ? 'Property' : 'Properti'}
                </label>
                <select
                  value={exportPropertyId}
                  onChange={(e) => setExportPropertyId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-indigo-600 appearance-none cursor-pointer"
                >
                  <option value="">{language === 'en' ? 'All Properties' : 'Semua Properti'}</option>
                  {propertyList.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <hr className="border-slate-100 mt-2" />

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 mt-1">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                disabled={exportLoading}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer disabled:opacity-50"
              >
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="button"
                onClick={handleExportReport}
                disabled={exportLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-900 text-white hover:bg-slate-950 transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {exportLoading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{language === 'en' ? 'Generating...' : 'Membuat...'}</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-4 h-4" />
                    <span>{language === 'en' ? 'Export Report' : 'Ekspor Laporan'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern sliding notifications */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 animate-slide-in max-w-sm font-sans ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <p className="text-xs font-bold leading-relaxed">{notification.message}</p>
          <button 
            onClick={() => setNotification(null)} 
            className="ml-auto text-slate-400 hover:text-slate-600 text-sm font-bold px-1.5 py-0.5 rounded-md hover:bg-slate-100"
          >
            ×
          </button>
        </div>
      )}

    </div>
  );
}
