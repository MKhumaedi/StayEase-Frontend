import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../../types';
import { useWishlist } from '../context/WishlistContext';

interface GuardProps {
  children: React.ReactNode;
  fallbackNavigate: (path: string) => void;
}

export function UserRoute({ children, fallbackNavigate }: GuardProps) {
  const { user, loading } = useAuth();
  const { triggerToast } = useWishlist();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      fallbackNavigate('/login');
    } else if (user.role === UserRole.TENANT) {
      triggerToast("Tenant accounts cannot create reservations.", "error");
      fallbackNavigate('/dashboard');
    } else if (user.role !== UserRole.USER) {
      fallbackNavigate('/');
    }
  }, [user, loading, fallbackNavigate, triggerToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== UserRole.USER) {
    return null;
  }

  return <>{children}</>;
}

export function TenantRoute({ children, fallbackNavigate }: GuardProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      fallbackNavigate('/login');
    } else if (user.role !== UserRole.TENANT) {
      fallbackNavigate('/');
    }
  }, [user, loading, fallbackNavigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== UserRole.TENANT) {
    return null;
  }

  return <>{children}</>;
}

export function ProtectedRoute({ children, fallbackNavigate }: GuardProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      fallbackNavigate('/login');
    }
  }, [user, loading, fallbackNavigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
