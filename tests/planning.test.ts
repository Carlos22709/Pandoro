import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  GeminiError,
  createPlanService,
  toGeminiError,
  type GenerateFn,
} from '../src/services/gemini/geminiService';
import { parsePlanResponse } from '../src/services/gemini/planContract';
import {
  analyzeProposal,
  mergeRevision,
  planByDay,
  proposalToTasks,
  updateActivity,
  updateSubtask,
} from '../src/services/planning/planLogic';
import type { Availability, PlanProposal } from '../src/services/planning/planTypes';

const availability: Availability = { days: ['2026-11-03', '2026-11-04', '2026-11-05'], minutesPerDay: 120 };
const today = new Date(2026, 10, 2);
const text = 'Preparar exposición de IA para el viernes y estudiar bases de datos';

const subtask = (id: string, date: string | null, order: number, extra: object = {}) => ({
  id,
  title: `Sub ${id}`,
  description: 'detalle',
  durationMinutes: 60,
  difficulty: 'medium',
  dependsOn: [],
  scheduledDate: date,
  order,
  ...extra,
});

const activity = (id: string, subtasks: object[], extra: object = {}) => ({
  id,
  title: `Act ${id}`,
  description: 'desc',
  deadline: null,
  deadlineQuote: null,
  priority: 'medium',
  prioritySource: 'inferred',
  difficulty: 'medium',
  subtasks,
  ...extra,
});

const plan = (activities: object[], extra: object = {}) => JSON.stringify({
  status: 'plan',
  clarificationQuestion: null,
  summary: 'Plan',
  activities,
  removedIds: [],
  overriddenManualFields: [],
  unavailableDates: [],
  ...extra,
});

const twoActivities = plan([
  activity('a1', [subtask('s1', '2026-11-03', 1), subtask('s2', '2026-11-04', 2, { dependsOn: ['s1'] })], {
    deadline: '2026-11-06',
    deadlineQuote: 'para el viernes',
  }),
  activity('a2', [subtask('s3', '2026-11-05', 3, { difficulty: 'high' })]),
]);

const serviceReturning = (raw: string | undefined) => createPlanService({ generate: async () => raw });

async function firstProposal(raw = twoActivities) {
  const result = await serviceReturning(raw).generatePlan({ text, availability, today });
  assert.equal(result.kind, 'proposal');
  return (result as { proposal: PlanProposal }).proposal;
}

test('escenario 1: interpreta una sola responsabilidad', async () => {
  const proposal = await firstProposal(plan([activity('a1', [subtask('s1', '2026-11-03', 1)])]));
  assert.equal(proposal.activities.length, 1);
});

test('escenarios 2-4: varias responsabilidades con subtareas, duración y dificultad', async () => {
  const proposal = await firstProposal();
  assert.equal(proposal.activities.length, 2);
  assert.equal(proposal.activities[0].subtasks.length, 2);
  assert.equal(proposal.activities[0].subtasks[1].dependsOn[0], 's1');
  assert.equal(proposal.activities[1].subtasks[0].difficulty, 'high');
  assert.equal(proposal.activities[0].subtasks[0].durationMinutes, 60);
});

test('solo admite una fecha límite citada del texto del usuario', () => {
  const invented = plan([activity('a1', [subtask('s1', null, 1)], { deadline: '2026-11-20', deadlineQuote: 'antes del 20' })]);
  const parsed = parsePlanResponse(invented, [text]);
  assert.equal(parsed.kind, 'plan');
  assert.equal(parsed.kind === 'plan' && parsed.revision.activities[0].deadline, null);
});

test('la ambigüedad devuelve una aclaración, no actividades', async () => {
  const raw = JSON.stringify({ status: 'needs_clarification', clarificationQuestion: '¿Qué debes entregar?', activities: [] });
  const result = await serviceReturning(raw).generatePlan({ text: 'cosas', availability, today });
  assert.deepEqual(result, { kind: 'clarification', question: '¿Qué debes entregar?' });
});

test('escenario 5: la edición manual marca el campo y sobrevive a otra revisión', async () => {
  let proposal = await firstProposal();
  proposal = updateSubtask(proposal, 's1', { durationMinutes: 25, difficulty: 'high' });
  const { proposal: next } = mergeRevision(proposal, parsedRevision(twoActivities));
  const merged = next.activities[0].subtasks[0];
  assert.equal(merged.durationMinutes, 25);
  assert.equal(merged.difficulty, 'high');
  assert.deepEqual(merged.editedFields, ['durationMinutes', 'difficulty']);
});

