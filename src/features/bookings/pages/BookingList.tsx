import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/i18n';
import { Loader2, CalendarX, FileSpreadsheet } from 'lucide-react';
import BookingFilterBar from '../components/BookingFilterBar';
import BookingRowItem from '../components/BookingRowItem';

interface PropertyOption {
  id: string;
  name: string;
}

export default function BookingList({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const [bookings, setBookings] = useState<any[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);

  // States for filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [propertyId, setPropertyId] = useState('');

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (status !== 'ALL') params.append('status', status);
    if (search.trim()) params.append('search', search.trim());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (propertyId) params.append('propertyId', propertyId);
    return params.toString() ? `?${params.toString()}` : '';
  };

  const loadProperties = () => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch('/api/properties', { headers })
      .then(res => res.json())
      .then(data => setProperties(data.data || []))
      .catch(err => console.error('Error fetching properties', err));
  };

  const loadBookings = () => {
    setLoading(true);
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch(`/api/bookings${buildQuery()}`, { headers })
      .then(res => res.json())
      .then(data => {
        setBookings(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadProperties();
  }, [token]);

  useEffect(() => {
    loadBookings();
  }, [token, status, search, startDate, endDate, propertyId]);

  const isEn = language === 'en';

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 font-sans flex flex-col gap-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-indigo-950 font-display tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
          {isEn ? 'Booking & Reservation Ledger' : 'Arsip Transaksi Reservasi & Pemesanan'}
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">
          {isEn
            ? 'Unified administrative interface for checking real-time transaction schedules and verification pipelines'
            : 'Sistem manajemen terintegrasi untuk melacak semua pemesanan aktif, riwayat, dan verifikasi dana'}
        </p>
      </div>

      {/* Filter Bar Component */}
      <BookingFilterBar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        propertyId={propertyId}
        onPropertyChange={setPropertyId}
        properties={properties}
        language={language}
      />

      {/* Bookings Ledger Sheet */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-indigo-900">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center justify-center p-6">
            <CalendarX className="w-12 h-12 text-slate-300 mb-2" />
            <span className="text-xs text-slate-500 font-bold block">
              {isEn ? 'No reservation books found matching filter parameters.' : 'Tidak ada catatan transaksi pemesanan yang cocok dengan filter.'}
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4">Ref Code & Created</th>
                  <th className="p-4">Guest Name</th>
                  <th className="p-4">Property & Room</th>
                  <th className="p-4">Check In</th>
                  <th className="p-4">Check Out</th>
                  <th className="p-4 text-center">Duration</th>
                  <th className="p-4">Total Quote</th>
                  <th className="p-4">Workflow Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.map((booking, index) => (
                  <BookingRowItem
                    key={`${booking.id || ''}-${index}`}
                    booking={booking}
                    onViewDetails={(id) => onNavigate(`/bookings/${id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
