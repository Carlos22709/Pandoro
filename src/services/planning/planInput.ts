// Validación de lo que se envía al planificador desde Nueva tarea.
export const MAX_MINUTES_PER_DAY = 16 * 60;

/** Mensaje si los minutos por día no sirven; null si están bien. */
export function minutesPerDayProblem(value: string): string | null {
  const text = value.trim();
  if (!text) return 'Escribe cuántos minutos tienes por día.';
  if (!/^\d+$/.test(text)) return 'Escribe solo el número de minutos, por ejemplo 60.';
  const minutes = Number(text);
  if (minutes < 10) return 'Necesitas al menos 10 minutos por día para planear algo.';
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
