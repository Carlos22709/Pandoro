import { mergeRevision } from '@/services/planning/planLogic';
import type { Availability, PlanActivity, PlanProposal } from '@/services/planning/planTypes';

import { PLAN_RESPONSE_SCHEMA, PlanResponseError, parsePlanResponse } from './planContract';
import { PLAN_SYSTEM_INSTRUCTION, buildGeneratePrompt, buildRevisePrompt } from './planPrompt';

// Único archivo que habla con Gemini. Para migrar a un backend basta con cambiar geminiGenerate:
// la pantalla solo conoce generatePlan, revisePlan y GeminiError.
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
  | 'unsupported_runtime';

const ERROR_MESSAGES: Record<GeminiErrorCode, string> = {
  missing_key: 'Pandoro aún no tiene configurada su conexión con la IA. Agrega la clave en el archivo .env.',
  invalid_key: 'La clave de Gemini no es válida. Revísala en el archivo .env.',
  auth: 'Gemini rechazó el acceso con esta clave. Revisa sus permisos en Google AI Studio.',
  quota: 'Se alcanzó el límite de solicitudes de Gemini. Espera un momento e inténtalo de nuevo.',
  network: 'No hay conexión con Gemini. Revisa tu internet e inténtalo de nuevo.',
  timeout: 'Gemini tardó demasiado en responder. Inténtalo de nuevo.',
  empty_response: 'Gemini no devolvió ninguna propuesta. Inténtalo de nuevo.',
  invalid_response: 'La respuesta de Gemini llegó incompleta, así que no se usó. Inténtalo de nuevo.',
  model_unavailable: 'El modelo configurado no está disponible. Revisa EXPO_PUBLIC_GEMINI_MODEL.',
  provider: 'Gemini tiene un problema temporal. Inténtalo de nuevo en unos minutos.',
  unsupported_runtime: 'La IA no pudo iniciarse en este dispositivo. Puedes crear tus tareas manualmente.',
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

async function loadSdk() {
  // El SDK lee ReadableStream al cargarse y Hermes puede no tenerlo. Aquí no se usa streaming,
  // así que basta un sustituto vacío. Se carga bajo demanda para que un fallo no afecte al arranque.
  if (typeof globalThis.ReadableStream === 'undefined') {
    Object.assign(globalThis, { ReadableStream: class {} });
  }
  try {
    return await import('@google/genai/web');
  } catch {
    throw new GeminiError('unsupported_runtime');
  }
}

const geminiGenerate: GenerateFn = async ({ prompt, systemInstruction, schema, signal }) => {
  // Expo solo sustituye process.env.EXPO_PUBLIC_* escrito de forma literal.
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
  const model = process.env.EXPO_PUBLIC_GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  if (!apiKey) throw new GeminiError('missing_key');

  const { GoogleGenAI } = await loadSdk();
  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
      temperature: 0.3,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      abortSignal: signal,
    },
  });
  return response.text;
};

// Traduce cualquier fallo a un código propio: el mensaje original puede incluir la URL o la clave.
export function toGeminiError(error: unknown): GeminiError {
  if (error instanceof GeminiError) return error;
  if (error instanceof PlanResponseError) return new GeminiError('invalid_response');

  const status = (error as { status?: unknown } | null)?.status;
  const message = error instanceof Error ? error.message : '';
  if (typeof status === 'number') {
    if (status === 400 && /api[ _-]?key/i.test(message)) return new GeminiError('invalid_key');
    if (status === 401 || status === 403) return new GeminiError('auth');
    if (status === 404) return new GeminiError('model_unavailable');
    if (status === 408) return new GeminiError('timeout');
    if (status === 429) return new GeminiError('quota');
    if (status >= 500) return new GeminiError('provider');
    return new GeminiError('invalid_response');
  }
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
    async generatePlan({ text, availability, today }: GenerateInput): Promise<PlanResult> {
      const parsed = await run(buildGeneratePrompt(text, availability, today), [text]);
      if (parsed.kind === 'clarification') return parsed;
      const proposal: PlanProposal = {
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
        summary: parsed.revision.summary,
        activities: parsed.revision.activities,
        revision: 1,
      };
      return { kind: 'proposal', proposal, unavailableDates: parsed.unavailableDates, restored: 0 };
    },

    async revisePlan({ text, availability, today, proposal, instruction }: ReviseInput): Promise<PlanResult> {
      const prompt = buildRevisePrompt(text, instruction, proposal, availability, today);
      const parsed = await run(prompt, [text, instruction]);
      if (parsed.kind === 'clarification') return parsed;
      const { proposal: next, restored } = mergeRevision(proposal, withKnownDeadlines(parsed.revision, proposal));
      return { kind: 'proposal', proposal: next, unavailableDates: parsed.unavailableDates, restored };
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
