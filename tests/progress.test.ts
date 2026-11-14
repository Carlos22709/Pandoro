import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { TaskItem } from '../src/components/tasks/taskTypes';
import { EMPTY_PROGRESS_META, type ProgressMeta } from '../src/services/progress/progressMeta';
import { stepsInWeek, totalSteps, type CompletionEvent } from '../src/services/progress/steps';
import {
  canUndoCompletion, completeTask, dismissTask, moveDueDate, undoCompletion,
} from '../src/services/progress/taskActions';
import {
  acknowledgeClosure, closureSummary, startMeta, unacknowledgedClosedWeeks,
} from '../src/services/progress/weekClosure';
import { isWeekComplete } from '../src/services/progress/weekComplete';

const task = (id: string, extra: Partial<TaskItem> = {}): TaskItem => ({
  id, title: id, detail: '', priority: 1, tone: 'blue', icon: 'checklist',
  difficulty: 'light', completed: false, ...extra,
});
const at = (y: number, m: number, d: number, h = 12, mi = 0, s = 0) => new Date(y, m - 1, d, h, mi, s);
// Miércoles 11/11/2026 (semana del 2026-11-09).
const WED = at(2026, 11, 11);

test('1. agregar tareas no da pasos ni cambia ninguna semana', () => {
  const events: CompletionEvent[] = [];
  const tasks = ['a', 'b', 'c', 'd', 'e'].map((id) => task(id, { dueDate: '2026-11-12' }));
  assert.equal(tasks.length, 5);
  assert.equal(totalSteps(events), 0);
  assert.equal(stepsInWeek(events, '2026-11-09'), 0);
});

test('2. el paso del domingo 23:59:59 es de esa semana y el del lunes 00:00:00 de la siguiente', () => {
  const base = { tasks: [task('a'), task('b')], events: [] as CompletionEvent[] };
  const sunday = completeTask(base, 'a', at(2026, 11, 15, 23, 59, 59));
  const both = completeTask(sunday, 'b', at(2026, 11, 16, 0, 0, 0));
  assert.equal(stepsInWeek(both.events, '2026-11-09'), 1);
  assert.equal(stepsInWeek(both.events, '2026-11-16'), 1);
});

test('3. completar hoy una tarea con fecha a 30 días suma a esta semana', () => {
  const state = completeTask({ tasks: [task('a', { dueDate: '2026-12-11' })], events: [] }, 'a', WED);
  assert.equal(stepsInWeek(state.events, '2026-11-09'), 1);
  assert.equal(stepsInWeek(state.events, '2026-12-07'), 0);
});

test('4. una semana cerrada no se reabre al agregar una tarea con fecha de esa semana', () => {
  let state = { tasks: ['a', 'b', 'c', 'd'].map((id) => task(id)), events: [] as CompletionEvent[] };
  for (const id of ['a', 'b', 'c', 'd']) state = completeTask(state, id, at(2026, 11, 4));
  assert.equal(totalSteps(state.events), 4);

  const tasks = [...state.tasks, task('late', { dueDate: '2026-11-05' })];
  assert.equal(totalSteps(state.events), 4);
  assert.equal(stepsInWeek(state.events, '2026-11-02'), 4);
  const meta = { ...EMPTY_PROGRESS_META, lastAcknowledgedWeekKey: '2026-10-26' };
  const summary = closureSummary(state.events, tasks, meta, WED);
  assert.equal(summary?.steps, 4);
  assert.deepEqual(summary?.carryOver.map((item) => item.id), ['late']);
});

test('5. descartar nunca reduce los pasos', () => {
  const state = completeTask({ tasks: [task('a'), task('b')], events: [] }, 'a', WED);
  const dismissedDone = dismissTask(state.tasks, 'a', WED);
  const dismissedPending = dismissTask(state.tasks, 'b', WED);
  assert.equal(totalSteps(state.events), 1);
  assert.equal(dismissedDone.find((item) => item.id === 'a')?.dismissed, true);
  assert.equal(dismissedPending.find((item) => item.id === 'b')?.dismissed, true);
  assert.equal(dismissedPending.find((item) => item.id === 'b')?.completed, false);
});

