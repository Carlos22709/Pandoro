import { weekKey } from './weeks';

// Una tarea completada es un paso. El camino se cuenta con eventos, nunca con un porcentaje.
export const STEPS_PER_TASK = 1;

export type CompletionEvent = {
  taskId: string;
  // Milisegundos desde 1970. La semana del paso se deriva de este instante (no de la fecha de entrega).
  completedAt: number;
};

export function totalSteps(events: readonly CompletionEvent[]) {
  return events.length * STEPS_PER_TASK;
}

export function stepsInWeek(events: readonly CompletionEvent[], key: string) {
  return events.filter((event) => weekKey(new Date(event.completedAt)) === key).length * STEPS_PER_TASK;
}

// Pasos ganados en un conjunto de semanas (el resumen de cierre suma varias a la vez).
export function stepsInWeeks(events: readonly CompletionEvent[], keys: readonly string[]) {
  const wanted = new Set(keys);
  return events.filter((event) => wanted.has(weekKey(new Date(event.completedAt)))).length * STEPS_PER_TASK;
}