test('escenario 9: una instrucción contradictoria sí cambia el valor manual, solo si lo declara', async () => {
  let proposal = await firstProposal();
  proposal = updateSubtask(proposal, 's1', { durationMinutes: 25 });
  proposal = updateActivity(proposal, 'a1', { title: 'Mi título' });
  const raw = plan(JSON.parse(twoActivities).activities, { overriddenManualFields: [{ id: 's1', field: 'durationMinutes' }] });
  const { proposal: next } = mergeRevision(proposal, parsedRevision(raw));
  assert.equal(next.activities[0].subtasks[0].durationMinutes, 60);
  assert.equal(next.activities[0].title, 'Mi título');
  assert.equal(next.revision, 2);
});

test('escenario 9: lo que la IA omite sin declararlo se conserva', async () => {
  const proposal = await firstProposal();
  const dropped = plan([activity('a1', [subtask('s1', '2026-11-03', 1)])]);
  const { proposal: next, restored } = mergeRevision(proposal, parsedRevision(dropped));
  assert.equal(restored, 2);
  assert.deepEqual(next.activities.flatMap((item) => item.subtasks.map((sub) => sub.id)).sort(), ['s1', 's2', 's3']);
});

test('una eliminación declarada sí se aplica', async () => {
  const proposal = await firstProposal();
  const raw = plan([activity('a1', [subtask('s1', '2026-11-03', 1)])], { removedIds: ['s2', 'a2'] });
  const { proposal: next, restored } = mergeRevision(proposal, parsedRevision(raw));
  assert.equal(restored, 0);
  assert.equal(next.activities.length, 1);
});

test('la revisión no pierde una fecha límite que no se vuelve a citar', async () => {
  const proposal = await firstProposal();
  const raw = plan([activity('a1', [subtask('s1', '2026-11-03', 1), subtask('s2', '2026-11-04', 2)]), activity('a2', [subtask('s3', '2026-11-05', 3)])]);
  const result = await serviceReturning(raw).revisePlan({ text, availability, today, proposal, instruction: 'Más tiempo' });
  assert.equal(result.kind === 'proposal' && result.proposal.activities[0].deadline, '2026-11-06');
});

test('escenario 6: detecta un día no disponible y una sobrecarga sin ocultar tareas', async () => {
  const proposal = await firstProposal(plan([activity('a1', [
    subtask('s1', '2026-11-08', 1),
    subtask('s2', '2026-11-03', 2, { durationMinutes: 500 }),
  ])]));
  const kinds = analyzeProposal(proposal, availability).map((issue) => issue.kind);
  assert.ok(kinds.includes('unscheduled'));
  assert.ok(kinds.includes('day_overload'));
  assert.ok(kinds.includes('total_overload'));
  assert.equal(proposalToTasks(proposal, 1).length, 2);
});

test('detecta fecha límite excedida, dependencias invertidas y concentración', async () => {
  const proposal = await firstProposal(plan([activity('a1', [
    subtask('s1', '2026-11-05', 1, { dependsOn: ['s2'] }),
    subtask('s2', '2026-11-05', 2),
  ], { deadline: '2026-11-04', deadlineQuote: 'para el viernes' })]));
  const kinds = analyzeProposal(proposal, availability).map((issue) => issue.kind);
  assert.ok(kinds.includes('after_deadline'));
  assert.ok(kinds.includes('dependency_order'));
  assert.ok(kinds.includes('concentrated'));
});

test('agrupa la planificación por día y en orden', async () => {
  const days = planByDay(await firstProposal());
  assert.deepEqual(days.map((day) => day.date), ['2026-11-03', '2026-11-04', '2026-11-05']);
});

test('escenarios 7-8: la edición llega a la lista solo al convertir, con id estables', async () => {
  const proposal = updateSubtask(await firstProposal(), 's1', { title: 'Editada' });
  const first = proposalToTasks(proposal, 10);
  const second = proposalToTasks(proposal, 10);
  assert.equal(first[0].title, 'Editada');
  assert.equal(first[0].duration, '1 h');
  assert.deepEqual(first.map((task) => task.id), second.map((task) => task.id));
  assert.equal(new Set(first.map((task) => task.id)).size, 3);
});

