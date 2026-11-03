import assert from 'node:assert/strict';
import { test } from 'node:test';

import { describeReason, prioritizeTasks, type PriorityTask } from '../src/services/planning/priority';

const today = '2026-11-02';

const task = (id: string, extra: Partial<PriorityTask> = {}): PriorityTask => ({
  id,
  deadline: null,
  importance: 'medium',
  difficulty: 'medium',
  remainingMinutes: 60,
  scheduledDate: null,
  ...extra,
});

const order = (tasks: PriorityTask[], availability = null) =>
  prioritizeTasks(tasks, { today, availability }).ranked.map((ranked) => ranked.id);

test('escenario 1: la fecha límite más cercana va primero', () => {
  const tasks = [task('ensayo', { deadline: '2026-11-09' }), task('taller', { deadline: '2026-11-04' })];

  assert.deepEqual(order(tasks), ['taller', 'ensayo']);
});

test('escenario 2: con igual urgencia e importancia, la más fácil va primero', () => {
  const tasks = [
    task('informe', { deadline: '2026-11-05', difficulty: 'high' }),
    task('correo', { deadline: '2026-11-05', difficulty: 'light' }),
  ];

  assert.deepEqual(order(tasks), ['correo', 'informe']);
});

test('escenario 3: la importancia desempata antes que la dificultad', () => {
  const tasks = [
    task('lectura', { deadline: '2026-11-05', difficulty: 'light', importance: 'medium' }),
    task('parcial', { deadline: '2026-11-05', difficulty: 'high', importance: 'high' }),
  ];

  assert.deepEqual(order(tasks), ['parcial', 'lectura']);
});

test('escenario 4: lo que vence hoy va antes que algo importante para después', () => {
  const tasks = [
    task('parcial', { deadline: '2026-11-04', importance: 'high' }),
    task('quiz', { deadline: today, importance: 'low' }),
  ];

  assert.deepEqual(order(tasks), ['quiz', 'parcial']);
});

test('escenario 5: lo que el plan programó para hoy o antes sube al nivel de hoy', () => {
  const tasks = [
    task('parcial', { deadline: '2026-11-04', importance: 'high' }),
    task('repaso', { scheduledDate: '2026-11-01', importance: 'low' }),
  ];

  const { ranked } = prioritizeTasks(tasks, { today, availability: null });

  assert.deepEqual(ranked.map((item) => item.id), ['repaso', 'parcial']);
  assert.equal(ranked[0].level, 'today');
});

test('escenario 6: si no alcanza sin empezar hoy, pasa al nivel de hoy', () => {
  // Hasta mañana hay 240 min; con 200 por hacer sobran 40, menos que un día de trabajo.
  const tasks = [
    task('resumen', { deadline: '2026-11-03', importance: 'high', remainingMinutes: 30 }),
    task('tesis', { deadline: '2026-11-03', importance: 'low', remainingMinutes: 200 }),
  ];

  assert.deepEqual(order(tasks), ['tesis', 'resumen']);
});

test('escenario 7: si el tiempo disponible no alcanza, va primero y genera un aviso', () => {
  // Hasta el miércoles hay 2 días de 60 min: el informe necesita 180 y el quiz cabe hoy.
  const availability = { days: [today, '2026-11-03', '2026-11-06'], minutesPerDay: 60 };
  const tasks = [
    task('quiz', { deadline: today }),
    task('informe', { deadline: '2026-11-04', remainingMinutes: 180 }),
  ];

  const result = prioritizeTasks(tasks, { today, availability });

  assert.deepEqual(result.ranked.map((item) => item.id), ['informe', 'quiz']);
  assert.equal(result.ranked[0].level, 'late');
  assert.deepEqual(result.warnings, [
    { taskId: 'informe', deadline: '2026-11-04', neededMinutes: 180, availableMinutes: 120 },
  ]);
});

test('escenario 8: un día que el usuario no marcó como disponible no cuenta como tiempo', () => {
  const availability = { days: ['2026-11-03'], minutesPerDay: 60 };

  const result = prioritizeTasks([task('quiz', { deadline: today })], { today, availability });

  assert.equal(result.ranked[0].level, 'late');
  assert.deepEqual(result.warnings, [{ taskId: 'quiz', deadline: today, neededMinutes: 60, availableMinutes: 0 }]);
});