test('6. desmarcar solo se puede en la semana abierta', () => {
  const state = completeTask({ tasks: [task('a'), task('b')], events: [] }, 'a', at(2026, 11, 3));
  const both = completeTask(state, 'b', WED);
  assert.equal(canUndoCompletion(both, 'a', WED), false);
  assert.equal(undoCompletion(both, 'a', WED), both);
  assert.equal(canUndoCompletion(both, 'b', WED), true);
  const undone = undoCompletion(both, 'b', WED);
  assert.deepEqual(undone.events.map((event) => event.taskId), ['a']);
  assert.equal(undone.tasks.find((item) => item.id === 'b')?.completed, false);
  assert.equal(undone.tasks.find((item) => item.id === 'b')?.completedAt, undefined);
});

test('7. tras 3 semanas sin abrir hay un solo resumen con la suma de pasos', () => {
  let state = { tasks: ['a', 'b', 'c'].map((id) => task(id)), events: [] as CompletionEvent[] };
  state = completeTask(state, 'a', at(2026, 10, 20)); // semana 2026-10-19
  state = completeTask(state, 'b', at(2026, 10, 27)); // semana 2026-10-26
  state = completeTask(state, 'c', at(2026, 11, 3)); // semana 2026-11-02
  const meta: ProgressMeta = { ...EMPTY_PROGRESS_META, lastAcknowledgedWeekKey: '2026-10-12' };
  assert.deepEqual(unacknowledgedClosedWeeks(meta, WED), ['2026-10-19', '2026-10-26', '2026-11-02']);
  const summary = closureSummary(state.events, state.tasks, meta, WED);
  assert.equal(summary?.steps, 3);
  assert.equal(summary?.weeks.length, 3);
});

test('8. semana cerrada con 0 pasos: el resumen no trae logros', () => {
  const meta: ProgressMeta = { ...EMPTY_PROGRESS_META, lastAcknowledgedWeekKey: '2026-10-26' };
  const summary = closureSummary([], [task('a', { dueDate: '2026-11-04' })], meta, WED);
  assert.equal(summary?.steps, 0);
  assert.equal(summary?.carryOver.length, 1);
});

test('9. cerrar sin elegir reconoce el cierre y no toca ninguna tarea', () => {
  const tasks = [task('a', { dueDate: '2026-11-04' }), task('b', { dueDate: '2026-12-30' }), task('c')];
  const before = JSON.stringify(tasks);
  const meta: ProgressMeta = { ...EMPTY_PROGRESS_META, lastAcknowledgedWeekKey: '2026-10-26' };
  const after = acknowledgeClosure(meta, WED);
  assert.equal(after.lastAcknowledgedWeekKey, '2026-11-02');
  assert.equal(unacknowledgedClosedWeeks(after, WED).length, 0);
  assert.equal(JSON.stringify(tasks), before);
  assert.equal(acknowledgeClosure(after, WED), after);
});

test('10. mover fecha cambia solo ese dueDate y ya no aplica solo ese estado', () => {
  const tasks = [task('a', { dueDate: '2026-11-04' }), task('b', { dueDate: '2026-11-05' })];
  const moved = moveDueDate(tasks, 'a', '2026-11-20');
  assert.equal(moved[0].dueDate, '2026-11-20');
  assert.deepEqual(moved[1], tasks[1]);
  assert.equal(moved[0].completed, false);
  assert.equal(moved[0].dismissed, undefined);

  const dismissed = dismissTask(tasks, 'a', WED);
  assert.equal(dismissed[0].dueDate, '2026-11-04');
  assert.equal(dismissed[0].dismissed, true);
  assert.deepEqual(dismissed[1], tasks[1]);
});

test('una cuenta nueva parte de la semana pasada y no muestra cierre', () => {
  const started = startMeta(EMPTY_PROGRESS_META, WED);
  assert.equal(started.lastAcknowledgedWeekKey, '2026-11-02');
  assert.deepEqual(unacknowledgedClosedWeeks(EMPTY_PROGRESS_META, WED), []);
  assert.equal(closureSummary([], [], EMPTY_PROGRESS_META, WED), null);
});

test('semana completa: al menos un paso y nada pendiente con fecha hasta el domingo', () => {
  const tasks = [
    task('a', { dueDate: '2026-11-10' }),
    task('b', { dueDate: '2026-11-13' }),
    task('c'),
    task('d', { dueDate: '2026-11-30' }),
  ];
  let state = { tasks, events: [] as CompletionEvent[] };
  assert.equal(isWeekComplete(state.tasks, state.events, '2026-11-09'), false);
  state = completeTask(state, 'a', WED);
  assert.equal(isWeekComplete(state.tasks, state.events, '2026-11-09'), false);
  state = completeTask(state, 'b', WED);
  // «c» (sin fecha) y «d» (fecha futura) no bloquean la semana.
  assert.equal(isWeekComplete(state.tasks, state.events, '2026-11-09'), true);
});

