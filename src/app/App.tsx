import React, { useState, useEffect } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import Navbar from '../shared/components/navigation/Navbar';
import Footer from '../shared/components/Footer';
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
import TenantRooms from '../features/tenant/pages/TenantRooms';
import TenantAvailability from '../features/tenant/pages/TenantAvailability';
import TenantBookings from '../features/tenant/pages/TenantBookings';
import TenantReviews from '../features/tenant/pages/TenantReviews';
import TenantReports from '../features/tenant/pages/TenantReports';
import TodayCheckInPage from '../features/tenant/pages/TodayCheckInPage';
import TodayCheckOutPage from '../features/tenant/pages/TodayCheckOutPage';
import TenantFinancePage from '../features/tenant/pages/TenantFinancePage';
import TenantOperationsPage from '../features/tenant/pages/TenantOperationsPage';
import AdminPanel from '../features/admin/pages/AdminPanel';
import AboutPage from '../features/about/pages/AboutPage';
import BookingList from '../features/bookings/pages/BookingList';
import BookingDetail from '../features/bookings/pages/BookingDetail';
import TenantPaymentsPage from '../features/tenant-payments/pages/TenantPaymentsPage';

import { AuthProvider, useAuth } from '../shared/context/AuthContext';
import { WishlistProvider, useWishlist } from '../shared/context/WishlistContext';
import { UserRoute, TenantRoute, ProtectedRoute } from '../shared/components/RouteGuards';

