// Validación de lo que se envía al planificador desde Nueva tarea.
export const MAX_MINUTES_PER_DAY = 16 * 60;
export const MIN_MINUTES_PER_DAY = 15;

// El usuario escribe horas por día («2», «1,5» o «0.5»); el planificador trabaja en minutos.
const HOURS_PATTERN = /^(\d{1,2})(?:[.,](\d{1,2}))?$/;

/** Horas por día escritas (con coma o punto) a minutos; NaN si no es un número claro. */
export function hoursToMinutes(value: string): number {
  const match = HOURS_PATTERN.exec(value.trim());
  if (!match) return Number.NaN;
  return Math.round(Number(`${match[1]}.${match[2] ?? '0'}`) * 60);
}

/** Mensaje si las horas por día no sirven; null si están bien. */
export function hoursPerDayProblem(value: string): string | null {
  const text = value.trim();
  if (!text) return 'Escribe cuántas horas tienes por día.';
  const minutes = hoursToMinutes(text);
  if (Number.isNaN(minutes)) return 'Escribe solo el número de horas, por ejemplo 2 o 1,5.';
  if (minutes < MIN_MINUTES_PER_DAY) return 'Necesitas al menos 0,25 horas (15 minutos) por día para planear algo.';
  if (minutes > MAX_MINUTES_PER_DAY) return 'Eso es más de 16 horas al día. Escribe un tiempo que de verdad tengas libre.';
  return null;
}

/** Mensaje si el texto de responsabilidades no se puede planear; null si está bien. */
export function planTextProblem(value: string, maxLength: number): string | null {
  const text = value.trim();
  if (!text) return 'Cuéntame qué tienes pendiente.';
  if (text.length > maxLength) return `El texto puede tener hasta ${maxLength} caracteres. Resúmelo un poco.`;
  if (!/\p{L}{2,}/u.test(text)) return 'Cuéntame con palabras qué tienes pendiente.';
  return null;
}
