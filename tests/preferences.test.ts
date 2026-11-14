import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PREFERENCES, preferencesFrom } from '../src/services/preferences/preferences';

test('sin nada guardado se usan los valores por defecto', () => {
  assert.deepEqual(preferencesFrom(undefined), DEFAULT_PREFERENCES);
  assert.deepEqual(preferencesFrom({}), DEFAULT_PREFERENCES);
});

test('lo guardado reemplaza el valor por defecto', () => {
  assert.deepEqual(
    preferencesFrom({ taskReminders: false, reducedMotion: true }),
    { reducedMotion: true, pandoroBubble: true, taskReminders: false },
  );
});

test('las claves antiguas no se heredan: reduceMotion venía activado por defecto y no hacía nada', () => {
  const saved = { reduceMotion: true, darkMode: true, usageAnalytics: true, sounds: true };
  assert.deepEqual(preferencesFrom(saved), DEFAULT_PREFERENCES);
});

test('un valor que no es verdadero/falso se ignora', () => {
  assert.equal(preferencesFrom({ taskReminders: 'no' }).taskReminders, true);
});
