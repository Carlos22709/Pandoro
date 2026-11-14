import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PROGRESS_WORLD_STAGES } from '../src/components/progress/worldData';
import type { TaskItem } from '../src/components/tasks/taskTypes';
import { DEMO_PLAN } from '../src/demo/demoScript';
import { INITIAL_DEMO_STATE, demoPlanTasks, demoReducer, sortTasksForNow } from '../src/demo/demoState';
import { pandaTrailFraction } from '../src/services/progress/pandaPath';

// Las tareas viven en TasksProvider; la demo solo lleva el progreso del mundo.
const WEEK = '2026-11-09';
const base = { ...INITIAL_DEMO_STATE, progress: { ...INITIAL_DEMO_STATE.progress, completedTasks: 3, currentStage: 1 } };

test('completar una tarea suma un paso sin ganar un lugar', () => {
  const state = demoReducer(base, { type: 'recordCompletion', taskId: 'plan-x', completed: true });

  assert.equal(state.progress.completedTasks, 4);
  assert.equal(state.progress.currentStage, 1);
  assert.equal(state.pendingUnlock, null);
});

test('desmarcar resta un paso y nunca toca los lugares ni las semanas ganadas', () => {
  const won = demoReducer(
    { ...base, progress: { ...base.progress, lastAcknowledgedWeekKey: '2026-10-26' } },
    { type: 'acknowledgeClosure', todayMs: new Date(2026, 10, 11, 12).getTime(), wonWeeks: [WEEK] },
  );
  const state = demoReducer(won, { type: 'recordCompletion', taskId: 'b', completed: false });

  assert.equal(state.progress.completedTasks, 2);
  assert.equal(state.progress.currentStage, 2);
  assert.deepEqual(state.progress.unlockedWeeks, [WEEK]);
});

const closing = { ...base, progress: { ...base.progress, lastAcknowledgedWeekKey: '2026-10-26' } };
const AFTER_WEEK = new Date(2026, 10, 11, 12).getTime();

test('al cerrar una semana completa se abre el lugar siguiente', () => {
  const state = demoReducer(closing, { type: 'acknowledgeClosure', todayMs: AFTER_WEEK, wonWeeks: [WEEK] });

  assert.equal(state.progress.currentStage, 2);
  assert.equal(state.progress.stageStartSteps, 3);
  assert.deepEqual(state.progress.unlockedWeeks, [WEEK]);
  assert.equal(state.progress.lastAcknowledgedWeekKey, '2026-11-02');
  assert.equal(state.pendingUnlock, 2);
  assert.equal(state.pendingHomeReveal, true);
});

test('cerrar una semana incompleta reconoce el cierre sin abrir nada', () => {
  const state = demoReducer(closing, { type: 'acknowledgeClosure', todayMs: AFTER_WEEK, wonWeeks: [] });

  assert.equal(state.progress.currentStage, 1);
  assert.equal(state.progress.lastAcknowledgedWeekKey, '2026-11-02');
  assert.equal(state.pendingUnlock, null);
  assert.equal(state.progress.completedTasks, 3);
});

test('cerrar dos veces la misma semana no abre otro lugar', () => {
  const once = demoReducer(closing, { type: 'acknowledgeClosure', todayMs: AFTER_WEEK, wonWeeks: [WEEK] });
  const twice = demoReducer(once, { type: 'acknowledgeClosure', todayMs: AFTER_WEEK, wonWeeks: [WEEK] });

  assert.equal(twice, once);
});

test('varias semanas completas abren varios lugares, sin pasar del último', () => {
  const nearEnd = { ...closing, progress: { ...closing.progress, currentStage: PROGRESS_WORLD_STAGES.length - 1 } };
  const state = demoReducer(nearEnd, {
    type: 'acknowledgeClosure',
    todayMs: AFTER_WEEK,
    wonWeeks: ['2026-10-26', WEEK],
  });

  assert.equal(state.progress.currentStage, PROGRESS_WORLD_STAGES.length);
  assert.deepEqual(state.progress.unlockedWeeks, ['2026-10-26', WEEK]);
});

