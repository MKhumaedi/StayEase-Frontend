import React, { useState, useEffect, useRef } from 'react';
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

  const { user } = useAuth();
  const { triggerToast } = useWishlist();

  // Save the previous page location before navigating to /checkout or other routes
  const previousLocationRef = useRef<{ path: string; params: any } | null>(null);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleCloseModal = () => {
    setShowLoginModal(false);
    setShowRegisterModal(false);

    // If user is unauthenticated and currently on /checkout, closing the auth modal must navigate back
    // to the saved return location or property detail page to prevent a navigation loop.
    if (!user && path === '/checkout') {
      if (previousLocationRef.current && previousLocationRef.current.path && previousLocationRef.current.path !== '/checkout') {
        const prev = previousLocationRef.current;
        setPath(prev.path);
        setParams(prev.params);
        if (window.location.pathname !== prev.path) {
          window.history.pushState(null, '', prev.path);
        }
      } else if (params?.property?.id) {
        const targetPath = `/property/${params.property.id}`;
        setPath(targetPath);
        if (window.location.pathname !== targetPath) {
          window.history.pushState(null, '', targetPath);
        }
      } else if (window.history.length > 1) {
        window.history.back();
      } else {
        setPath('/');
        if (window.location.pathname !== '/') {
          window.history.pushState(null, '', '/');
        }
      }
    }
  };

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

    if (path !== targetPath && path !== '/login' && path !== '/register') {
      previousLocationRef.current = { path, params };
    }

    setPath(targetPath);
    setParams(routeParams);
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

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
          setShowLoginModal={(show) => {
            if (!show) {
              setShowLoginModal(false);
              if (!showRegisterModal) {
                handleCloseModal();
              }
            } else {
              setShowLoginModal(true);
            }
          }}
          showRegisterModal={showRegisterModal}
          setShowRegisterModal={(show) => {
            if (!show) {
              setShowRegisterModal(false);
              if (!showLoginModal) {
                handleCloseModal();
              }
            } else {
              setShowRegisterModal(true);
            }
          }}
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
