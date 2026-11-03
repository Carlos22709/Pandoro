import type { TaskDifficulty } from '@/components/tasks/taskTypes';

import { parseIsoDate } from '@/services/planning/planDates';
import type { PlanRevision } from '@/services/planning/planLogic';
import type { PlanActivity, PlanPriority, PlanSubtask } from '@/services/planning/planTypes';

// Contrato de salida. Gemini lo aplica en la generación, pero parsePlanResponse lo revalida:
// el esquema no garantiza valores coherentes y una respuesta cortada no llega a cumplirlo.
const nullableString = { type: ['string', 'null'] };

export const PLAN_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['plan', 'needs_clarification'] },
    clarificationQuestion: nullableString,
    summary: { type: 'string' },
    activities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          deadline: { ...nullableString, description: 'YYYY-MM-DD, solo si el usuario la mencionó.' },
          deadlineQuote: { ...nullableString, description: 'Texto exacto del usuario que indica la fecha.' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          prioritySource: { type: 'string', enum: ['user', 'inferred'] },
          difficulty: { type: 'string', enum: ['light', 'medium', 'high'] },
          subtasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                durationMinutes: { type: 'integer' },
                difficulty: { type: 'string', enum: ['light', 'medium', 'high'] },
                dependsOn: { type: 'array', items: { type: 'string' } },
                scheduledDate: nullableString,
                order: { type: 'integer' },
              },
              required: ['id', 'title', 'description', 'durationMinutes', 'difficulty', 'dependsOn', 'scheduledDate', 'order'],
            },
          },
        },
        required: ['id', 'title', 'description', 'deadline', 'deadlineQuote', 'priority', 'prioritySource', 'difficulty', 'subtasks'],
      },
    },
    removedIds: { type: 'array', items: { type: 'string' } },
    overriddenManualFields: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, field: { type: 'string' } },
        required: ['id', 'field'],
      },
    },
    unavailableDates: { type: 'array', items: { type: 'string' } },
  },
  required: ['status', 'clarificationQuestion', 'summary', 'activities', 'removedIds', 'overriddenManualFields', 'unavailableDates'],
};

export type ParsedPlanResponse =
  | { kind: 'clarification'; question: string }
  | { kind: 'plan'; revision: PlanRevision; unavailableDates: string[] };

export class PlanResponseError extends Error {}

type Dictionary = Record<string, unknown>;

const DIFFICULTIES: TaskDifficulty[] = ['light', 'medium', 'high'];
const PRIORITIES: PlanPriority[] = ['high', 'medium', 'low'];
const MAX_MINUTES = 24 * 60;

function isDictionary(value: unknown): value is Dictionary {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) throw new PlanResponseError('Falta un texto obligatorio.');
  return value.trim();
}

function optionalText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function oneOf<T extends string>(value: unknown, options: T[]) {
  if (!options.includes(value as T)) throw new PlanResponseError('Valor fuera de la escala.');
  return value as T;
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function uniqueId(raw: unknown, used: Set<string>, fallback: string) {
  let id = optionalText(raw).replace(/[^A-Za-z0-9_-]/g, '') || fallback;
  for (let suffix = 2; used.has(id); suffix += 1) id = `${fallback}-${suffix}`;
  used.add(id);
  return id;
}

function normalize(text: string) {
  return text.toLocaleLowerCase('es').replace(/\s+/g, ' ').trim();
}

function parseSubtask(raw: unknown, used: Set<string>, position: number): PlanSubtask {
  if (!isDictionary(raw)) throw new PlanResponseError('Subtarea mal formada.');
  const durationMinutes = raw.durationMinutes;
  if (
    typeof durationMinutes !== 'number'
    || !Number.isFinite(durationMinutes)
    || durationMinutes <= 0
    || durationMinutes > MAX_MINUTES
  ) {
    throw new PlanResponseError('Duración fuera de rango.');
  }
  const scheduledDate = typeof raw.scheduledDate === 'string' && parseIsoDate(raw.scheduledDate)
    ? raw.scheduledDate
    : null;
  return {
    id: uniqueId(raw.id, used, `sub-${position}`),
    title: requiredText(raw.title),
    description: optionalText(raw.description),
    durationMinutes: Math.round(durationMinutes),
    difficulty: oneOf(raw.difficulty, DIFFICULTIES),
    dependsOn: stringList(raw.dependsOn),
    scheduledDate,
    order: typeof raw.order === 'number' ? raw.order : position,
    editedFields: [],
  };
}

function parseActivity(raw: unknown, sources: string[], used: Set<string>, usedSubtasks: Set<string>, position: number): PlanActivity {
  if (!isDictionary(raw)) throw new PlanResponseError('Actividad mal formada.');
  if (!Array.isArray(raw.subtasks) || !raw.subtasks.length) throw new PlanResponseError('Actividad sin subtareas.');

  // Una fecha límite solo se admite si puede citarse del texto del usuario.
  const quote = normalize(optionalText(raw.deadlineQuote));
  const confirmed = Boolean(quote) && sources.some((source) => normalize(source).includes(quote));
  const deadline = confirmed && typeof raw.deadline === 'string' && parseIsoDate(raw.deadline) ? raw.deadline : null;

  return {
    id: uniqueId(raw.id, used, `act-${position}`),
    title: requiredText(raw.title),
    description: optionalText(raw.description),
    deadline,
    priority: oneOf(raw.priority, PRIORITIES),
    prioritySource: raw.prioritySource === 'user' ? 'user' : 'inferred',
    difficulty: oneOf(raw.difficulty, DIFFICULTIES),
    subtasks: raw.subtasks.map((item, index) => parseSubtask(item, usedSubtasks, usedSubtasks.size + index + 1)),
    editedFields: [],
  };
}

export function parsePlanResponse(rawText: string, sources: string[]): ParsedPlanResponse {
  let data: unknown;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new PlanResponseError('JSON inválido.');
  }
  if (!isDictionary(data)) throw new PlanResponseError('La respuesta no es un objeto.');

  if (data.status === 'needs_clarification') {
    return { kind: 'clarification', question: requiredText(data.clarificationQuestion) };
  }
  if (data.status !== 'plan') throw new PlanResponseError('Estado desconocido.');
  if (!Array.isArray(data.activities) || !data.activities.length) throw new PlanResponseError('Plan vacío.');

  const usedActivities = new Set<string>();
  const usedSubtasks = new Set<string>();
  const activities = data.activities.map((item, index) => (
    parseActivity(item, sources, usedActivities, usedSubtasks, index + 1)
  ));

  // Las dependencias hacia subtareas inexistentes no significan nada para el calendario.
  for (const activity of activities) {
    for (const subtask of activity.subtasks) {
      subtask.dependsOn = subtask.dependsOn.filter((id) => usedSubtasks.has(id) && id !== subtask.id);
    }
  }

  const overrides = Array.isArray(data.overriddenManualFields) ? data.overriddenManualFields : [];
  return {
    kind: 'plan',
    revision: {
      summary: optionalText(data.summary),
      activities,
      removedIds: stringList(data.removedIds),
      overriddenManualFields: overrides.filter(isDictionary).map((item) => ({
        id: optionalText(item.id),
        field: optionalText(item.field),
      })),
    },
    unavailableDates: stringList(data.unavailableDates).filter((item) => parseIsoDate(item)),
  };
}
