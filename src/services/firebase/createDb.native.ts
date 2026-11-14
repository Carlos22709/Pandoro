import type { FirebaseApp } from 'firebase/app';
import { type Firestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';

// En iOS y Android el SDK de JavaScript no tiene IndexedDB: la caché vive en memoria mientras la app
// está abierta. Los datos persisten en Firestore; sin conexión, la lista no carga al abrir.
export function createDb(app: FirebaseApp) {
  return initializeFirestore(app, { localCache: memoryLocalCache() });
}

// La caché en memoria no queda en el disco: no hay nada que borrar al cerrar sesión.
export async function clearLocalCache(_db: Firestore) {
  return undefined;
}
