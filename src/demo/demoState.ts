import {
  PROGRESS_WORLD_STAGES,
  type ProgressWorldSnapshot,
} from '@/components/progress/worldData';
import { TASK_DIFFICULTY, type TaskDraft, type TaskItem } from '@/components/tasks/taskTypes';
import { DEMO_PLAN } from '@/demo/demoScript';
import { toIsoDate, upcomingDays, weekdayLong } from '@/services/planning/planDates';
import { acknowledgeClosure } from '@/services/progress/weekClosure';

// Estado de la presentación: vive solo en memoria y vuelve a este punto al recargar
// o con "Reiniciar demo" en Ajustes.

export type DemoCelebration = {
  taskId: string;
  stageId: number;
};

export type DemoState = {
  tasks: TaskItem[];
  progress: ProgressWorldSnapshot;
  // Tareas muestra la celebración; Progreso anima la llegada; Inicio despliega el origami.
  celebration: DemoCelebration | null;
  pendingUnlock: number | null;
  pendingHomeReveal: boolean;
  // Falsa hasta que llega el progreso guardado: antes no se puede decidir si hay un cierre de semana.
  progressLoaded: boolean;
};

export type DemoAction =
  | { type: 'toggleTask'; id: string }
  // Una tarea de TasksProvider cambió de estado: solo se actualiza el progreso del mundo.
  | { type: 'recordCompletion'; taskId: string; completed: boolean }
  // El usuario vio (o cerró sin elegir) el cierre de las semanas pasadas hasta la anterior a `todayMs`.
  // `wonWeeks` son las que cerraron completas: cada una abre un lugar, una sola vez.
  | { type: 'acknowledgeClosure'; todayMs: number; wonWeeks?: string[] }
  // Progreso guardado en Firestore: los lugares ya ganados no se vuelven a celebrar.
  | { type: 'loadProgress'; progress: ProgressWorldSnapshot }
  | { type: 'createTask'; id: string; draft: TaskDraft }
  | { type: 'updateTask'; id: string; draft: TaskDraft }
  | { type: 'deleteTask'; id: string }
  | { type: 'addPlan' }
  | { type: 'dismissCelebration' }
  | { type: 'finishUnlock' }
  | { type: 'finishHomeReveal' }
  | { type: 'reset' };

// Un usuario nuevo empieza su mundo en cero. El progreso guardado llega con loadProgress.
const INITIAL_PROGRESS: ProgressWorldSnapshot = {
  currentStage: 1,
  completedTasks: 0,
  streak: 0,
  stageStartSteps: 0,
  unlockedWeeks: [],
  lastAcknowledgedWeekKey: null,
};

// Las tareas de la app viven en TasksProvider; esta lista solo la usa el reducer de la demo.
export const INITIAL_DEMO_STATE: DemoState = {
  tasks: [],
  progress: INITIAL_PROGRESS,
  celebration: null,
  pendingUnlock: null,
  pendingHomeReveal: false,
  progressLoaded: false,
};

// Puntuación de la vista "Ahora": menor va antes y las tareas difíciles suben.
function nowScore(task: TaskItem) {
  return task.priority - TASK_DIFFICULTY[task.difficulty].weight * 1.5;
}

// Las pendientes con fecha ya pasada van primero, sin etiqueta; entre sí rige la misma puntuación.
export function sortTasksForNow(tasks: readonly TaskItem[], today: Date = new Date()) {
  const todayIso = toIsoDate(today);
  const overdue = (task: TaskItem) => !task.completed && task.dueDate !== undefined && task.dueDate < todayIso;
  return [...tasks].sort((first, second) => {
    if (first.completed !== second.completed) return first.completed ? 1 : -1;
    if (overdue(first) !== overdue(second)) return overdue(first) ? -1 : 1;
    return nowScore(first) - nowScore(second);
  });
}

// Cada lugar del plan queda por delante de todas las demás en "Ahora", en el orden del plan.
// Los ids son fijos: agregarlo dos veces no duplica nada.
// El día del guion ('Hoy', 'Mañana', 'Jueves'…) se vuelve la fecha real más próxima desde hoy.
function demoDueDate(day: string, today: Date) {
  const days = upcomingDays(today, 7);
  if (day === 'Hoy') return days[0];
  if (day === 'Mañana') return days[1];
  const wanted = day.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return days.find((iso) => weekdayLong(iso).normalize('NFD').replace(/[̀-ͯ]/g, '') === wanted);
}

