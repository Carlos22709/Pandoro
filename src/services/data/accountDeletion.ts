import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
  type DocumentReference,
} from 'firebase/firestore';
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';

import { authErrorMessage, NOT_CONFIGURED_MESSAGE } from '@/services/auth/authRules';
import {
  clearLocalData,
  flushPendingWrites,
  getFirebaseAuth,
  getFirebaseDb,
  isFirebaseConfigured,
} from '@/services/firebase/firebaseApp';
import { reminderService } from '@/services/reminders/expoNotifications';

// Colecciones que cuelgan de users/{uid}. plans y usage están en el modelo pero
// aún no se escriben; se incluyen para no dejar residuos si aparecen después.
export const USER_SUBCOLLECTIONS = ['tasks', 'completions', 'progress', 'plans', 'usage'] as const;

// Por debajo del límite de 500 operaciones de un lote de Firestore.
export const DELETE_BATCH_SIZE = 450;

export class RecentLoginRequiredError extends Error {
  constructor(message = 'Para borrar tu cuenta, escribe tu contraseña otra vez.') {
    super(message);
    this.name = 'RecentLoginRequiredError';
  }
}

export type AccountDeletionDeps = {
  listCollection(uid: string, collectionName: string): Promise<string[]>;
  deleteDocs(uid: string, collectionName: string, ids: string[]): Promise<void>;
  deleteUserDoc(uid: string): Promise<void>;
  cancelReminders(): Promise<void>;
  currentUser(): { uid: string; email: string | null } | null;
  reauthenticate(password: string): Promise<void>;
  deleteAuthUser(): Promise<void>;
  clearLocalData(): Promise<void>;
  flushPendingWrites(): Promise<void>;
};

function isRecentLoginRequired(failure: unknown) {
  return (failure as { code?: string } | null)?.code === 'auth/requires-recent-login';
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

// Borra primero las subcolecciones conocidas y al final el documento users/{uid}.
// Borrar solo el documento padre dejaría huérfanos en Firestore.
export async function deleteUserDocuments(uid: string, deps: Pick<AccountDeletionDeps, 'listCollection' | 'deleteDocs' | 'deleteUserDoc'>) {
  for (const name of USER_SUBCOLLECTIONS) {
    const ids = await deps.listCollection(uid, name);
    for (const group of chunk(ids, DELETE_BATCH_SIZE)) {
      if (group.length) await deps.deleteDocs(uid, name, group);
    }
  }
  await deps.deleteUserDoc(uid);
}

export function createAccountDeletionService(deps: AccountDeletionDeps) {
  async function deleteAccount(password?: string) {
    const user = deps.currentUser();
    if (!user) throw new Error('No hay una sesión activa.');

    // Si hay contraseña, se reautentica antes de tocar nada: así no queda la
    // cuenta a medias si Firebase exige un inicio de sesión reciente.
    if (password) await deps.reauthenticate(password);

    // Vacía la cola local para que un escrito pendiente no recree documentos
    // después de borrarlos.
    await deps.flushPendingWrites();
    await deleteUserDocuments(user.uid, deps);
    await deps.cancelReminders();

    try {
      await deps.deleteAuthUser();
    } catch (failure) {
      if (isRecentLoginRequired(failure)) throw new RecentLoginRequiredError();
      const message = failure instanceof Error && failure.message === NOT_CONFIGURED_MESSAGE
        ? NOT_CONFIGURED_MESSAGE
        : authErrorMessage(failure);
      throw new Error(message);
    }

    await deps.clearLocalData();
  }

  return { deleteUserDocuments: (uid: string) => deleteUserDocuments(uid, deps), deleteAccount };
}

async function deleteRefs(refs: DocumentReference[]) {
  if (!refs.length) return;
  const db = getFirebaseDb();
  for (const group of chunk(refs, DELETE_BATCH_SIZE)) {
    const batch = writeBatch(db);
    group.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

function firebaseDeps(): AccountDeletionDeps {
  return {
    async listCollection(uid, collectionName) {
      const snapshot = await getDocs(collection(getFirebaseDb(), 'users', uid, collectionName));
      return snapshot.docs.map((item) => item.id);
    },
    async deleteDocs(uid, collectionName, ids) {
      const db = getFirebaseDb();
      await deleteRefs(ids.map((id) => doc(db, 'users', uid, collectionName, id)));
    },
    async deleteUserDoc(uid) {
      await deleteDoc(doc(getFirebaseDb(), 'users', uid));
    },
    cancelReminders: () => reminderService.cancelAll(),
    currentUser() {
      if (!isFirebaseConfigured) throw new Error(NOT_CONFIGURED_MESSAGE);
      const user = getFirebaseAuth().currentUser;
      return user ? { uid: user.uid, email: user.email } : null;
    },
    async reauthenticate(password) {
      if (!isFirebaseConfigured) throw new Error(NOT_CONFIGURED_MESSAGE);
      const user = getFirebaseAuth().currentUser;
      if (!user?.email) throw new Error('No pudimos confirmar tu identidad. Cierra sesión e inténtalo de nuevo.');
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
    },
    async deleteAuthUser() {
      if (!isFirebaseConfigured) throw new Error(NOT_CONFIGURED_MESSAGE);
      const user = getFirebaseAuth().currentUser;
      if (!user) throw new Error('No hay una sesión activa.');
      await deleteUser(user);
    },
    clearLocalData,
    flushPendingWrites,
  };
}

let defaultService: ReturnType<typeof createAccountDeletionService> | null = null;

function accountDeletion() {
  if (!defaultService) defaultService = createAccountDeletionService(firebaseDeps());
  return defaultService;
}

export function deleteAccount(password?: string) {
  return accountDeletion().deleteAccount(password);
}

export function deleteCurrentUserDocuments(uid: string) {
  return accountDeletion().deleteUserDocuments(uid);
}
