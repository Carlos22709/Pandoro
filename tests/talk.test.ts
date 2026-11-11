import assert from 'node:assert/strict';
import { test } from 'node:test';

import { responsibilitiesText, sendTalkTurn, type TalkMessage } from '../src/components/talk/talkConversation';
import { GeminiError, createPlanService } from '../src/services/gemini/geminiService';

// Gemini se reemplaza por una función falsa: estas pruebas no llaman a Firebase.
const availability = { days: ['2026-11-04', '2026-11-05'], minutesPerDay: 120 };
const today = new Date(2026, 10, 3);
const greeting: TalkMessage = { id: 'greeting', from: 'pandoro', text: '¡Hola! Cuéntame qué tienes pendiente.' };

const clarification = JSON.stringify({
  status: 'needs_clarification',
  clarificationQuestion: '¿Para cuándo es el parcial?',
  summary: '',
  activities: [],
});

test('al modelo solo van los mensajes del usuario, no el saludo ni las preguntas de Pandoro', () => {
  const messages: TalkMessage[] = [
    greeting,
    { id: 'user-1', from: 'user', text: ' Estudiar para el parcial ' },
    { id: 'pandoro-2', from: 'pandoro', text: '¿Para cuándo es el parcial?' },
    { id: 'user-3', from: 'user', text: 'Para el viernes' },
  ];

  assert.equal(responsibilitiesText(messages), 'Estudiar para el parcial\nPara el viernes');
});

test('una pregunta de Pandoro se agrega a la conversación y el prompt no lleva datos personales', async () => {
  const prompts: string[] = [];
  const service = createPlanService({
    generate: async ({ prompt }) => {
      prompts.push(prompt);
      return clarification;
    },
  });

  const result = await sendTalkTurn(service, {
    messages: [greeting],
    input: 'Estudiar para el parcial y escribirle a profe@unisabana.edu.co o al 3001234567',
    availability,
    today,
  });

  assert.equal(result.kind, 'clarification');
  assert.deepEqual(result.messages.map((message) => message.from), ['pandoro', 'user', 'pandoro']);
  assert.equal(result.messages.at(-1)?.text, '¿Para cuándo es el parcial?');
  assert.ok(!prompts[0].includes('profe@unisabana.edu.co'));
  assert.ok(!prompts[0].includes('3001234567'));
  assert.ok(!prompts[0].includes('¡Hola!'));
});

test('la respuesta a la pregunta se envía junto con lo que el usuario ya había dicho', async () => {
  const prompts: string[] = [];
  const service = createPlanService({
    generate: async ({ prompt }) => {
      prompts.push(prompt);
      return clarification;
    },
  });

  const first = await sendTalkTurn(service, { messages: [greeting], input: 'Estudiar para el parcial', availability, today });
  await sendTalkTurn(service, { messages: first.messages, input: 'Es el viernes', availability, today });

  assert.ok(prompts[1].includes('Estudiar para el parcial'));
  assert.ok(prompts[1].includes('Es el viernes'));
});

test('si Gemini falla, el error llega traducido y la conversación anterior no cambia', async () => {
  const service = createPlanService({
    generate: async () => {
      throw Object.assign(new Error('https://example.test?key=SECRETO'), { status: 429 });
    },
  });
  const messages = [greeting];

  await assert.rejects(
    sendTalkTurn(service, { messages, input: 'Estudiar', availability, today }),
    (error: unknown) => error instanceof GeminiError && error.code === 'quota' && !error.message.includes('SECRETO'),
  );
  assert.deepEqual(messages, [greeting]);
});

test('una propuesta llega como sugerencia editable y Pandoro responde con su resumen', async () => {
  const raw = JSON.stringify({
    status: 'plan',
    clarificationQuestion: null,
    summary: 'Te propongo estudiar dos días antes del parcial.',
    activities: [{
      id: 'a1',
      title: 'Estudiar para el parcial',
      description: 'Repasar los temas',
      deadline: null,
      deadlineQuote: null,
      priority: 'high',
      prioritySource: 'inferred',
      difficulty: 'medium',
      subtasks: [{
        id: 's1',
        title: 'Repasar el tema 1',
        description: 'Leer apuntes',
        durationMinutes: 60,
        difficulty: 'medium',
        dependsOn: [],
        scheduledDate: '2026-11-04',
        order: 1,
      }],
    }],
    removedIds: [],
    overriddenManualFields: [],
    unavailableDates: [],
  });
  const service = createPlanService({ generate: async () => raw });

  const result = await sendTalkTurn(service, { messages: [greeting], input: 'Estudiar para el parcial', availability, today });

  assert.equal(result.kind, 'proposal');
  assert.equal(result.messages.at(-1)?.text, 'Te propongo estudiar dos días antes del parcial.');
  if (result.kind === 'proposal') assert.equal(result.proposal.activities[0].subtasks.length, 1);
});
