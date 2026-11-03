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

export function savePreferences(uid: string, preferences: Record<string, boolean>) {
  return setDoc(userRef(uid), { preferences }, { merge: true });
}

// Solo llegan los valores verdadero/falso: un documento dañado no rompe Ajustes.
export function watchPreferences(uid: string, onPreferences: (saved: Record<string, boolean>) => void) {
  return onSnapshot(
    userRef(uid),
    (snapshot) => {
      const raw = snapshot.data()?.preferences;
      const entries = raw && typeof raw === 'object' ? Object.entries(raw as Record<string, unknown>) : [];
      onPreferences(Object.fromEntries(entries.filter(([, value]) => typeof value === 'boolean')) as Record<string, boolean>);
    },
    (error) => console.warn('No se pudieron leer las preferencias.', error.message),
  );
}
