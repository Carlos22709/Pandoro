import { doc, onSnapshot, setDoc } from 'firebase/firestore';

import { getFirebaseDb } from '@/services/firebase/firebaseApp';

import { hasConsent } from './mapping';

// Versión del aviso de privacidad que acepta el usuario. Cambia cuando Andrea publique el texto
// definitivo (fila 34); así queda constancia de qué versión aceptó cada persona.
export const PRIVACY_NOTICE_VERSION = 'borrador-2026-11-02';

const userRef = (uid: string) => doc(getFirebaseDb(), 'users', uid);

// Ley 1581 y Decreto 1074: constancia de la autorización, con versión y fecha.
export function saveConsent(uid: string) {
  return setDoc(
    userRef(uid),
    { consents: { dataProcessing: { version: PRIVACY_NOTICE_VERSION, acceptedAt: Date.now() } } },
    { merge: true },
  );
}

export function watchConsent(uid: string, onConsent: (given: boolean) => void, onError: (error: Error) => void) {
  return onSnapshot(userRef(uid), (snapshot) => onConsent(hasConsent(snapshot.data())), onError);
}

export type PreferenceValue = boolean | number;

// Los booleanos se aceptan siempre. reminderHour es la única clave numérica (hora entera 0–23).
function isPreferenceValue(key: string, value: unknown): value is PreferenceValue {
  if (typeof value === 'boolean') return true;
  return key === 'reminderHour' && typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 23;
}

export function savePreferences(uid: string, preferences: Record<string, PreferenceValue>) {
  return setDoc(userRef(uid), { preferences }, { merge: true });
}

// Un documento dañado no rompe Ajustes: solo pasan booleanos y una hora válida.
export function watchPreferences(uid: string, onPreferences: (saved: Record<string, PreferenceValue>) => void) {
  return onSnapshot(
    userRef(uid),
    (snapshot) => {
      const raw = snapshot.data()?.preferences;
      const entries = raw && typeof raw === 'object' ? Object.entries(raw as Record<string, unknown>) : [];
      onPreferences(Object.fromEntries(entries.filter(([key, value]) => isPreferenceValue(key, value))) as Record<string, PreferenceValue>);
    },
    (error) => console.warn('No se pudieron leer las preferencias.', error.message),
  );
}
