import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

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
  // Firebase avisa apenas crea la cuenta, antes de guardar la constancia de consentimiento y el
  // nombre. Mientras el registro no termina, no se entra a la app: cerrarla a mitad no deja huecos.
  const registeringRef = useRef(false);
  const latestUserRef = useRef<AuthUser | null>(null);

  useEffect(() => authService.subscribe((next) => {
    latestUserRef.current = next;
    setUser(next);
    if (registeringRef.current && next) return;
    setStatus(next ? 'signedIn' : 'signedOut');
  }), []);

  const signIn = useCallback(async (email: string, password: string) => {
    setUser(await authService.signIn(email, password));
  }, []);

  // onAuthStateChanged avisa al crear la cuenta, antes de que exista el nombre, y no
  // vuelve a avisar por updateProfile: por eso se actualiza también con el resultado.
  const register = useCallback(async (name: string, email: string, password: string) => {
    registeringRef.current = true;
    try {
      const created = await authService.register(name, email, password);
      setUser(created);
      setStatus('signedIn');
    } catch (error) {
      // Si la cuenta quedó a medias, la pantalla de consentimiento de _layout la completa.
      setStatus(latestUserRef.current ? 'signedIn' : 'signedOut');
      throw error;
    } finally {
      registeringRef.current = false;
    }
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
