import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { UserRole } from '../../../types';
import { 
  BarChart, Users, Building, Calendar, DollarSign, Star, Bell, Shield, Terminal, Settings, LogOut, Loader2, ArrowLeft 
} from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';

// Components
import AdminOverview from '../components/AdminOverview';
import UserManagement from '../components/UserManagement';
import PropertyManagement from '../components/PropertyManagement';
import BookingManagement from '../components/BookingManagement';
import FinanceManagement from '../components/FinanceManagement';
import ReviewManagement from '../components/ReviewManagement';
import NotificationCenter from '../components/NotificationCenter';
import AuditLogs from '../components/AuditLogs';
import SystemSettings from '../components/SystemSettings';
import PeakSeasonManagement from '../components/PeakSeasonManagement';

// Secure helper to run authenticated administrative requests
const fetchAdmin = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('stayease_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
};

export default function AdminPanel({ path = '/admin', onNavigate = () => {} }: { path?: string; onNavigate?: (path: string) => void }) {
  const { user, logout } = useAuth();
  
  const getActiveTabFromPath = (p: string) => {
    if (p === '/admin/users') return 'users';
    if (p === '/admin/properties' || p === '/admin/rooms') return 'properties';
    if (p === '/admin/bookings') return 'bookings';
    if (p === '/admin/finance') return 'finance';
    if (p === '/admin/peak-seasons') return 'peak-seasons';
    if (p === '/admin/reviews') return 'reviews';
    if (p === '/admin/notifications') return 'notifications';
    if (p === '/admin/activity-logs') return 'activity-logs';
    if (p === '/admin/settings') return 'settings';
    return 'dashboard';
  };

  const activeTab = getActiveTabFromPath(path);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Loaded Data
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Hook to fetch all administration datasets
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats & Trends
      const dash = await fetchAdmin('/api/admin/dashboard');
      if (dash.success) {
        setStats(dash.stats);
        setTrends(dash.trends);
      }

      // 2. Fetch Users
      const usersData = await fetchAdmin('/api/admin/users');
      if (usersData.success) setUsers(usersData.users);

      // 3. Fetch Tenants
      const tenantsData = await fetchAdmin('/api/admin/tenants');
      if (tenantsData.success) setTenants(tenantsData.tenants);

      // 4. Fetch Properties
      const propsData = await fetchAdmin('/api/admin/properties');
      if (propsData.success) setProperties(propsData.properties);

      // 5. Fetch Bookings
      const bookData = await fetchAdmin('/api/admin/bookings');
      if (bookData.success) setBookings(bookData.bookings);

      // 6. Fetch Payments
      const paysData = await fetchAdmin('/api/admin/payments');
      if (paysData.success) setPayments(paysData.payments);

      // 7. Fetch Reviews
      const revsData = await fetchAdmin('/api/admin/reviews');
      if (revsData.success) setReviews(revsData.reviews);

      // 8. Fetch Audit Logs
      const logsData = await fetchAdmin('/api/admin/audit-logs');
      if (logsData.success) setAuditLogs(logsData.logs);

      // 9. Fetch System Settings
      const settingsData = await fetchAdmin('/api/admin/settings');
      if (settingsData.success) setSettings(settingsData.settings);

    } catch (err: any) {
      console.error('Error fetching admin dashboard data:', err);
      setErrorMsg(err.message || 'Verification or loading failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Update handles
  const handleCreateUser = async (data: any) => {
    try {
      const res = await fetchAdmin('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res.success) {
        setUsers(prev => [res.user, ...prev]);
        // Refresh audit logs
        const logsData = await fetchAdmin('/api/admin/audit-logs');
        if (logsData.success) setAuditLogs(logsData.logs);
      }
    } catch (err: any) {
      throw new Error(err.message || 'Create failed');
    }
  };

  const handleUpdateUser = async (userId: string, data: any) => {
    try {
      const res = await fetchAdmin(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      if (res.success) {
        // Optimistic refresh
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...res.user } : u));
        // Refresh audit logs
        const logsData = await fetchAdmin('/api/admin/audit-logs');
        if (logsData.success) setAuditLogs(logsData.logs);
      }
    } catch (err: any) {
      throw new Error(err.message || 'Update failed');
    }
  };

  const handleResetPassword = async (userId: string, newPassword: string) => {
    try {
      await fetchAdmin(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password: newPassword })
      });
      // Refresh audit logs
      const logsData = await fetchAdmin('/api/admin/audit-logs');
      if (logsData.success) setAuditLogs(logsData.logs);
    } catch (err: any) {
      throw new Error(err.message || 'Override failed');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetchAdmin(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        // Refresh audit logs
        const logsData = await fetchAdmin('/api/admin/audit-logs');
        if (logsData.success) setAuditLogs(logsData.logs);
      }
    } catch (err: any) {
      throw new Error(err.message || 'Permanent delete failed');
    }
  };

  const handleUpdateTenantProfileStatus = async (tenantId: string, isVerified: boolean) => {
    try {
      const res = await fetchAdmin(`/api/admin/users/${tenantId}`, {
        method: 'PUT',
        body: JSON.stringify({ isVerified })
      });
      if (res.success) {
        setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, isVerified } : t));
        const logsData = await fetchAdmin('/api/admin/audit-logs');
        if (logsData.success) setAuditLogs(logsData.logs);
      }
    } catch (err: any) {
      throw new Error(err.message || 'Tenant verification failed');
    }
  };

  const handleSuspendTenant = async (tenantId: string, suspend: boolean) => {
    try {
      const res = await fetchAdmin(`/api/admin/users/${tenantId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: suspend ? 'SUSPENDED' : 'ACTIVE' })
      });
      if (res.success) {
        setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, status: suspend ? 'SUSPENDED' : 'ACTIVE' } : t));
        const logsData = await fetchAdmin('/api/admin/audit-logs');
        if (logsData.success) setAuditLogs(logsData.logs);
      }
    } catch (err: any) {
      throw new Error(err.message || 'Tenant status change failed');
    }
  };

  const handleUpdatePropertyStatus = async (propertyId: string, status: string) => {
    try {
      const res = await fetchAdmin(`/api/admin/properties/${propertyId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      if (res.success) {
        setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, ...res.property } : p));
        const logsData = await fetchAdmin('/api/admin/audit-logs');
        if (logsData.success) setAuditLogs(logsData.logs);
      }
    } catch (err: any) {
      throw new Error(err.message || 'Property update failed');
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const res = await fetchAdmin(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      if (res.success) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, ...res.booking } : b));
        const logsData = await fetchAdmin('/api/admin/audit-logs');
        if (logsData.success) setAuditLogs(logsData.logs);
      }
    } catch (err: any) {
      throw new Error(err.message || 'Booking update failed');
    }
  };

  const handleConfirmPayment = async (bookingId: string) => {
    await handleUpdateBookingStatus(bookingId, 'CONFIRMED');
    setPayments(prev => prev.map(p => p.id === bookingId ? { ...p, status: 'CONFIRMED' } : p));
  };

  const handleRejectPayment = async (bookingId: string) => {
    await handleUpdateBookingStatus(bookingId, 'CANCELLED');
    setPayments(prev => prev.map(p => p.id === bookingId ? { ...p, status: 'CANCELLED' } : p));
  };

  const handleToggleReviewVisibility = async (reviewId: string, isHidden: boolean) => {
    try {
      const res = await fetchAdmin(`/api/admin/reviews/${reviewId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isHidden })
      });
      if (res.success) {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ...res.review } : r));
        const logsData = await fetchAdmin('/api/admin/audit-logs');
        if (logsData.success) setAuditLogs(logsData.logs);
      }
    } catch (err: any) {
      throw new Error(err.message || 'Review visibility update failed');
    }
  };

  const handleBroadcast = async (title: string, message: string, target: string) => {
    try {
      await fetchAdmin('/api/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title, message, target })
      });
      const logsData = await fetchAdmin('/api/admin/audit-logs');
      if (logsData.success) setAuditLogs(logsData.logs);
    } catch (err: any) {
      throw new Error(err.message || 'Broadcast failed');
    }
  };

  const handleUpdateSettings = async (updates: any) => {
    try {
      const res = await fetchAdmin('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      if (res.success) {
        setSettings(res.settings);
        const logsData = await fetchAdmin('/api/admin/audit-logs');
        if (logsData.success) setAuditLogs(logsData.logs);
      }
    } catch (err: any) {
      throw new Error(err.message || 'Settings update failed');
    }
  };

  const handleManualLogRefresh = async () => {
    const logsData = await fetchAdmin('/api/admin/audit-logs');
    if (logsData.success) setAuditLogs(logsData.logs);
  };

  const handleBackToClient = () => {
    window.location.href = '/';
  };

  // Safe checks: Only admins can proceed past this block
  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-4" id="admin-forbidden-view">
        <Shield className="h-16 w-16 text-rose-500 animate-pulse" />
        <h2 className="text-xl font-bold text-gray-900">Access Denied: Administrative Rights Required</h2>
        <p className="text-sm text-gray-500 max-w-sm">If you believe this is in error, please register/ensure your account role is set as ADMIN.</p>
        <button 
          onClick={handleBackToClient}
          className="bg-indigo-650 bg-indigo-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition"
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  // General loading panel
  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3" id="admin-overall-loading">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Loading Administrative Datastores...</p>
      </div>
    );
  }

  return (
    <AdminLayout 
      activePath={path} 
      onNavigate={onNavigate}
      bookingsCount={bookings.length}
      reviewsCount={reviews.length}
      notificationsCount={8}
    >
      {loading && (
        <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-3 text-xs text-indigo-700 flex items-center gap-2 mb-6" id="loading-spinner-notif">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 shrink-0" />
          <span>Syncing fresh platform records...</span>
        </div>
      )}

      {/* Content Tabs */}
      {activeTab === 'dashboard' && stats && (
        <AdminOverview stats={stats} trends={trends} />
      )}

      {activeTab === 'users' && (
        <UserManagement 
          users={users} 
          onUpdateUser={handleUpdateUser} 
          onResetPassword={handleResetPassword} 
          onCreateUser={handleCreateUser}
          onPermanentDelete={handleDeleteUser}
          auditLogs={auditLogs}
          tenants={tenants}
          onUpdateTenantStatus={handleUpdateTenantProfileStatus}
          onSuspendTenant={handleSuspendTenant}
        />
      )}

      {activeTab === 'properties' && (
        <PropertyManagement 
          properties={properties} 
          onUpdatePropertyStatus={handleUpdatePropertyStatus} 
          bookings={bookings}
          reviews={reviews}
          onRefreshData={fetchAllData}
        />
      )}

      {activeTab === 'bookings' && (
        <BookingManagement 
          bookings={bookings} 
          onUpdateBookingStatus={handleUpdateBookingStatus} 
        />
      )}

      {activeTab === 'finance' && (
        <FinanceManagement 
          payments={payments} 
          onConfirmPayment={handleConfirmPayment} 
          onRejectPayment={handleRejectPayment} 
          stats={stats}
          trends={trends}
        />
      )}

      {activeTab === 'peak-seasons' && (
        <PeakSeasonManagement 
          properties={properties}
        />
      )}

      {activeTab === 'reviews' && (
        <ReviewManagement 
          reviews={reviews} 
          onToggleReviewVisibility={handleToggleReviewVisibility} 
        />
      )}

      {activeTab === 'notifications' && (
        <NotificationCenter 
          onBroadcast={handleBroadcast} 
          registeredUsers={users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))} 
        />
      )}

      {activeTab === 'activity-logs' && (
        <AuditLogs 
          logs={auditLogs} 
          onRefresh={handleManualLogRefresh} 
        />
      )}

      {activeTab === 'settings' && settings && (
        <SystemSettings 
          settings={settings} 
          onUpdateSettings={handleUpdateSettings} 
        />
      )}
    </AdminLayout>
  );
}
