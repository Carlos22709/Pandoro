import { addWeeks, weekKey } from './weeks';

// Metadatos del progreso semanal (users/{uid}/progress/world).
export type ProgressMeta = {
  // Última semana cerrada cuyo cierre ya vio el usuario; null si todavía no hay ninguna.
  lastAcknowledgedWeekKey: string | null;
  // Semanas que ya dieron un lugar nuevo. Un lugar ganado no se revierte.
  unlockedWeeks: string[];
};

export const EMPTY_PROGRESS_META: ProgressMeta = {
  lastAcknowledgedWeekKey: null,
  unlockedWeeks: [],
};

// Semana anterior a la de `today`: la última que puede estar cerrada.
export function lastClosedWeekKey(today: Date) {
  return addWeeks(weekKey(today), -1);
}
