import React, { useState, useEffect } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import Navbar from '../shared/components/navigation/Navbar';
import Footer from '../shared/components/Footer';
import { AuthProvider, useAuth } from '../shared/context/AuthContext';
import { WishlistProvider, useWishlist } from '../shared/context/WishlistContext';
import { AppRoutes } from './AppRoutes';

function AppContent() {
  const [path, setPath] = useState<string>(() => {
    const p = window.location.pathname;
    const h = window.location.hash;
    if (h) {
      const hashParams = new URLSearchParams(h.replace('#', '?'));
      if (hashParams.get('type') === 'recovery') return '/reset-password';
      if (hashParams.get('type') === 'signup') return '/verify-email';
    }
    return p && p !== '/' ? p : '/';
  });
  const [params, setParams] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleModalNavigation = (targetPath: string, routeParams: any) => {
    if (targetPath === '/login') {
      setShowLoginModal(true);
      setShowRegisterModal(false);
    } else {
      setShowRegisterModal(true);
      setShowLoginModal(false);
      setParams(routeParams);
    }
  };

  const handleNavigate = (targetPath: string, routeParams: any = null) => {
    const isModal = targetPath === '/login' || targetPath === '/register' || targetPath === '/signup';
    if (isModal) {
      handleModalNavigation(targetPath, routeParams);
      return;
    }
    setPath(targetPath);
    setParams(routeParams);
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const { user } = useAuth();
  const { triggerToast } = useWishlist();

  const runRouteGuards = () => {
    const isTraveler = path === '/checkout' || path === '/my-bookings' || path === '/traveler-dashboard' || path === '/wishlist' || path === '/favorites';
    if (user?.role === 'TENANT' && isTraveler) {
      triggerToast("Tenant accounts cannot create reservations.", "error");
      return handleNavigate('/dashboard');
    }
    const isProt = path === '/my-bookings' || path === '/traveler-dashboard' || path === '/wishlist' || path === '/profile' || path === '/settings' || path === '/security' || path === '/dashboard' || path === '/rooms' || path === '/availability' || path === '/bookings' || path === '/reviews' || path === '/reports' || path === '/tenant-dashboard' || path.startsWith('/admin');
    if (!user && isProt) return handleNavigate('/');
    if (path.startsWith('/admin') && user?.role !== 'ADMIN') return handleNavigate('/');
    if (user?.role === 'ADMIN' && path === '/login') return handleNavigate('/admin');
  };

  useEffect(() => {
    runRouteGuards();
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
        <AppRoutes path={path} params={params} user={user} onNavigate={handleNavigate} />
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
