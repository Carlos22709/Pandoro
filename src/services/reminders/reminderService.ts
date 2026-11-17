// Recordatorios locales (arquitectura §6.4). Sin dependencias de Expo: recibe un
// adaptador con la forma de expo-notifications para poder probarlo con un simulacro.
import type { TaskItem } from '@/components/tasks/taskTypes';

export type PermissionStatus = { granted: boolean; canAskAgain: boolean };

export type NotificationsAdapter = {
  getPermissionsAsync(): Promise<PermissionStatus>;
  requestPermissionsAsync(): Promise<PermissionStatus>;
  scheduleNotificationAsync(request: {
    identifier: string;
    content: { title: string; body: string; data: Record<string, string> };
    trigger: { type: 'date'; date: Date; channelId?: string };
  }): Promise<string>;
  cancelScheduledNotificationAsync(identifier: string): Promise<void>;
  getAllScheduledNotificationsAsync(): Promise<{ identifier: string }[]>;
};

/** Hora local a la que llega el aviso el día de la tarea. */
export const REMINDER_HOUR = 8;
export const REMINDER_PREFIX = 'pandask-task-';
export const ANDROID_CHANNEL_ID = 'recordatorios';

// Texto genérico a propósito: la notificación se ve en la pantalla bloqueada,
// así que nunca incluye el título ni las notas de la tarea.
export const REMINDER_CONTENT = {
  title: 'Pandask',
  body: 'Tienes una tarea para hoy. Pandoro te espera en la app.',
} as const;

export type ReminderTask = Pick<TaskItem, 'id' | 'completed' | 'dueDate'>;

export function reminderId(taskId: string) {
  return `${REMINDER_PREFIX}${taskId}`;
}

/** Fecha y hora del aviso, o null si la tarea no tiene día o ya pasó. */
export function reminderDate(dueDate: string | undefined, now: Date): Date | null {
  const match = dueDate ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate) : null;
  if (!match) return null;
  const at = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), REMINDER_HOUR, 0, 0, 0);
  if (Number.isNaN(at.getTime()) || at.getMonth() !== Number(match[2]) - 1) return null;
  return at.getTime() > now.getTime() ? at : null;
}

export type SyncResult = 'scheduled' | 'disabled' | 'denied' | 'unsupported';

export function createReminderService(notifications: NotificationsAdapter | null, now: () => Date = () => new Date()) {
  async function ensurePermission(): Promise<boolean> {
    if (!notifications) return false;
    const current = await notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await notifications.requestPermissionsAsync()).granted;
  }

  async function cancelAll(): Promise<void> {
    if (!notifications) return;
    const scheduled = await notifications.getAllScheduledNotificationsAsync();
    await Promise.all(scheduled
      .filter((request) => request.identifier.startsWith(REMINDER_PREFIX))
      .map((request) => notifications.cancelScheduledNotificationAsync(request.identifier)));
  }

  async function cancelTaskReminder(taskId: string): Promise<void> {
    await notifications?.cancelScheduledNotificationAsync(reminderId(taskId));
  }

  /** Reprograma el aviso de una tarea; lo quita si ya no aplica. */
  async function scheduleTaskReminder(task: ReminderTask): Promise<boolean> {
    if (!notifications) return false;
    await cancelTaskReminder(task.id);
    const date = task.completed ? null : reminderDate(task.dueDate, now());
    if (!date) return false;
    await notifications.scheduleNotificationAsync({
      identifier: reminderId(task.id),
      content: { ...REMINDER_CONTENT, data: { taskId: task.id } },
      trigger: { type: 'date', date, channelId: ANDROID_CHANNEL_ID },
    });
    return true;
  }

  /** Deja programados exactamente los avisos de las tareas pendientes con fecha futura. */
  async function syncReminders(tasks: readonly ReminderTask[], enabled: boolean): Promise<SyncResult> {
    if (!notifications) return 'unsupported';
    if (!enabled) {
      await cancelAll();
      return 'disabled';
    }
    const due = tasks.filter((task) => !task.completed && reminderDate(task.dueDate, now()));
    // El permiso se pide solo cuando hay algo que recordar, la primera vez.
    if (due.length && !(await ensurePermission())) {
      await cancelAll();
      return 'denied';
    }
    await cancelAll();
    for (const task of due) await scheduleTaskReminder(task);
    return 'scheduled';
  }

  return { ensurePermission, scheduleTaskReminder, cancelTaskReminder, cancelAll, syncReminders };
}

function localDay(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Aviso en la app para la web, donde no hay notificaciones programadas. */
export function upcomingNotice(tasks: readonly ReminderTask[], now: Date): string | null {
  const today = localDay(now);
  const tomorrow = localDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const pending = tasks.filter((task) => !task.completed);
  const forToday = pending.filter((task) => task.dueDate === today).length;
  const forTomorrow = pending.filter((task) => task.dueDate === tomorrow).length;
  if (forToday) return forToday === 1 ? 'Tienes 1 tarea para hoy.' : `Tienes ${forToday} tareas para hoy.`;
  if (forTomorrow) return forTomorrow === 1 ? 'Mañana tienes 1 tarea.' : `Mañana tienes ${forTomorrow} tareas.`;
  return null;
}
