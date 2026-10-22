import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Profile } from '../types.js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: any) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfileLocally: (userPartial?: Partial<User>, profilePartial?: Partial<Profile>) => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async (authToken?: string) => {
    try {
      const activeToken = authToken || token;
      const headers: Record<string, string> = {};
      if (activeToken) headers.Authorization = `Bearer ${activeToken}`;

      const res = await fetch('/api/me', { headers });
      if (!res.ok) {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('campussathi_token');
        setToken(null);
        return;
      }

      const data = await res.json();
      setUser(data.user);
      setProfile(data.profile);
    } catch {
      setUser(null);
      setProfile(null);
      localStorage.removeItem('campussathi_token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('campussathi_token');
    if (savedToken) {
      setToken(savedToken);
    }
    fetchCurrentUser(savedToken || undefined);
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        localStorage.setItem('campussathi_token', data.token);
        setUser(data.user);
        await fetchCurrentUser(data.token);
        return { success: true };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const signup = async (formData: any) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        localStorage.setItem('campussathi_token', data.token);
        setUser(data.user);
        await fetchCurrentUser(data.token);
        return { success: true };
      }
      return { success: false, error: data.error || 'Signup failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const loginAsDemo = async () => {
    // Demo mode intentionally disabled in real app mode.
    return;
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // ignore network error during logout
    }
    localStorage.removeItem('campussathi_token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const updateProfileLocally = (userPartial?: Partial<User>, profilePartial?: Partial<Profile>) => {
    if (userPartial && user) setUser({ ...user, ...userPartial });
    if (profilePartial && profile) setProfile({ ...profile, ...profilePartial });
  };

  const refreshUserData = async () => {
    if (token) await fetchCurrentUser(token);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      token,
      loading,
      login,
      signup,
      loginAsDemo,
      logout,
      updateProfileLocally,
      refreshUserData,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
