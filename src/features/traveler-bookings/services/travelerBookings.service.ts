import { TravelerBooking, BookingFilters, BookingStats } from '../types/travelerBookings.types';

export const travelerBookingsService = {
  async fetchBookings(token: string, filters: BookingFilters): Promise<{ data: TravelerBooking[]; total: number }> {
    const q = new URLSearchParams({
      search: filters.search,
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate,
      page: String(filters.page),
      limit: String(filters.limit)
    });
    const res = await fetch(`/api/bookings?${q.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return res.json();
  },

  async fetchStats(token: string): Promise<BookingStats> {
    const res = await fetch('/api/bookings', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    const { data } = await res.json();
    return calculateStats(data || []);
  },

  async uploadPaymentProof(id: string, proofUrl: string, token: string): Promise<any> {
    const res = await fetch(`/api/bookings/${id}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ proofUrl })
    });
    if (!res.ok) throw new Error('Failed to upload proof');
    return res.json();
  },

  async updateStatus(id: string, status: string, token: string): Promise<any> {
    const res = await fetch(`/api/bookings/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  }
};

function calculateStats(bookings: any[]): BookingStats {
  const totalReservations = bookings.length;
  const activeReservations = bookings.filter(b => b.status === 'CONFIRMED').length;
  const completedReservations = bookings.filter(b => b.status === 'COMPLETED').length;
  const waitingPaymentReservations = bookings.filter(b => b.status === 'WAITING_PAYMENT').length;
  return {
    totalReservations,
    activeReservations,
    completedReservations,
    waitingPaymentReservations
  };
}
