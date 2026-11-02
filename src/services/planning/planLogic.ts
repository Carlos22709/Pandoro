import type { TaskItem } from '@/components/tasks/taskTypes';

import { formatDay, formatMinutes } from './planDates';
import type {
  ActivityField,
  Availability,
  PlanActivity,
  PlanIssue,
  PlanProposal,
  PlanSubtask,
  SubtaskField,
} from './planTypes';

const SUBTASK_FIELDS: SubtaskField[] = ['title', 'description', 'durationMinutes', 'difficulty', 'scheduledDate'];
const ACTIVITY_FIELDS: ActivityField[] = ['title', 'description', 'difficulty', 'deadline', 'priority'];

export type ManualOverride = { id: string; field: string };

export type PlanRevision = {
  summary: string;
  activities: PlanActivity[];
  removedIds: string[];
  overriddenManualFields: ManualOverride[];
};

function allSubtasks(proposal: PlanProposal) {
  return proposal.activities.flatMap((activity) => activity.subtasks);
}

function withoutField<T>(fields: T[], field: T) {
  return fields.filter((item) => item !== field);
}

function mergeEdits<T extends { id: string }, F extends string>(
  incoming: T,
  previous: T & { editedFields: F[] },
  fields: F[],
  overrides: ManualOverride[],
) {
  const merged = { ...incoming, editedFields: [...previous.editedFields] } as T & { editedFields: F[] };
  for (const field of fields) {
    if (!previous.editedFields.includes(field)) continue;
    const overridden = overrides.some((item) => item.id === incoming.id && item.field === field);
    if (overridden) merged.editedFields = withoutField(merged.editedFields, field);
    else (merged as Record<string, unknown>)[field] = (previous as Record<string, unknown>)[field];
  }
  return merged;
}

// Une la respuesta de la IA con la propuesta actual: lo corregido a mano se conserva salvo que
// la IA declare que la instrucción lo exige, y nada desaparece sin haberse retirado explícitamente.
export function mergeRevision(previous: PlanProposal, revision: PlanRevision) {
  const previousSubtasks = new Map(allSubtasks(previous).map((item) => [item.id, item]));
  const previousActivities = new Map(previous.activities.map((item) => [item.id, item]));
  const removed = new Set(revision.removedIds);
  const seen = new Set<string>();

  const activities = revision.activities.map((activity) => {
    const before = previousActivities.get(activity.id);
    const base = before
      ? mergeEdits(activity, before, ACTIVITY_FIELDS, revision.overriddenManualFields)
      : activity;
    seen.add(activity.id);
    return {
      ...base,
      subtasks: activity.subtasks.map((subtask) => {
        seen.add(subtask.id);
        const old = previousSubtasks.get(subtask.id);
        return old ? mergeEdits(subtask, old, SUBTASK_FIELDS, revision.overriddenManualFields) : subtask;
      }),
    };
  });

  let restored = 0;
  for (const activity of previous.activities) {
    if (removed.has(activity.id)) continue;
    if (!seen.has(activity.id)) {
      const subtasks = activity.subtasks.filter((item) => !removed.has(item.id) && !seen.has(item.id));
      if (!subtasks.length) continue;
      subtasks.forEach((item) => seen.add(item.id));
      restored += subtasks.length;
      activities.push({ ...activity, subtasks });
      continue;
    }
    const missing = activity.subtasks.filter((item) => !removed.has(item.id) && !seen.has(item.id));
    if (!missing.length) continue;
    missing.forEach((item) => seen.add(item.id));
    restored += missing.length;
    const target = activities.find((item) => item.id === activity.id);
    target?.subtasks.push(...missing);
  }

  const proposal: PlanProposal = {
    ...previous,
    summary: revision.summary,
    activities,
    revision: previous.revision + 1,
  };
  return { proposal, restored };
}

