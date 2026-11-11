import type { TaskItem } from '@/components/tasks/taskTypes';

import type { CompletionEvent } from './steps';
import { weekKey } from './weeks';

// Cada acción cambia solo lo suyo y devuelve copias nuevas.
export type TasksAndEvents = { tasks: TaskItem[]; events: CompletionEvent[] };

export function completeTask(state: TasksAndEvents, taskId: string, now: Date): TasksAndEvents {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task || task.completed || task.dismissed) return state;
  return {
    tasks: state.tasks.map((item) => (
      item.id === taskId ? { ...item, completed: true, completedAt: now.getTime() } : item
    )),
    events: [...state.events, { taskId, completedAt: now.getTime() }],
  };
}

// Solo se puede desmarcar lo completado en la semana abierta. Lo de una semana cerrada se queda.
export function canUndoCompletion(state: TasksAndEvents, taskId: string, today: Date) {
  const event = state.events.find((item) => item.taskId === taskId);
  return event !== undefined && weekKey(new Date(event.completedAt)) === weekKey(today);
}

export function undoCompletion(state: TasksAndEvents, taskId: string, today: Date): TasksAndEvents {
  if (!canUndoCompletion(state, taskId, today)) return state;
  return {
    tasks: state.tasks.map((item) => {
      if (item.id !== taskId) return item;
      const { completedAt: _completedAt, ...rest } = item;
      return { ...rest, completed: false };
    }),
    events: state.events.filter((event) => event.taskId !== taskId),
  };
}

// «Ya no aplica»: sale de todas las listas sin dar ni quitar pasos.
export function dismissTask(tasks: readonly TaskItem[], taskId: string, now: Date): TaskItem[] {
  return tasks.map((item) => (
    item.id === taskId && !item.dismissed ? { ...item, dismissed: true, dismissedAt: now.getTime() } : item
  ));
}

// «Mover fecha»: la única forma de cambiar dueDate.
export function moveDueDate(tasks: readonly TaskItem[], taskId: string, dueDate: string): TaskItem[] {
  return tasks.map((item) => (item.id === taskId ? { ...item, dueDate } : item));
}
