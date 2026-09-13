'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '@/lib/auth';
import type { AuthResult, Credentials, RegisterInput, User } from '@/lib/auth';

interface AuthContextValue {
  user: User | null;
  isReady: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: Credentials) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    authService.getCurrentUser().then((current) => {
      setUser(current);
      setIsReady(true);
    });
  }, []);

  const login = useCallback(async (credentials: Credentials) => {
    const result = await authService.login(credentials);
    if (result.ok) setUser(result.user);
    return result;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const result = await authService.register(input);
    if (result.ok) setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback((patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, isReady, login, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth нужно вызывать внутри <AuthProvider>');
  return context;
}
