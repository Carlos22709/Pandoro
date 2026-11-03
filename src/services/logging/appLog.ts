// Registro básico de eventos y errores (fila 32 del cronograma).
// Ley 1581: aquí nunca entra lo que escribe o dice el usuario. Solo nombres de evento de una
// lista cerrada, la hora, la pantalla y, para errores, un código y un mensaje saneado.
// Los registros viven en memoria (últimos 200) y, en desarrollo, salen por consola. No se suben.

export const LOG_EVENTS = [
  'app_started',
  'screen_view',
  'ai_suggestion_requested',
  'ai_suggestion_received',
  'ai_clarification_requested',
  'ai_suggestion_failed',
  'auth_error',
  'unhandled_error',
  'render_error',
] as const;

export type LogEvent = (typeof LOG_EVENTS)[number];
export type LogLevel = 'info' | 'error';

export type LogEntry = {
  event: LogEvent;
  level: LogLevel;
  at: string;
  screen?: string;
  code?: string;
  message?: string;
};

const MAX_ENTRIES = 200;
const MAX_MESSAGE = 120;
const entries: LogEntry[] = [];

// Quita correos, números largos (teléfonos, cédulas), URLs y comillas con contenido, que es
// donde suele colarse texto del usuario, y corta el mensaje.
export function sanitizeMessage(raw: unknown): string {
  const text = typeof raw === 'string' ? raw : raw instanceof Error ? raw.message : '';
  return text
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[correo]')
    .replace(/https?:\/\/\S+/g, '[url]')
    .replace(/(["'«“])[^"'»”]*(["'»”])/g, '[texto]')
    .replace(/\+?\d[\d\s.\-]{5,}\d/g, '[número]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_MESSAGE);
}

// Códigos tipo "auth/invalid-credential" o "fetch-error"; cualquier otra cosa se descarta.
export function sanitizeCode(raw: unknown): string | undefined {
  return typeof raw === 'string' && /^[a-z0-9_\-/]{1,60}$/i.test(raw) ? raw : undefined;
}

// Rutas como /hablar o /(tabs)/inicio; segmentos con números o arrobas se ocultan.
export function sanitizeScreen(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  return raw
    .split('/')
    .map((part) => (/^[a-z()\-_]*$/i.test(part) ? part : ':id'))
    .join('/')
    .slice(0, 60);
}

function isDev() {
  return typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
}

function record(entry: LogEntry) {
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
  if (isDev() && process.env.NODE_ENV !== 'test') {
    (entry.level === 'error' ? console.warn : console.log)('[pandask]', entry.event, entry);
  }
}

export function logEvent(event: LogEvent, details: { screen?: string } = {}) {
  record({ event, level: 'info', at: new Date().toISOString(), screen: sanitizeScreen(details.screen) });
}

export function logError(event: LogEvent, error: unknown, details: { screen?: string } = {}) {
  const code = sanitizeCode((error as { code?: unknown } | null)?.code);
  record({
    event,
    level: 'error',
    at: new Date().toISOString(),
    screen: sanitizeScreen(details.screen),
    code,
    message: sanitizeMessage(error) || undefined,
  });
}

export function getLogEntries(): readonly LogEntry[] {
  return [...entries];
}

export function clearLogEntries() {
  entries.length = 0;
}

let installed = false;

// Captura errores no manejados de JS (nativo: ErrorUtils; web: window error/unhandledrejection).
export function installGlobalErrorCapture() {
  if (installed) return;
  installed = true;
  const errorUtils = (globalThis as { ErrorUtils?: { getGlobalHandler(): (e: unknown, fatal?: boolean) => void; setGlobalHandler(h: (e: unknown, fatal?: boolean) => void): void } }).ErrorUtils;
  if (errorUtils) {
    const previous = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error, fatal) => {
      logError('unhandled_error', error);
      previous(error, fatal);
    });
  }
  const target = globalThis as { addEventListener?: (type: string, listener: (event: any) => void) => void };
  if (typeof target.addEventListener === 'function' && typeof document !== 'undefined') {
    target.addEventListener('error', (event) => logError('unhandled_error', event?.error ?? event?.message));
    target.addEventListener('unhandledrejection', (event) => logError('unhandled_error', event?.reason));
  }
}
