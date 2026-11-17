import { getApp, getApps, initializeApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { type Firestore, waitForPendingWrites } from 'firebase/firestore';

import { createAuth } from '@/services/firebase/createAuth';
import { clearLocalCache, createDb } from '@/services/firebase/createDb';

// Expo solo incorpora estas variables si se escriben literalmente.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Authentication no usa Storage ni Messaging: esas dos variables pueden quedar vacías.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId,
);

let auth: Auth | null = null;
let db: Firestore | null = null;

// Una sola app de Firebase para Authentication y AI Logic.
export function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

// Se inicializa al primer uso: sin .env completo, initializeAuth lanzaría al cargar la app.
export function getFirebaseAuth() {
  if (!auth) {
    auth = createAuth(getFirebaseApp());
  }
  return auth;
}

// Igual que Auth: initializeFirestore solo puede llamarse una vez por app.
export function getFirebaseDb() {
  if (!db) {
    db = createDb(getFirebaseApp());
  }
  return db;
}

// Antes de cerrar sesión: da unos segundos para que lleguen al servidor los cambios recientes,
// que después ya no se podrían enviar. Sin conexión no espera para siempre.
export async function flushPendingWrites(timeoutMs = 3000) {
  if (!db) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    waitForPendingWrites(db).catch(() => undefined),
    new Promise((resolve) => { timer = setTimeout(resolve, timeoutMs); }),
  ]);
  clearTimeout(timer);
}

// Después de cerrar sesión: borra la copia local (solo existe en la web). El siguiente uso de
// getFirebaseDb crea una instancia nueva y limpia.
export async function clearLocalData() {
  if (!db) return;
  const current = db;
  db = null;
  try {
    await clearLocalCache(current);
  } catch (error) {
    console.warn('No se pudo borrar la copia local de Firestore.', (error as Error).message);
  }
}
