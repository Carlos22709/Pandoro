import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';

import type { CompletionEvent } from '@/services/progress/steps';
import { getFirebaseDb } from '@/services/firebase/firebaseApp';

import { completionFromDoc } from './mapping';

// users/{uid}/completions/{taskId}: un evento por tarea completada. Solo guarda el id de la tarea
// y el instante (ningún texto del usuario). Si la tarea se borra, el paso ganado se conserva.
const completionsOf = (uid: string) => collection(getFirebaseDb(), 'users', uid, 'completions');

export function watchCompletions(
  uid: string,
  onEvents: (events: CompletionEvent[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    completionsOf(uid),
    (snapshot) => onEvents(snapshot.docs.flatMap((item) => completionFromDoc(item.id, item.data()) ?? [])),
    onError,
  );
}

export function saveCompletion(uid: string, event: CompletionEvent) {
  return setDoc(doc(completionsOf(uid), event.taskId), { completedAt: event.completedAt });
}

export function removeCompletion(uid: string, taskId: string) {
  return deleteDoc(doc(completionsOf(uid), taskId));
}

// Ajustes → Reiniciar demo: los pasos vuelven a cero junto con las tareas.
export async function deleteAllCompletions(uid: string) {
  const snapshot = await getDocs(completionsOf(uid));
  const batch = writeBatch(getFirebaseDb());
  snapshot.docs.forEach((item) => batch.delete(item.ref));
  return batch.commit();
}
