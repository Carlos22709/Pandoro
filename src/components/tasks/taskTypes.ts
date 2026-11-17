import type { AppIconName } from '@/components/icons/AppIcon';
import type { PlanPriority } from '@/services/planning/planTypes';
import type { PaletteTone } from '@/theme/palette';

export type TaskDifficulty = 'light' | 'medium' | 'high';

export const TASK_DIFFICULTY: Record<
  TaskDifficulty,
  { label: string; tone: PaletteTone; weight: number }
> = {
  light: { label: 'Fácil', tone: 'green', weight: 1 },
  medium: { label: 'Media', tone: 'yellow', weight: 2 },
  high: { label: 'Difícil', tone: 'pink', weight: 3 },
};

export type TaskItem = {
  id: string;
  title: string;
  detail: string;
  duration?: string;
  notes?: string;
  // Día local YYYY-MM-DD; solo las tareas con día tienen recordatorio.
  dueDate?: string;
  // Solo en tareas de un plan: fecha límite de su actividad (si el usuario la dijo) e importancia.
  // En una tarea creada a mano, dueDate hace de fecha límite. Los usa la vista «Ahora» (priority.ts).
  deadline?: string;
  importance?: PlanPriority;
  priority: number;
  tone: PaletteTone;
  icon: AppIconName;
  difficulty: TaskDifficulty;
  completed: boolean;
  // Semana viva (src/services/progress): el estado es pendiente, completada (`completed`) o
  // descartada (`dismissed`). Las fechas son ISO local (dueDate) o milisegundos (los demás).
  dismissed?: boolean;
  createdAt?: number;
  completedAt?: number;
  dismissedAt?: number;
};

export type TaskDraft = Pick<TaskItem, 'title' | 'detail' | 'duration' | 'difficulty' | 'dueDate'>;
