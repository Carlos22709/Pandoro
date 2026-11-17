import { AIError, GoogleAIBackend, getAI, getGenerativeModel } from 'firebase/ai';

import { getFirebaseApp, isFirebaseConfigured } from '@/services/firebase/firebaseApp';
import { logError, logEvent, markFlowStart } from '@/services/logging/appLog';
import { mergeRevision } from '@/services/planning/planLogic';
import type { Availability, PlanActivity, PlanProposal } from '@/services/planning/planTypes';

import { PLAN_RESPONSE_SCHEMA, PlanResponseError, parsePlanResponse } from './planContract';
import { PLAN_SYSTEM_INSTRUCTION, buildGeneratePrompt, buildRevisePrompt } from './planPrompt';
import { redactPersonalData } from './redactPersonalData';

// Único archivo que habla con Gemini, a través de Firebase AI Logic: la clave de Gemini vive en
// Firebase, no en la app. Cambiar de proveedor solo toca geminiGenerate; la pantalla solo conoce
// generatePlan, revisePlan y GeminiError.
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_TOKENS = 12_000;
export const MAX_INPUT_LENGTH = 4_000;

export type GeminiErrorCode =
  | 'missing_key'
  | 'invalid_key'
  | 'auth'
  | 'quota'
  | 'network'
  | 'timeout'
  | 'empty_response'
  | 'invalid_response'
  | 'model_unavailable'
  | 'provider'
  | 'unsupported_runtime'
  | 'ai_not_enabled';

const ERROR_MESSAGES: Record<GeminiErrorCode, string> = {
  missing_key: 'Pandoro aún no tiene configurada su conexión con la IA. Revisa la configuración de Firebase en el archivo .env.',
  invalid_key: 'La configuración de Firebase no es válida. Revísala en el archivo .env.',
  auth: 'Firebase rechazó el acceso a la IA. Revisa los permisos del proyecto.',
  quota: 'Se alcanzó el límite de solicitudes de Gemini. Espera un momento e inténtalo de nuevo.',
  network: 'No hay conexión con Gemini. Revisa tu internet e inténtalo de nuevo.',
  timeout: 'Gemini tardó demasiado en responder. Inténtalo de nuevo.',
  empty_response: 'Gemini no devolvió ninguna propuesta. Inténtalo de nuevo.',
  invalid_response: 'La respuesta de Gemini llegó incompleta, así que no se usó. Inténtalo de nuevo.',
  model_unavailable: 'El modelo configurado no está disponible. Revisa EXPO_PUBLIC_GEMINI_MODEL.',
  provider: 'Gemini tiene un problema temporal. Inténtalo de nuevo en unos minutos.',
  unsupported_runtime: 'La IA no pudo iniciarse en este dispositivo. Puedes crear tus tareas manualmente.',
  ai_not_enabled: 'La IA todavía no está activada en el proyecto de Firebase. Puedes crear tus tareas manualmente.',
};

export class GeminiError extends Error {
  readonly code: GeminiErrorCode;

  constructor(code: GeminiErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = 'GeminiError';
    this.code = code;
  }
}

export type GenerateRequest = {
  prompt: string;
  systemInstruction: string;
  schema: unknown;
  signal: AbortSignal;
};

export type GenerateFn = (request: GenerateRequest) => Promise<string | undefined>;

