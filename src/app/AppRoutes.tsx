import React from 'react';
import Home from '../features/properties/pages/Home';
import Search from '../features/properties/pages/Search';
import PropertyDetail from '../features/properties/pages/PropertyDetail';
import Checkout from '../features/bookings/pages/Checkout';
import TravelerDashboard from '../features/dashboard/pages/TravelerDashboard';
import Wishlist from '../features/dashboard/pages/Wishlist';
import Profile from '../features/dashboard/pages/Profile';
import Settings from '../features/dashboard/pages/Settings';
import Security from '../features/dashboard/pages/Security';
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';
import VerifyEmail from '../features/auth/pages/VerifyEmail';
import OAuthCallback from '../features/auth/pages/OAuthCallback';
import ForgotPassword from '../features/auth/pages/ForgotPassword';
import ResetPassword from '../features/auth/pages/ResetPassword';
import TenantLayout from '../layouts/TenantLayout';
import TenantDashboard from '../features/tenant/pages/TenantDashboard';
import TenantProperties from '../features/tenant/pages/TenantProperties';
import TenantBookings from '../features/tenant/pages/TenantBookings';
import TenantReports from '../features/tenant/pages/TenantReports';
import TenantFinancePage from '../features/tenant/pages/TenantFinancePage';
import TenantOperationsPage from '../features/tenant/pages/TenantOperationsPage';
import AdminPanel from '../features/admin/pages/AdminPanel';
import AboutPage from '../features/about/pages/AboutPage';
import BookingList from '../features/bookings/pages/BookingList';
import BookingDetail from '../features/bookings/pages/BookingDetail';
import { UserRoute, TenantRoute, ProtectedRoute } from '../shared/components/RouteGuards';

interface RoutesProps {
  path: string;
  params: any;
  user: any;
  onNavigate: (path: string, params?: any) => void;
}

export function AppRoutes({ path, params, user, onNavigate }: RoutesProps) {
  if (path === '/') return <Home onNavigate={onNavigate} />;
  if (path === '/login') return <Login onNavigate={onNavigate} />;
  if (path === '/register') return <Register onNavigate={onNavigate} />;
  if (path === '/about') return <AboutPage onNavigate={onNavigate} />;
  if (path === '/verify-email') return <VerifyEmail onNavigate={onNavigate} params={params} />;
  if (path === '/auth/callback') return <VerifyEmail onNavigate={onNavigate} params={params} />;
  if (path === '/auth/callback-oauth') return <OAuthCallback />;
  if (path === '/forgot-password') return <ForgotPassword onNavigate={onNavigate} />;
  if (path === '/reset-password') return <ResetPassword onNavigate={onNavigate} params={params} />;
  if (path.startsWith('/admin')) return <AdminPanel path={path} onNavigate={onNavigate} />;
  if (path.startsWith('/property/')) return <PropertyDetail propertyId={path.split('/').pop() || ''} onNavigate={onNavigate} />;
  return <AppGuardRoutes path={path} params={params} user={user} onNavigate={onNavigate} />;
}

function AppGuardRoutes({ path, params, user, onNavigate }: RoutesProps) {
  if (path === '/checkout') return <UserRoute fallbackNavigate={onNavigate}><Checkout params={params} onNavigate={onNavigate} /></UserRoute>;
  if (path === '/wishlist') return <UserRoute fallbackNavigate={onNavigate}><Wishlist onNavigate={onNavigate} /></UserRoute>;
  if (path === '/profile') return <ProtectedRoute fallbackNavigate={onNavigate}><Profile /></ProtectedRoute>;
  if (path === '/settings') return <ProtectedRoute fallbackNavigate={onNavigate}><Settings /></ProtectedRoute>;
  if (path === '/security') return <ProtectedRoute fallbackNavigate={onNavigate}><Security /></ProtectedRoute>;
  if (path === '/my-bookings' || path === '/favorites' || path === '/traveler-dashboard') {
    return <UserRoute fallbackNavigate={onNavigate}><TravelerDashboard /></UserRoute>;
  }
  return <TenantAndBookingRoutes path={path} params={params} user={user} onNavigate={onNavigate} />;
}