test('a mitad de semana no se gana nada: el lugar se decide al cerrar la semana', () => {
  // Martes: se completa todo lo de la semana, pero todavía puede llegar más.
  const tuesday = at(2026, 11, 10);
  let state = { tasks: [task('a', { dueDate: '2026-11-10' })], events: [] as CompletionEvent[] };
  state = completeTask(state, 'a', tuesday);
  const meta: ProgressMeta = { ...EMPTY_PROGRESS_META, lastAcknowledgedWeekKey: '2026-11-02' };
  assert.equal(closureSummary(state.events, state.tasks, meta, tuesday), null);
  // El jueves llega otra tarea para esa semana: sigue pendiente al cerrar.
  const withMore = [...state.tasks, task('b', { dueDate: '2026-11-13' })];
  const monday = at(2026, 11, 16);
  assert.deepEqual(closureSummary(state.events, withMore, meta, monday)?.wonWeeks, []);
});

test('al cerrar, la semana con todo hecho gana un lugar y la incompleta no', () => {
  let state = {
    tasks: [task('a', { dueDate: '2026-11-10' }), task('b', { dueDate: '2026-11-12' })],
    events: [] as CompletionEvent[],
  };
  state = completeTask(state, 'a', at(2026, 11, 10));
  const meta: ProgressMeta = { ...EMPTY_PROGRESS_META, lastAcknowledgedWeekKey: '2026-11-02' };
  const monday = at(2026, 11, 16);
  assert.deepEqual(closureSummary(state.events, state.tasks, meta, monday)?.wonWeeks, []);

  state = completeTask(state, 'b', at(2026, 11, 14));
  const summary = closureSummary(state.events, state.tasks, meta, monday);
  assert.deepEqual(summary?.wonWeeks, ['2026-11-09']);
  assert.equal(summary?.steps, 2);
});

test('con varias semanas sin abrir, cada una completa gana su lugar', () => {
  let state = { tasks: ['a', 'b'].map((id) => task(id)), events: [] as CompletionEvent[] };
  state = completeTask(state, 'a', at(2026, 11, 3));
  state = completeTask(state, 'b', at(2026, 11, 17));
  const meta: ProgressMeta = { ...EMPTY_PROGRESS_META, lastAcknowledgedWeekKey: '2026-10-26' };
  const summary = closureSummary(state.events, state.tasks, meta, at(2026, 11, 25));
  assert.deepEqual(summary?.weeks, ['2026-11-02', '2026-11-09', '2026-11-16']);
  assert.deepEqual(summary?.wonWeeks, ['2026-11-02', '2026-11-16']);
});

test('una semana ya ganada no vuelve a ganarse', () => {
  const state = completeTask({ tasks: [task('a')], events: [] }, 'a', at(2026, 11, 3));
  const meta: ProgressMeta = { lastAcknowledgedWeekKey: '2026-10-26', unlockedWeeks: ['2026-11-02'] };
  assert.deepEqual(closureSummary(state.events, state.tasks, meta, at(2026, 11, 11))?.wonWeeks, []);
});

test('una tarea creada después de que cerró la semana no la deja incompleta', () => {
  const lateTask = task('late', { dueDate: '2026-11-06', createdAt: at(2026, 11, 12).getTime() });
  const state = completeTask({ tasks: [task('a', { dueDate: '2026-11-05' }), lateTask], events: [] }, 'a', at(2026, 11, 5));
  assert.equal(isWeekComplete(state.tasks, state.events, '2026-11-02'), true);
});

test('una semana sin pasos no se gana aunque no haya tareas pendientes', () => {
  assert.equal(isWeekComplete([], [], '2026-11-09'), false);
});

test('las vencidas descartadas no bloquean la semana', () => {
  let state = {
    tasks: [task('old', { dueDate: '2026-11-02' }), task('a', { dueDate: '2026-11-10' })],
    events: [] as CompletionEvent[],
  };
  state = completeTask(state, 'a', WED);
  assert.equal(isWeekComplete(state.tasks, state.events, '2026-11-09'), false);
  const tasks = dismissTask(state.tasks, 'old', WED);
  assert.equal(isWeekComplete(tasks, state.events, '2026-11-09'), true);
});

