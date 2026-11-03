import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// En web, getAuth ya persiste la sesión en IndexedDB y sobrevive a recargar y cerrar el navegador.
export function createAuth(app: FirebaseApp) {
  return getAuth(app);
}
