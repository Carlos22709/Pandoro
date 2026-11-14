import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useTasks } from '@/components/tasks/TasksProvider';
import { useDemo } from '@/demo/DemoProvider';
import { unacknowledgedClosedWeeks } from '@/services/progress/weekClosure';

// Al abrir la app o volver a primer plano revisa si una semana cerró sin que el usuario la viera.
// No hay notificaciones ni tareas en segundo plano: solo se mira cuando la app está en uso.
export function useWeekClosureWatcher(enabled: boolean, onClosureRoute: boolean) {
  const router = useRouter();
  const { ready, tasks, events } = useTasks();
  const { progress, progressLoaded, acknowledgeClosure } = useDemo();
  const latest = useRef({ progress, tasks, events, onClosureRoute, acknowledgeClosure, router });
  latest.current = { progress, tasks, events, onClosureRoute, acknowledgeClosure, router };
  const active = enabled && ready && progressLoaded;

  useEffect(() => {
    if (!active) return;

    const check = () => {
      const { progress: current, tasks: allTasks, events: allEvents, onClosureRoute: showing, acknowledgeClosure: acknowledge, router: nav } = latest.current;
      const today = new Date();
      // Primera vez con esta cuenta: se parte de la semana pasada, sin cierre que mostrar.
      if (!current.lastAcknowledgedWeekKey) {
        acknowledge(today);
        return;
      }
      if (showing) return;
      const meta = { lastAcknowledgedWeekKey: current.lastAcknowledgedWeekKey, unlockedWeeks: current.unlockedWeeks };
      if (unacknowledgedClosedWeeks(meta, today, { tasks: allTasks, events: allEvents }).length > 0) nav.push('/cierre-semana');
    };

    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    // El cierre aparece solo, sin recargar: se revisa cada pocos segundos (es una cuenta de fechas, sin red).
    const interval = setInterval(check, 4_000);
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [active]);
}