test('reconocer el cierre sin semanas ganadas solo mueve lastAcknowledgedWeekKey', () => {
  const state = demoReducer(base, { type: 'acknowledgeClosure', todayMs: new Date(2026, 10, 11, 12).getTime() });

  assert.equal(state.progress.lastAcknowledgedWeekKey, '2026-11-02');
  assert.deepEqual({ ...state.progress, lastAcknowledgedWeekKey: null }, base.progress);
});

test('un usuario nuevo empieza sin tareas de ejemplo y con el mundo en cero', () => {
  assert.deepEqual(INITIAL_DEMO_STATE.tasks, []);
  assert.deepEqual(INITIAL_DEMO_STATE.progress, {
    currentStage: 1,
    completedTasks: 0,
    streak: 0,
    stageStartSteps: 0,
    unlockedWeeks: [],
    lastAcknowledgedWeekKey: null,
  });
  assert.equal(INITIAL_DEMO_STATE.progressLoaded, false);
});

test('cargar el progreso guardado no repite celebraciones ni desbloqueos', () => {
  const saved = {
    currentStage: 3,
    completedTasks: 41,
    streak: 2,
    stageStartSteps: 30,
    unlockedWeeks: ['2026-10-26', '2026-11-02'],
    lastAcknowledgedWeekKey: '2026-11-02',
  };

  const state = demoReducer(INITIAL_DEMO_STATE, { type: 'loadProgress', progress: saved });

  assert.deepEqual(state.progress, saved);
  assert.equal(state.progressLoaded, true);
  assert.equal(state.celebration, null);
  assert.equal(state.pendingUnlock, null);
  assert.equal(state.pendingHomeReveal, false);
});

test('Pandoro avanza con cada paso, cada vez menos, y nunca llega solo al siguiente lugar', () => {
  assert.equal(pandaTrailFraction(10, 10), 0);
  assert.equal(pandaTrailFraction(5, 10), 0);
  // El primer paso se nota (cerca del 8% del sendero).
  assert.ok(pandaTrailFraction(1, 0) > 0.07 && pandaTrailFraction(1, 0) < 0.1);

  let previous = 0;
  let previousGain = Infinity;
  for (let steps = 1; steps <= 100; steps += 1) {
    const fraction = pandaTrailFraction(steps, 0);
    const gain = fraction - previous;
    assert.ok(gain > 0, `el paso ${steps} debe mover a Pandoro`);
    assert.ok(gain <= previousGain + 1e-12, `el paso ${steps} no mueve más que el anterior`);
    assert.ok(fraction < 0.8, 'nunca pasa del tope');
    previous = fraction;
    previousGain = gain;
  }
  assert.ok(pandaTrailFraction(1000, 0) < 0.8);
  // Muchas tareas dejan margen: la tarea 30 todavía se nota.
  assert.ok(pandaTrailFraction(30, 0) - pandaTrailFraction(29, 0) > 0.001);
});

test('"Ahora" pone primero las pendientes con fecha pasada, sin importar la dificultad', () => {
  const today = new Date(2026, 10, 11, 12);
  const sorted = sortTasksForNow([
    { ...existingTask('hoy', 1), dueDate: '2026-11-11' },
    { ...existingTask('vencida', 9), dueDate: '2026-11-04' },
    { ...existingTask('hecha', 0), dueDate: '2026-11-03', completed: true },
    existingTask('sin-fecha', 2),
  ], today);

  assert.deepEqual(sorted.map((task) => task.id), ['vencida', 'hoy', 'sin-fecha', 'hecha']);
});

test('el plan del guion trae fecha real para cada tarea', () => {
  const planned = demoPlanTasks([], new Date(2026, 10, 10, 9));

  assert.ok(planned.every((task) => task.dueDate !== undefined));
  assert.equal(planned[0].dueDate, '2026-11-10');
});

function existingTask(id: string, priority: number): TaskItem {
  return {
    id, title: id, detail: '', priority, tone: 'blue', icon: 'checklist', difficulty: 'medium', completed: false,
  };
}

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
