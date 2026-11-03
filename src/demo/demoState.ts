import {
  PROGRESS_WORLD_STAGES,
  type ProgressWorldSnapshot,
} from '@/components/progress/worldData';
import { TASK_DIFFICULTY, type TaskDraft, type TaskItem } from '@/components/tasks/taskTypes';
import { DEMO_PLAN } from '@/demo/demoScript';

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
};

export type DemoAction =
  | { type: 'toggleTask'; id: string }
  // Una tarea de TasksProvider cambió de estado: solo se actualiza el progreso del mundo.
  | { type: 'recordCompletion'; taskId: string; completed: boolean }
  | { type: 'createTask'; id: string; draft: TaskDraft }
  | { type: 'updateTask'; id: string; draft: TaskDraft }
  | { type: 'deleteTask'; id: string }
  | { type: 'addPlan' }
  | { type: 'dismissCelebration' }
  | { type: 'finishUnlock' }
  | { type: 'finishHomeReveal' }
  | { type: 'reset' };

// La tarea del plan que se completa en escena lleva el total a 25 y abre el Bosque de origami.
// Cambia estos valores para mover a Pandoro y probar el florecimiento del mundo.
const INITIAL_PROGRESS: ProgressWorldSnapshot = {
  currentStage: 1,
  completedTasks: 24,
  streak: 6,
};

// El informe, la estadística y la exposición no están: los trae la conversación con Pandoro.
const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'mail',
    title: 'Responder correo',
    detail: 'Hoy · 15 min',
    duration: '15 min',
    priority: 2,
    tone: 'blue',
    icon: 'mail',
    difficulty: 'light',
    completed: false,
  },
  {
    id: 'materials',
    title: 'Comprar materiales',
    detail: 'Viernes',
    priority: 6,
    tone: 'green',
    icon: 'cart',
    difficulty: 'light',
    completed: false,
  },
  {
    id: 'notes',
    title: 'Revisar notas',
    detail: 'Viernes · 20 min',
    duration: '20 min',
    priority: 5,
    tone: 'blue',
    icon: 'document',
    difficulty: 'light',
    completed: true,
  },
  {
    id: 'agenda',
    title: 'Organizar agenda',
    detail: 'Domingo · 15 min',
    duration: '15 min',
    priority: 8,
    tone: 'lilac',
    icon: 'checklist',
    difficulty: 'light',
    completed: false,
  },
  {
    id: 'team',
    title: 'Llamar al equipo',
    detail: 'Lunes · 9:00 a. m.',
    duration: '20 min',
    priority: 9,
    tone: 'green',
    icon: 'phone',
    difficulty: 'medium',
    completed: false,
  },
];

export const INITIAL_DEMO_STATE: DemoState = {
  tasks: INITIAL_TASKS,
  progress: INITIAL_PROGRESS,
  celebration: null,
  pendingUnlock: null,
  pendingHomeReveal: false,
};

// Puntuación de la vista "Ahora": menor va antes y las tareas difíciles suben.
function nowScore(task: TaskItem) {
  return task.priority - TASK_DIFFICULTY[task.difficulty].weight * 1.5;
}

export function sortTasksForNow(tasks: readonly TaskItem[]) {
  return [...tasks].sort((first, second) => {
    if (first.completed !== second.completed) return first.completed ? 1 : -1;
    return nowScore(first) - nowScore(second);
  });
}

// Avance entre el lugar actual y el siguiente, de 0 a 1.
export function getStageProgress(progress: ProgressWorldSnapshot) {
  const current = PROGRESS_WORLD_STAGES.find((stage) => stage.id === progress.currentStage);
  const next = PROGRESS_WORLD_STAGES.find((stage) => stage.id === progress.currentStage + 1);
  if (!current || !next) return 1;
  const value = (progress.completedTasks - current.requiredTasks) / (next.requiredTasks - current.requiredTasks);
  return Math.min(1, Math.max(0, value));
}

// Cada lugar del plan queda por delante de todas las demás en "Ahora", en el orden del plan.
// Los ids son fijos: agregarlo dos veces no duplica nada.
export function demoPlanTasks(existing: readonly TaskItem[]): TaskItem[] {
  const existingIds = new Set(existing.map((task) => task.id));
  const fresh = DEMO_PLAN.filter((task) => !existingIds.has(task.id));
  const lowestScore = Math.min(0, ...existing.map(nowScore));
  return fresh.map(({ day: _day, minutes: _minutes, ...task }, index): TaskItem => ({
    ...task,
    priority: lowestScore - fresh.length + index + TASK_DIFFICULTY[task.difficulty].weight * 1.5,
    completed: false,
  }));
}

function recordCompletion(state: DemoState, taskId: string, completed: boolean): DemoState {
  const completedTasks = Math.max(0, state.progress.completedTasks + (completed ? 1 : -1));
  const nextStage = PROGRESS_WORLD_STAGES.find((stage) => stage.id === state.progress.currentStage + 1);
  // Un lugar desbloqueado no se vuelve a bloquear aunque se desmarquen tareas.
  const unlocked = completed && nextStage !== undefined && completedTasks >= nextStage.requiredTasks
    ? nextStage
    : null;

  return {
    ...state,
    progress: {
      ...state.progress,
      completedTasks,
      currentStage: unlocked ? unlocked.id : state.progress.currentStage,
    },
    celebration: unlocked ? { taskId, stageId: unlocked.id } : state.celebration,
    pendingUnlock: unlocked ? unlocked.id : state.pendingUnlock,
    pendingHomeReveal: unlocked ? true : state.pendingHomeReveal,
  };
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'toggleTask': {
      const task = state.tasks.find((item) => item.id === action.id);
      if (!task) return state;

      const completed = !task.completed;
      return {
        ...recordCompletion(state, task.id, completed),
        tasks: state.tasks.map((item) => (item.id === action.id ? { ...item, completed } : item)),
      };
    }

    case 'recordCompletion':
      return recordCompletion(state, action.taskId, action.completed);

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
