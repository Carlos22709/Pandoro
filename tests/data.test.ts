import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { TaskItem } from '../src/components/tasks/taskTypes';
import { completionFromDoc, hasConsent, progressFromDoc, taskFromDoc, taskToDoc } from '../src/services/data/mapping';

const task: TaskItem = {
  id: 'plan-1-s1',
  title: 'Investigación y planificación',
  detail: 'mar 3 nov',
  duration: '120 min',
  priority: 3,
  tone: 'yellow',
  icon: 'document',
  difficulty: 'medium',
  completed: false,
};

test('una tarea se guarda sin su id y sin campos vacíos, que Firestore rechaza', () => {
  const doc = taskToDoc({ ...task, notes: undefined });

  assert.equal('id' in doc, false);
  assert.equal('notes' in doc, false);
  assert.equal(doc.title, 'Investigación y planificación');
});

test('una tarea guardada vuelve idéntica', () => {
  assert.deepEqual(taskFromDoc(task.id, taskToDoc(task)), task);
});

test('editar una tarea conserva su id y reemplaza los campos modificados', () => {
  const edited: TaskItem = {
    ...task,
    title: 'Planificar la presentación',
    detail: 'jue 12 nov',
    duration: '45 min',
    difficulty: 'high',
  };

  assert.deepEqual(taskFromDoc(task.id, taskToDoc(edited)), edited);
});

test('un documento con valores inesperados no rompe la app', () => {
  const restored = taskFromDoc('x', {
    title: 'Algo',
    detail: 42,
    priority: 'alta',
    tone: 'red',
    icon: 'rocket',
    difficulty: 'extreme',
    completed: 'yes',
  });

  assert.deepEqual(restored, {
    id: 'x',
    title: 'Algo',
    detail: '',
    priority: 0,
    tone: 'blue',
    icon: 'checklist',
    difficulty: 'medium',
    completed: false,
  });
});

test('un documento sin título se ignora', () => {
  assert.equal(taskFromDoc('x', { detail: 'sin nombre' }), null);
  assert.equal(taskFromDoc('x', undefined), null);
});

test('solo cuenta como consentimiento una constancia con versión y fecha', () => {
  assert.equal(hasConsent({ consents: { dataProcessing: { version: 'v1', acceptedAt: 1_793_000_000_000 } } }), true);
  assert.equal(hasConsent(undefined), false);
  assert.equal(hasConsent({ preferences: { darkMode: true } }), false);
  assert.equal(hasConsent({ consents: { dataProcessing: { version: 'v1' } } }), false);
  assert.equal(hasConsent({ consents: { dataProcessing: true } }), false);
});

test('un usuario nuevo empieza su mundo en cero', () => {
  const empty = {
    currentStage: 1,
    completedTasks: 0,
    streak: 0,
    stageStartSteps: 0,
    unlockedWeeks: [],
    lastAcknowledgedWeekKey: null,
  };
  assert.deepEqual(progressFromDoc(undefined), empty);
  assert.deepEqual(progressFromDoc({ currentStage: 3, completedTasks: 41, streak: -2 }), {
    ...empty,
    currentStage: 3,
    completedTasks: 41,
  });
});

test('el progreso semanal guardado se lee y los valores dañados se ignoran', () => {
  const progress = progressFromDoc({
    unlockedWeeks: ['2026-11-02', 'basura', 7, '2026-11-02', '2026-11-09'],
    lastAcknowledgedWeekKey: '2026-11-09',
    stageStartSteps: 12,
  });
  assert.deepEqual(progress.unlockedWeeks, ['2026-11-02', '2026-11-09']);
  assert.equal(progress.lastAcknowledgedWeekKey, '2026-11-09');
  assert.equal(progress.stageStartSteps, 12);
  assert.equal(progressFromDoc({ lastAcknowledgedWeekKey: '2026-13-45' }).lastAcknowledgedWeekKey, null);
});

test('una tarea de antes de la semana viva se lee como pendiente sin fecha', () => {
  const read = taskFromDoc('t', { title: 'Vieja', completed: true });
  assert.equal(read?.completed, true);
  assert.equal('dueDate' in (read ?? {}), false);
  assert.equal('dismissed' in (read ?? {}), false);
});

test('la fecha de entrega, el descarte y las marcas de tiempo vuelven idénticas', () => {
  const full: TaskItem = { ...task, dueDate: '2026-11-12', dismissed: true, completedAt: 1_793_000_000_000, dismissedAt: 1_793_000_100_000 };
  assert.deepEqual(taskFromDoc(full.id, taskToDoc(full)), full);
  assert.equal(taskFromDoc('t', { title: 'x', dueDate: '2026-02-31' })?.dueDate, undefined);
});

test('un evento de completado solo guarda el instante', () => {
  assert.deepEqual(completionFromDoc('t1', { completedAt: 1_793_000_000_000 }), { taskId: 't1', completedAt: 1_793_000_000_000 });
  assert.equal(completionFromDoc('t1', { completedAt: 'ayer' }), null);
  assert.equal(completionFromDoc('t1', undefined), null);
});

test('la fecha de la tarea sobrevive a Firestore para que los recordatorios funcionen', () => {
  const dated: TaskItem = { ...task, dueDate: '2026-11-04' };
  assert.equal(taskFromDoc(dated.id, taskToDoc(dated))?.dueDate, '2026-11-04');
  assert.equal(taskFromDoc('x', { title: 'Algo', dueDate: 'mañana' })?.dueDate, undefined);
});
