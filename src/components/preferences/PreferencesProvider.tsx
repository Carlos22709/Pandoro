import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ReduceMotion, ReducedMotionConfig } from 'react-native-reanimated';

import { useAuth } from '@/components/auth/AuthProvider';
import { savePreferences, watchPreferences } from '@/services/data/userRepository';
import { DEFAULT_PREFERENCES, preferencesFrom, type AppPreferences } from '@/services/preferences/preferences';

type PreferencesValue = {
  preferences: AppPreferences;
  setPreference: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => void;
  resetPreferences: () => void;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

// Ajustes, Inicio y los recordatorios leen de aquí. Cada cambio se ve al instante y se guarda en la
// cuenta, así que sobrevive a cerrar la app y a cambiar de dispositivo.
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const uid = useAuth().user?.uid ?? null;
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [ownerUid, setOwnerUid] = useState(uid);

  // Igual que TasksProvider: al cambiar de cuenta no quedan las preferencias de la anterior.
  if (ownerUid !== uid) {
    setOwnerUid(uid);
    setPreferences(DEFAULT_PREFERENCES);
  }

  useEffect(() => {
    if (!uid) return;
    return watchPreferences(uid, (saved) => setPreferences(preferencesFrom(saved)));
  }, [uid]);

  const persist = useCallback((next: AppPreferences) => {
    setPreferences(next);
    if (uid) {
      savePreferences(uid, next).catch((failure: Error) => (
        console.warn('No se pudieron guardar las preferencias.', failure.message)
      ));
    }
  }, [uid]);

  const setPreference = useCallback<PreferencesValue['setPreference']>((key, value) => {
    persist({ ...preferences, [key]: value });
  }, [persist, preferences]);

  const resetPreferences = useCallback(() => persist(DEFAULT_PREFERENCES), [persist]);

  const value = useMemo(
    () => ({ preferences, setPreference, resetPreferences }),
    [preferences, setPreference, resetPreferences],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {/* Reanimated aplica esto a todas las animaciones que no fijan su propio modo. */}
      <ReducedMotionConfig mode={preferences.reducedMotion ? ReduceMotion.Always : ReduceMotion.System} />
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences debe usarse dentro de PreferencesProvider.');
  return value;
}
