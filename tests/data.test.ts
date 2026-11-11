import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { TaskItem } from '../src/components/tasks/taskTypes';
import { hasConsent, progressFromDoc, taskFromDoc, taskToDoc } from '../src/services/data/mapping';

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
  assert.deepEqual(progressFromDoc(undefined), { currentStage: 1, completedTasks: 0, streak: 0 });
  assert.deepEqual(progressFromDoc({ currentStage: 3, completedTasks: 41, streak: -2 }), {
    currentStage: 3,
    completedTasks: 41,
    streak: 0,
  });
});