function AppContent() {
  const [path, setPath] = useState<string>(() => {
    const p = window.location.pathname;
    const h = window.location.hash;
    if (h) {
      const hashParams = new URLSearchParams(h.replace('#', '?'));
      const type = hashParams.get('type');
      if (type === 'recovery') return '/reset-password';
      if (type === 'signup') return '/verify-email';
    }
    return p && p !== '/' ? p : '/';
  });
  const [params, setParams] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (targetPath: string, routeParams: any = null) => {
    if (targetPath === '/login') {
      setShowLoginModal(true);
      setShowRegisterModal(false);
      return;
    }
    if (targetPath === '/register' || targetPath === '/signup') {
      setShowRegisterModal(true);
      setShowLoginModal(false);
      setParams(routeParams);
      return;
    }
    setPath(targetPath);
    setParams(routeParams);
    
    // Sync browser URL history
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    
    // Scroll to top on navigation to match standard router action
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Sync state or redirect depending on current security context on route load
  const { user } = useAuth();
  const { triggerToast } = useWishlist();

  useEffect(() => {
    // Guard for tenants trying to access traveler-exclusive checkout / my-bookings / wishlist
    if (user && user.role === 'TENANT' && (
      path === '/checkout' || 
      path === '/my-bookings' || 
      path === '/traveler-dashboard' || 
      path === '/wishlist' ||
      path === '/favorites'
    )) {
      triggerToast("Tenant accounts cannot create reservations.", "error");
      handleNavigate('/dashboard');
      return;
    }

    // If user changes (signed out), redirect safely back to public Home
    if (!user && (
      path === '/my-bookings' || 
      path === '/traveler-dashboard' || 
      path === '/wishlist' || 
      path === '/profile' || 
      path === '/settings' || 
      path === '/security' || 
      path === '/dashboard' || 
      path === '/rooms' || 
      path === '/availability' || 
      path === '/bookings' || 
      path === '/reviews' || 
      path === '/reports' || 
      path === '/tenant-dashboard' ||
      path.startsWith('/admin')
    )) {
      handleNavigate('/');
    }

    // Role-based guard for ADMIN panel
    if (path.startsWith('/admin') && user && user.role !== 'ADMIN') {
      handleNavigate('/');
    }

    // If ADMIN already has active session and attempts to access login, redirect to /admin
    if (user && user.role === 'ADMIN' && path === '/login') {
      handleNavigate('/admin');
    }
  }, [user, path]);

  const isAdminRoute = path.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans antialiased text-slate-800 bg-[#f8fafc]">
      {!isAdminRoute && (
        <Navbar 
          activePath={path} 
          onNavigate={handleNavigate} 
          showLoginModal={showLoginModal}
          setShowLoginModal={setShowLoginModal}
          showRegisterModal={showRegisterModal}
          setShowRegisterModal={setShowRegisterModal}
        />
      )}

      <main className={`flex-1 ${isAdminRoute ? '' : 'pb-12'}`}>
        {/* Public Routes */}
        {path === '/' && <Home onNavigate={handleNavigate} />}
        {path === '/login' && <Login onNavigate={handleNavigate} />}
        {path === '/register' && <Register onNavigate={handleNavigate} />}
        {path === '/search' && (
          <Search 
            initialLocation={params?.location} 
            initialQuery={params?.search} 
            initialCategory={params?.category} 
            initialCheckIn={params?.checkIn}
            initialDuration={params?.duration}
            initialGuests={params?.adults !== undefined ? (Number(params.adults) + Number(params.children || 0)) : (params?.guests ? (typeof params.guests === 'number' ? params.guests : parseInt(String(params.guests)) || '') : '')}
            onNavigate={handleNavigate} 
          />
        )}
        {path === '/about' && <AboutPage onNavigate={handleNavigate} />}
        {path.startsWith('/property/') && <PropertyDetail propertyId={path.split('/').pop() || 'prop-4'} onNavigate={handleNavigate} />}
        {path === '/checkout' && (
          <UserRoute fallbackNavigate={handleNavigate}>
            <Checkout params={params} onNavigate={handleNavigate} />
          </UserRoute>
        )}
        {path === '/verify-email' && <VerifyEmail onNavigate={handleNavigate} params={params} />}
        {path === '/auth/callback' && <VerifyEmail onNavigate={handleNavigate} params={params} />}
        {path === '/auth/callback-oauth' && <OAuthCallback />}
        {path === '/forgot-password' && <ForgotPassword onNavigate={handleNavigate} />}
        {path === '/reset-password' && <ResetPassword onNavigate={handleNavigate} params={params} />}
        {path.startsWith('/admin') && <AdminPanel path={path} onNavigate={handleNavigate} />}

        {/* User Route Guards */}
        {(path === '/my-bookings' || path === '/favorites') && (
          <UserRoute fallbackNavigate={handleNavigate}>
            <TravelerDashboard />
          </UserRoute>
        )}
        {path === '/traveler-dashboard' && (
          <UserRoute fallbackNavigate={handleNavigate}>
            <TravelerDashboard />
          </UserRoute>
        )}
        {path === '/wishlist' && (
          <UserRoute fallbackNavigate={handleNavigate}>
            <Wishlist onNavigate={handleNavigate} />
          </UserRoute>
        )}
        {path === '/profile' && (
          <ProtectedRoute fallbackNavigate={handleNavigate}>
            <Profile />
          </ProtectedRoute>
        )}
        {path === '/settings' && (
          <ProtectedRoute fallbackNavigate={handleNavigate}>
            <Settings />
          </ProtectedRoute>
        )}
        {path === '/security' && (
          <ProtectedRoute fallbackNavigate={handleNavigate}>
            <Security />
          </ProtectedRoute>
        )}

        {/* Tenant Route Guards */}
        {(path === '/dashboard' || path === '/tenant-dashboard') && (
          <TenantRoute fallbackNavigate={handleNavigate}>
            <TenantLayout activeTab="dashboard" onSelectTab={(tab) => handleNavigate('/' + tab)}>
              <TenantDashboard />
            </TenantLayout>
          </TenantRoute>
        )}
        {path === '/properties' && (
          user?.role === 'TENANT' ? (
            <TenantRoute fallbackNavigate={handleNavigate}>
              <TenantLayout activeTab="properties" onSelectTab={(tab) => handleNavigate('/' + tab)}>
                <TenantProperties />
              </TenantLayout>
            </TenantRoute>
          ) : (
            <Search 
              initialLocation={params?.location} 
              initialQuery={params?.search} 
              initialCategory={params?.category} 
              initialCheckIn={params?.checkIn}
              initialDuration={params?.duration}
              initialGuests={params?.adults !== undefined ? (Number(params.adults) + Number(params.children || 0)) : (params?.guests ? (typeof params.guests === 'number' ? params.guests : parseInt(String(params.guests)) || '') : '')}
              onNavigate={handleNavigate} 
            />
          )
        )}
        {path === '/rooms' && (
          <TenantRoute fallbackNavigate={handleNavigate}>
            <TenantLayout activeTab="properties" onSelectTab={(tab) => handleNavigate('/' + tab)}>
              <TenantProperties initialTab="rooms" />
            </TenantLayout>
          </TenantRoute>
        )}
        {path === '/availability' && (
          <TenantRoute fallbackNavigate={handleNavigate}>
            <TenantLayout activeTab="properties" onSelectTab={(tab) => handleNavigate('/' + tab)}>
              <TenantProperties initialTab="calendar" />
            </TenantLayout>
          </TenantRoute>
        )}
        {path === '/reservations' && (
          <TenantRoute fallbackNavigate={handleNavigate}>
            <TenantLayout activeTab="reservations" onSelectTab={(tab) => handleNavigate('/' + tab)}>
              <TenantBookings />
            </TenantLayout>
          </TenantRoute>
        )}
        {path === '/finance' && (
          <TenantRoute fallbackNavigate={handleNavigate}>
            <TenantLayout activeTab="finance" onSelectTab={(tab) => handleNavigate('/' + tab)}>
              <TenantFinancePage onNavigate={handleNavigate} />
            </TenantLayout>
          </TenantRoute>
        )}
        {path === '/payments' && (
          <TenantRoute fallbackNavigate={handleNavigate}>
            <TenantLayout activeTab="finance" onSelectTab={(tab) => handleNavigate('/' + tab)}>
              <TenantFinancePage initialTab="manual" onNavigate={handleNavigate} />
            </TenantLayout>
          </TenantRoute>
        )}
        {path === '/operations' && (
          <TenantRoute fallbackNavigate={handleNavigate}>
            <TenantLayout activeTab="operations" onSelectTab={(tab) => handleNavigate('/' + tab)}>
              <TenantOperationsPage onNavigate={handleNavigate} />
            </TenantLayout>
          </TenantRoute>
        )}
        {path === '/check-in' && (
          <TenantRoute fallbackNavigate={handleNavigate}>
            <TenantLayout activeTab="operations" onSelectTab={(tab) => handleNavigate('/' + tab)}>
              <TenantOperationsPage initialTab="check-in" onNavigate={handleNavigate} />
            </TenantLayout>
          </TenantRoute>
        )}
        {path === '/check-out' && (
          <TenantRoute fallbackNavigate={handleNavigate}>
            <TenantLayout activeTab="operations" onSelectTab={(tab) => handleNavigate('/' + tab)}>
              <TenantOperationsPage initialTab="check-out" onNavigate={handleNavigate} />
            </TenantLayout>
          </TenantRoute>
        )}
        {path === '/reviews' && (
          <TenantRoute fallbackNavigate={handleNavigate}>
            <TenantLayout activeTab="operations" onSelectTab={(tab) => handleNavigate('/' + tab)}>
              <TenantOperationsPage initialTab="reviews" onNavigate={handleNavigate} />
            </TenantLayout>
          </TenantRoute>
        )}
        {path === '/bookings' && (
          <ProtectedRoute fallbackNavigate={handleNavigate}>
            {user?.role === 'TENANT' ? (
              <TenantLayout activeTab="reservations" onSelectTab={(tab) => handleNavigate('/' + tab)}>
                <TenantBookings />
              </TenantLayout>
            ) : (
              <BookingList onNavigate={handleNavigate} />
            )}
          </ProtectedRoute>
        )}
        {path.startsWith('/bookings/') && (
          <ProtectedRoute fallbackNavigate={handleNavigate}>
            {user?.role === 'TENANT' ? (
              <TenantLayout activeTab="reservations" onSelectTab={(tab) => handleNavigate('/' + tab)}>
                <BookingDetail id={path.split('/').pop() || ''} onNavigate={handleNavigate} />
              </TenantLayout>
            ) : (
              <BookingDetail id={path.split('/').pop() || ''} onNavigate={handleNavigate} />
            )}
          </ProtectedRoute>
        )}
        {path === '/reports' && (
          <TenantRoute fallbackNavigate={handleNavigate}>
            <TenantLayout activeTab="dashboard" onSelectTab={(tab) => handleNavigate('/' + tab)}>
              <TenantReports />
            </TenantLayout>
          </TenantRoute>
        )}
      </main>

      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WishlistProvider>
          <AppContent />
        </WishlistProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
export {};
