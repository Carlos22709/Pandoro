// Pose de Pandoro mientras camina y al celebrar que llegó a un lugar nuevo. Son funciones puras: la
// animación (PandoroAnimated) solo las evalúa en cada cuadro. En reposo todo vale 0.
// Las distancias van en unidades del dibujo (280 × 280) y los ángulos en grados.
export type PandoroPose = {
  // Sube (negativo) o baja el cuerpo entero.
  lift: number;
  // Desplaza el cuerpo de lado (positivo = a la derecha): el peso pasa a la pata que pisa.
  shift: number;
  // Inclina el cuerpo entero, en grados (positivo = hacia la derecha).
  lean: number;
  // Positivo estira a Pandoro hacia arriba; negativo lo aplasta.
  squash: number;
  headTilt: number;
  headLift: number;
  earLeft: number;
  earRight: number;
  // Positivo separa el brazo del cuerpo (el izquierdo hacia la izquierda, el derecho hacia la derecha).
  armLeft: number;
  armRight: number;
  legLeft: number;
  legRight: number;
  // Cuánto levanta cada pata (positivo = hacia arriba).
  legLiftLeft: number;
  legLiftRight: number;
};

export const WALK_LEG_KICK = 16;
export const WALK_ARM_OPEN = 30;
export const WALK_ARM_SWING = 20;
export const WALK_BODY_SHIFT = 9;
export const WALK_BODY_LEAN = 5;
export const WALK_LEG_LIFT = 40;
export const CELEBRATE_JUMP = 34;
export const CELEBRATE_ARMS = 105;

export function neutralPose(): PandoroPose {
  'worklet';
  return {
    lift: 0,
    shift: 0,
    lean: 0,
    squash: 0,
    headTilt: 0,
    headLift: 0,
    earLeft: 0,
    earRight: 0,
    armLeft: 0,
    armRight: 0,
    legLeft: 0,
    legRight: 0,
    legLiftLeft: 0,
    legLiftRight: 0,
  };
}

function clamp01(value: number) {
  'worklet';
  return Math.min(1, Math.max(0, value));
}

function smooth(value: number) {
  'worklet';
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

// Caminata «de marcha», como la animación de referencia (design/videoanimacion.mp4): cada paso (medio
// ciclo del seno) sube una rodilla bien alto, el cuerpo se carga sobre la otra pata y los brazos van
// abiertos a los lados, el contrario a la pata que sube más abierto. Arranca y termina en pose neutra.
export function walkPose(progress: number, hops: number): PandoroPose {
  'worklet';
  if (progress <= 0 || progress >= 1) return neutralPose();

  const edge = smooth(Math.min(progress, 1 - progress) * 10);
  const phase = progress * Math.PI * hops;
  const step = Math.sin(phase);
  // Las orejas llegan un poco tarde: cuelgan del cuerpo, no van pegadas a él.
  const lag = Math.sin(phase - 0.9);

  return {
    lift: 0,
    // Mientras una pata está en el aire, el cuerpo se carga sobre la otra.
    shift: step * WALK_BODY_SHIFT * edge,
    lean: step * WALK_BODY_LEAN * edge,
    squash: 0,
    headTilt: step * 6 * edge,
    headLift: -Math.abs(step) * 3 * edge,
    earLeft: -lag * 16 * edge,
    earRight: lag * 16 * edge,
    armLeft: (WALK_ARM_OPEN - step * WALK_ARM_SWING) * edge,
    armRight: (WALK_ARM_OPEN + step * WALK_ARM_SWING) * edge,
    // La pata que sube se abre un poco hacia afuera, como al marchar.
    legLeft: Math.max(0, step) * WALK_LEG_KICK * edge,
    legRight: -Math.max(0, -step) * WALK_LEG_KICK * edge,
    legLiftLeft: Math.max(0, step) * WALK_LEG_LIFT * edge,
    legLiftRight: Math.max(0, -step) * WALK_LEG_LIFT * edge,
  };
}

// Llegada: se agacha para tomar impulso, salta con los brazos arriba moviendo las orejas y aterriza.
// `progress` va de 0 a 1 y la pose vuelve a ser neutra en ambos extremos.
export function celebratePose(progress: number): PandoroPose {
  'worklet';
  if (progress <= 0 || progress >= 1) return neutralPose();

  const arc = Math.sin(Math.PI * clamp01((progress - 0.2) / 0.6));
  const crouch = progress < 0.2 ? smooth(progress / 0.2) : smooth(1 - (progress - 0.2) / 0.1);
  const landing = Math.sin(Math.PI * clamp01((progress - 0.8) / 0.2));
  const window = Math.sin(Math.PI * progress);
  const wiggle = Math.sin(progress * Math.PI * 8) * window;
  const wave = Math.sin(progress * Math.PI * 10) * 9 * arc;

  return {
    lift: -CELEBRATE_JUMP * arc,
    shift: 0,
    lean: 0,
    squash: -0.12 * crouch + 0.05 * arc - 0.08 * landing,
    headTilt: Math.sin(progress * Math.PI * 6) * 6 * window,
    headLift: 0,
    earLeft: wiggle * 14,
    earRight: -wiggle * 14,
    armLeft: CELEBRATE_ARMS * arc + wave,
    armRight: CELEBRATE_ARMS * arc - wave,
    legLeft: 13 * arc,
    legRight: -13 * arc,
    legLiftLeft: 6 * arc,
    legLiftRight: 6 * arc,
  };
}

export function addPoses(first: PandoroPose, second: PandoroPose): PandoroPose {
  'worklet';
  return {
    lift: first.lift + second.lift,
    shift: first.shift + second.shift,
    lean: first.lean + second.lean,
    squash: first.squash + second.squash,
    headTilt: first.headTilt + second.headTilt,
    headLift: first.headLift + second.headLift,
    earLeft: first.earLeft + second.earLeft,
    earRight: first.earRight + second.earRight,
    armLeft: first.armLeft + second.armLeft,
    armRight: first.armRight + second.armRight,
    legLeft: first.legLeft + second.legLeft,
    legRight: first.legRight + second.legRight,
    legLiftLeft: first.legLiftLeft + second.legLiftLeft,
    legLiftRight: first.legLiftRight + second.legLiftRight,
  };
}
