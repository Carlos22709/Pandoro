// Pandoro camina por el sendero un trecho por paso, pero cada paso mueve un poco menos que el anterior:
// así siempre avanza algo, con 3 tareas o con 30, y nunca llega solo al siguiente lugar (eso ocurre al
// cerrar la semana). No es una barra ni una razón de tareas: depende solo de los pasos dados.
export const PANDA_MAX_FRACTION = 0.8;
// Con tantos pasos el panda lleva la mitad del trecho máximo. El primer paso mueve unos 8% del sendero.
export const PANDA_HALF_STEPS = 9;

export type TrailPoint = { x: number; y: number };

// Posición de Pandoro en el sendero hacia el siguiente lugar (0 = en el lugar actual).
export function pandaTrailFraction(totalSteps: number, stageStartSteps: number) {
  const steps = Math.max(0, totalSteps - stageStartSteps);
  return (PANDA_MAX_FRACTION * steps) / (steps + PANDA_HALF_STEPS);
}

// Misma curva que dibuja ProgressPath: sale del lugar, cruza a medio camino y llega al siguiente.
export function trailPoint(from: TrailPoint, to: TrailPoint, t: number): TrailPoint {
  'worklet';
  const inverse = 1 - t;
  const middleY = (from.y + to.y) / 2;
  return {
    x: inverse ** 3 * from.x + 3 * inverse ** 2 * t * from.x + 3 * inverse * t ** 2 * to.x + t ** 3 * to.x,
    y: inverse ** 3 * from.y + 3 * inverse ** 2 * t * middleY + 3 * inverse * t ** 2 * middleY + t ** 3 * to.y,
  };
}
