import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import type { TaskDraft, TaskItem } from '@/components/tasks/taskTypes';
import {
  deleteAllCompletions,
  removeCompletion,
  saveCompletion,
  watchCompletions,
} from '@/services/data/completionsRepository';
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
import type { CompletionEvent } from '@/services/progress/steps';
import {
  canUndoCompletion,
  completeTask,
  dismissTask as dismissTaskInList,
  moveDueDate as moveDueDateInList,
  undoCompletion,
  type TasksAndEvents,
} from '@/services/progress/taskActions';

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
  // Las tareas descartadas («ya no aplica») no aparecen en ninguna lista.
  tasks: TaskItem[];
  // Pasos ganados: un evento por tarea completada. Sobreviven aunque la tarea se borre.
  events: CompletionEvent[];
  // Falso hasta que llegaron las tareas y los pasos guardados.
  ready: boolean;
  // Alterna la tarea y devuelve cómo quedó todo; null si no se puede (p. ej. desmarcar una de una semana cerrada).
  toggleTask: (id: string) => TasksAndEvents | null;
  canToggle: (id: string) => boolean;
  dismissTask: (id: string) => void;
  moveDueDate: (id: string, dueDate: string) => void;
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
  const [allTasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<CompletionEvent[]>([]);
  const [loaded, setLoaded] = useState({ tasks: false, events: false });
  const [planner, setPlanner] = useState(EMPTY_PLANNER);
  const [syncError, setSyncError] = useState<string | null>(null);
  const uid = useAuth().user?.uid ?? null;
  const [ownerUid, setOwnerUid] = useState(uid);

  // Al cerrar sesión o cambiar de cuenta, nada de lo anterior queda a la vista del siguiente usuario.
  if (ownerUid !== uid) {
    setOwnerUid(uid);
    setTasks([]);
    setEvents([]);
    setLoaded({ tasks: false, events: false });
    setPlanner(EMPTY_PLANNER);
    setSyncError(null);
  }

  useEffect(() => {
    if (!uid) return;
    return watchTasks(
      uid,
      (next) => { setTasks(next); setLoaded((current) => ({ ...current, tasks: true })); },
      () => {
        setSyncError('No se pudieron cargar tus tareas.');
        setLoaded((current) => ({ ...current, tasks: true }));
      },
    );
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    return watchCompletions(
      uid,
      (next) => { setEvents(next); setLoaded((current) => ({ ...current, events: true })); },
      () => {
        setSyncError('No se pudo cargar tu progreso.');
        setLoaded((current) => ({ ...current, events: true }));
      },
    );
  }, [uid]);

  const tasks = useMemo(() => allTasks.filter((task) => !task.dismissed), [allTasks]);

  // Firestore muestra el cambio al instante y lo confirma después; si falla, se avisa.
  const sync = useCallback((write: Promise<unknown>) => {
    write.then(() => setSyncError(null), () => setSyncError('No se pudo guardar el último cambio.'));
  }, []);

  const canToggle = useCallback((id: string) => {
    const task = allTasks.find((item) => item.id === id);
    if (!task || task.dismissed) return false;
    return !task.completed || canUndoCompletion({ tasks: allTasks, events }, id, new Date());
  }, [allTasks, events]);

  // Completar suma un paso en la semana de hoy; desmarcar lo quita solo si fue en la semana abierta.
  const toggleTask = useCallback((id: string) => {
    const task = allTasks.find((item) => item.id === id);
    if (!uid || !task || !canToggle(id)) return null;
    const current = { tasks: allTasks, events };
    const now = new Date();
    const next = task.completed ? undoCompletion(current, id, now) : completeTask(current, id, now);
    const changed = next.tasks.find((item) => item.id === id);
    if (!changed) return null;
    sync(saveTask(uid, changed));
    if (task.completed) {
      sync(removeCompletion(uid, id));
    } else {
      sync(saveCompletion(uid, { taskId: id, completedAt: now.getTime() }));
      logEvent('task_completed');
    }
    return next;
  }, [allTasks, canToggle, events, sync, uid]);

  const dismissTask = useCallback((id: string) => {
    const changed = dismissTaskInList(allTasks, id, new Date()).find((item) => item.id === id);
    if (uid && changed) sync(saveTask(uid, changed));
  }, [allTasks, sync, uid]);

  const moveDueDate = useCallback((id: string, dueDate: string) => {
    const changed = moveDueDateInList(allTasks, id, dueDate).find((item) => item.id === id);
    if (uid && changed) sync(saveTask(uid, changed));
  }, [allTasks, sync, uid]);
  const addTask = useCallback((draft: TaskDraft) => {
    if (!uid) return;
    sync(createTask(uid, {
      id: `task-${Date.now()}`,
      ...draft,
      priority: nextPriority(allTasks),
      tone: 'blue',
      icon: 'checklist',
      completed: false,
    }));
    logEvent('task_created');
  }, [sync, allTasks, uid]);

  const updateTask = useCallback((id: string, draft: TaskDraft) => {
    const task = allTasks.find((item) => item.id === id);
    if (uid && task) sync(saveTask(uid, { ...task, ...draft }));
  }, [sync, allTasks, uid]);

  const removeTask = useCallback((id: string) => {
    if (uid) sync(deleteTask(uid, id));
  }, [sync, uid]);

  // Los id de un plan son estables: confirmar dos veces no puede duplicar filas.
  const addPlannedTasks = useCallback((planned: TaskItem[]) => {
    const existing = new Set(allTasks.map((task) => task.id));
    const fresh = planned.filter((task) => !existing.has(task.id));
    if (uid && fresh.length) {
      sync(createTasks(uid, fresh));
      logEvent('plan_accepted', { durationMs: takeFlowDuration('plan_accept') });
    }
    return fresh.length;
  }, [sync, allTasks, uid]);

  // Ajustes → Reiniciar demo borra las tareas guardadas de este usuario.
  const resetTasks = useCallback(() => {
    if (uid) {
      sync(deleteAllTasks(uid));
      sync(deleteAllCompletions(uid));
    }
    setPlanner(EMPTY_PLANNER);
  }, [sync, uid]);

  const ready = loaded.tasks && loaded.events;

  const value = useMemo(() => ({
    tasks,
    events,
    ready,
    toggleTask,
    canToggle,
    dismissTask,
    moveDueDate,
    addTask,
    updateTask,
    removeTask,
    addPlannedTasks,
    resetTasks,
    syncError,
    planner,
    updatePlanner: setPlanner,
  }), [tasks, events, ready, toggleTask, canToggle, dismissTask, moveDueDate, addTask, updateTask, removeTask, addPlannedTasks, resetTasks, syncError, planner]);

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const value = useContext(TasksContext);
  if (!value) throw new Error('useTasks debe usarse dentro de TasksProvider.');
  return value;
}

export { nextPriority };