test('escenario 9: sin disponibilidad registrada no inventa avisos', () => {
  // Con la capacidad por defecto (360 min hasta el miércoles) no alcanzaría, pero es una suposición.
  const tasks = [task('informe', { deadline: '2026-11-04', remainingMinutes: 500 })];

  const result = prioritizeTasks(tasks, { today, availability: null });

  assert.deepEqual(result.warnings, []);
  assert.equal(result.ranked[0].level, 'today');
});

test('escenario 10: una fecha límite vencida va primero, sin aviso de tiempo', () => {
  const tasks = [
    task('quiz', { deadline: today, importance: 'high' }),
    task('formulario', { deadline: '2026-10-30', importance: 'low' }),
  ];

  const result = prioritizeTasks(tasks, { today, availability: null });

  assert.deepEqual(result.ranked.map((item) => item.id), ['formulario', 'quiz']);
  assert.equal(result.ranked[0].level, 'late');
  assert.deepEqual(result.warnings, []);
});

test('escenario 11: lo que no tiene fecha límite va al final', () => {
  const tasks = [
    task('ordenar-escritorio', { importance: 'high', difficulty: 'light' }),
    task('ensayo', { deadline: '2026-11-20', importance: 'low', difficulty: 'high' }),
  ];

  assert.deepEqual(order(tasks), ['ensayo', 'ordenar-escritorio']);
});

test('escenario 12: el orden no depende del orden en que llegan las tareas', () => {
  const tasks = [
    task('c', { deadline: '2026-11-06' }),
    task('a', { deadline: '2026-11-06' }),
    task('b', { deadline: '2026-11-06' }),
    task('d'),
  ];

  assert.deepEqual(order(tasks), ['a', 'b', 'c', 'd']);
  assert.deepEqual(order([...tasks].reverse()), ['a', 'b', 'c', 'd']);
});

test('la sugerencia de Pandoro es la primera tarea, o ninguna si no hay pendientes', () => {
  const tasks = [task('ensayo', { deadline: '2026-11-09' }), task('quiz', { deadline: today })];

  assert.equal(prioritizeTasks(tasks, { today, availability: null }).suggestion, 'quiz');
  assert.equal(prioritizeTasks([], { today, availability: null }).suggestion, null);
});

test('cada tarea explica por qué está en su lugar', () => {
  const availability = { days: [today, '2026-11-03', '2026-11-04', '2026-11-05'], minutesPerDay: 60 };
  const tasks = [
    task('vencida', { deadline: '2026-10-30' }),
    task('sin-tiempo', { deadline: '2026-11-03', remainingMinutes: 300 }),
    task('hoy', { deadline: today }),
    task('del-plan', { scheduledDate: today }),
    task('empezar-hoy', { deadline: '2026-11-03', remainingMinutes: 90 }),
    task('pronto', { deadline: '2026-11-04' }),
    task('despues', { deadline: '2026-11-30' }),
    task('sin-fecha'),
  ];

  const reasons = Object.fromEntries(
    prioritizeTasks(tasks, { today, availability }).ranked.map((item) => [item.id, item.reason.kind]),
  );

  assert.deepEqual(reasons, {
    vencida: 'overdue',
    'sin-tiempo': 'not_enough_time',
    hoy: 'due_today',
    'del-plan': 'scheduled_today',
    'empezar-hoy': 'start_today',
    pronto: 'due_soon',
    despues: 'due_later',
    'sin-fecha': 'no_deadline',
  });
});

test('los motivos se leen en español y sin culpa', () => {
  assert.equal(describeReason({ kind: 'overdue', deadline: '2026-10-30' }), 'La fecha límite era el vie 30 oct. ¿La reprogramamos?');
  assert.equal(
    describeReason({ kind: 'not_enough_time', deadline: '2026-11-04', neededMinutes: 180, availableMinutes: 120 }),
    'Necesitas 3 h y hasta el mié 4 nov tienes 2 h libres. ¿La ajustamos?',
  );
  assert.equal(describeReason({ kind: 'due_today', deadline: today }), 'Vence hoy');
  assert.equal(describeReason({ kind: 'scheduled_today' }), 'Estaba en tu plan para hoy');
  assert.equal(describeReason({ kind: 'start_today', deadline: '2026-11-03' }), 'Conviene empezarla hoy para llegar al mar 3 nov');
  assert.equal(describeReason({ kind: 'due_soon', deadline: '2026-11-04' }), 'Vence el mié 4 nov');
  assert.equal(describeReason({ kind: 'due_later', deadline: '2026-11-30' }), 'Tienes tiempo hasta el lun 30 nov');
  assert.equal(describeReason({ kind: 'no_deadline' }), 'Sin fecha límite');
});
