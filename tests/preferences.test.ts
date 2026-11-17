import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PREFERENCES, preferencesFrom } from '../src/services/preferences/preferences';

test('sin nada guardado se usan los valores por defecto', () => {
  assert.deepEqual(preferencesFrom(undefined), DEFAULT_PREFERENCES);
  assert.deepEqual(preferencesFrom({}), DEFAULT_PREFERENCES);
  assert.equal(preferencesFrom(undefined).reminderHour, 8);
});

test('lo guardado reemplaza el valor por defecto', () => {
  assert.deepEqual(
    preferencesFrom({ taskReminders: false, reducedMotion: true, reminderHour: 19 }),
    { reducedMotion: true, pandoroBubble: true, taskReminders: false, reminderHour: 19 },
  );
});

test('las claves antiguas no se heredan: reduceMotion venía activado por defecto y no hacía nada', () => {
  const saved = { reduceMotion: true, darkMode: true, usageAnalytics: true, sounds: true };
  assert.deepEqual(preferencesFrom(saved), DEFAULT_PREFERENCES);
});

test('un valor que no es verdadero/falso se ignora', () => {
  assert.equal(preferencesFrom({ taskReminders: 'no' }).taskReminders, true);
});

test('una hora válida se conserva y una inválida vuelve a las 8:00', () => {
  assert.equal(preferencesFrom({ reminderHour: 0 }).reminderHour, 0);
  assert.equal(preferencesFrom({ reminderHour: 23 }).reminderHour, 23);
  assert.equal(preferencesFrom({ reminderHour: 24 }).reminderHour, 8);
  assert.equal(preferencesFrom({ reminderHour: 8.5 }).reminderHour, 8);
  assert.equal(preferencesFrom({ reminderHour: '19' }).reminderHour, 8);
});
