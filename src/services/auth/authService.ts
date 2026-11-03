import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';

import { authErrorMessage, NOT_CONFIGURED_MESSAGE } from '@/services/auth/authRules';
import { saveConsent } from '@/services/data/userRepository';
import { getFirebaseAuth, isFirebaseConfigured } from '@/services/firebase/firebaseApp';

export type AuthUser = {
  uid: string;
  email: string;
  displayName: string | null;
};

function toAuthUser(user: User): AuthUser {
  return { uid: user.uid, email: user.email ?? '', displayName: user.displayName };
}

function configuredAuth() {
  if (!isFirebaseConfigured) throw new Error(NOT_CONFIGURED_MESSAGE);
  return getFirebaseAuth();
}

// Las pantallas solo ven mensajes en español, nunca el error técnico de Firebase.
async function friendly<T>(action: () => Promise<T>) {
  try {
    return await action();
  } catch (failure) {
    const message = failure instanceof Error && failure.message === NOT_CONFIGURED_MESSAGE
      ? NOT_CONFIGURED_MESSAGE
      : authErrorMessage(failure);
    throw new Error(message);
  }
}

export const authService = {
  subscribe(listener: (user: AuthUser | null) => void) {
    if (!isFirebaseConfigured) {
      listener(null);
      return () => undefined;
    }
    return onAuthStateChanged(getFirebaseAuth(), (user) => listener(user ? toAuthUser(user) : null));
  },

  signIn(email: string, password: string) {
    return friendly(async () => {
      const { user } = await signInWithEmailAndPassword(configuredAuth(), email.trim(), password);
      return toAuthUser(user);
    });
  },

  register(name: string, email: string, password: string) {
    return friendly(async () => {
      const { user } = await createUserWithEmailAndPassword(configuredAuth(), email.trim(), password);
      // Ley 1581: sin constancia de la autorización no debe quedar una cuenta. Si no se guarda,
      // se borra la cuenta recién creada y el usuario puede volver a intentarlo.
      try {
        await saveConsent(user.uid);
      } catch (error) {
        await deleteUser(user).catch(() => undefined);
        throw error;
      }
      // La cuenta ya existe: si el nombre falla no se reporta como registro fallido,
      // porque reintentar daría "correo en uso". Se puede corregir desde Perfil.
      await updateProfile(user, { displayName: name.trim() }).catch(() => undefined);
      return toAuthUser(user);
    });
  },

  signOut() {
    return friendly(() => signOut(configuredAuth()));
  },

  sendPasswordReset(email: string) {
    return friendly(() => sendPasswordResetEmail(configuredAuth(), email.trim()));
  },

  updateName(name: string) {
    return friendly(async () => {
      const auth = configuredAuth();
      if (!auth.currentUser) throw new Error(NOT_CONFIGURED_MESSAGE);
      await updateProfile(auth.currentUser, { displayName: name.trim() });
      return toAuthUser(auth.currentUser);
    });
  },
};