export function updateActivity(
  proposal: PlanProposal,
  activityId: string,
  patch: Partial<Pick<PlanActivity, ActivityField>>,
): PlanProposal {
  const fields = Object.keys(patch) as ActivityField[];
  return {
    ...proposal,
    activities: proposal.activities.map((activity) => (
      activity.id === activityId
        ? {
            ...activity,
            ...patch,
            prioritySource: patch.priority ? 'user' : activity.prioritySource,
            editedFields: [...new Set([...activity.editedFields, ...fields])],
          }
        : activity
    )),
  };
}

export function updateSubtask(
  proposal: PlanProposal,
  subtaskId: string,
  patch: Partial<Pick<PlanSubtask, SubtaskField>>,
): PlanProposal {
  const fields = Object.keys(patch) as SubtaskField[];
  return {
    ...proposal,
    activities: proposal.activities.map((activity) => ({
      ...activity,
      subtasks: activity.subtasks.map((subtask) => (
        subtask.id === subtaskId
          ? { ...subtask, ...patch, editedFields: [...new Set([...subtask.editedFields, ...fields])] }
          : subtask
      )),
    })),
  };
}

export function removeActivity(proposal: PlanProposal, activityId: string): PlanProposal {
  return { ...proposal, activities: proposal.activities.filter((item) => item.id !== activityId) };
}

export function removeSubtask(proposal: PlanProposal, subtaskId: string): PlanProposal {
  const activities = proposal.activities
    .map((activity) => ({
      ...activity,
      subtasks: activity.subtasks
        .filter((item) => item.id !== subtaskId)
        .map((item) => ({ ...item, dependsOn: item.dependsOn.filter((id) => id !== subtaskId) })),
    }))
    .filter((activity) => activity.subtasks.length > 0);
  return { ...proposal, activities };
}

export function addSubtask(proposal: PlanProposal, activityId: string, id: string): PlanProposal {
  const subtask: PlanSubtask = {
    id,
    title: '',
    description: '',
    durationMinutes: 30,
    difficulty: 'medium',
    dependsOn: [],
    scheduledDate: null,
    order: allSubtasks(proposal).length + 1,
    editedFields: [...SUBTASK_FIELDS],
  };
  return {
    ...proposal,
    activities: proposal.activities.map((activity) => (
      activity.id === activityId ? { ...activity, subtasks: [...activity.subtasks, subtask] } : activity
    )),
  };
}

export function sortByPlan(first: PlanSubtask, second: PlanSubtask) {
  if (first.scheduledDate !== second.scheduledDate) {
    if (!first.scheduledDate) return 1;
    if (!second.scheduledDate) return -1;
    return first.scheduledDate.localeCompare(second.scheduledDate);
  }
  return first.order - second.order;
}

export function planByDay(proposal: PlanProposal) {
  const entries = proposal.activities
    .flatMap((activity) => activity.subtasks.map((subtask) => ({ activity, subtask })))
    .sort((first, second) => sortByPlan(first.subtask, second.subtask));
  const days = new Map<string, typeof entries>();
  for (const entry of entries) {
    const key = entry.subtask.scheduledDate ?? '';
    days.set(key, [...(days.get(key) ?? []), entry]);
  }
  return [...days.entries()].map(([date, items]) => ({
    date: date || null,
    items,
    minutes: items.reduce((total, item) => total + item.subtask.durationMinutes, 0),
  }));
}

export function activityMinutes(activity: PlanActivity) {
  return activity.subtasks.reduce((total, item) => total + item.durationMinutes, 0);
}

