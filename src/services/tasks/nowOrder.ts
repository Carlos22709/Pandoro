// Vista «Ahora» de Tareas: aplica la lógica de priorización (src/services/planning/priority.ts,
// docs/priorizacion.md) a las tareas guardadas. Sin dependencias de React para poder probarla.
import type { TaskItem } from '@/components/tasks/taskTypes';
import { toIsoDate } from '@/services/planning/planDates';
import { describeReason, prioritizeTasks, type PriorityTask } from '@/services/planning/priority';

import { parseDurationMinutes } from './taskValidation';

// Una tarea sin duración legible cuenta como media hora, lo mismo que propone el formulario.
export const DEFAULT_TASK_MINUTES = 30;

// Las tareas de un plan distinguen el día en que se trabajan (dueDate) de la fecha límite de su
// actividad (deadline). En una tarea creada a mano, su fecha es la fecha límite.
export function toPriorityTask(task: TaskItem): PriorityTask {
  const planned = task.id.startsWith('plan-');
  return {
    id: task.id,
    deadline: planned ? task.deadline ?? null : task.dueDate ?? null,
    importance: task.importance ?? 'medium',
    difficulty: task.difficulty,
    remainingMinutes: (task.duration ? parseDurationMinutes(task.duration) : null) || DEFAULT_TASK_MINUTES,
    scheduledDate: planned ? task.dueDate ?? null : null,
    position: task.priority,
  };
}

export type NowOrder = {
  tasks: TaskItem[];
  // La «sugerencia de Pandoro para ahora»: la primera pendiente, o null si no hay.
  suggestionId: string | null;
  // Motivo legible de cada pendiente («Vence hoy», «Sin fecha límite»…).
  reasons: Record<string, string>;
};

// Pendientes en el orden de prioritizeTasks y, al final, las completadas en su orden de siempre.
// La disponibilidad no se guarda todavía (modelo de datos, F05): se usan las 2 h por día por defecto.
export function orderForNow(tasks: readonly TaskItem[], today: Date = new Date()): NowOrder {
  const pending = tasks.filter((task) => !task.completed);
  const done = tasks.filter((task) => task.completed);
  const byId = new Map(pending.map((task) => [task.id, task]));
  const { ranked, suggestion } = prioritizeTasks(pending.map(toPriorityTask), {
    today: toIsoDate(today),
    availability: null,
  });
  return {
    tasks: [...ranked.flatMap(({ id }) => byId.get(id) ?? []), ...done],
    suggestionId: suggestion,
    reasons: Object.fromEntries(ranked.map(({ id, reason }) => [id, describeReason(reason)])),
  };
}