function TenantAndBookingRoutes({ path, params, user, onNavigate }: RoutesProps) {
  if (path === '/dashboard' || path === '/tenant-dashboard') {
    return <TenantRoute fallbackNavigate={onNavigate}><TenantLayout activeTab="dashboard" onSelectTab={(t) => onNavigate('/' + t)}><TenantDashboard /></TenantLayout></TenantRoute>;
  }
  if (path === '/properties') {
    return user?.role === 'TENANT' 
      ? <TenantRoute fallbackNavigate={onNavigate}><TenantLayout activeTab="properties" onSelectTab={(t) => onNavigate('/' + t)}><TenantProperties /></TenantLayout></TenantRoute>
      : <Search initialLocation={params?.location} initialQuery={params?.search} initialCategory={params?.category} onNavigate={onNavigate} />;
  }
  if (path === '/rooms') {
    return <TenantRoute fallbackNavigate={onNavigate}><TenantLayout activeTab="properties" onSelectTab={(t) => onNavigate('/' + t)}><TenantProperties initialTab="rooms" /></TenantLayout></TenantRoute>;
  }
  if (path === '/availability') {
    return <TenantRoute fallbackNavigate={onNavigate}><TenantLayout activeTab="properties" onSelectTab={(t) => onNavigate('/' + t)}><TenantProperties initialTab="calendar" /></TenantLayout></TenantRoute>;
  }
  return <OperationsAndBookingDetailRoutes path={path} params={params} user={user} onNavigate={onNavigate} />;
}

function OperationsAndBookingDetailRoutes({ path, params, user, onNavigate }: RoutesProps) {
  if (path === '/reservations') {
    return user?.role === 'TENANT'
      ? <TenantRoute fallbackNavigate={onNavigate}><TenantLayout activeTab="reservations" onSelectTab={(t) => onNavigate('/' + t)}><TenantBookings /></TenantLayout></TenantRoute>
      : <UserRoute fallbackNavigate={onNavigate}><TravelerDashboard /></UserRoute>;
  }
  if (path === '/finance') {
    return <TenantRoute fallbackNavigate={onNavigate}><TenantLayout activeTab="finance" onSelectTab={(t) => onNavigate('/' + t)}><TenantFinancePage onNavigate={onNavigate} /></TenantLayout></TenantRoute>;
  }
  if (path === '/payments') {
    return <TenantRoute fallbackNavigate={onNavigate}><TenantLayout activeTab="finance" onSelectTab={(t) => onNavigate('/' + t)}><TenantFinancePage initialTab="manual" onNavigate={onNavigate} /></TenantLayout></TenantRoute>;
  }
  if (path === '/operations') {
    return <TenantRoute fallbackNavigate={onNavigate}><TenantLayout activeTab="operations" onSelectTab={(t) => onNavigate('/' + t)}><TenantOperationsPage onNavigate={onNavigate} /></TenantLayout></TenantRoute>;
  }
  return <CheckInReviewsAndReportsRoutes path={path} params={params} user={user} onNavigate={onNavigate} />;
}

function CheckInReviewsAndReportsRoutes({ path, params, user, onNavigate }: RoutesProps) {
  if (path === '/check-in') {
    return <TenantRoute fallbackNavigate={onNavigate}><TenantLayout activeTab="operations" onSelectTab={(t) => onNavigate('/' + t)}><TenantOperationsPage initialTab="check-in" onNavigate={onNavigate} /></TenantLayout></TenantRoute>;
  }
  if (path === '/check-out') {
    return <TenantRoute fallbackNavigate={onNavigate}><TenantLayout activeTab="operations" onSelectTab={(t) => onNavigate('/' + t)}><TenantOperationsPage initialTab="check-out" onNavigate={onNavigate} /></TenantLayout></TenantRoute>;
  }
  if (path === '/reviews') {
    return <TenantRoute fallbackNavigate={onNavigate}><TenantLayout activeTab="operations" onSelectTab={(t) => onNavigate('/' + t)}><TenantOperationsPage initialTab="reviews" onNavigate={onNavigate} /></TenantLayout></TenantRoute>;
  }
  if (path === '/reports') {
    return <TenantRoute fallbackNavigate={onNavigate}><TenantLayout activeTab="dashboard" onSelectTab={(t) => onNavigate('/' + t)}><TenantReports /></TenantLayout></TenantRoute>;
  }
  if (path === '/search') {
    return <Search initialLocation={params?.location} initialQuery={params?.search} initialCategory={params?.category} onNavigate={onNavigate} />;
  }
  return <FinalBookingRoutes path={path} params={params} user={user} onNavigate={onNavigate} />;
}

function FinalBookingRoutes({ path, params, user, onNavigate }: RoutesProps) {
  if (path === '/bookings') {
    return <ProtectedRoute fallbackNavigate={onNavigate}>
      {user?.role === 'TENANT' 
        ? <TenantLayout activeTab="reservations" onSelectTab={(t) => onNavigate('/' + t)}><TenantBookings /></TenantLayout>
        : <BookingList onNavigate={onNavigate} />}
    </ProtectedRoute>;
  }
  if (path.startsWith('/bookings/')) {
    const id = path.split('/').pop() || '';
    return <ProtectedRoute fallbackNavigate={onNavigate}>
      {user?.role === 'TENANT'
        ? <TenantLayout activeTab="reservations" onSelectTab={(t) => onNavigate('/' + t)}><BookingDetail id={id} onNavigate={onNavigate} /></TenantLayout>
        : <BookingDetail id={id} onNavigate={onNavigate} />}
    </ProtectedRoute>;
  }
  return null;
}
