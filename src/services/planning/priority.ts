import { TASK_DIFFICULTY, type TaskDifficulty } from '@/components/tasks/taskTypes';

import { formatDay, formatMinutes, parseIsoDate, upcomingDays } from './planDates';
import type { Availability, PlanPriority } from './planTypes';

// Sin disponibilidad registrada se calcula con esta capacidad diaria.
export const DEFAULT_MINUTES_PER_DAY = 120;
// Una tarea es «pronto» si su holgura cabe en menos de estos días de trabajo.
export const SOON_WORKDAYS = 3;

export type PriorityTask = {
  id: string;
  // Fechas locales YYYY-MM-DD, como en planTypes.
  deadline: string | null;
  importance: PlanPriority;
  difficulty: TaskDifficulty;
  remainingMinutes: number;
  scheduledDate: string | null;
};

export type PriorityContext = {
  today: string;
  availability: Availability | null;
};

// La pantalla arma el texto con describeReason; la lógica solo decide el motivo.
export type PriorityReason =
  | { kind: 'overdue'; deadline: string }
  | { kind: 'not_enough_time'; deadline: string; neededMinutes: number; availableMinutes: number }
  | { kind: 'due_today'; deadline: string }
  | { kind: 'scheduled_today' }
  | { kind: 'start_today'; deadline: string }
  | { kind: 'due_soon'; deadline: string }
  | { kind: 'due_later'; deadline: string }
  | { kind: 'no_deadline' };

// De más a menos urgente.
export type PriorityLevel = 'late' | 'today' | 'soon' | 'later' | 'undated';
const LEVEL_ORDER: PriorityLevel[] = ['late', 'today', 'soon', 'later', 'undated'];
const IMPORTANCE_ORDER: PlanPriority[] = ['high', 'medium', 'low'];

const LEVEL_BY_REASON: Record<PriorityReason['kind'], PriorityLevel> = {
  overdue: 'late',
  not_enough_time: 'late',
  due_today: 'today',
  scheduled_today: 'today',
  start_today: 'today',
  due_soon: 'soon',
  due_later: 'later',
  no_deadline: 'undated',
};

export type RankedTask = {
  id: string;
  level: PriorityLevel;
  reason: PriorityReason;
  // Minutos libres que sobran antes de la fecha límite; null si no tiene fecha.
  slackMinutes: number | null;
};

// Solo se avisa con disponibilidad real: con la capacidad por defecto el aviso sería inventado.
export type TimeWarning = {
  taskId: string;
  deadline: string;
  neededMinutes: number;
  availableMinutes: number;
};

export type PriorityResult = {
  ranked: RankedTask[];
  // La «sugerencia de Pandoro para ahora»: la primera pendiente, si hay alguna.
  suggestion: string | null;
  warnings: TimeWarning[];
};

function daysBetween(from: string, to: string) {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  if (!start || !end) return [];
  const count = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return count > 0 ? upcomingDays(start, count) : [];
}

// Minutos de trabajo entre hoy y la fecha límite, ambos incluidos.
function availableMinutes(today: string, deadline: string, availability: Availability | null) {
  const days = daysBetween(today, deadline);
  if (!availability) return days.length * DEFAULT_MINUTES_PER_DAY;
  const open = new Set(availability.days);
  return days.filter((day) => open.has(day)).length * availability.minutesPerDay;
}

function reasonFor(task: PriorityTask, { today, availability }: PriorityContext, available: number): PriorityReason {
  // Las fechas YYYY-MM-DD se comparan bien como texto.
  const scheduledForToday = task.scheduledDate !== null && task.scheduledDate <= today;
  const { deadline, remainingMinutes } = task;
  if (!deadline) return scheduledForToday ? { kind: 'scheduled_today' } : { kind: 'no_deadline' };
  if (deadline < today) return { kind: 'overdue', deadline };

  const slack = available - remainingMinutes;
  const minutesPerDay = availability?.minutesPerDay ?? DEFAULT_MINUTES_PER_DAY;
  if (availability && slack < 0) {
    return { kind: 'not_enough_time', deadline, neededMinutes: remainingMinutes, availableMinutes: available };
  }
  if (deadline === today) return { kind: 'due_today', deadline };
  if (scheduledForToday) return { kind: 'scheduled_today' };
  if (slack < minutesPerDay) return { kind: 'start_today', deadline };
  if (slack < SOON_WORKDAYS * minutesPerDay) return { kind: 'due_soon', deadline };
  return { kind: 'due_later', deadline };
}

function rank(task: PriorityTask, context: PriorityContext): RankedTask {
  const available = task.deadline ? availableMinutes(context.today, task.deadline, context.availability) : null;
  const reason = reasonFor(task, context, available ?? 0);
  return {
    id: task.id,
    level: LEVEL_BY_REASON[reason.kind],
    reason,
    slackMinutes: available === null ? null : available - task.remainingMinutes,
  };
}

// Nivel de urgencia, importancia, la más fácil primero, menor holgura y, al final, el id:
// el mismo conjunto de tareas da siempre el mismo orden.
export function prioritizeTasks(tasks: readonly PriorityTask[], context: PriorityContext): PriorityResult {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const ranked = tasks.map((task) => rank(task, context));

  ranked.sort((first, second) => {
    const a = byId.get(first.id)!;
    const b = byId.get(second.id)!;
    return (
      LEVEL_ORDER.indexOf(first.level) - LEVEL_ORDER.indexOf(second.level)
      || IMPORTANCE_ORDER.indexOf(a.importance) - IMPORTANCE_ORDER.indexOf(b.importance)
      || TASK_DIFFICULTY[a.difficulty].weight - TASK_DIFFICULTY[b.difficulty].weight
      || (first.slackMinutes ?? Infinity) - (second.slackMinutes ?? Infinity)
      || (first.id < second.id ? -1 : first.id > second.id ? 1 : 0)
    );
  });

  const warnings = ranked.flatMap(({ id, reason }) => (
    reason.kind === 'not_enough_time'
      ? [{ taskId: id, deadline: reason.deadline, neededMinutes: reason.neededMinutes, availableMinutes: reason.availableMinutes }]
      : []
  ));
  return { ranked, suggestion: ranked[0]?.id ?? null, warnings };
}

// Textos sin culpa: Pandoro sugiere, no regaña.
export function describeReason(reason: PriorityReason): string {
  switch (reason.kind) {
    case 'overdue':
      return `La fecha límite era el ${formatDay(reason.deadline)}. ¿La reprogramamos?`;
    case 'not_enough_time':
      return `Necesitas ${formatMinutes(reason.neededMinutes)} y hasta el ${formatDay(reason.deadline)} tienes ${formatMinutes(reason.availableMinutes)} libres. ¿La ajustamos?`;
    case 'due_today':
      return 'Vence hoy';
    case 'scheduled_today':
      return 'Estaba en tu plan para hoy';
    case 'start_today':
      return `Conviene empezarla hoy para llegar al ${formatDay(reason.deadline)}`;
    case 'due_soon':
      return `Vence el ${formatDay(reason.deadline)}`;
    case 'due_later':
      return `Tienes tiempo hasta el ${formatDay(reason.deadline)}`;
    case 'no_deadline':
      return 'Sin fecha límite';
  }
}
