import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateRoleInContext: (newRole: UserRole) => Promise<boolean>;
  updateUserInContext: (updatedData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Inisialisasi awal langsung dari localStorage untuk mencegah flash / unauthenticated state sesaat saat refresh
    try {
      const storedUser = localStorage.getItem('stayease_user');
      const storedToken = localStorage.getItem('stayease_token');
      if (storedUser && storedToken) {
        return JSON.parse(storedUser);
      }
    } catch {
      // Abaikan error parsing
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('stayease_token') || null;
  });
  
  const [loading, setLoading] = useState(false); // Set default ke false karena inisialisasi state sudah dibaca langsung di atas

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
        setUser(null);
        setToken(null);
      }
    }
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

  const formatAvatarUrl = (rawUrl?: string | null): string | undefined => {
    if (!rawUrl) return undefined;
    if (rawUrl.includes('dicebear.com') || rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) {
      return rawUrl;
    }
    const cleanUrl = rawUrl.split('?')[0];
    return `${cleanUrl}?v=${Date.now()}`;
  };

  const login = (userData: User, userToken: string) => {
    let formattedUser = { ...userData };
    if (userData.avatarUrl) {
      formattedUser.avatarUrl = formatAvatarUrl(userData.avatarUrl);
    }
    localStorage.setItem('stayease_token', userToken);
    localStorage.setItem('stayease_user', JSON.stringify(formattedUser));
    setUser(formattedUser);
    setToken(userToken);
  };

  const logout = () => {
    localStorage.removeItem('stayease_token');
    localStorage.removeItem('stayease_user');
    setUser(null);
    setToken(null);
  };

  const updateUserInContext = (updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      let newAvatarUrl = updatedData.avatarUrl !== undefined ? updatedData.avatarUrl : prev.avatarUrl;
      if (newAvatarUrl) {
        newAvatarUrl = formatAvatarUrl(newAvatarUrl);
      }
      const updated = {
        ...prev,
        ...updatedData,
        ...(newAvatarUrl !== undefined ? { avatarUrl: newAvatarUrl } : {})
      };
      localStorage.setItem('stayease_user', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshUser = async () => {
    const currentToken = token || localStorage.getItem('stayease_token');
    if (!currentToken) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          let newAvatarUrl = data.user.avatarUrl;
          if (newAvatarUrl) {
            newAvatarUrl = formatAvatarUrl(newAvatarUrl);
          }
          const updatedUser = { ...data.user, avatarUrl: newAvatarUrl };
          localStorage.setItem('stayease_user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      }
    } catch (err) {
      console.error('Error refreshing user profile:', err);
    }
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
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateRoleInContext, updateUserInContext, refreshUser }}>
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