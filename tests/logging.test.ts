import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import { sendTalkTurn } from '../src/components/talk/talkConversation';
import { createPlanService } from '../src/services/gemini/geminiService';
import {
  clearLogEntries,
  getLogEntries,
  logError,
  logEvent,
  markFlowStart,
  sanitizeMessage,
  sanitizeScreen,
  takeFlowDuration,
} from '../src/services/logging/appLog';

const availability = { days: ['2026-11-03'], minutesPerDay: 120 };
const today = new Date(2026, 10, 2);
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
  await sendTalkTurn(ok, { messages: [], input: SECRET, availability, today });
  // Hablar usa el servicio inyectado; el registro de IA vive en createPlanService.
  assert.equal(getLogEntries().length, 0);

  const service = createPlanService({
    generate: async () => {
      throw Object.assign(new Error(`fallo con ${SECRET}`), { code: 'fetch-error' });
    },
  });
  await assert.rejects(service.generatePlan({ text: SECRET, availability, today }));

  const events = getLogEntries().map((e) => e.event);
  assert.deepEqual(events, ['ai_suggestion_requested', 'ai_suggestion_failed', 'agent_error']);
  const dump = JSON.stringify(getLogEntries());
  for (const leak of ['ana.perez', 'unisabana', '3001234567', 'informe de Ana', 'Llamar a ana']) {
    assert.ok(!dump.includes(leak), `se filtró «${leak}»`);
  }
  assert.ok(getLogEntries().every((e) => e.event === 'ai_suggestion_requested' || typeof e.durationMs === 'number'));
});

test('registra duración del pedido a Gemini y de la aceptación del plan', async () => {
  const raw = JSON.stringify({
    status: 'plan',
    clarificationQuestion: null,
    summary: 'Plan',
    activities: [{
      id: 'a1',
      title: 'Estudiar',
      description: 'desc',
      deadline: null,
      deadlineQuote: null,
      priority: 'medium',
      prioritySource: 'inferred',
      difficulty: 'medium',
      subtasks: [{
        id: 's1',
        title: 'Leer',
        description: 'desc',
        durationMinutes: 30,
        difficulty: 'light',
        dependsOn: [],
        scheduledDate: '2026-11-03',
        order: 1,
      }],
    }],
    removedIds: [],
    overriddenManualFields: [],
    unavailableDates: [],
  });
  const service = createPlanService({ generate: async () => raw });
  await service.generatePlan({ text: 'Estudiar para el parcial', availability, today });
  const received = getLogEntries().find((e) => e.event === 'ai_suggestion_received');
  assert.ok(received);
  assert.equal(typeof received.durationMs, 'number');
  assert.ok((received.durationMs ?? -1) >= 0);

  // Simula la aceptación del plan (TasksProvider llama takeFlowDuration('plan_accept')).
  const durationMs = takeFlowDuration('plan_accept');
  assert.equal(typeof durationMs, 'number');
  logEvent('plan_accepted', { durationMs });
  logEvent('task_created');
  logEvent('task_completed');
  assert.deepEqual(
    getLogEntries().map((e) => e.event),
    ['ai_suggestion_requested', 'ai_suggestion_received', 'plan_accepted', 'task_created', 'task_completed'],
  );
});

test('markFlowStart ignora nombres raros que podrían filtrar texto', () => {
  markFlowStart('hola ana@x.co');
  assert.equal(takeFlowDuration('hola ana@x.co'), undefined);
});

test('guarda como máximo 200 registros', () => {
  for (let i = 0; i < 250; i += 1) logEvent('app_started');
  assert.equal(getLogEntries().length, 200);
});
