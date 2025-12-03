import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMe, login as apiLogin } from '../api/auth';
import { getStoredToken, setStoredToken } from '../api/client';
import type { Role, User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(!!token);
  const [error, setError] = useState<string | null>(null);

  const logout = () => {
    setUser(null);
    setToken(null);
    setStoredToken(null);
  };

  const refresh = async () => {
    if (!getStoredToken()) return;
    setLoading(true);
    try {
      const profile = await fetchMe();
      setUser(profile);
      setError(null);
    } catch (err) {
      console.error(err);
      logout();
      setError('Session expired');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { token: t, user: profile } = await apiLogin(email, password);
      setStoredToken(t);
      setToken(t);
      setUser(profile);
      setError(null);
      return profile;
    } catch (err) {
      console.error(err);
      setError('Invalid credentials');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      login,
      logout,
      refresh,
      hasRole: (roles: Role[]) => !!user && roles.includes(user.role)
    }),
    [user, token, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext missing');
  return ctx;
};
