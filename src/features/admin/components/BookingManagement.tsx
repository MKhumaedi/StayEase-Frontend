import React, { useState } from 'react';
import { Search, Filter, Calendar, DollarSign, RefreshCw, Layers } from 'lucide-react';

interface Booking {
  id: string;
  bookingCode: string;
  guestName: string;
  guestEmail: string;
  startDate: string;
  endDate: string;
  nights: number;
  totalAmount: string | number;
  status: string;
  createdAt: string;
  property: { name: string; location: string } | null;
}

interface BookingManagementProps {
  bookings: Booking[];
  onUpdateBookingStatus: (bookingId: string, status: string) => Promise<void>;
}

export default function BookingManagement({ bookings, onUpdateBookingStatus }: BookingManagementProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.bookingCode.toLowerCase().includes(search.toLowerCase()) ||
                          b.guestName.toLowerCase().includes(search.toLowerCase()) ||
                          b.guestEmail.toLowerCase().includes(search.toLowerCase()) ||
                          b.property?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (booking: Booking, status: string) => {
    if (window.confirm(`Are you sure you want to transition booking status to "${status}"?`)) {
      try {
        await onUpdateBookingStatus(booking.id, status);
      } catch (err: any) {
        alert(err.message || 'Status transition failed');
      }
    }
  };

  return (
    <div className="space-y-6" id="booking-management-container">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900" id="bookings-heading">Reservations & Bookings</h2>
        <p className="mt-1 text-sm text-gray-500" id="bookings-subheading">Track reservation payments, update booking workflows, and verify guest arrivals.</p>
      </div>

      {/* Inputs */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs flex flex-col gap-4 sm:flex-row sm:items-center" id="bookings-filters-bar">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input 
            id="booking-search-input"
            type="text" 
            placeholder="Search booking code, guest name, property..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-gray-50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400 shrink-0" />
          <select 
            id="booking-status-filter"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg py-1.5 px-3 min-w-[160px] focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-gray-50"
          >
            <option value="ALL">All Statuses</option>
            <option value="WAITING_PAYMENT">WAITING_PAYMENT</option>
            <option value="WAITING_CONFIRMATION">WAITING_CONFIRMATION</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Bookings Table List */}
      <div className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-xs" id="bookings-table-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" id="bookings-table">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-4">Booking Code & Guest</th>
                <th className="px-6 py-4">Stay Location</th>
                <th className="px-6 py-4">Check In - Out</th>
                <th className="px-6 py-4">Total Price</th>
                <th className="px-6 py-4">Current Status</th>
                <th className="px-6 py-4 text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm" id="bookings-table-body">
              {filteredBookings.length === 0 ? (
                <tr id="empty-booking-row">
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No reservations matching current filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  return (
                    <tr key={b.id} className="hover:bg-gray-50/40 transition-colors" id={`booking-row-${b.id}`}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 rounded-md px-2 py-0.5 w-fit">{b.bookingCode}</p>
                          <p className="font-bold text-gray-800 mt-2">{b.guestName}</p>
                          <p className="text-xs text-gray-400">{b.guestEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-[180px]">
                          <p className="font-semibold text-gray-800 line-clamp-1">{b.property?.name || 'Staying Facility'}</p>
                          <p className="text-xs text-gray-400 line-clamp-1">{b.property?.location || 'Stayease Base'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1 font-medium text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {b.startDate}
                          </span>
                          <span className="flex items-center gap-1 font-medium text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            {b.endDate}
                          </span>
                          <span className="text-gray-400 italic text-[10px]">({b.nights} nights)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 text-md">
                        ${Math.round(Number(b.totalAmount))}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          b.status === 'CONFIRMED' ? 'bg-indigo-15 bg-indigo-100 text-indigo-800' :
                          b.status === 'WAITING_PAYMENT' ? 'bg-amber-100 text-amber-800' :
                          b.status === 'WAITING_CONFIRMATION' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {b.status === 'WAITING_PAYMENT' && (
                            <button 
                              onClick={() => handleStatusChange(b, 'CONFIRMED')}
                              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs"
                            >
                              Verify Payment & Confirm
                            </button>
                          )}
                          {b.status === 'WAITING_CONFIRMATION' && (
                            <button 
                              onClick={() => handleStatusChange(b, 'CONFIRMED')}
                              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs"
                            >
                              Confirm Stay
                            </button>
                          )}
                          {b.status === 'CONFIRMED' && (
                            <button 
                              onClick={() => handleStatusChange(b, 'COMPLETED')}
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs"
                            >
                              Complete Stay
                            </button>
                          )}
                          
                          {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                            <button 
                              onClick={() => handleStatusChange(b, 'CANCELLED')}
                              className="text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold px-3 py-1.5 rounded-lg"
                            >
                              Cancel Stay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
