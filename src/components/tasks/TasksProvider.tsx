import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import type { TaskDraft, TaskItem } from '@/components/tasks/taskTypes';
import {
  createTask,
  createTasks,
  deleteAllTasks,
  deleteTask,
  saveTask,
  watchTasks,
} from '@/services/data/tasksRepository';
import { logEvent, takeFlowDuration } from '@/services/logging/appLog';
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
  resetTasks: () => void;
  // Último fallo al leer o guardar en Firestore; null si todo está sincronizado.
  syncError: string | null;
  planner: PlannerDraft;
  updatePlanner: (update: (current: PlannerDraft) => PlannerDraft) => void;
};

const TasksContext = createContext<TasksContextValue | null>(null);

function nextPriority(tasks: TaskItem[]) {
  return tasks.reduce((highest, task) => Math.max(highest, task.priority), 0) + 1;
}

// Tareas y Nueva tarea comparten esta lista. Las tareas viven en Firestore (users/{uid}/tasks) y
// llegan aquí por suscripción; el borrador del plan sigue solo en el dispositivo hasta confirmarlo.
export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [planner, setPlanner] = useState(EMPTY_PLANNER);
  const [syncError, setSyncError] = useState<string | null>(null);
  const uid = useAuth().user?.uid ?? null;
  const [ownerUid, setOwnerUid] = useState(uid);

  // Al cerrar sesión o cambiar de cuenta, nada de lo anterior queda a la vista del siguiente usuario.
  if (ownerUid !== uid) {
    setOwnerUid(uid);
    setTasks([]);
    setPlanner(EMPTY_PLANNER);
    setSyncError(null);
  }

  useEffect(() => {
    if (!uid) return;
    return watchTasks(uid, setTasks, () => setSyncError('No se pudieron cargar tus tareas.'));
  }, [uid]);

  // Firestore muestra el cambio al instante y lo confirma después; si falla, se avisa.
  const sync = useCallback((write: Promise<unknown>) => {
    write.then(() => setSyncError(null), () => setSyncError('No se pudo guardar el último cambio.'));
  }, []);

  const toggleTask = useCallback((id: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!uid || !task) return;
    const completed = !task.completed;
    sync(saveTask(uid, { ...task, completed }));
    if (completed) logEvent('task_completed');
  }, [sync, tasks, uid]);

  const addTask = useCallback((draft: TaskDraft) => {
    if (!uid) return;
    sync(createTask(uid, {
      id: `task-${Date.now()}`,
      ...draft,
      priority: nextPriority(tasks),
      tone: 'blue',
      icon: 'checklist',
      completed: false,
    }));
    logEvent('task_created');
  }, [sync, tasks, uid]);

  const updateTask = useCallback((id: string, draft: TaskDraft) => {
    const task = tasks.find((item) => item.id === id);
    if (uid && task) sync(saveTask(uid, { ...task, ...draft }));
  }, [sync, tasks, uid]);

  const removeTask = useCallback((id: string) => {
    if (uid) sync(deleteTask(uid, id));
  }, [sync, uid]);

  // Los id de un plan son estables: confirmar dos veces no puede duplicar filas.
  const addPlannedTasks = useCallback((planned: TaskItem[]) => {
    const existing = new Set(tasks.map((task) => task.id));
    const fresh = planned.filter((task) => !existing.has(task.id));
    if (uid && fresh.length) {
      sync(createTasks(uid, fresh));
      logEvent('plan_accepted', { durationMs: takeFlowDuration('plan_accept') });
    }
    return fresh.length;
  }, [sync, tasks, uid]);

  // Ajustes → Reiniciar demo borra las tareas guardadas de este usuario.
  const resetTasks = useCallback(() => {
    if (uid) sync(deleteAllTasks(uid));
    setPlanner(EMPTY_PLANNER);
  }, [sync, uid]);

  const value = useMemo(() => ({
    tasks,
    toggleTask,
    addTask,
    updateTask,
    removeTask,
    addPlannedTasks,
    resetTasks,
    syncError,
    planner,
    updatePlanner: setPlanner,
  }), [tasks, toggleTask, addTask, updateTask, removeTask, addPlannedTasks, resetTasks, syncError, planner]);

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const value = useContext(TasksContext);
  if (!value) throw new Error('useTasks debe usarse dentro de TasksProvider.');
  return value;
}

export { nextPriority };
