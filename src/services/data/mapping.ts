import type { AppIconName } from '@/components/icons/AppIcon';
import type { ProgressWorldSnapshot } from '@/components/progress/worldData';
import { TASK_DIFFICULTY, type TaskDifficulty, type TaskItem } from '@/components/tasks/taskTypes';
import type { PaletteTone } from '@/theme/palette';

// Traduce entre los tipos de la app y los documentos de Firestore. Los campos del modelo de
// datos (fila 10) se agregan aquí; ni las pantallas ni los repositorios cambian.
export type FirestoreData = Record<string, unknown>;

const TONES: readonly PaletteTone[] = ['green', 'lilac', 'blue', 'pink', 'yellow'];
const ICONS: readonly AppIconName[] = [
  'home', 'checklist', 'sprout', 'profile', 'settings', 'plus', 'back', 'document', 'mail',
  'book', 'presentation', 'cart', 'phone', 'play', 'edit', 'trash', 'close',
];

const oneOf = <T extends string>(options: readonly T[], value: unknown, fallback: T): T => (
  options.includes(value as T) ? (value as T) : fallback
);
const text = (value: unknown) => (typeof value === 'string' ? value : '');
const count = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

// Firestore rechaza undefined: los campos opcionales vacíos no se envían.
export function taskToDoc({ id: _id, ...task }: TaskItem): FirestoreData {
  return Object.fromEntries(Object.entries(task).filter(([, value]) => value !== undefined));
}

// Un documento dañado o de una versión anterior nunca rompe la lista: se corrige o se ignora.
export function taskFromDoc(id: string, data: FirestoreData | undefined): TaskItem | null {
  const title = text(data?.title).trim();
  if (!data || !title) return null;
  const difficulties = Object.keys(TASK_DIFFICULTY) as TaskDifficulty[];
  return {
    id,
    title,
    detail: text(data.detail),
    ...(typeof data.duration === 'string' ? { duration: data.duration } : {}),
    ...(typeof data.notes === 'string' ? { notes: data.notes } : {}),
    priority: count(data.priority),
    tone: oneOf(TONES, data.tone, 'blue'),
    icon: oneOf(ICONS, data.icon, 'checklist'),
    difficulty: oneOf(difficulties, data.difficulty, 'medium'),
    completed: data.completed === true,
  };
}

// Ley 1581: la autorización solo se puede demostrar si quedó con versión del aviso y fecha.
export function hasConsent(userData: FirestoreData | undefined) {
  const consents = userData?.consents as { dataProcessing?: unknown } | undefined;
  const record = consents?.dataProcessing as { version?: unknown; acceptedAt?: unknown } | undefined;
  return typeof record?.version === 'string' && typeof record?.acceptedAt === 'number';
}

export function progressFromDoc(data: FirestoreData | undefined): ProgressWorldSnapshot {
  return {
    currentStage: Math.max(1, count(data?.currentStage)),
    completedTasks: Math.max(0, count(data?.completedTasks)),
    streak: Math.max(0, count(data?.streak)),
  };
}
