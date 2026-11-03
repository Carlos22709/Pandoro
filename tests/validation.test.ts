import { test } from 'node:test';
import assert from 'node:assert/strict';

import { formatMinutes, parseDurationMinutes, validateTaskDraft, DURATION_HINT } from '../src/services/tasks/taskValidation';
import { minutesPerDayProblem, planTextProblem } from '../src/services/planning/planInput';
import { validateName, validateRegistration } from '../src/services/auth/authRules';

test('entiende duraciones comunes', () => {
  assert.equal(parseDurationMinutes('30'), 30);
  assert.equal(parseDurationMinutes('30 min'), 30);
  assert.equal(parseDurationMinutes('45 minutos'), 45);
  assert.equal(parseDurationMinutes('1 h'), 60);
  assert.equal(parseDurationMinutes('1h30'), 90);
  assert.equal(parseDurationMinutes('1 h 30 min'), 90);
  assert.equal(parseDurationMinutes('2 horas y 15'), 135);
  assert.equal(parseDurationMinutes('1,5 horas'), 90);
  assert.equal(parseDurationMinutes('1:30'), 90);
});

test('rechaza duraciones ambiguas', () => {
  for (const value of ['un rato', 'mucho', '1.5 h 30', '1 h 75', '-20', '30 seg', '']) {
    assert.equal(parseDurationMinutes(value), null, value);
  }
});

test('formatea minutos', () => {
  assert.equal(formatMinutes(30), '30 min');
  assert.equal(formatMinutes(60), '1 h');
  assert.equal(formatMinutes(95), '1 h 35 min');
});

test('valida y normaliza una tarea', () => {
  const ok = validateTaskDraft({ title: '  Leer   capítulo 3 ', detail: '', duration: '1h30', difficulty: 'light' });
  assert.deepEqual(ok, { ok: true, draft: { title: 'Leer capítulo 3', detail: 'Sin fecha', duration: '1 h 30 min', difficulty: 'light' } });
  const noDuration = validateTaskDraft({ title: 'Leer', detail: 'Hoy', duration: '  ', difficulty: 'light' });
  assert.equal(noDuration.ok && noDuration.draft.duration, undefined);
});

test('explica por qué una tarea no se guarda', () => {
  const base = { title: 'Leer', detail: 'Hoy', duration: '30 min', difficulty: 'medium' as const };
  const error = (draft: typeof base) => {
    const result = validateTaskDraft(draft);
    return result.ok ? null : result.error;
  };
  assert.equal(error({ ...base, title: '   ' }), 'Escribe el nombre de la tarea.');
  assert.match(error({ ...base, title: '!!!' }) ?? '', /letra o un número/);
  assert.match(error({ ...base, title: 'a'.repeat(121) }) ?? '', /120/);
  assert.match(error({ ...base, detail: 'x'.repeat(81) }) ?? '', /80/);
  assert.equal(error({ ...base, duration: 'un rato' }), DURATION_HINT);
  assert.match(error({ ...base, duration: '0' }) ?? '', /entre 1 minuto y 12 horas/);
  assert.match(error({ ...base, duration: '13 h' }) ?? '', /entre 1 minuto y 12 horas/);
});

test('minutos por día ambiguos o fuera de rango', () => {
  assert.equal(minutesPerDayProblem('60'), null);
  assert.match(minutesPerDayProblem('') ?? '', /Escribe cuántos/);
  assert.match(minutesPerDayProblem('1h') ?? '', /solo el número/);
  assert.match(minutesPerDayProblem('5') ?? '', /al menos 10/);
  assert.match(minutesPerDayProblem('2000') ?? '', /16 horas/);
});

test('texto de responsabilidades vacío, sin palabras o muy largo', () => {
  assert.equal(planTextProblem('Estudiar para el parcial', 4000), null);
  assert.match(planTextProblem('   ', 4000) ?? '', /qué tienes pendiente/);
  assert.match(planTextProblem('??? 123', 4000) ?? '', /con palabras/);
  assert.match(planTextProblem('a'.repeat(4001), 4000) ?? '', /4000/);
});

test('nombre de perfil y registro', () => {
  assert.equal(validateName('Ana'), null);
  assert.equal(validateName('  '), 'Escribe tu nombre.');
  assert.match(validateName('1234') ?? '', /una letra/);
  assert.match(validateName('a'.repeat(61)) ?? '', /60/);
  assert.equal(
    validateRegistration({ name: 'Ana', email: 'ana@correo.co', password: '      ', confirmation: '      ' }),
    'La contraseña no puede ser solo espacios.',
  );
});
