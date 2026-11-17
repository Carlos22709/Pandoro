import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { usePreferences } from '@/components/preferences/PreferencesProvider';
import { useTasks } from '@/components/tasks/TasksProvider';
import { reminderService, remindersSupported } from '@/services/reminders/expoNotifications';
import { upcomingNotice, type SyncResult } from '@/services/reminders/reminderService';

type RemindersValue = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  status: SyncResult | null;
  supported: boolean;
  // En la web no hay avisos programados: Pandoro avisa al abrir la app.
  webNotice: string | null;
};

const RemindersContext = createContext<RemindersValue | null>(null);

export function RemindersProvider({ children }: { children: ReactNode }) {
  const { tasks } = useTasks();
  // El interruptor vive en las preferencias de la cuenta: apagarlo sobrevive a cerrar la app.
  const { preferences, setPreference } = usePreferences();
  const enabled = preferences.taskReminders;
  const [status, setStatus] = useState<SyncResult | null>(null);

  // Cada vez que se guarda, reprograma o termina una tarea, se recalculan los avisos.
  const schedule = useMemo(
    () => tasks.map(({ id, completed, dueDate }) => ({ id, completed, dueDate })),
    [tasks],
  );
  useEffect(() => {
    let active = true;
    reminderService.syncReminders(schedule, enabled)
      .then((result) => { if (active) setStatus(result); })
      .catch(() => { if (active) setStatus('denied'); });
    return () => { active = false; };
  }, [schedule, enabled]);

  const webNotice = useMemo(
    () => (!remindersSupported && enabled ? upcomingNotice(schedule, new Date()) : null),
    [schedule, enabled],
  );

  const value = useMemo(
    () => ({
      enabled,
      setEnabled: (next: boolean) => setPreference('taskReminders', next),
      status,
      supported: remindersSupported,
      webNotice,
    }),
    [enabled, setPreference, status, webNotice],
  );
  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}

export function useReminders() {
  const value = useContext(RemindersContext);
  if (!value) throw new Error('useReminders debe usarse dentro de RemindersProvider.');
  return value;
}
