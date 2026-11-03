import { getApp, getApps, initializeApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';

import { createAuth } from '@/services/firebase/createAuth';

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