test('las tareas planeadas guardan su día para el recordatorio', async () => {
  const tasks = proposalToTasks(await firstProposal(), 1);
  assert.deepEqual(tasks.map((task) => task.dueDate), ['2026-11-03', '2026-11-04', '2026-11-05']);
});

test('los campos vacíos bloquean la confirmación', async () => {
  const proposal = updateSubtask(await firstProposal(), 's1', { title: '', durationMinutes: 0 });
  assert.ok(analyzeProposal(proposal, availability).filter((issue) => issue.blocking).length >= 2);
});

for (const [name, raw] of [
  ['JSON inválido', '{"status":"plan","activities":['],
  ['objeto incompleto', '{"status":"plan"}'],
  ['plan vacío', plan([])],
  ['actividad sin subtareas', plan([activity('a1', [])])],
  ['duración inválida', plan([activity('a1', [subtask('s1', null, 1, { durationMinutes: -5 })])])],
  ['dificultad fuera de escala', plan([activity('a1', [subtask('s1', null, 1, { difficulty: 'imposible' })])])],
  ['estado desconocido', '{"status":"ok"}'],
] as const) {
  test(`escenario 10: rechaza ${name}`, async () => {
    await assert.rejects(
      serviceReturning(raw).generatePlan({ text, availability, today }),
      (error: GeminiError) => error.code === 'invalid_response',
    );
  });
}

test('respuesta vacía', async () => {
  await assert.rejects(
    serviceReturning('  ').generatePlan({ text, availability, today }),
    (error: GeminiError) => error.code === 'empty_response',
  );
});

// npm test no carga .env, así que aquí Firebase nunca está configurado.
test('escenario 11: sin configuración de Firebase falla con un error propio y sin llamar al SDK', async () => {
  await assert.rejects(
    createPlanService().generatePlan({ text, availability, today }),
    (error: GeminiError) => error.code === 'missing_key',
  );
});

test('escenario 12: traduce errores HTTP y de red sin filtrar el mensaje original', () => {
  const secret = 'https://x.googleapis.com?key=AIzaSECRETO';
  const cases: [unknown, string][] = [
    [Object.assign(new Error('API key not valid'), { status: 400 }), 'invalid_key'],
    [Object.assign(new Error(secret), { status: 401 }), 'auth'],
    [Object.assign(new Error(secret), { status: 403 }), 'auth'],
    [Object.assign(new Error(secret), { status: 404 }), 'model_unavailable'],
    [Object.assign(new Error(secret), { status: 429 }), 'quota'],
    [Object.assign(new Error(secret), { status: 503 }), 'provider'],
    [new TypeError(`Network request failed ${secret}`), 'network'],
    [Object.assign(new Error('aborted'), { name: 'AbortError' }), 'timeout'],
  ];
  for (const [error, code] of cases) {
    const mapped = toGeminiError(error);
    assert.equal(mapped.code, code);
    assert.ok(!mapped.message.includes('AIza'));
  }
});

test('agota el tiempo de espera y aborta la solicitud', async () => {
  let aborted = false;
  const generate: GenerateFn = ({ signal }) => new Promise(() => {
    signal.addEventListener('abort', () => { aborted = true; });
  });
  await assert.rejects(
    createPlanService({ generate, timeoutMs: 10 }).generatePlan({ text, availability, today }),
    (error: GeminiError) => error.code === 'timeout',
  );
  assert.ok(aborted);
});

test('no repite una solicitud idéntica en curso y permite reintentar tras un fallo', async () => {
  let calls = 0;
  const service = createPlanService({
    generate: async () => {
      calls += 1;
      if (calls === 1) throw Object.assign(new Error('x'), { status: 503 });
      return twoActivities;
    },
  });
  const input = { text, availability, today };
  const results = await Promise.allSettled([service.generatePlan(input), service.generatePlan(input)]);
  assert.equal(calls, 1);
  assert.ok(results.every((item) => item.status === 'rejected'));
  assert.equal((await service.generatePlan(input)).kind, 'proposal');
  assert.equal(calls, 2);
});

function parsedRevision(raw: string) {
  const parsed = parsePlanResponse(raw, [text]);
  assert.equal(parsed.kind, 'plan');
  return (parsed as Extract<typeof parsed, { kind: 'plan' }>).revision;
}
