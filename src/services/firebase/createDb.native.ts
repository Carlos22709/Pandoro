import type { FirebaseApp } from 'firebase/app';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';

// En iOS y Android el SDK de JavaScript no tiene IndexedDB: la caché vive en memoria mientras la app
// está abierta. Los datos persisten en Firestore; sin conexión, la lista no carga al abrir.
export function createDb(app: FirebaseApp) {
  return initializeFirestore(app, { localCache: memoryLocalCache() });
}
