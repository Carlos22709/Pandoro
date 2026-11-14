import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

import type { TaskItem } from '@/components/tasks/taskTypes';
import { getFirebaseDb } from '@/services/firebase/firebaseApp';

import { taskFromDoc, taskToDoc } from './mapping';

// users/{uid}/tasks/{taskId}: las reglas de firestore.rules solo dejan entrar al dueño.
const tasksOf = (uid: string) => collection(getFirebaseDb(), 'users', uid, 'tasks');
const taskRef = (uid: string, id: string) => doc(tasksOf(uid), id);

// Avisa con cada cambio, también con los propios antes de que el servidor confirme.
export function watchTasks(uid: string, onTasks: (tasks: TaskItem[]) => void, onError: (error: Error) => void) {
  return onSnapshot(
    query(tasksOf(uid), orderBy('createdAt')),
    (snapshot) => onTasks(snapshot.docs.flatMap((item) => taskFromDoc(item.id, item.data()) ?? [])),
    onError,
  );
}

// createdAt solo se escribe al crear: ordena la vista «Todas» por orden de registro.
export function createTask(uid: string, task: TaskItem) {
  return setDoc(taskRef(uid, task.id), { ...taskToDoc(task), createdAt: Date.now() });
}

// Con merge, un campo ausente no se borra: desmarcar quita completedAt y «Sin fecha» quita dueDate.
export function saveTask(uid: string, task: TaskItem) {
  const cleared = {
    ...(task.completedAt === undefined ? { completedAt: deleteField() } : {}),
    ...(task.dueDate === undefined ? { dueDate: deleteField() } : {}),
  };
  return setDoc(taskRef(uid, task.id), { ...taskToDoc(task), ...cleared }, { merge: true });
}

export function deleteTask(uid: string, id: string) {
  return deleteDoc(taskRef(uid, id));
}

// Un plan confirmado se guarda entero o no se guarda. Sus ids son estables: repetir no duplica.
export function createTasks(uid: string, tasks: readonly TaskItem[]) {
  const batch = writeBatch(getFirebaseDb());
  const now = Date.now();
  tasks.forEach((task, index) => {
    batch.set(taskRef(uid, task.id), { ...taskToDoc(task), createdAt: now + index });
  });
  return batch.commit();
}

export async function deleteAllTasks(uid: string) {
  const snapshot = await getDocs(tasksOf(uid));
  const batch = writeBatch(getFirebaseDb());
  snapshot.docs.forEach((item) => batch.delete(item.ref));
  return batch.commit();
}
