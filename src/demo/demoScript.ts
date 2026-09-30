import type { TaskItem } from '@/components/tasks/taskTypes';

// Guion de la presentación. Todo lo que dice Pandoro sale de aquí: cambia los textos
// sin tocar las pantallas. Las fechas suponen que la demo se presenta un martes.

export type DemoTurn = {
  // Lo que aparece transcrito mientras el presentador mantiene pulsado el pajarito.
  user: string;
  reply: string;
};

export type DemoPlanTask = Omit<TaskItem, 'priority' | 'completed'> & {
  day: string;
  minutes: number;
};

export const DEMO_GREETING = '¡Hola! Cuéntame qué tienes pendiente esta semana.';

export const DEMO_TURNS: readonly DemoTurn[] = [
  {
    user: 'Esta semana tengo que estudiar para un examen de estadística, terminar un informe y preparar una exposición. No sé por dónde empezar.',
    reply: 'Si tuviera que apostar, lo más pesado es el examen de estadística: no se aprende en una noche, necesita práctica repartida en varios días. La exposición engaña: parece rápida, pero entre diapositivas y ensayo suele tomar el doble de lo que uno calcula. El informe depende de cuánto lleves.\n\nPara organizarlo bien, cuéntame: ¿para cuándo es cada una, y cuánto llevas del informe?',
  },
  {
    user: 'El informe es para mañana y llevo la mitad. La exposición es el viernes y el examen el lunes.',
    reply: 'Aunque el examen es lo último, lo empezamos hoy: así llegas al lunes con tres sesiones cortas en vez de una noche larga. Este es tu plan:',
  },
];

export const DEMO_PLAN_ADDED_REPLY = '¡Listo! Ya están en tus tareas. Empieza por el informe cuando quieras.';

// El orden es el del plan: así aparecen en la tarjeta y en la vista "Ahora" de Tareas.
export const DEMO_PLAN: readonly DemoPlanTask[] = [
  {
    id: 'plan-informe',
    title: 'Terminar el informe',
    detail: 'Hoy · 1 h',
    duration: '1 h',
    minutes: 60,
    day: 'Hoy',
    tone: 'blue',
    icon: 'document',
    difficulty: 'medium',
  },
  {
    id: 'plan-estadistica-tema-1',
    title: 'Estadística: repasar el tema 1',
    detail: 'Hoy · 25 min',
    duration: '25 min',
    minutes: 25,
    day: 'Hoy',
    tone: 'lilac',
    icon: 'book',
    difficulty: 'high',
  },
  {
    id: 'plan-diapositivas',
    title: 'Armar diapositivas',
    detail: 'Mañana · 45 min',
    duration: '45 min',
    minutes: 45,
    day: 'Mañana',
    tone: 'yellow',
    icon: 'presentation',
    difficulty: 'medium',
  },
  {
    id: 'plan-ensayo',
    title: 'Ensayar la exposición',
    detail: 'Jueves · 20 min',
    duration: '20 min',
    minutes: 20,
    day: 'Jueves',
    tone: 'pink',
    icon: 'presentation',
    difficulty: 'light',
  },
  {
    id: 'plan-estadistica-ejercicios',
    title: 'Estadística: ejercicios',
    detail: 'Sábado · 40 min',
    duration: '40 min',
    minutes: 40,
    day: 'Sábado',
    tone: 'lilac',
    icon: 'book',
    difficulty: 'high',
  },
  {
    id: 'plan-estadistica-repaso',
    title: 'Estadística: repaso final',
    detail: 'Domingo · 30 min',
    duration: '30 min',
    minutes: 30,
    day: 'Domingo',
    tone: 'lilac',
    icon: 'book',
    difficulty: 'medium',
  },
];

// Título de la celebración según la tarea que desbloquea un lugar.
export const DEMO_CELEBRATION_TITLES: Record<string, string> = {
  'plan-informe': '¡Informe listo un día antes!',
};
export const DEMO_DEFAULT_CELEBRATION_TITLE = '¡Una tarea menos!';

export const HOME_BUBBLE = {
  initial: '¿Qué organizamos hoy?',
  origami: '¡Tenemos un vecino nuevo!',
} as const;

export function formatMinutes(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (!hours) return minutes + ' min';
  if (!minutes) return hours + ' h';
  return hours + ' h ' + minutes + ' min';
}
