import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import { useTasks } from '@/components/tasks/TasksProvider';
import { watchPreferences } from '@/services/data/userRepository';
import { reminderService, remindersSupported } from '@/services/reminders/expoNotifications';
import {
  DEFAULT_REMINDER_HOUR,
  normalizeReminderHour,
  upcomingNotice,
  type SyncResult,
} from '@/services/reminders/reminderService';

type RemindersValue = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  hour: number;
  setHour: (hour: number) => void;
  status: SyncResult | null;
  supported: boolean;
  // En la web no hay avisos programados: Pandoro avisa al abrir la app.
  webNotice: string | null;
};

const RemindersContext = createContext<RemindersValue | null>(null);

export function RemindersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const { tasks } = useTasks();
  const [enabled, setEnabled] = useState(true);
  const [hour, setHourState] = useState(DEFAULT_REMINDER_HOUR);
  const [status, setStatus] = useState<SyncResult | null>(null);

  const setHour = (next: number) => setHourState(normalizeReminderHour(next));

  // La hora se guarda en users/{uid}.preferences.reminderHour, junto al resto de Ajustes.
  useEffect(() => {
    setHourState(DEFAULT_REMINDER_HOUR);
    if (!uid) return;
    return watchPreferences(uid, (saved) => {
      if (typeof saved.reminderHour === 'number') setHourState(saved.reminderHour);
    });
  }, [uid]);

  // Cada vez que se guarda, reprograma o termina una tarea, o cambia la hora, se recalculan los avisos.
  const schedule = useMemo(
    () => tasks.map(({ id, completed, dueDate }) => ({ id, completed, dueDate })),
    [tasks],
  );
  useEffect(() => {
    let active = true;
    reminderService.syncReminders(schedule, enabled, hour)
      .then((result) => { if (active) setStatus(result); })
      .catch(() => { if (active) setStatus('denied'); });
    return () => { active = false; };
  }, [schedule, enabled, hour]);

  const webNotice = useMemo(
    () => (!remindersSupported && enabled ? upcomingNotice(schedule, new Date()) : null),
    [schedule, enabled],
  );

  const value = useMemo(
    () => ({ enabled, setEnabled, hour, setHour, status, supported: remindersSupported, webNotice }),
    [enabled, hour, status, webNotice],
  );
  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}

export function useReminders() {
  const value = useContext(RemindersContext);
  if (!value) throw new Error('useReminders debe usarse dentro de RemindersProvider.');
  return value;
}
