// Preferencias de Ajustes que de verdad cambian algo en la app. Se guardan en users/{uid}.preferences.
// Las claves son nuevas a propósito: versiones anteriores guardaban interruptores que no hacían nada
// (por ejemplo, reduceMotion venía activado por defecto) y esos valores no deben heredarse.
export type AppPreferences = {
  // Activado: sin animaciones en toda la app. Apagado: se sigue el ajuste del sistema.
  reducedMotion: boolean;
  // El globo con lo que dice Pandoro en Inicio.
  pandoroBubble: boolean;
  // Aviso a las 8:00 a. m. el día de cada tarea (en la web, el aviso al abrir la app).
  taskReminders: boolean;
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  reducedMotion: false,
  pandoroBubble: true,
  taskReminders: true,
};

const KEYS = Object.keys(DEFAULT_PREFERENCES) as (keyof AppPreferences)[];

// Lo guardado completa los valores por defecto; las claves antiguas o desconocidas se ignoran.
export function preferencesFrom(saved: Record<string, unknown> | undefined): AppPreferences {
  const known = KEYS.filter((key) => typeof saved?.[key] === 'boolean').map((key) => [key, saved?.[key]]);
  return { ...DEFAULT_PREFERENCES, ...Object.fromEntries(known) };
}
