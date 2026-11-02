import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';

// En iOS y Android no hay IndexedDB: sin AsyncStorage la sesión se perdería al cerrar la app.
export function createAuth(app: FirebaseApp) {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // Fast Refresh vuelve a ejecutar este módulo con Auth ya inicializado.
    return getAuth(app);
  }
}
