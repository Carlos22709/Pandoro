// Validación de lo que la persona escribe a mano en una tarea. Sin dependencias
// de React para poder probarla directamente.
import type { TaskDraft } from '@/components/tasks/taskTypes';

export const MAX_TITLE_LENGTH = 120;
export const MAX_DETAIL_LENGTH = 80;
export const MAX_TASK_MINUTES = 12 * 60;

export const DURATION_HINT = 'No entendí la duración. Escríbela como «30 min», «1 h» o «1 h 30».';

/**
 * Convierte una duración escrita a minutos. Acepta «30», «30 min», «1 h», «1h30»,
 * «1 h 30 min», «1,5 horas» y «1:30». Devuelve null si es ambigua o no es una duración.
 */
export function parseDurationMinutes(input: string): number | null {
  const text = input.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!text) return null;
  const clock = /^(\d{1,2}):([0-5]\d)$/.exec(text);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
  const minutesOnly = /^(\d{1,4}) ?(m|min|mins|minuto|minutos)?\.?$/.exec(text);
  if (minutesOnly) return Number(minutesOnly[1]);
  const hours = /^(\d{1,2}(?:[.,]\d{1,2})?) ?(h|hr|hrs|hora|horas)\.?(?: ?y?(?: ?(\d{1,2}) ?(m|min|mins|minuto|minutos)?\.?))?$/.exec(text);
  if (hours) {
    const whole = Number(hours[1].replace(',', '.'));
    const extra = hours[3] ? Number(hours[3]) : 0;
    if (hours[3] && !Number.isInteger(whole)) return null;
    if (extra >= 60) return null;
    return Math.round(whole * 60) + extra;
  }
  return null;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export type TaskValidation = { ok: true; draft: TaskDraft } | { ok: false; error: string };

export function validateTaskDraft(draft: TaskDraft): TaskValidation {
  const title = draft.title.replace(/\s+/g, ' ').trim();
  if (!title) return { ok: false, error: 'Escribe el nombre de la tarea.' };
  if (!/[\p{L}\p{N}]/u.test(title)) return { ok: false, error: 'El nombre necesita al menos una letra o un número.' };
  if (title.length > MAX_TITLE_LENGTH) {
    return { ok: false, error: `El nombre puede tener hasta ${MAX_TITLE_LENGTH} caracteres.` };
  }
  const detail = draft.detail.trim();
  if (detail.length > MAX_DETAIL_LENGTH) {
    return { ok: false, error: `La fecha u hora puede tener hasta ${MAX_DETAIL_LENGTH} caracteres.` };
  }
  let duration: string | undefined;
  if (draft.duration?.trim()) {
    const minutes = parseDurationMinutes(draft.duration);
    if (minutes === null) return { ok: false, error: DURATION_HINT };
    if (minutes < 1 || minutes > MAX_TASK_MINUTES) {
      return { ok: false, error: 'La duración debe estar entre 1 minuto y 12 horas. Si es más larga, divídela en partes.' };
    }
    duration = formatMinutes(minutes);
  }
  return { ok: true, draft: { ...draft, title, detail: detail || 'Sin fecha', duration } };
}
