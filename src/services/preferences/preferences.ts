// Preferencias de Ajustes que de verdad cambian algo en la app. Se guardan en users/{uid}.preferences.
// Las claves son nuevas a propósito: versiones anteriores guardaban interruptores que no hacían nada
// (por ejemplo, reduceMotion venía activado por defecto) y esos valores no deben heredarse.
import { DEFAULT_REMINDER_HOUR, normalizeReminderHour } from '@/services/reminders/reminderService';

export type AppPreferences = {
  // Activado: sin animaciones en toda la app. Apagado: se sigue el ajuste del sistema.
  reducedMotion: boolean;
  // El globo con lo que dice Pandoro en Inicio.
  pandoroBubble: boolean;
  // Aviso el día de cada tarea, a la hora elegida (en la web, el aviso al abrir la app).
  taskReminders: boolean;
  // Hora local del aviso diario (0–23). Por defecto las 8:00 a. m.
  reminderHour: number;
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  reducedMotion: false,
  pandoroBubble: true,
  taskReminders: true,
  reminderHour: DEFAULT_REMINDER_HOUR,
};

const BOOLEAN_KEYS = ['reducedMotion', 'pandoroBubble', 'taskReminders'] as const;

// Lo guardado completa los valores por defecto; las claves antiguas o desconocidas se ignoran.
export function preferencesFrom(saved: Record<string, unknown> | undefined): AppPreferences {
  const next: AppPreferences = { ...DEFAULT_PREFERENCES };
  if (!saved) return next;
  for (const key of BOOLEAN_KEYS) {
    if (typeof saved[key] === 'boolean') next[key] = saved[key];
  }
  if (typeof saved.reminderHour === 'number') next.reminderHour = normalizeReminderHour(saved.reminderHour);
  return next;
}