// Se calcula aquí y no se confía en la IA: así los avisos siguen correctos tras cada edición manual.
export function analyzeProposal(proposal: PlanProposal, availability: Availability) {
  const issues: PlanIssue[] = [];
  const subtasks = allSubtasks(proposal);
  const byId = new Map(subtasks.map((item) => [item.id, item]));
  const available = new Set(availability.days);

  for (const activity of proposal.activities) {
    if (!activity.title.trim()) {
      issues.push({ kind: 'incomplete', message: 'Hay una actividad sin nombre.', blocking: true });
    }
    for (const subtask of activity.subtasks) {
      if (!subtask.title.trim()) {
        issues.push({ kind: 'incomplete', message: `Hay una subtarea sin nombre en «${activity.title}».`, blocking: true });
      }
      if (subtask.durationMinutes <= 0) {
        issues.push({
          kind: 'incomplete',
          message: `«${subtask.title || 'Subtarea'}» necesita una duración mayor que cero.`,
          blocking: true,
        });
      }
      if (!subtask.scheduledDate || !available.has(subtask.scheduledDate)) {
        issues.push({
          kind: 'unscheduled',
          message: `«${subtask.title || 'Subtarea'}» no cabe en ninguno de tus días disponibles.`,
          blocking: false,
        });
      }
      if (activity.deadline && subtask.scheduledDate && subtask.scheduledDate > activity.deadline) {
        issues.push({
          kind: 'after_deadline',
          message: `«${subtask.title}» queda después de la fecha límite (${formatDay(activity.deadline)}).`,
          blocking: false,
        });
      }
      for (const dependencyId of subtask.dependsOn) {
        const dependency = byId.get(dependencyId);
        if (!dependency?.scheduledDate || !subtask.scheduledDate) continue;
        if (sortByPlan(dependency, subtask) > 0) {
          issues.push({
            kind: 'dependency_order',
            message: `«${subtask.title}» está antes de «${dependency.title}», y depende de ella.`,
            blocking: false,
          });
        }
      }
    }
  }

  const scheduledDays = planByDay(proposal).filter((day) => day.date);
  for (const day of scheduledDays) {
    if (day.minutes > availability.minutesPerDay) {
      issues.push({
        kind: 'day_overload',
        message: `El ${formatDay(day.date as string)} tiene ${formatMinutes(day.minutes)} y solo dispones de ${formatMinutes(availability.minutesPerDay)}.`,
        blocking: false,
      });
    }
  }

  const needed = subtasks.reduce((total, item) => total + item.durationMinutes, 0);
  const capacity = availability.days.length * availability.minutesPerDay;
  if (needed > capacity) {
    issues.push({
      kind: 'total_overload',
      message: `El trabajo suma ${formatMinutes(needed)} y tus días disponibles dan ${formatMinutes(capacity)}. Ninguna tarea se ocultó: decide qué recortar o agrega días.`,
      blocking: false,
    });
  }

  if (scheduledDays.length === 1 && availability.days.length > 1 && subtasks.length > 1) {
    issues.push({
      kind: 'concentrated',
      message: 'Todo quedó en un solo día aunque tienes más días disponibles.',
      blocking: false,
    });
  }

  return issues;
}

export function plannedTaskId(proposalId: string, subtaskId: string) {
  return `plan-${proposalId}-${subtaskId}`;
}

// Cada subtarea es una fila de la lista: tiene su propio día, duración, dificultad y huella para completar.
export function proposalToTasks(proposal: PlanProposal, firstPriority: number): TaskItem[] {
  return planByDay(proposal)
    .flatMap((day) => day.items)
    .map(({ activity, subtask }, index) => ({
      id: plannedTaskId(proposal.id, subtask.id),
      title: subtask.title.trim(),
      detail: `${subtask.scheduledDate ? formatDay(subtask.scheduledDate) : 'Sin día'} · ${activity.title.trim()}`,
      duration: formatMinutes(subtask.durationMinutes),
      notes: [
        subtask.description.trim(),
        activity.deadline ? `Fecha límite: ${formatDay(activity.deadline)}` : '',
      ].filter(Boolean).join(' · ') || undefined,
      priority: firstPriority + index,
      tone: 'blue',
      icon: 'checklist',
      difficulty: subtask.difficulty,
      completed: false,
    }));
}
