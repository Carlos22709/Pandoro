import type { TaskItem } from '@/components/tasks/taskTypes';
import { toIsoDate } from '@/services/planning/planDates';

import { lastClosedWeekKey, type ProgressMeta } from './progressMeta';
import { stepsInWeeks, type CompletionEvent } from './steps';
import { isWeekComplete } from './weekComplete';
import { addWeeks, weekKey } from './weeks';

// Semanas cerradas cuyo cierre el usuario aún no ha visto, de la más antigua a la más reciente.
// Se calcula con la app abierta: no hay notificaciones ni tareas en segundo plano. Sin semana
// reconocida todavía (cuenta nueva) no hay nada que cerrar.
// Cada domingo la semana en curso ya puede cerrarse, pero solo si quedó completa: así el aviso de
// «Semana completada» llega el domingo y una semana a medias no molesta hasta el lunes.
export function unacknowledgedClosedWeeks(
  meta: ProgressMeta,
  today: Date,
  data?: { tasks: readonly TaskItem[]; events: readonly CompletionEvent[] },
) {
  const lastClosed = lastClosedWeekKey(today);
  if (!meta.lastAcknowledgedWeekKey || !lastClosed) return [];

  const weeks: string[] = [];
  let next = addWeeks(meta.lastAcknowledgedWeekKey, 1);
  // El tope evita un bucle largo si el dato guardado está dañado.
  while (next && next <= lastClosed && weeks.length < 520) {
    weeks.push(next);
    next = addWeeks(next, 1);
  }

  const current = weekKey(today);
  if (data && today.getDay() === 0 && current > meta.lastAcknowledgedWeekKey && !weeks.includes(current)
    && isWeekComplete(data.tasks, data.events, current)) {
    weeks.push(current);
  }
  return weeks;
}

// Tareas pendientes que pasan a la semana abierta: con fecha anterior a hoy. Las que no
// tienen fecha o la tienen futura no piden ninguna decisión.
export function carryOverTasks(tasks: readonly TaskItem[], today: Date) {
  const todayIso = toIsoDate(today);
  return tasks.filter((task) => (
    !task.completed && !task.dismissed && task.dueDate !== undefined && task.dueDate < todayIso
  ));
}

export type ClosureSummary = {
  weeks: string[];
  steps: number;
  completedTasks: number;
  // Semanas cerradas que quedaron completas y abren un lugar nuevo (de la más antigua a la más reciente).
  wonWeeks: string[];
  carryOver: TaskItem[];
};

// Un solo resumen aunque hayan pasado varias semanas. Con cero pasos la pantalla omite los logros.
export function closureSummary(
  events: readonly CompletionEvent[],
  tasks: readonly TaskItem[],
  meta: ProgressMeta,
  today: Date,
): ClosureSummary | null {
  const weeks = unacknowledgedClosedWeeks(meta, today, { tasks, events });
  if (!weeks.length) return null;
  const steps = stepsInWeeks(events, weeks);
  return {
    weeks,
    steps,
    completedTasks: steps,
    wonWeeks: weeks.filter((week) => !meta.unlockedWeeks.includes(week) && isWeekComplete(tasks, events, week)),
    carryOver: carryOverTasks(tasks, today),
  };
}

// «Pasar todo» y cerrar la pantalla sin elegir hacen exactamente esto: nada cambia en las tareas.
// Con una semana ganada en curso (domingo), el cierre cubre también esa semana.
export function acknowledgeClosure(meta: ProgressMeta, today: Date, wonWeeks: readonly string[] = []): ProgressMeta {
  const lastClosed = lastClosedWeekKey(today);
  if (!lastClosed) return meta;
  const current = weekKey(today);
  // Solo en domingo la semana en curso puede darse por cerrada.
  const through = today.getDay() === 0 && wonWeeks.includes(current) ? current : lastClosed;
  if (meta.lastAcknowledgedWeekKey && meta.lastAcknowledgedWeekKey >= through) return meta;
  return { ...meta, lastAcknowledgedWeekKey: through };
}

// Primera vez que se abre la app con esta cuenta: se parte de la semana pasada, sin cierre que mostrar.
export function startMeta(meta: ProgressMeta, today: Date): ProgressMeta {
  return meta.lastAcknowledgedWeekKey ? meta : acknowledgeClosure(meta, today);
}
