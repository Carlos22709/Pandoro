import type { FirebaseApp } from 'firebase/app';
import {
  type Firestore,
  clearIndexedDbPersistence,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  terminate,
} from 'firebase/firestore';

// En web, Firestore guarda una copia en IndexedDB: la lista abre aunque no haya conexión.
export function createDb(app: FirebaseApp) {
  return initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
}

// Al cerrar sesión se borra esa copia: en un computador compartido no deben quedar en el disco las
// tareas de la persona anterior. Si otra pestaña de Pandask sigue abierta, el navegador no deja
// borrarla y se avisa en consola; la app no muestra esos datos a otra cuenta en ningún caso.
export async function clearLocalCache(db: Firestore) {
  await terminate(db);
  await clearIndexedDbPersistence(db);
}
