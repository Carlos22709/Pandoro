import type { FirebaseApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// En web, Firestore guarda una copia en IndexedDB: la lista abre aunque no haya conexión.
export function createDb(app: FirebaseApp) {
  return initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
}
