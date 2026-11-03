const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const WEEKDAYS_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Fechas locales: toISOString() usa UTC y por la noche devolvería el día siguiente en Colombia.
export function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  const valid = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return valid ? date : null;
}

export function upcomingDays(from: Date, count: number) {
  return Array.from({ length: count }, (_, offset) => (
    toIsoDate(new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset))
  ));
}

export function weekdayShort(value: string) {
  const date = parseIsoDate(value);
  return date ? WEEKDAYS[date.getDay()] : value;
}

export function weekdayLong(value: string) {
  const date = parseIsoDate(value);
  return date ? WEEKDAYS_LONG[date.getDay()] : value;
}

export function dayNumber(value: string) {
  return parseIsoDate(value)?.getDate() ?? 0;
}

export function formatDay(value: string) {
  const date = parseIsoDate(value);
  if (!date) return value;
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
