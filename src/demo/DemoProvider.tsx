import { createContext, useContext, useMemo, useReducer, useState, type ReactNode } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import type { TaskDraft } from '@/components/tasks/taskTypes';
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
