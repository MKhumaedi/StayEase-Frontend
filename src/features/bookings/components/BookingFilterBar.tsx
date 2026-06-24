import React from 'react';
import { Search, Calendar, Landmark } from 'lucide-react';

interface PropertyOption {
  id: string;
  name: string;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  propertyId: string;
  onPropertyChange: (val: string) => void;
  properties: PropertyOption[];
  language: string;
}

export default function BookingFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  propertyId,
  onPropertyChange,
  properties,
  language
}: FilterBarProps) {
  const isEn = language === 'en';

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
      {/* Target Search & Status Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {isEn ? 'Guest or Code Search' : 'Cari Tamu / No Booking'}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-450" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={isEn ? 'Enter key or code...' : 'Masukkan kata kunci...'}
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-550 focus:border-indigo-550 bg-slate-50"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {isEn ? 'Filter by Status' : 'Saring Berdasarkan Status'}
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-550 focus:border-indigo-550 bg-slate-50 font-semibold"
          >
            <option value="ALL">{isEn ? 'All Statuses' : 'Semua Status'}</option>
            <option value="WAITING_PAYMENT">WAITING_PAYMENT</option>
            <option value="WAITING_CONFIRMATION">WAITING_CONFIRMATION</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="EXPIRED">{isEn ? 'AUTO_EXPIRED' : 'KADALUARSA'}</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {isEn ? 'Select Property' : 'Filter Properti'}
          </label>
          <div className="relative">
            <Landmark className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 hidden sm:block" />
            <select
              value={propertyId}
              onChange={(e) => onPropertyChange(e.target.value)}
              className="w-full px-3 sm:pl-9 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-550 focus:border-indigo-550 bg-slate-50 font-semibold"
            >
              <option value="">{isEn ? 'All Properties' : 'Semua Properti'}</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Date Range Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-50 pt-4">
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {isEn ? 'Check In Date From' : 'Tanggal Check-in Dari'}
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-450" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-550 bg-slate-50 font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {isEn ? 'Check Out Date To' : 'Tanggal Check-out Hingga'}
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-450" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-550 bg-slate-50 font-semibold"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
