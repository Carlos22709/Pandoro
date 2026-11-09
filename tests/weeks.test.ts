import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addWeeks, isSameWeek, weekEnd, weekEndIso, weekKey, weekStart } from '../src/services/progress/weeks';

// Fechas locales: new Date(año, mes0, día, h, m, s).
test('la semana va de lunes a domingo', () => {
  const wednesday = new Date(2026, 10, 11, 15, 0, 0);
  assert.equal(weekKey(wednesday), '2026-11-09');
  assert.equal(weekStart(wednesday).getDay(), 1);
  assert.equal(weekEnd(wednesday).getDay(), 0);
});

test('domingo 23:59:59 es de esa semana y lunes 00:00:00 de la siguiente', () => {
  const sunday = new Date(2026, 10, 15, 23, 59, 59);
  const monday = new Date(2026, 10, 16, 0, 0, 0);
  assert.equal(weekKey(sunday), '2026-11-09');
  assert.equal(weekKey(monday), '2026-11-16');
  assert.equal(isSameWeek(sunday, monday), false);
  assert.equal(isSameWeek(new Date(2026, 10, 9), sunday), true);
});

test('la semana que cruza el cambio de año se identifica por su lunes', () => {
  assert.equal(weekKey(new Date(2025, 11, 29)), '2025-12-29');
  assert.equal(weekKey(new Date(2026, 0, 1)), '2025-12-29');
  assert.equal(weekKey(new Date(2026, 0, 4, 23, 59, 59)), '2025-12-29');
  assert.equal(weekKey(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(weekEndIso('2025-12-29'), '2026-01-04');
  assert.equal(addWeeks('2025-12-29', 1), '2026-01-05');
  assert.equal(addWeeks('2026-01-05', -1), '2025-12-29');
});

test('el cambio de hora no desplaza la semana (se calcula por calendario)', () => {
  // Primer domingo de noviembre en EE. UU.: la noche dura 25 horas.
  assert.equal(weekKey(new Date(2026, 10, 1, 23, 30)), '2026-10-26');
  assert.equal(weekKey(new Date(2026, 10, 2, 0, 30)), '2026-11-02');
});

test('la semana depende de la zona horaria del dispositivo', () => {
  const instant = Date.UTC(2026, 10, 16, 3, 0, 0); // lunes 03:00 UTC
  const original = process.env.TZ;
  try {
    process.env.TZ = 'America/Bogota'; // UTC-5: todavía es domingo 22:00
    assert.equal(weekKey(new Date(instant)), '2026-11-09');
    process.env.TZ = 'UTC';
    assert.equal(weekKey(new Date(instant)), '2026-11-16');
    process.env.TZ = 'Asia/Tokyo'; // UTC+9: lunes 12:00
    assert.equal(weekKey(new Date(instant)), '2026-11-16');
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});