test('RNF-01: los textos del cierre y del progreso no usan lenguaje de culpa', async () => {
  const { readFile } = await import('node:fs/promises');
  const files = [
    'src/screens/WeekClosureScreen.tsx',
    'src/components/progress/ProgressSummary.tsx',
    'src/components/progress/ProgressLandmarkSheet.tsx',
    'src/components/progress/useWeekClosureWatcher.ts',
  ];
  const forbidden = /atrasad|vencid|fallid|no lograste|incomplet|perdiste|racha rota|d[ií]as seguidos/i;
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const visible = text.split('\n').filter((line) => !line.trim().startsWith('//')).join('\n');
    assert.equal(forbidden.test(visible), false, `${file} usa un texto prohibido`);
  }
});

test('si el reloj retrocede no se reevalúan semanas ya reconocidas', () => {
  const state = completeTask({ tasks: [task('a')], events: [] }, 'a', at(2026, 11, 3));
  // Ya se reconoció una semana futura (se adelantó el reloj); volver al 11/11 no muestra cierres.
  const meta: ProgressMeta = { lastAcknowledgedWeekKey: '2026-11-23', unlockedWeeks: [] };
  assert.deepEqual(unacknowledgedClosedWeeks(meta, WED), []);
  assert.equal(closureSummary(state.events, state.tasks, meta, WED), null);
});


// Domingo 8/11/2026: cierra la semana del 2026-11-02.
const SUN = at(2026, 11, 8, 18);

test('el domingo, con la semana completa, el cierre aparece ese mismo día', () => {
  let state = { tasks: ['a', 'b', 'c', 'd'].map((id) => task(id, { dueDate: '2026-11-08' })), events: [] as CompletionEvent[] };
  for (const id of ['a', 'b', 'c', 'd']) state = completeTask(state, id, at(2026, 11, 8, 10));
  const meta: ProgressMeta = { ...EMPTY_PROGRESS_META, lastAcknowledgedWeekKey: '2026-10-26' };

  const summary = closureSummary(state.events, state.tasks, meta, SUN);
  assert.deepEqual(summary?.weeks, ['2026-11-02']);
  assert.deepEqual(summary?.wonWeeks, ['2026-11-02']);
  assert.equal(summary?.steps, 4);
});

test('el domingo con la semana a medias no molesta: el cierre espera al lunes', () => {
  let state = { tasks: ['a', 'b'].map((id) => task(id, { dueDate: '2026-11-08' })), events: [] as CompletionEvent[] };
  state = completeTask(state, 'a', at(2026, 11, 8, 10));
  const meta: ProgressMeta = { ...EMPTY_PROGRESS_META, lastAcknowledgedWeekKey: '2026-10-26' };

  assert.equal(closureSummary(state.events, state.tasks, meta, SUN), null);
  const monday = closureSummary(state.events, state.tasks, meta, at(2026, 11, 9));
  assert.deepEqual(monday?.weeks, ['2026-11-02']);
  assert.deepEqual(monday?.wonWeeks, []);
});

test('un día entre semana, aunque todo esté hecho, la semana en curso no cierra', () => {
  let state = { tasks: [task('a', { dueDate: '2026-11-10' })], events: [] as CompletionEvent[] };
  state = completeTask(state, 'a', at(2026, 11, 10));
  const meta: ProgressMeta = { ...EMPTY_PROGRESS_META, lastAcknowledgedWeekKey: '2026-11-02' };

  assert.equal(closureSummary(state.events, state.tasks, meta, at(2026, 11, 11)), null);
  assert.deepEqual(unacknowledgedClosedWeeks(meta, at(2026, 11, 14), { tasks: state.tasks, events: state.events }), []);
});

test('reconocer el cierre del domingo cubre esa semana y el lunes no vuelve a salir', () => {
  const meta: ProgressMeta = { ...EMPTY_PROGRESS_META, lastAcknowledgedWeekKey: '2026-10-26' };
  const after = acknowledgeClosure(meta, SUN, ['2026-11-02']);
  assert.equal(after.lastAcknowledgedWeekKey, '2026-11-02');
  assert.deepEqual(unacknowledgedClosedWeeks(after, at(2026, 11, 9), { tasks: [], events: [] }), []);
  // Sin semana ganada, el domingo solo se reconoce hasta la semana anterior.
  assert.equal(acknowledgeClosure(meta, SUN).lastAcknowledgedWeekKey, '2026-10-26');
});
