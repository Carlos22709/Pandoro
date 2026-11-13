import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plural } from '../src/utils/plural';

test('concuerda singular y plural', () => {
  assert.equal(plural(1, 'tarea'), '1 tarea');
  assert.equal(plural(0, 'tarea'), '0 tareas');
  assert.equal(plural(3, 'subtarea'), '3 subtareas');
  assert.equal(plural(2, 'mes', 'meses'), '2 meses');
});
