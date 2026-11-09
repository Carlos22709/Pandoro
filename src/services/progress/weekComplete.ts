import type { TaskItem } from '@/components/tasks/taskTypes';
import { parseIsoDate } from '@/services/planning/planDates';

import { stepsInWeek, type CompletionEvent } from './steps';
import { weekEnd, weekEndIso } from './weeks';

// Una semana está completa si dio al menos un paso y, al cerrarse, no quedaba ninguna tarea
// pendiente con fecha hasta su domingo. Sin fecha, con fecha futura, descartadas o creadas
// después de que la semana terminó no cuentan. Es un sí o un no, nunca un porcentaje.
// Solo se evalúa al cerrar la semana: a mitad de semana todavía pueden llegar más tareas.
export function isWeekComplete(
  tasks: readonly TaskItem[],
  events: readonly CompletionEvent[],
  key: string,
) {
  const lastDay = weekEndIso(key);
  const start = parseIsoDate(key);
  if (!lastDay || !start || stepsInWeek(events, key) < 1) return false;
  const endMs = weekEnd(start).getTime();
  return !tasks.some((task) => (
    !task.completed
    && !task.dismissed
    && task.dueDate !== undefined
    && task.dueDate <= lastDay
    && (task.createdAt === undefined || task.createdAt <= endMs)
  ));
}