export function demoPlanTasks(existing: readonly TaskItem[], today: Date = new Date()): TaskItem[] {
  const existingIds = new Set(existing.map((task) => task.id));
  const fresh = DEMO_PLAN.filter((task) => !existingIds.has(task.id));
  const lowestScore = Math.min(0, ...existing.map(nowScore));
  return fresh.map(({ day, minutes: _minutes, ...task }, index): TaskItem => {
    const dueDate = demoDueDate(day, today);
    return {
      ...task,
      ...(dueDate ? { dueDate } : {}),
      priority: lowestScore - fresh.length + index + TASK_DIFFICULTY[task.difficulty].weight * 1.5,
      completed: false,
    };
  });
}

// Completar una tarea es un paso del camino. Los lugares no se abren aquí: se ganan al cerrar la semana.
function recordCompletion(state: DemoState, completed: boolean): DemoState {
  const completedTasks = Math.max(0, state.progress.completedTasks + (completed ? 1 : -1));
  return { ...state, progress: { ...state.progress, completedTasks } };
}

// Cierra las semanas pasadas: las completas abren un lugar cada una. Lo ganado nunca se revierte.
function closeWeeks(state: DemoState, todayMs: number, wonWeeks: readonly string[]): DemoState {
  const meta = acknowledgeClosure(
    { lastAcknowledgedWeekKey: state.progress.lastAcknowledgedWeekKey, unlockedWeeks: state.progress.unlockedWeeks },
    new Date(todayMs),
    wonWeeks,
  );
  if (meta.lastAcknowledgedWeekKey === state.progress.lastAcknowledgedWeekKey) return state;

  const fresh = wonWeeks.filter((week) => !state.progress.unlockedWeeks.includes(week));
  const reached = Math.min(PROGRESS_WORLD_STAGES.length, state.progress.currentStage + fresh.length);
  const opened = reached > state.progress.currentStage;

  return {
    ...state,
    progress: {
      ...state.progress,
      lastAcknowledgedWeekKey: meta.lastAcknowledgedWeekKey,
      currentStage: reached,
      stageStartSteps: opened ? state.progress.completedTasks : state.progress.stageStartSteps,
      unlockedWeeks: [...state.progress.unlockedWeeks, ...fresh],
    },
    pendingUnlock: opened ? reached : state.pendingUnlock,
    pendingHomeReveal: opened ? true : state.pendingHomeReveal,
  };
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'toggleTask': {
      const task = state.tasks.find((item) => item.id === action.id);
      if (!task) return state;

      const completed = !task.completed;
      return {
        ...recordCompletion(state, completed),
        tasks: state.tasks.map((item) => (item.id === action.id ? { ...item, completed } : item)),
      };
    }

    case 'recordCompletion':
      return recordCompletion(state, action.completed);

    case 'acknowledgeClosure':
      return closeWeeks(state, action.todayMs, action.wonWeeks ?? []);

    case 'loadProgress':
      return { ...state, progress: action.progress, progressLoaded: true };

    case 'createTask': {
      const priority = state.tasks.reduce((highest, task) => Math.max(highest, task.priority), 0) + 1;
      return {
        ...state,
        tasks: [
          ...state.tasks,
          {
            id: action.id,
            ...action.draft,
            priority,
            tone: 'blue',
            icon: 'checklist',
            completed: false,
          },
        ],
      };
    }

    case 'updateTask':
      return {
        ...state,
        tasks: state.tasks.map((task) => (task.id === action.id ? { ...task, ...action.draft } : task)),
      };

    case 'deleteTask':
      return { ...state, tasks: state.tasks.filter((task) => task.id !== action.id) };

    case 'addPlan': {
      const planned = demoPlanTasks(state.tasks);
      return planned.length ? { ...state, tasks: [...planned, ...state.tasks] } : state;
    }

    case 'dismissCelebration':
      return { ...state, celebration: null };

    case 'finishUnlock':
      return { ...state, pendingUnlock: null };

    case 'finishHomeReveal':
      return { ...state, pendingHomeReveal: false };

    case 'reset':
      return INITIAL_DEMO_STATE;
  }
}
