// Geometría orgánica del Pandén (serpiente, rama, follaje, montículo y flor áurea).
// Se calcula una sola vez al cargar el módulo; las coordenadas usan el viewBox 170x128
// de los escenarios del progreso.

type Point = [number, number];
type Segment = [Point, Point, Point, Point];
type Sample = { x: number; y: number; tx: number; ty: number; u: number; segment: number };

const round = (value: number) => Math.round(value * 10) / 10;
const smooth = (from: number, to: number, t: number) => from + (to - from) * (t * t * (3 - 2 * t));

function cubicPoint([p0, p1, p2, p3]: Segment, t: number): Point {
  const s = 1 - t;
  return [
    s * s * s * p0[0] + 3 * s * s * t * p1[0] + 3 * s * t * t * p2[0] + t * t * t * p3[0],
    s * s * s * p0[1] + 3 * s * s * t * p1[1] + 3 * s * t * t * p2[1] + t * t * t * p3[1],
  ];
}

function sampleCurve(segments: Segment[], perSegment: number): Sample[] {
  const points: Point[] = [];
  const owners: number[] = [];
  segments.forEach((segment, index) => {
    for (let step = index === 0 ? 0 : 1; step <= perSegment; step++) {
      points.push(cubicPoint(segment, step / perSegment));
      owners.push(index);
    }
  });

  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  const total = lengths[lengths.length - 1];

  return points.map((point, i) => {
    const before = points[Math.max(0, i - 1)];
    const after = points[Math.min(points.length - 1, i + 1)];
    const dx = after[0] - before[0];
    const dy = after[1] - before[1];
    const distance = Math.hypot(dx, dy) || 1;
    return { x: point[0], y: point[1], tx: dx / distance, ty: dy / distance, u: lengths[i] / total, segment: owners[i] };
  });
}

function toPath(points: Point[]) {
  return 'M' + points.map((point) => round(point[0]) + ' ' + round(point[1])).join('L') + 'Z';
}

// Contorno relleno que sigue una curva con grosor variable (cuerpo, rama).
function taperedPath(
  samples: Sample[],
  halfWidth: (u: number) => number,
  offset: (u: number) => number = () => 0,
) {
  const left: Point[] = [];
  const right: Point[] = [];
  samples.forEach((sample) => {
    const width = halfWidth(sample.u);
    const shift = offset(sample.u);
    const nx = -sample.ty;
    const ny = sample.tx;
    const cx = sample.x + nx * shift;
    const cy = sample.y + ny * shift;
    right.push([cx + nx * width, cy + ny * width]);
    left.push([cx - nx * width, cy - ny * width]);
  });
  return toPath(left.concat(right.reverse()));
}

// Masa de follaje aplanada: copa ondulada arriba y vientre más suave abajo.
function foliagePad(cx: number, cy: number, rx: number, ry: number, bumps: number, phase: number, flatten: number) {
  const points: Point[] = [];
  for (let i = 0; i < 72; i++) {
    const t = (i / 72) * Math.PI * 2;
    const top = Math.sin(t) < 0;
    const bump = top
      ? 1 + 0.13 * Math.abs(Math.sin(bumps * t + phase))
      : 1 + 0.04 * Math.sin(bumps * 0.5 * t + phase);
    points.push([cx + Math.cos(t) * rx * bump, cy + Math.sin(t) * (top ? ry : ry * flatten) * bump]);
  }
  return toPath(points);
}

function mossMound() {
  const points: Point[] = [];
  for (let i = 0; i < 80; i++) {
    const t = (i / 80) * Math.PI * 2;
    const wobble = 1 + 0.045 * Math.sin(3 * t + 0.6) + 0.03 * Math.sin(7 * t + 1.3);
    const top = Math.sin(t) < 0;
    points.push([82 + Math.cos(t) * 66 * wobble, 106 + Math.sin(t) * (top ? 9.5 : 7) * wobble]);
  }
  return toPath(points);
}

// Serpiente: la cola descansa sobre la rama junto al tronco, el cuerpo da una vuelta
// completa alrededor de ella (por delante y luego por detrás) y alza el cuello en "S"
// hacia el fruto. El tramo 2 pasa por detrás de la rama.
const SNAKE_SEGMENTS: Segment[] = [
  [[83, 56.6], [87.5, 55.2], [92, 53.6], [96, 53.4]],
  [[96, 53.4], [99, 53.6], [100.6, 58], [101.6, 62.2]],
  [[101.6, 62.2], [103.2, 65.6], [108.6, 63.6], [109.6, 52.2]],
  [[109.6, 52.2], [111.2, 50.6], [114, 50.8], [117, 50.6]],
  [[117, 50.6], [121.5, 50.2], [122.5, 45], [121.3, 41]],
  [[121.3, 41], [120, 37], [123, 33.6], [127.2, 35.6]],
];
const SNAKE_BEHIND_SEGMENT = 2;
const snakeSamples = sampleCurve(SNAKE_SEGMENTS, 22);
const snakeWidth = (u: number) =>
  u < 0.3 ? smooth(0.3, 2.35, u / 0.3) : u < 0.74 ? 2.35 : smooth(2.35, 1.9, (u - 0.74) / 0.26);