const geminiGenerate: GenerateFn = async ({ prompt, systemInstruction, schema, signal }) => {
  if (!isFirebaseConfigured) throw new GeminiError('missing_key');

  // Expo solo sustituye process.env.EXPO_PUBLIC_* escrito de forma literal.
  const model = getGenerativeModel(getAI(getFirebaseApp(), { backend: new GoogleAIBackend() }), {
    model: process.env.EXPO_PUBLIC_GEMINI_MODEL?.trim() || DEFAULT_MODEL,
    systemInstruction,
    generationConfig: {
      responseMimeType: 'application/json',
      responseJsonSchema: schema as Record<string, unknown>,
      temperature: 0.3,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  });
  const result = await model.generateContent(prompt, { signal });
  return result.response.text();
};

function fromStatus(status: number, message: string) {
  if (status === 400 && /api[ _-]?key/i.test(message)) return new GeminiError('invalid_key');
  if (status === 401 || status === 403) return new GeminiError('auth');
  if (status === 404) return new GeminiError('model_unavailable');
  if (status === 408) return new GeminiError('timeout');
  if (status === 429) return new GeminiError('quota');
  if (status >= 500) return new GeminiError('provider');
  return new GeminiError('invalid_response');
}

// El código de AI Logic va primero: una API sin activar también llega con estado 403.
function fromAIError(error: AIError) {
  switch (error.code) {
    case 'api-not-enabled':
      return new GeminiError('ai_not_enabled');
    case 'no-api-key':
    case 'no-project-id':
    case 'no-app-id':
      return new GeminiError('missing_key');
  }
  const status = error.customErrorData?.status;
  if (typeof status === 'number') return fromStatus(status, error.message);
  switch (error.code) {
    case 'response-error':
    case 'parse-failed':
    case 'invalid-content':
      return new GeminiError('invalid_response');
    case 'fetch-error':
      return new GeminiError('network');
    default:
      return new GeminiError('provider');
  }
}

// Traduce cualquier fallo a un código propio: el mensaje original puede incluir la URL o la clave.
export function toGeminiError(error: unknown): GeminiError {
  if (error instanceof GeminiError) return error;
  if (error instanceof PlanResponseError) return new GeminiError('invalid_response');
  if (error instanceof AIError) return fromAIError(error);

  const status = (error as { status?: unknown } | null)?.status;
  const message = error instanceof Error ? error.message : '';
  if (typeof status === 'number') return fromStatus(status, message);
  if (error instanceof Error && error.name === 'AbortError') return new GeminiError('timeout');
  return new GeminiError('network');
}

type PlanResult =
  | { kind: 'clarification'; question: string }
  | { kind: 'proposal'; proposal: PlanProposal; unavailableDates: string[]; restored: number };

type GenerateInput = { text: string; availability: Availability; today: Date };
type ReviseInput = GenerateInput & { proposal: PlanProposal; instruction: string };

type ServiceOptions = { generate?: GenerateFn; timeoutMs?: number };

export function createPlanService({ generate = geminiGenerate, timeoutMs = REQUEST_TIMEOUT_MS }: ServiceOptions = {}) {
  const inFlight = new Map<string, Promise<string | undefined>>();

  const request = (prompt: string) => {
    const running = inFlight.get(prompt);
    if (running) return running;

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new GeminiError('timeout'));
      }, timeoutMs);
    });
    const call = generate({
      prompt,
      systemInstruction: PLAN_SYSTEM_INSTRUCTION,
      schema: PLAN_RESPONSE_SCHEMA,
      signal: controller.signal,
    });
    const pending = Promise.race([call, timeout]).finally(() => {
      clearTimeout(timer);
      inFlight.delete(prompt);
    });
    inFlight.set(prompt, pending);
    return pending;
  };

  const run = async (prompt: string, sources: string[]) => {
    try {
      const raw = await request(prompt);
      if (!raw?.trim()) throw new GeminiError('empty_response');
      return parsePlanResponse(raw, sources);
    } catch (error) {
      throw toGeminiError(error);
    }
  };

  return {
    async generatePlan({ text: rawText, availability, today }: GenerateInput): Promise<PlanResult> {
      const text = redactPersonalData(rawText);
      logEvent('ai_suggestion_requested');
      const started = Date.now();
      try {
        const parsed = await run(buildGeneratePrompt(text, availability, today), [text]);
        const durationMs = Date.now() - started;
        if (parsed.kind === 'clarification') {
          logEvent('ai_clarification_requested', { durationMs });
          return parsed;
        }
        const proposal: PlanProposal = {
          id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
          summary: parsed.revision.summary,
          activities: parsed.revision.activities,
          revision: 1,
        };
        logEvent('ai_suggestion_received', { durationMs });
        markFlowStart('plan_accept');
        return { kind: 'proposal', proposal, unavailableDates: parsed.unavailableDates, restored: 0 };
      } catch (failure) {
        const durationMs = Date.now() - started;
        logError('ai_suggestion_failed', failure, { durationMs });
        logError('agent_error', failure, { durationMs });
        throw failure;
      }
    },

    async revisePlan({ text: rawText, availability, today, proposal, instruction: rawInstruction }: ReviseInput): Promise<PlanResult> {
      const text = redactPersonalData(rawText);
      const instruction = redactPersonalData(rawInstruction);
      const prompt = buildRevisePrompt(text, instruction, proposal, availability, today);
      logEvent('ai_suggestion_requested');
      const started = Date.now();
      try {
        const parsed = await run(prompt, [text, instruction]);
        const durationMs = Date.now() - started;
        if (parsed.kind === 'clarification') {
          logEvent('ai_clarification_requested', { durationMs });
          return parsed;
        }
        const { proposal: next, restored } = mergeRevision(proposal, withKnownDeadlines(parsed.revision, proposal));
        logEvent('ai_suggestion_received', { durationMs });
        markFlowStart('plan_accept');
        return { kind: 'proposal', proposal: next, unavailableDates: parsed.unavailableDates, restored };
      } catch (failure) {
        const durationMs = Date.now() - started;
        logError('ai_suggestion_failed', failure, { durationMs });
        logError('agent_error', failure, { durationMs });
        throw failure;
      }
    },
  };
}

// En una revisión, la IA no puede borrar una fecha que el usuario ya dio solo por no citarla otra vez.
function withKnownDeadlines<T extends { activities: PlanActivity[] }>(revision: T, proposal: PlanProposal): T {
  const known = new Map(proposal.activities.map((activity) => [activity.id, activity.deadline]));
  return {
    ...revision,
    activities: revision.activities.map((activity) => ({
      ...activity,
      deadline: activity.deadline ?? known.get(activity.id) ?? null,
    })),
  };
}

export const planService = createPlanService();
