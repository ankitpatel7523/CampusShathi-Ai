import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Profile } from '../types.js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string, role?: 'student' | 'teacher') => Promise<{ success: boolean; error?: string; user?: User }>;
  signup: (data: any) => Promise<{ success: boolean; error?: string; user?: User }>;
  loginAsDemo: (role?: 'student' | 'teacher') => Promise<void>;
  logout: () => Promise<void>;
  updateProfileLocally: (userPartial?: Partial<User>, profilePartial?: Partial<Profile>) => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('campussathi_token'));
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async (authToken?: string) => {
    try {
      const activeToken = authToken || token;
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }
      const res = await fetch('/api/me', { headers });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
        if (data.user?.role) {
          localStorage.setItem('campussathi_role', data.user.role);
        }
      } else {
        // Fallback to demo login if first time
        const currentSavedRole = (localStorage.getItem('campussathi_role') as 'student' | 'teacher') || 'student';
        await loginAsDemo(currentSavedRole);
      }
    } catch (err) {
      console.warn('Failed to load user, trying demo login:', err);
      const currentSavedRole = (localStorage.getItem('campussathi_role') as 'student' | 'teacher') || 'student';
      await loginAsDemo(currentSavedRole);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, pass: string, role?: 'student' | 'teacher') => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, role })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        localStorage.setItem('campussathi_token', data.token);
        setUser(data.user);
        if (data.user?.role) {
          localStorage.setItem('campussathi_role', data.user.role);
        }
        await fetchCurrentUser(data.token);
        return { success: true, user: data.user };
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
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        localStorage.setItem('campussathi_token', data.token);
        setUser(data.user);
        if (data.user?.role) {
          localStorage.setItem('campussathi_role', data.user.role);
        }
        await fetchCurrentUser(data.token);
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Signup failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const loginAsDemo = async (targetRole: 'student' | 'teacher' = 'student') => {
    try {
      const res = await fetch('/api/auth/demo', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole })
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('campussathi_token', data.token);
        setUser(data.user);
        const resolvedRole = data.user?.role || targetRole;
        localStorage.setItem('campussathi_role', resolvedRole);
        if (resolvedRole === 'teacher') {
          localStorage.setItem('campussathi_faculty_name', data.user?.name || 'Dr. Rajesh Sharma');
          localStorage.setItem('campussathi_faculty_dept', 'Computer Science & Engineering');
        }
        const meRes = await fetch('/api/me', { headers: { Authorization: `Bearer ${data.token}` } });
        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData.user);
          setProfile(meData.profile);
        }
      }
    } catch (err) {
      console.error('Demo login error:', err);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch {}
    localStorage.removeItem('campussathi_token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const updateProfileLocally = (userPartial?: Partial<User>, profilePartial?: Partial<Profile>) => {
    if (userPartial && user) {
      setUser({ ...user, ...userPartial });
    }
    if (profilePartial && profile) {
      setProfile({ ...profile, ...profilePartial });
    }
  };

  const refreshUserData = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
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
      refreshUserData
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
