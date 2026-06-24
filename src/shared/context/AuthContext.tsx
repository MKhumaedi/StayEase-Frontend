import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateRoleInContext: (newRole: UserRole) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = () => {
    const storedUser = localStorage.getItem('stayease_user');
    const storedToken = localStorage.getItem('stayease_token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch {
        localStorage.removeItem('stayease_user');
        localStorage.removeItem('stayease_token');
      }
    } else {
      setUser(null);
      setToken(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
    // Support sync across tabs or events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'stayease_user' || e.key === 'stayease_token') {
        loadUser();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync Global Theme
  useEffect(() => {
    if (!user) {
      document.documentElement.classList.remove('dark');
      return;
    }
    const theme = user.settings?.theme || 'System';
    if (theme === 'Dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'Light') {
      document.documentElement.classList.remove('dark');
    } else if (theme === 'System') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [user]);

  const login = (userData: User, userToken: string) => {
    localStorage.setItem('stayease_token', userToken);
    localStorage.setItem('stayease_user', JSON.stringify(userData));
    setUser(userData);
    setToken(userToken);
  };

  const logout = () => {
    localStorage.removeItem('stayease_token');
    localStorage.removeItem('stayease_user');
    setUser(null);
    setToken(null);
  };

  const updateRoleInContext = async (newRole: UserRole): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, role: newRole })
      });
      if (res.ok) {
        const updated = { ...user, role: newRole };
        localStorage.setItem('stayease_user', JSON.stringify(updated));
        setUser(updated);
        return true;
      }
    } catch (err) {
      console.error('Error updating role in database:', err);
    }
    // Fallback offline update
    const updated = { ...user, role: newRole };
    localStorage.setItem('stayease_user', JSON.stringify(updated));
    setUser(updated);
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateRoleInContext }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
