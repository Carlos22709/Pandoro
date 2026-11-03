import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import type { TaskDraft } from '@/components/tasks/taskTypes';
import { saveProgress, watchProgress } from '@/services/data/progressRepository';
import { INITIAL_DEMO_STATE, demoReducer, type DemoState } from '@/demo/demoState';

type DemoActions = {
  toggleTask: (id: string) => void;
  recordCompletion: (taskId: string, completed: boolean) => void;
  createTask: (draft: TaskDraft) => void;
  updateTask: (id: string, draft: TaskDraft) => void;
  deleteTask: (id: string) => void;
  addPlan: () => void;
  dismissCelebration: () => void;
  finishUnlock: () => void;
  finishHomeReveal: () => void;
  resetDemo: () => void;
};

type DemoContextValue = DemoState & DemoActions;

const DemoContext = createContext<DemoContextValue | null>(null);

// Estado compartido de la simulación: todas las pantallas leen y cambian lo mismo.
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, INITIAL_DEMO_STATE);
  const uid = useAuth().user?.uid ?? null;
  const [ownerUid, setOwnerUid] = useState(uid);

  // Igual que TasksProvider: al cambiar de cuenta, el progreso del anterior no queda a la vista.
  if (ownerUid !== uid) {
    setOwnerUid(uid);
    dispatch({ type: 'reset' });
  }

  // Último progreso igual al de Firestore; null mientras no ha llegado lo guardado.
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    syncedRef.current = null;
    if (!uid) return;
    return watchProgress(
      uid,
      (progress) => {
        syncedRef.current = JSON.stringify(progress);
        dispatch({ type: 'loadProgress', progress });
      },
      (error) => console.warn('No se pudo leer el progreso.', error.message),
    );
  }, [uid]);

  // Guarda cada avance, pero no reescribe lo que acaba de leer ni pisa lo guardado antes de cargarlo.
  useEffect(() => {
    if (!uid || syncedRef.current === null) return;
    const current = JSON.stringify(state.progress);
    if (current === syncedRef.current) return;
    syncedRef.current = current;
    saveProgress(uid, state.progress).catch((error: Error) => (
      console.warn('No se pudo guardar el progreso.', error.message)
    ));
  }, [uid, state.progress]);

  const actions = useMemo<DemoActions>(() => ({
    toggleTask: (id) => dispatch({ type: 'toggleTask', id }),
    recordCompletion: (taskId, completed) => dispatch({ type: 'recordCompletion', taskId, completed }),
    createTask: (draft) => dispatch({ type: 'createTask', id: `task-${Date.now()}`, draft }),
    updateTask: (id, draft) => dispatch({ type: 'updateTask', id, draft }),
    deleteTask: (id) => dispatch({ type: 'deleteTask', id }),
    addPlan: () => dispatch({ type: 'addPlan' }),
    dismissCelebration: () => dispatch({ type: 'dismissCelebration' }),
    finishUnlock: () => dispatch({ type: 'finishUnlock' }),
    finishHomeReveal: () => dispatch({ type: 'finishHomeReveal' }),
    resetDemo: () => dispatch({ type: 'reset' }),
  }), []);

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error('useDemo debe usarse dentro de DemoProvider.');
  return value;
}
