import { parseIsoDate, toIsoDate } from '@/services/planning/planDates';

// Semana viva: lunes 00:00 a domingo 23:59:59, hora local del dispositivo. Todo se calcula por
// fecha de calendario (nunca sumando 7×24 h, que se desfasa con los cambios de hora).
// Estas funciones no leen el reloj: reciben la fecha que deben evaluar.

export function weekStart(date: Date) {
  const sinceMonday = (date.getDay() + 6) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - sinceMonday);
}

export function weekEnd(date: Date) {
  const start = weekStart(date);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999);
}

// El identificador de la semana es la fecha ISO de su lunes.
export function weekKey(date: Date) {
  return toIsoDate(weekStart(date));
}

export function isSameWeek(first: Date, second: Date) {
  return weekKey(first) === weekKey(second);
}

export function weekKeyOfIso(value: string) {
  const date = parseIsoDate(value);
  return date ? weekKey(date) : null;
}

// Último día (ISO) de la semana que empieza en `key`.
export function weekEndIso(key: string) {
  const start = parseIsoDate(key);
  return start ? toIsoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)) : null;
}

export function addWeeks(key: string, weeks: number) {
  const start = parseIsoDate(key);
  return start
    ? toIsoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + weeks * 7))
    : null;
}