const behindSamples = snakeSamples.filter((sample) => sample.segment === SNAKE_BEHIND_SEGMENT);
const snakeFront = [
  snakeSamples.filter((sample) => sample.segment < SNAKE_BEHIND_SEGMENT),
  // Empieza en el último punto del tramo trasero para que no quede un hueco.
  [behindSamples[behindSamples.length - 1], ...snakeSamples.filter((sample) => sample.segment > SNAKE_BEHIND_SEGMENT)],
];

function snakeSpots(samples: Sample[]) {
  const spots = [];
  for (let u = 0.12; u <= 0.94; u += 0.07) {
    const target = u;
    const sample = samples.reduce((best, s) => (Math.abs(s.u - target) < Math.abs(best.u - target) ? s : best));
    if (Math.abs(sample.u - target) > 0.03) continue;
    const width = snakeWidth(sample.u);
    spots.push({
      x: round(sample.x + sample.ty * width * 0.3),
      y: round(sample.y - sample.tx * width * 0.3),
      angle: round((Math.atan2(sample.ty, sample.tx) * 180) / Math.PI),
      rx: round(width * 0.4),
      ry: round(width * 0.24),
    });
  }
  return spots;
}

const snakeBelly = (samples: Sample[]) =>
  taperedPath(samples, (u) => snakeWidth(u) * 0.36, (u) => snakeWidth(u) * 0.52);

const snakeEnd = snakeSamples[snakeSamples.length - 1];

// Flor áurea: semillas en ángulo dorado que pasan del oro al coral y al magenta.
const SEED_STOPS: [number, number, number][] = [[255, 214, 92], [255, 138, 104], [228, 90, 166]];

function seedColor(t: number) {
  const [from, to, local] = t < 0.5 ? [SEED_STOPS[0], SEED_STOPS[1], t / 0.5] : [SEED_STOPS[1], SEED_STOPS[2], (t - 0.5) / 0.5];
  return '#' + from.map((value, i) => Math.round(value + (to[i] - value) * local).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function goldenSeeds(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    const radius = 1.25 * Math.sqrt(n);
    const angle = n * 137.508;
    const radians = (angle * Math.PI) / 180;
    return {
      x: round(Math.cos(radians) * radius),
      y: round(Math.sin(radians) * radius),
      angle: round(angle % 360),
      rx: round(0.55 + 0.028 * n),
      ry: round(0.42 + 0.02 * n),
      fill: seedColor(index / (count - 1)),
    };
  });
}

export const PANDEN_GEOMETRY = {
  // Capa trasera (se dibuja antes de la rama) y tramos delanteros (después).
  snakeBody: taperedPath(snakeSamples, snakeWidth),
  snakeBelly: snakeBelly(snakeSamples),
  snakeFrontBodies: snakeFront.map((samples) => taperedPath(samples, snakeWidth)),
  snakeFrontBellies: snakeFront.map((samples) => snakeBelly(samples)),
  snakeSpots: snakeSpots(snakeFront[0].concat(snakeFront[1])),
  snakeHead: {
    x: round(snakeEnd.x),
    y: round(snakeEnd.y),
    angle: round((Math.atan2(snakeEnd.ty, snakeEnd.tx) * 180) / Math.PI + 14),
  },
  branch: taperedPath(sampleCurve([[[74, 63], [96, 57.4], [122, 56.4], [148, 46.5]]], 40), (u) => smooth(3.4, 1.1, u)),
  twig: taperedPath(sampleCurve([[[139, 50.6], [143, 46], [146, 42], [151, 39.5]]], 16), (u) => smooth(1.1, 0.35, u)),
  pads: {
    aDeep: foliagePad(58, 21, 33, 15, 5, 0.4, 0.8),
    a: foliagePad(57, 19, 30, 13, 5, 0.4, 0.72),
    aLight: foliagePad(51, 14, 18, 6.5, 4, 1.2, 0.6),
    bDeep: foliagePad(23, 39, 18, 11.5, 4, 1.1, 0.8),
    b: foliagePad(22.5, 37.4, 16, 9.8, 4, 1.1, 0.72),
    bLight: foliagePad(19.5, 34, 9, 4.6, 3, 0.2, 0.6),
    cDeep: foliagePad(88, 42, 17, 9.5, 4, 2.1, 0.8),
    c: foliagePad(87.5, 40.6, 15, 8, 4, 2.1, 0.72),
    cLight: foliagePad(84.5, 37.8, 8, 3.6, 3, 0.9, 0.6),
  },
  mound: mossMound(),
  seeds: goldenSeeds(34),
};
