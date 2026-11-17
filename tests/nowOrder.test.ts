import { test } from 'node:test';
import assert from 'node:assert/strict';

import type { TaskItem } from '../src/components/tasks/taskTypes';
import { DEFAULT_TASK_MINUTES, orderForNow, toPriorityTask } from '../src/services/tasks/nowOrder';

// Miércoles 11 de noviembre de 2026, al mediodía.
const today = new Date(2026, 10, 11, 12);

const task = (id: string, extra: Partial<TaskItem> = {}): TaskItem => ({
  id, title: id, detail: '', priority: 1, tone: 'blue', icon: 'checklist', difficulty: 'medium', completed: false, ...extra,
});

test('una tarea a mano usa su fecha como fecha límite; una de plan separa el día de trabajo', () => {
  const manual = toPriorityTask(task('task-1', { dueDate: '2026-11-13', duration: '1 h 30 min' }));
  assert.equal(manual.deadline, '2026-11-13');
  assert.equal(manual.scheduledDate, null);
  assert.equal(manual.remainingMinutes, 90);

  const planned = toPriorityTask(task('plan-p1-s1', { dueDate: '2026-11-12', deadline: '2026-11-20', importance: 'high' }));
  assert.equal(planned.deadline, '2026-11-20');
  assert.equal(planned.scheduledDate, '2026-11-12');
  assert.equal(planned.importance, 'high');
});

test('sin duración legible ni importancia se usan los valores por defecto', () => {
  const converted = toPriorityTask(task('task-2', { duration: 'un rato' }));
  assert.equal(converted.remainingMinutes, DEFAULT_TASK_MINUTES);
  assert.equal(converted.importance, 'medium');
});

test('«Ahora»: vencidas, luego hoy, luego pronto, luego sin fecha; las completadas al final', () => {
  const order = orderForNow([
    task('sin-fecha'),
    task('hecha', { dueDate: '2026-11-01', completed: true }),
    task('hoy', { dueDate: '2026-11-11' }),
    task('vencida', { dueDate: '2026-11-04' }),
    task('pronto', { dueDate: '2026-11-13' }),
  ], today);

  assert.deepEqual(order.tasks.map((item) => item.id), ['vencida', 'hoy', 'pronto', 'sin-fecha', 'hecha']);
  assert.equal(order.suggestionId, 'vencida');
  assert.equal(order.reasons.hoy, 'Vence hoy');
  assert.equal(order.reasons['sin-fecha'], 'Sin fecha límite');
  assert.equal(order.reasons.hecha, undefined);
});

test('lo que el plan programó para hoy sube aunque su fecha límite sea lejana', () => {
  const order = orderForNow([
    task('task-pronto', { dueDate: '2026-11-14' }),
    task('plan-p-s1', { dueDate: '2026-11-11', deadline: '2026-12-01' }),
  ], today);

  assert.equal(order.suggestionId, 'plan-p-s1');
  assert.equal(order.reasons['plan-p-s1'], 'Estaba en tu plan para hoy');
});

test('en el mismo nivel, la importancia alta va primero y luego la más fácil', () => {
  const order = orderForNow([
    task('plan-a-dificil', { difficulty: 'high' }),
    task('plan-a-facil', { difficulty: 'light' }),
    task('plan-a-importante', { importance: 'high', difficulty: 'high' }),
  ], today);

  assert.deepEqual(order.tasks.map((item) => item.id), ['plan-a-importante', 'plan-a-facil', 'plan-a-dificil']);
});

test('sin otra diferencia se respeta el orden que ya tenía la lista, no el id', () => {
  const order = orderForNow([
    task('b', { priority: 1 }),
    task('a', { priority: 2 }),
  ], today);

  assert.deepEqual(order.tasks.map((item) => item.id), ['b', 'a']);
});

test('sin pendientes no hay sugerencia', () => {
  assert.equal(orderForNow([task('x', { completed: true })], today).suggestionId, null);
  assert.equal(orderForNow([], today).suggestionId, null);
});
