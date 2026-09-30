export type ProgressWorldStatus = 'completed' | 'current' | 'locked';

export type ProgressWorldLandmark =
  | 'pond'
  | 'origamiForest'
  | 'venusHouse'
  | 'ghostRoses'
  | 'starValley'
  | 'panden';

export type ProgressWorldSnapshot = {
  currentStage: number;
  completedTasks: number;
  streak: number;
};

export type ProgressWorldStageDefinition = {
  id: number;
  title: string;
  description: string;
  landmark: ProgressWorldLandmark;
  requiredTasks: number;
  x: number;
  y: number;
};

export type ProgressWorldStage = ProgressWorldStageDefinition & {
  status: ProgressWorldStatus;
  goalTasks: number;
  remainingTasks: number;
  isNext: boolean;
};

export const PROGRESS_WORLD_WIDTH = 390;
// Incluye el espacio bajo la barra de pestañas para que el pasto llegue hasta el fondo.
export const PROGRESS_WORLD_HEIGHT = 1672;

// Acercamiento de cada lugar; se reduce en pantallas estrechas para que no se recorten.
export function getLandmarkZoom(worldWidth: number) {
  return Math.min(1.3, worldWidth / 300);
}

// Cambia estos valores para mover a Pandoro y probar el florecimiento del mundo.
export const MOCK_WORLD_PROGRESS: ProgressWorldSnapshot = {
  currentStage: 1,
  completedTasks: 18,
  streak: 6,
};

export const PROGRESS_WORLD_STAGES: readonly ProgressWorldStageDefinition[] = [
  {
    id: 1,
    title: 'Estanque de Pandoro',
    description: 'El rincón tranquilo junto al bambú donde Pandoro descansa antes de cada aventura.',
    landmark: 'pond',
    requiredTasks: 0,
    x: 105,
    y: 1350,
  },
  {
    id: 2,
    title: 'Bosque de origami',
    description: 'Un rincón de papel plegado donde un zorro cuida cada tarea que completas.',
    landmark: 'origamiForest',
    requiredTasks: 25,
    x: 292,
    y: 1105,
  },
  {
    id: 3,
    title: 'La casa de la Sra. Venus',
    description: 'Una atrapamoscas muy educada vive en su maceta junto a su amiga la flor, siempre lista para recibir visitas.',
    landmark: 'venusHouse',
    requiredTasks: 40,
    x: 103,
    y: 850,
  },
  {
    id: 4,
    title: 'El rosal del fantasma enamorado',
    description: 'Un fantasma tímido cuida en silencio su rosal, y cada rosa guarda un suspiro.',
    landmark: 'ghostRoses',
    requiredTasks: 58,
    x: 286,
    y: 610,
  },
  {
    id: 5,
    title: 'El valle de las estrellas ciegas',
    description: 'Aquí florecen estrellas que no ven, pero escuchan con cariño la melodía de un pequeño ángel.',
    landmark: 'starValley',
    requiredTasks: 80,
    x: 96,
    y: 365,
  },
  {
    id: 6,
    title: 'El Pandén',
    description: 'El paraíso secreto del mundo de Pandoro: un árbol encantado, una serpiente mística y el fruto que corona todo tu viaje.',
    landmark: 'panden',
    requiredTasks: 105,
    x: 198,
    y: 128,
  },
];

export function buildProgressWorldStages(
  progress: ProgressWorldSnapshot,
): ProgressWorldStage[] {
  return PROGRESS_WORLD_STAGES.map((stage, index) => {
    const status: ProgressWorldStatus = stage.id < progress.currentStage
      ? 'completed'
      : stage.id === progress.currentStage
        ? 'current'
        : 'locked';
    const nextStage = PROGRESS_WORLD_STAGES[index + 1];
    const goalTasks = status === 'current' && nextStage
      ? nextStage.requiredTasks
      : stage.requiredTasks;

    return {
      ...stage,
      status,
      goalTasks,
      remainingTasks: Math.max(0, goalTasks - progress.completedTasks),
      isNext: stage.id === progress.currentStage + 1,
    };
  });
}
