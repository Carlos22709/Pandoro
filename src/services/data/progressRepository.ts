import { doc, onSnapshot, setDoc } from 'firebase/firestore';

import type { ProgressWorldSnapshot } from '@/components/progress/worldData';
import { getFirebaseDb } from '@/services/firebase/firebaseApp';

import { progressFromDoc } from './mapping';

// users/{uid}/progress/world: un solo documento con el avance del mundo de Pandoro.
const worldRef = (uid: string) => doc(getFirebaseDb(), 'users', uid, 'progress', 'world');

// Si el documento aún no existe, llega el progreso de un usuario nuevo: todo en cero.
export function watchProgress(
  uid: string,
  onProgress: (progress: ProgressWorldSnapshot) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(worldRef(uid), (snapshot) => onProgress(progressFromDoc(snapshot.data())), onError);
}

export function saveProgress(uid: string, progress: ProgressWorldSnapshot) {
  return setDoc(worldRef(uid), progress);
}
