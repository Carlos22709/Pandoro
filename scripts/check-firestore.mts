// Prueba de integración contra el Firestore real del proyecto (decisión 4 del marco normativo).
// Crea dos cuentas temporales, ejercita los repositorios, comprueba que una cuenta no lee los
// datos de la otra y al final borra los datos y las dos cuentas.
// Uso: npm run check:firestore (necesita .env y las reglas de firestore.rules publicadas).
// Toca el proyecto real: córrelo antes del piloto y cada vez que cambien las reglas.
import { createRequire } from 'node:module';

import type { TaskItem } from '@/components/tasks/taskTypes';
import { saveProgress, watchProgress } from '@/services/data/progressRepository';
import { createTask, createTasks, deleteAllTasks, deleteTask, saveTask, watchTasks } from '@/services/data/tasksRepository';
import { authService } from '@/services/auth/authService';
import { savePreferences, watchPreferences } from '@/services/data/userRepository';
import { getFirebaseAuth, getFirebaseDb } from '@/services/firebase/firebaseApp';

// tsx carga los módulos de la app como CommonJS: Firebase se pide igual para usar la misma copia.
const require = createRequire(import.meta.url);
const { createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword, signOut } =
  require('firebase/auth') as typeof import('firebase/auth');
const { collection, deleteDoc, doc, getDoc, getDocs } = require('firebase/firestore') as typeof import('firebase/firestore');

const results: string[] = [];
const check = (ok: boolean, label: string) => {
  results.push(`${ok ? '✔' : '✖'} ${label}`);
  if (!ok) process.exitCode = 1;
};

const stamp = Date.now();
const password = `Prueba-${Math.random().toString(36).slice(2)}-${stamp}`;
const emailA = `prueba-carlos-a-${stamp}@pandask.test`;
const emailB = `prueba-carlos-b-${stamp}@pandask.test`;
const auth = getFirebaseAuth();
const db = getFirebaseDb();

const task = (id: string, extra: Partial<TaskItem> = {}): TaskItem => ({
  id, title: `Tarea ${id}`, detail: '', priority: 1, tone: 'blue', icon: 'checklist', difficulty: 'medium', completed: false, ...extra,
});

function nextTasks(uid: string, accept: (tasks: TaskItem[]) => boolean) {
  return new Promise<TaskItem[]>((resolve, reject) => {
    const stop = watchTasks(uid, (tasks) => {
      if (accept(tasks)) { stop(); resolve(tasks); }
    }, reject);
  });
}

async function denied(action: () => Promise<unknown>) {
  try { await action(); return false; } catch (error) { return (error as { code?: string }).code === 'permission-denied'; }
}

// La cuenta A se crea con el registro real de la app, que guarda la constancia de consentimiento.
const uidA = (await authService.register('Prueba Carlos', emailA, password)).uid;
try {
  const consent = (await getDoc(doc(db, 'users', uidA))).data()?.consents?.dataProcessing;
  check(typeof consent?.version === 'string' && typeof consent?.acceptedAt === 'number', 'el registro guarda la constancia de consentimiento (versión y fecha)');

  await createTask(uidA, task('t1'));
  await createTask(uidA, task('t2', { notes: undefined }));
  let tasks = await nextTasks(uidA, (list) => list.length === 2);
  check(tasks.map((t) => t.id).join() === 't1,t2', 'crear tareas y leerlas en orden de registro');

  await saveTask(uidA, { ...task('t1'), completed: true });
  tasks = await nextTasks(uidA, (list) => list.find((t) => t.id === 't1')?.completed === true);
  check(true, 'editar una tarea (completarla)');

  const plan = [task('plan-s1'), task('plan-s2')];
  await createTasks(uidA, plan);
  await createTasks(uidA, plan);
  tasks = await nextTasks(uidA, (list) => list.length >= 4);
  check(tasks.length === 4, 'guardar un plan dos veces no duplica tareas');

  await deleteTask(uidA, 't2');
  tasks = await nextTasks(uidA, (list) => !list.some((t) => t.id === 't2'));
  check(tasks.length === 3, 'borrar una tarea');

  const fresh = await new Promise((resolve, reject) => {
    const stop = watchProgress(uidA, (progress) => { stop(); resolve(progress); }, reject);
  });
  check(JSON.stringify(fresh) === JSON.stringify({ currentStage: 1, completedTasks: 0, streak: 0 }), 'un usuario nuevo empieza su mundo en cero');
  await saveProgress(uidA, { currentStage: 1, completedTasks: 1, streak: 0 });
  const saved = (await getDoc(doc(db, 'users', uidA, 'progress', 'world'))).data();
  check(saved?.completedTasks === 1, 'guardar el progreso');

  await savePreferences(uidA, { darkMode: true, sounds: false });
  const preferences = await new Promise<Record<string, boolean>>((resolve) => {
    const stop = watchPreferences(uidA, (saved) => { stop(); resolve(saved); });
  });
  check(preferences.darkMode === true && preferences.sounds === false, 'guardar y leer las preferencias de Ajustes');
  const stillConsented = (await getDoc(doc(db, 'users', uidA))).data()?.consents?.dataProcessing;
  check(Boolean(stillConsented), 'guardar preferencias no borra la constancia de consentimiento');

  await signOut(auth);
  check(await denied(() => getDocs(collection(db, 'users', uidA, 'tasks'))), 'sin sesión no se pueden leer tareas');

  const userB = (await createUserWithEmailAndPassword(auth, emailB, password)).user;
  check(await denied(() => getDocs(collection(db, 'users', uidA, 'tasks'))), 'otra cuenta no puede leer las tareas ajenas');
  check(await denied(() => getDoc(doc(db, 'users', uidA))), 'otra cuenta no puede leer el perfil ni el consentimiento ajeno');
  check(await denied(() => deleteDoc(doc(db, 'users', uidA, 'tasks', 't1'))), 'otra cuenta no puede borrar tareas ajenas');
  await deleteUser(userB);
  results.push('· cuenta B borrada');

  // Volver a entrar comprueba recuperación después de cerrar sesión y después de los fallos de
  // permisos anteriores. Ninguno de esos fallos puede borrar o reemplazar el estado de la cuenta A.
  await signInWithEmailAndPassword(auth, emailA, password);
  tasks = await nextTasks(uidA, (list) => list.length === 3);
  check(
    tasks.map((item) => item.id).join() === 't1,plan-s1,plan-s2',
    'las tareas reaparecen intactas al volver a iniciar sesión',
  );
  const recoveredProgress = await new Promise((resolve, reject) => {
    const stop = watchProgress(uidA, (progress) => { stop(); resolve(progress); }, reject);
  });
  check(
    JSON.stringify(recoveredProgress) === JSON.stringify({ currentStage: 1, completedTasks: 1, streak: 0 }),
    'el progreso reaparece intacto al volver a iniciar sesión',
  );
  const recoveredPreferences = await new Promise<Record<string, boolean>>((resolve) => {
    const stop = watchPreferences(uidA, (saved) => { stop(); resolve(saved); });
  });
  check(
    recoveredPreferences.darkMode === true && recoveredPreferences.sounds === false,
    'las preferencias reaparecen intactas al volver a iniciar sesión',
  );
} finally {
  if (auth.currentUser?.uid !== uidA) await signInWithEmailAndPassword(auth, emailA, password);
  await deleteAllTasks(uidA);
  await deleteDoc(doc(db, 'users', uidA, 'progress', 'world'));
  await deleteDoc(doc(db, 'users', uidA));
  await deleteUser(auth.currentUser!);
  results.push('· datos y cuenta A borrados');
}

console.log(results.join('\n'));
process.exit();
