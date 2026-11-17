export type ProgressWorldStatus = 'completed' | 'current' | 'locked';

export type ProgressWorldLandmark =
  | 'pond'
  | 'origamiForest'
  | 'venusHouse'
  | 'ghostRoses'
  | 'starValley'
  | 'panden';

// completedTasks son los pasos del camino (una tarea completada, un paso). Lo ganado solo sube:
// los lugares y las semanas ganadas no se revierten. `streak` queda por compatibilidad con
// documentos guardados; la app ya no lo muestra (un contador que se reinicia castigaría la inactividad).
export type ProgressWorldSnapshot = {
  currentStage: number;
  completedTasks: number;
  streak: number;
  // Pasos acumulados cuando se ganó el lugar actual: de ahí avanza Pandoro hacia el siguiente.
  stageStartSteps: number;
  // Semanas (lunes ISO) que ya dieron un lugar, y última semana cerrada que el usuario ya vio.
  unlockedWeeks: string[];
  lastAcknowledgedWeekKey: string | null;
};

export type ProgressWorldStageDefinition = {
  id: number;
  title: string;
  description: string;
  landmark: ProgressWorldLandmark;
  x: number;
  y: number;
};

export type ProgressWorldStage = ProgressWorldStageDefinition & {
  status: ProgressWorldStatus;
  isNext: boolean;
};

export const PROGRESS_WORLD_WIDTH = 390;
// Incluye el espacio bajo la barra de pestañas para que el pasto llegue hasta el fondo.
export const PROGRESS_WORLD_HEIGHT = 1672;

// Acercamiento de cada lugar; se reduce en pantallas estrechas para que no se recorten.
export function getLandmarkZoom(worldWidth: number) {
  return Math.min(1.3, worldWidth / 300);
}

export const PROGRESS_WORLD_STAGES: readonly ProgressWorldStageDefinition[] = [
  {
    id: 1,
    title: 'Estanque de Pandoro',
    description: 'El rincón tranquilo junto al bambú donde Pandoro descansa antes de cada aventura.',
    landmark: 'pond',
    x: 105,
    y: 1350,
  },
  {
    id: 2,
    title: 'Bosque de origami',
    description: 'Un rincón de papel plegado donde un zorro cuida cada tarea que completas.',
    landmark: 'origamiForest',
    x: 292,
    y: 1105,
  },
  {
    id: 3,
    title: 'La casa de la Sra. Venus',
    description: 'Una atrapamoscas muy educada vive en su maceta junto a su amiga la flor, siempre lista para recibir visitas.',
    landmark: 'venusHouse',
    x: 103,
    y: 850,
  },
  {
    id: 4,
    title: 'El rosal del fantasma enamorado',
    description: 'Un fantasma tímido cuida en silencio su rosal, y cada rosa guarda un suspiro.',
    landmark: 'ghostRoses',
    x: 286,
    y: 610,
  },
  {
    id: 5,
    title: 'El valle de las estrellas ciegas',
    description: 'Aquí florecen estrellas que no ven, pero escuchan con cariño la melodía de un pequeño ángel.',
    landmark: 'starValley',
    x: 96,
    y: 365,
  },
  {
    id: 6,
    title: 'El Pandén',
    description: 'El paraíso secreto del mundo de Pandoro: un árbol encantado, una serpiente mística y el fruto que corona todo tu viaje.',
    landmark: 'panden',
    x: 198,
    y: 128,
  },
];

export function buildProgressWorldStages(
  progress: Pick<ProgressWorldSnapshot, 'currentStage'>,
): ProgressWorldStage[] {
  return PROGRESS_WORLD_STAGES.map((stage) => {
    const status: ProgressWorldStatus = stage.id < progress.currentStage
      ? 'completed'
      : stage.id === progress.currentStage
        ? 'current'
        : 'locked';

    return {
      ...stage,
      status,
      isNext: stage.id === progress.currentStage + 1,
    };
  });
}
