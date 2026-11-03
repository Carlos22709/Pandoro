import type { planService as defaultPlanService } from '@/services/gemini/geminiService';
import { logError, logEvent } from '@/services/logging/appLog';
import type { Availability, PlanProposal } from '@/services/planning/planTypes';

// La conversación de «Hablar» vive solo en memoria mientras la pantalla está abierta: no se
// guarda ni se registra (decisión 3 del marco normativo). Solo el plan aprobado llega a Tareas.
export const TALK_GREETING = '¡Hola! Cuéntame qué tienes pendiente y para cuándo. Evita escribir nombres, correos o teléfonos.';

export type TalkMessage = { id: string; from: 'pandoro' | 'user'; text: string };

export type TalkTurnResult =
  | { kind: 'clarification'; messages: TalkMessage[] }
  | { kind: 'proposal'; messages: TalkMessage[]; proposal: PlanProposal };

type PlanService = Pick<typeof defaultPlanService, 'generatePlan'>;

type TurnInput = {
  messages: TalkMessage[];
  input: string;
  availability: Availability;
  today: Date;
};

// Al modelo solo va lo que el usuario dijo sobre sus responsabilidades, no las preguntas de
// Pandoro ni el saludo. El servicio de Gemini aplica después el filtro de datos personales.
export function responsibilitiesText(messages: readonly TalkMessage[]) {
  return messages
    .filter((message) => message.from === 'user')
    .map((message) => message.text.trim())
    .filter(Boolean)
    .join('\n');
}

// Un turno: agrega lo que dijo el usuario y pide a Gemini un plan con todo lo dicho hasta ahora.
// Si falla, el error sale tal cual (GeminiError) y quien llama conserva los mensajes anteriores.
export async function sendTalkTurn(service: PlanService, { messages, input, availability, today }: TurnInput): Promise<TalkTurnResult> {
  const userMessage: TalkMessage = { id: `user-${messages.length}`, from: 'user', text: input.trim() };
  const withUser = [...messages, userMessage];
  logEvent('ai_suggestion_requested');
  let result: Awaited<ReturnType<PlanService['generatePlan']>>;
  try {
    result = await service.generatePlan({ text: responsibilitiesText(withUser), availability, today });
  } catch (failure) {
    logError('ai_suggestion_failed', failure);
    throw failure;
  }
  logEvent(result.kind === 'clarification' ? 'ai_clarification_requested' : 'ai_suggestion_received');

  if (result.kind === 'clarification') {
    const question: TalkMessage = { id: `pandoro-${withUser.length}`, from: 'pandoro', text: result.question };
    return { kind: 'clarification', messages: [...withUser, question] };
  }
  const summary: TalkMessage = { id: `pandoro-${withUser.length}`, from: 'pandoro', text: result.proposal.summary };
  return { kind: 'proposal', messages: [...withUser, summary], proposal: result.proposal };
}
