import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import { sendTalkTurn } from '../src/components/talk/talkConversation';
import { clearLogEntries, getLogEntries, logError, logEvent, sanitizeMessage, sanitizeScreen } from '../src/services/logging/appLog';

const availability = { days: ['2026-11-03'], minutesPerDay: 120 };
const SECRET = 'Llamar a ana.perez@unisabana.edu.co al 3001234567 por el "informe de Ana"';

beforeEach(() => clearLogEntries());

test('registra eventos con nombre y hora', () => {
  logEvent('screen_view', { screen: '/hablar' });
  const [entry] = getLogEntries();
  assert.equal(entry.event, 'screen_view');
  assert.equal(entry.screen, '/hablar');
  assert.ok(!Number.isNaN(Date.parse(entry.at)));
});

test('sanea correos, números y texto entre comillas en los errores', () => {
  assert.equal(sanitizeMessage(SECRET), 'Llamar a [correo] al [número] por el [texto]');
  assert.equal(sanitizeScreen('/tareas/abc123'), '/tareas/:id');
});

test('conserva el código de error de Firebase y descarta códigos raros', () => {
  logError('auth_error', Object.assign(new Error('x'), { code: 'auth/invalid-credential' }));
  logError('auth_error', Object.assign(new Error('x'), { code: 'hola ana@x.co' }));
  const [first, second] = getLogEntries();
  assert.equal(first.code, 'auth/invalid-credential');
  assert.equal(second.code, undefined);
});

test('una conversación de Hablar no deja texto del usuario en el registro', async () => {
  const ok = { generatePlan: async () => ({ kind: 'clarification' as const, question: '¿Para cuándo?' }) };
  await sendTalkTurn(ok, { messages: [], input: SECRET, availability, today: new Date(2026, 10, 2) });
  const failing = { generatePlan: async () => { throw new Error(`fallo con ${SECRET}`); } };
  await assert.rejects(sendTalkTurn(failing, { messages: [], input: SECRET, availability, today: new Date(2026, 10, 2) }));

  const events = getLogEntries().map((e) => e.event);
  assert.deepEqual(events, ['ai_suggestion_requested', 'ai_clarification_requested', 'ai_suggestion_requested', 'ai_suggestion_failed']);
  const dump = JSON.stringify(getLogEntries());
  for (const leak of ['ana.perez', 'unisabana', '3001234567', 'informe de Ana', 'Llamar a ana']) {
    assert.ok(!dump.includes(leak), `se filtró «${leak}»`);
  }
});

test('guarda como máximo 200 registros', () => {
  for (let i = 0; i < 250; i += 1) logEvent('app_started');
  assert.equal(getLogEntries().length, 200);
});
