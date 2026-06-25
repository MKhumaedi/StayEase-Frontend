import { useState, useEffect, useCallback } from 'react';
import { TravelerBooking, BookingFilters, BookingStats } from '../types/travelerBookings.types';
import { travelerBookingsService } from '../services/travelerBookings.service';

export function useTravelerBookings(token: string | null) {
  const [data, setData] = useState<TravelerBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<BookingStats>({
    totalReservations: 0,
    activeReservations: 0,
    completedReservations: 0,
    waitingPaymentReservations: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BookingFilters>({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  });

  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      const statsObj = await travelerBookingsService.fetchStats(token);
      setStats(statsObj);
    } catch (_) {}
  }, [token]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await travelerBookingsService.fetchBookings(token, filters);
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (_) {}
    setLoading(false);
  }, [token, filters]);

  useEffect(() => {
    loadData();
    loadStats();
  }, [loadData, loadStats]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      travelerBookingsService.fetchBookings(token, filters).then(res => {
        setData(res.data || []);
        setTotal(res.total || 0);
      }).catch(() => {});
      travelerBookingsService.fetchStats(token).then(statsObj => {
        setStats(statsObj);
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [token, filters]);

  const changeFilter = useCallback((field: keyof BookingFilters, val: any) => {
    setFilters(prev => ({ ...prev, [field]: val, page: field === 'page' ? val : 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ search: '', status: '', startDate: '', endDate: '', page: 1, limit: 10 });
  }, []);

  return {
    data,
    total,
    stats,
    loading,
    filters,
    setData,
    changeFilter,
    resetFilters,
    reload: loadData,
    reloadStats: loadStats
  };
}
