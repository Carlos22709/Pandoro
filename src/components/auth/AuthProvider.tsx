import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authService, type AuthUser } from '@/services/auth/authService';

// 'loading' es distinto de 'signedOut': mientras Firebase comprueba la sesión no se redirige a nadie.
export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => authService.subscribe((next) => {
    setUser(next);
    setStatus(next ? 'signedIn' : 'signedOut');
  }), []);

  const signIn = useCallback(async (email: string, password: string) => {
    setUser(await authService.signIn(email, password));
  }, []);

  // onAuthStateChanged avisa al crear la cuenta, antes de que exista el nombre, y no
  // vuelve a avisar por updateProfile: por eso se actualiza también con el resultado.
  const register = useCallback(async (name: string, email: string, password: string) => {
    setUser(await authService.register(name, email, password));
  }, []);

  const updateName = useCallback(async (name: string) => {
    setUser(await authService.updateName(name));
  }, []);

  const value = useMemo(() => ({
    status,
    user,
    signIn,
    register,
    signOut: authService.signOut,
    sendPasswordReset: authService.sendPasswordReset,
    updateName,
  }), [status, user, signIn, register, updateName]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return value;
}
