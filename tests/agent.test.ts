import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AIError } from 'firebase/ai';

import { createPlanService, toGeminiError } from '../src/services/gemini/geminiService';
import { redactPersonalData } from '../src/services/gemini/redactPersonalData';

const availability = { days: ['2026-11-03'], minutesPerDay: 120 };
const today = new Date(2026, 10, 2);

test('reemplaza correos antes de enviar el texto al modelo', () => {
  assert.equal(
    redactPersonalData('Escribirle a ana.perez@unisabana.edu.co sobre el informe'),
    'Escribirle a [correo] sobre el informe',
  );
});

test('reemplaza teléfonos y números de documento', () => {
  assert.equal(
    redactPersonalData('Llamar al +57 300 123 4567 o al 3001234567 y llevar la cédula 1.020.304.050'),
    'Llamar al [número] o al [número] y llevar la cédula [número]',
  );
});

test('conserva fechas, horas y cantidades que el plan necesita', () => {
  const text = 'Entregar el 15/11/2026 a las 3:30, son 80 páginas y 2 horas; la cita es el 2026-11-20 de 8 a 10';

  assert.equal(redactPersonalData(text), text);
});

test('el servicio nunca envía al modelo el correo que escribió el usuario', async () => {
  let prompt = '';
  const service = createPlanService({
    generate: async (request) => {
      prompt = request.prompt;
      return JSON.stringify({ status: 'needs_clarification', clarificationQuestion: '¿Qué debes hacer?', summary: '', activities: [] });
    },
  });

  await service.generatePlan({ text: 'Mandar el acta a profe@unisabana.edu.co', availability, today });

  assert.ok(!prompt.includes('profe@unisabana.edu.co'));
  assert.ok(prompt.includes('[correo]'));
});

test('traduce los errores de Firebase AI Logic sin mostrar el mensaje original', () => {
  const secret = 'https://firebasevertexai.googleapis.com/v1beta/projects/pandask?key=AIzaSECRETO';
  const cases: [AIError, string][] = [
    [new AIError('api-not-enabled', secret), 'ai_not_enabled'],
    // Así llega en la práctica: la API sin activar responde con 403.
    [new AIError('api-not-enabled', secret, { status: 403 }), 'ai_not_enabled'],
    [new AIError('no-api-key', secret), 'missing_key'],
    [new AIError('no-project-id', secret), 'missing_key'],
    [new AIError('fetch-error', secret, { status: 429 }), 'quota'],
    [new AIError('fetch-error', secret, { status: 403 }), 'auth'],
    [new AIError('fetch-error', secret, { status: 404 }), 'model_unavailable'],
    [new AIError('fetch-error', secret, { status: 503 }), 'provider'],
    [new AIError('fetch-error', secret), 'network'],
    [new AIError('response-error', secret), 'invalid_response'],
    [new AIError('parse-failed', secret), 'invalid_response'],
  ];

  for (const [error, code] of cases) {
    const translated = toGeminiError(error);
    assert.equal(translated.code, code, error.code);
    assert.ok(!translated.message.includes('AIzaSECRETO'));
  }
});
