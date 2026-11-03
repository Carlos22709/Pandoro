import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import { INITIAL_TASKS } from '@/components/tasks/initialTasks';
import type { TaskDraft, TaskItem } from '@/components/tasks/taskTypes';
import type { PlanProposal } from '@/services/planning/planTypes';

export type PlannerStage = 'compose' | 'review' | 'saved';

export type PlannerDraft = {
  stage: PlannerStage;
  text: string;
  days: string[];
  minutesPerDay: string;
  instruction: string;
  clarification: string | null;
  proposal: PlanProposal | null;
  savedProposalId: string | null;
  savedCount: number;
};

export const EMPTY_PLANNER: PlannerDraft = {
  stage: 'compose',
  text: '',
  days: [],
  minutesPerDay: '',
  instruction: '',
  clarification: null,
  proposal: null,
  savedProposalId: null,
  savedCount: 0,
};

type TasksContextValue = {
  tasks: TaskItem[];
  toggleTask: (id: string) => void;
  addTask: (draft: TaskDraft) => void;
  updateTask: (id: string, draft: TaskDraft) => void;
  removeTask: (id: string) => void;
  addPlannedTasks: (planned: TaskItem[]) => number;
  planner: PlannerDraft;
  updatePlanner: (update: (current: PlannerDraft) => PlannerDraft) => void;
};

const TasksContext = createContext<TasksContextValue | null>(null);

function nextPriority(tasks: TaskItem[]) {
  return tasks.reduce((highest, task) => Math.max(highest, task.priority), 0) + 1;
}

// El estado vive aquí para que Tareas y Nueva tarea compartan la lista. Sigue siendo en memoria,
// igual que antes; el borrador del plan sobrevive a salir de la pantalla, no a cerrar la app.
export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [planner, setPlanner] = useState(EMPTY_PLANNER);
  const uid = useAuth().user?.uid ?? null;
  const [ownerUid, setOwnerUid] = useState(uid);

  // Al cerrar sesión o cambiar de cuenta, nada de lo anterior queda a la vista del siguiente usuario.
  if (ownerUid !== uid) {
    setOwnerUid(uid);
    setTasks(INITIAL_TASKS);
    setPlanner(EMPTY_PLANNER);
  }

  const toggleTask = useCallback((id: string) => {
    setTasks((current) => current.map((task) => (
      task.id === id ? { ...task, completed: !task.completed } : task
    )));
  }, []);

  const addTask = useCallback((draft: TaskDraft) => {
    setTasks((current) => [
      ...current,
      {
        id: `task-${Date.now()}`,
        ...draft,
        priority: nextPriority(current),
        tone: 'blue',
        icon: 'checklist',
        completed: false,
      },
    ]);
  }, []);

  const updateTask = useCallback((id: string, draft: TaskDraft) => {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...draft } : task)));
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((current) => current.filter((task) => task.id !== id));
  }, []);

  // Los id de un plan son estables: confirmar dos veces no puede duplicar filas.
  const addPlannedTasks = useCallback((planned: TaskItem[]) => {
    const existing = new Set(tasks.map((task) => task.id));
    const fresh = planned.filter((task) => !existing.has(task.id));
    setTasks((current) => {
      const ids = new Set(current.map((task) => task.id));
      return [...current, ...planned.filter((task) => !ids.has(task.id))];
    });
    return fresh.length;
  }, [tasks]);

  const value = useMemo(() => ({
    tasks,
    toggleTask,
    addTask,
    updateTask,
    removeTask,
    addPlannedTasks,
    planner,
    updatePlanner: setPlanner,
  }), [tasks, toggleTask, addTask, updateTask, removeTask, addPlannedTasks, planner]);

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const value = useContext(TasksContext);
  if (!value) throw new Error('useTasks debe usarse dentro de TasksProvider.');
  return value;
}

export { nextPriority };
