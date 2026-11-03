import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PROGRESS_WORLD_STAGES } from '../src/components/progress/worldData';
import type { TaskItem } from '../src/components/tasks/taskTypes';
import { DEMO_PLAN } from '../src/demo/demoScript';
import { INITIAL_DEMO_STATE, demoPlanTasks, demoReducer } from '../src/demo/demoState';

// Las tareas viven en TasksProvider; la demo solo lleva el progreso del mundo.
const secondStage = PROGRESS_WORLD_STAGES.find((stage) => stage.id === 2)!;
const oneBeforeUnlock = {
  ...INITIAL_DEMO_STATE,
  progress: { ...INITIAL_DEMO_STATE.progress, currentStage: 1, completedTasks: secondStage.requiredTasks - 2 },
};

test('completar una tarea de otra lista suma progreso', () => {
  const state = demoReducer(oneBeforeUnlock, { type: 'recordCompletion', taskId: 'plan-x', completed: true });

  assert.equal(state.progress.completedTasks, secondStage.requiredTasks - 1);
  assert.equal(state.celebration, null);
});

test('al llegar al umbral se desbloquea el lugar y se celebra', () => {
  const almost = demoReducer(oneBeforeUnlock, { type: 'recordCompletion', taskId: 'a', completed: true });
  const state = demoReducer(almost, { type: 'recordCompletion', taskId: 'b', completed: true });

  assert.equal(state.progress.currentStage, 2);
  assert.deepEqual(state.celebration, { taskId: 'b', stageId: 2 });
  assert.equal(state.pendingUnlock, 2);
  assert.equal(state.pendingHomeReveal, true);
});

test('desmarcar resta progreso pero nunca vuelve a bloquear un lugar', () => {
  const unlocked = {
    ...INITIAL_DEMO_STATE,
    progress: { ...INITIAL_DEMO_STATE.progress, currentStage: 2, completedTasks: secondStage.requiredTasks },
  };

  const state = demoReducer(unlocked, { type: 'recordCompletion', taskId: 'b', completed: false });

  assert.equal(state.progress.completedTasks, secondStage.requiredTasks - 1);
  assert.equal(state.progress.currentStage, 2);
});

test('un usuario nuevo empieza sin tareas de ejemplo y con el mundo en cero', () => {
  assert.deepEqual(INITIAL_DEMO_STATE.tasks, []);
  assert.deepEqual(INITIAL_DEMO_STATE.progress, { currentStage: 1, completedTasks: 0, streak: 0 });
});

test('cargar el progreso guardado no repite celebraciones ni desbloqueos', () => {
  const saved = { currentStage: 3, completedTasks: 41, streak: 2 };

  const state = demoReducer(INITIAL_DEMO_STATE, { type: 'loadProgress', progress: saved });

  assert.deepEqual(state.progress, saved);
  assert.equal(state.celebration, null);
  assert.equal(state.pendingUnlock, null);
  assert.equal(state.pendingHomeReveal, false);
});

const existing = (id: string, priority: number): TaskItem => ({
  id,
  title: id,
  detail: '',
  priority,
  tone: 'blue',
  icon: 'checklist',
  difficulty: 'medium',
  completed: false,
});

test('el plan del guion se agrega una sola vez a cualquier lista de tareas', () => {
  const tasks = [existing('mail', 2), existing('agenda', 8)];

  const planned = demoPlanTasks(tasks);

  assert.deepEqual(planned.map((task) => task.id), DEMO_PLAN.map((task) => task.id));
  assert.ok(planned.every((task) => !task.completed));
  assert.deepEqual(demoPlanTasks([...tasks, ...planned]), []);
});
