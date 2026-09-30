import { memo } from 'react';
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

// Fondo de Inicio cuando Pandoro llega al Bosque de origami: todo es papel plegado.
// Mismo lienzo que ForestScene (390 × 760, recortado para cubrir) y la luz entra por
// arriba a la izquierda, así que la cara izquierda de cada pliegue es la clara.

type Rgb = readonly [number, number, number];

const TRUNK = '#C9A283';
const TRUNK_SHADE = '#B08A6E';

const TULIP_TONES = {
  pink: ['#F7C9D0', '#F1B0BC', '#DB8C9D', '#FCE3E6'],
  yellow: ['#F9E2A8', '#F2D08A', '#D9AE62', '#FCF0CF'],
  lilac: ['#E3D6F5', '#CDBBEB', '#A993CF', '#F1EAFB'],
} as const;

type TulipTone = keyof typeof TULIP_TONES;

const STAR_TONES = {
  cream: ['#FFF6E8', '#F3E4CC'],
  pink: ['#F9D3DB', '#F0B8C5'],
  lilac: ['#E6DBF6', '#D2C2EE'],
} as const;

type StarTone = keyof typeof STAR_TONES;

const BLOSSOM = {
  pink: ['#F8CDD6', '#EFB2C1', '#DE97AB'],
  deepPink: ['#F7C6D0', '#EEA9BA', '#DC8FA5'],
  lilac: ['#E9DDF7', '#D9C8F0', '#C3AEE6'],
  far: ['#F8D6DC', '#F1BFCA', '#E6A7B6'],
} as const;

const f = (value: number) => Math.round(value * 10) / 10;

function Pine({ x, base, height, width, light, shade, trunk = TRUNK }: {
  x: number;
  base: number;
  height: number;
  width: number;
  light: string;
  shade: string;
  trunk?: string;
}) {
  const trunkHeight = height * 0.14;
  const crown = height - trunkHeight * 0.6;
  const tiers = [0, 1, 2].map((tier) => {
    const k = tier / 3;
    const tierBase = base - trunkHeight * 0.6 - crown * k * 0.78;
    const apex = tierBase - crown * (0.52 - k * 0.12);
    const half = (width / 2) * (1 - k * 0.32);
    const notch = (tierBase - apex) * 0.1;
    return { tierBase, apex, half, notch };
  });

  return (
    <G>
      <Rect
        x={f(x - width * 0.07)}
        y={f(base - trunkHeight)}
        width={f(width * 0.14)}
        height={f(trunkHeight + 2)}
        rx={1.5}
        fill={trunk}
      />
      {tiers.map(({ tierBase, apex, half, notch }, index) => (
        <G key={index}>
          <Path d={`M${f(x)} ${f(apex)}L${f(x - half)} ${f(tierBase)}L${f(x)} ${f(tierBase - notch)}Z`} fill={light} />
          <Path d={`M${f(x)} ${f(apex)}L${f(x)} ${f(tierBase - notch)}L${f(x + half)} ${f(tierBase)}Z`} fill={shade} />
        </G>
      ))}
    </G>
  );
}

// Copa de siete caras alrededor de un centro desplazado hacia la luz.
function RoundTree({ x, y, radius, colors, base }: {
  x: number;
  y: number;
  radius: number;
  colors: readonly [string, string, string];
  base: number;
}) {
  const [light, mid, shade] = colors;
  const points = Array.from({ length: 7 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / 7;
    const reach = radius * (index % 2 === 0 ? 1 : 0.9);
    return [x + reach * Math.cos(angle), y + reach * 0.92 * Math.sin(angle)] as const;
  });
  const center = [x - radius * 0.12, y - radius * 0.08] as const;

  return (
    <G>
      <Path
        d={`M${f(x - radius * 0.12)} ${f(y + radius * 0.5)}L${f(x)} ${f(y + radius * 0.4)}L${f(x)} ${base}L${f(x - radius * 0.14)} ${base}Z`}
        fill={TRUNK}
      />
      <Path
        d={`M${f(x)} ${f(y + radius * 0.4)}L${f(x + radius * 0.12)} ${f(y + radius * 0.5)}L${f(x + radius * 0.14)} ${base}L${f(x)} ${base}Z`}
        fill={TRUNK_SHADE}
      />
      {points.map((from, index) => {
        const to = points[(index + 1) % 7];
        const facing = Math.atan2((from[1] + to[1]) / 2 - y, (from[0] + to[0]) / 2 - x);
        const lit = Math.cos(facing + (3 * Math.PI) / 4);
        const fill = lit > 0.35 ? light : lit > -0.45 ? mid : shade;
        return (
          <Path
            key={index}
            d={`M${f(center[0])} ${f(center[1])}L${f(from[0])} ${f(from[1])}L${f(to[0])} ${f(to[1])}Z`}
            fill={fill}
          />
        );
      })}
    </G>
  );
}

function Cloud({ x, y, scale }: { x: number; y: number; scale: number }) {
  const [a, b, c, d, e, g] = [[-30, 0], [-22, -9], [-10, -15], [4, -17], [18, -11], [30, 0]].map(
    ([px, py]) => `${f(x + px * scale)} ${f(y + py * scale)}`,
  );
  const mid = `${f(x + 2 * scale)} ${f(y - 2 * scale)}`;
  return (
    <G>
      <Path d={`M${a}L${b}L${c}L${d}L${mid}Z`} fill="#FFFDF7" />
      <Path d={`M${d}L${e}L${g}L${mid}Z`} fill="#EDE7F3" />
      <Path d={`M${a}L${mid}L${g}Z`} fill="#F5F0F8" />
    </G>
  );
}

// Grulla de papel en vuelo, mirando a la derecha.
function Crane({ x, y, scale, light, shade }: { x: number; y: number; scale: number; light: string; shade: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Path d="M0 0L-14 -16L-4 -2Z" fill={light} />
      <Path d="M0 0L10 -20L4 -1Z" fill={shade} />
      <Path d="M-12 2L0 0L12 2L0 5Z" fill={light} />
      <Path d="M12 2L20 -6L21 -4L14 3Z" fill={shade} />
      <Path d="M-12 2L-20 -3L-8 4Z" fill={shade} />
    </G>
  );
}

function Tulip({ x, base, scale, tone }: { x: number; base: number; scale: number; tone: TulipTone }) {
  const [light, mid, deep, fold] = TULIP_TONES[tone];
  return (
    <G transform={`translate(${f(x - 20 * scale)} ${f(base - 88 * scale)}) scale(${scale})`}>
      <Path d="M20 88C20 72 21 58 20 44" fill="none" stroke="#7DB27A" strokeWidth="2.6" strokeLinecap="round" />
      <Path d="M20 86L5 58L15 69Z" fill="#9CCB8E" />
      <Path d="M20 86L15 69L19 72Z" fill="#7DB27A" />
      <Path d="M20 80L34 62L25 72Z" fill="#7DB27A" />
      <Path d="M20 80L25 72L23 77Z" fill="#689E6A" />
      <Path d="M13 27L20 12L27 27Z" fill={deep} />
      <Path d="M8 22L20 30L20 46L11 40Z" fill={light} />
      <Path d="M20 30L32 22L29 40L20 46Z" fill={mid} />
      <Path d="M8 22L20 30L14 31Z" fill={fold} />
    </G>
  );
}

// Flor estrella: cinco pétalos plegados por la mitad.
function StarFlower({ x, y, scale, tone }: { x: number; y: number; scale: number; tone: StarTone }) {
  const [petal, shade] = STAR_TONES[tone];
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      {[0, 1, 2, 3, 4].map((index) => (
        <G key={index} transform={`rotate(${-90 + index * 72})`}>
          <Path d="M0 0L12 -4L16 0Z" fill={petal} />
          <Path d="M0 0L16 0L12 4Z" fill={shade} />
        </G>
      ))}
      <Path d="M0 -3.5L3.3 -1.1L2 2.8L-2 2.8L-3.3 -1.1Z" fill="#F2C46B" />
    </G>
  );
}

function Mountain({ apex, left, right, base, colors }: {
  apex: readonly [number, number];
  left: number;
  right: number;
  base: number;
  colors: readonly [string, string, string];
}) {
  const [ax, ay] = apex;
  const foldLeft = f(ax - (ax - left) * 0.35);
  const foldRight = f(ax + (right - ax) * 0.2);
  return (
    <G>
      <Path d={`M${ax} ${ay}L${left} ${base}L${foldLeft} ${base}Z`} fill={colors[0]} />
      <Path d={`M${ax} ${ay}L${foldLeft} ${base}L${foldRight} ${base}Z`} fill={colors[1]} />
      <Path d={`M${ax} ${ay}L${foldRight} ${base}L${right} ${base}Z`} fill={colors[2]} />
    </G>
  );
}

function Stone({ x, y, rx, ry }: { x: number; y: number; rx: number; ry: number }) {
  return (
    <G>
      <Path d={`M${x - rx} ${y}L${f(x - rx * 0.55)} ${y - ry}L${f(x + rx * 0.2)} ${f(y - ry * 1.05)}L${f(x + rx * 0.05)} ${f(y - ry * 0.1)}Z`} fill="#D8D1DD" />
      <Path d={`M${f(x + rx * 0.2)} ${f(y - ry * 1.05)}L${x + rx} ${f(y - ry * 0.2)}L${f(x + rx * 0.05)} ${f(y - ry * 0.1)}Z`} fill="#C2BACA" />
      <Path d={`M${x - rx} ${y}L${f(x + rx * 0.05)} ${f(y - ry * 0.1)}L${x + rx} ${f(y - ry * 0.2)}L${f(x + rx * 0.8)} ${f(y + ry * 0.35)}L${f(x - rx * 0.7)} ${f(y + ry * 0.4)}Z`} fill="#A9A1B4" />
    </G>
  );
}

// Generador con semilla: el suelo sale idéntico en cada carga.
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Facet = { d: string; fill: string };

// Suelo de papel: una malla de triángulos con tonos que varían un poco, como pliegues.
function buildTerrain({ edge, top, bottom, rows, cols, color, seed, spread }: {
  edge: (x: number) => number;
  top: number;
  bottom: number;
  rows: number;
  cols: number;
  color: Rgb;
  seed: number;
  spread: number;
}): Facet[] {
  const random = seeded(seed);
  const between = (min: number, max: number) => min + random() * (max - min);
  const grid = Array.from({ length: rows + 1 }, (_, row) => (
    Array.from({ length: cols + 1 }, (_, col) => {
      const x = -20 + (430 * col) / cols + (col > 0 && col < cols ? between(-12, 12) : 0);
      const y = row === 0 ? edge(x) : top + ((bottom - top) * row) / rows + between(-8, 8);
      return [x, y] as const;
    })
  ));
  const facets: Facet[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const a = grid[row][col];
      const b = grid[row][col + 1];
      const c = grid[row + 1][col];
      const d = grid[row + 1][col + 1];
      ([[a, b, c], [b, d, c]] as const).forEach((triangle, half) => {
        const shift = between(-spread, spread) + (half === 0 ? 6 : -6) - row * 3;
        const fill = '#' + color
          .map((channel) => Math.max(0, Math.min(255, Math.round(channel + shift))).toString(16).padStart(2, '0'))
          .join('');
        facets.push({ d: 'M' + triangle.map(([px, py]) => `${f(px)} ${f(py)}`).join('L') + 'Z', fill });
      });
    }
  }
  return facets;
}

const FAR_MEADOW = buildTerrain({ edge: (x) => 330 + 6 * Math.sin(x / 40), top: 330, bottom: 380, rows: 1, cols: 7, color: [0xd2, 0xe6, 0xbc], seed: 3, spread: 6 });
const MEADOW = buildTerrain({ edge: (x) => 372 + 5 * Math.sin(x / 33 + 1), top: 372, bottom: 470, rows: 2, cols: 8, color: [0xc8, 0xe0, 0xaa], seed: 7, spread: 7 });
const MIDDLE_GROUND = buildTerrain({ edge: (x) => 440 + 10 * Math.sin(x / 60), top: 440, bottom: 600, rows: 3, cols: 7, color: [0xb9, 0xd9, 0x96], seed: 11, spread: 9 });
const NEAR_GROUND = buildTerrain({ edge: (x) => 566 + 12 * Math.sin(x / 70 + 2), top: 566, bottom: 760, rows: 3, cols: 6, color: [0xaf, 0xd2, 0x8c], seed: 19, spread: 4 });

// Hilera del fondo: pinos pequeños con algún árbol en flor intercalado.
const TREE_LINE = Array.from({ length: 26 }, (_, index) => {
  const x = -4 + index * 16;
  const height = 44 + ((index * 37) % 22);
  return { index, x, height, blossom: index % 5 === 2 };
});

const MEADOW_TULIPS: { x: number; base: number; scale: number; tone: TulipTone }[] = [
  { x: 16, base: 404, scale: 0.26, tone: 'pink' },
  { x: 44, base: 410, scale: 0.22, tone: 'yellow' },
  { x: 86, base: 402, scale: 0.24, tone: 'lilac' },
  { x: 200, base: 396, scale: 0.22, tone: 'pink' },
  { x: 236, base: 400, scale: 0.22, tone: 'yellow' },
  { x: 300, base: 404, scale: 0.26, tone: 'yellow' },
  { x: 336, base: 410, scale: 0.24, tone: 'pink' },
  { x: 378, base: 402, scale: 0.22, tone: 'lilac' },
];

const MEADOW_STARS: { x: number; y: number; scale: number; tone: StarTone }[] = [
  { x: 30, y: 410, scale: 0.55, tone: 'cream' },
  { x: 58, y: 420, scale: 0.45, tone: 'pink' },
  { x: 150, y: 398, scale: 0.4, tone: 'cream' },
  { x: 250, y: 402, scale: 0.4, tone: 'pink' },
  { x: 352, y: 404, scale: 0.5, tone: 'cream' },
  { x: 372, y: 418, scale: 0.45, tone: 'lilac' },
];

const FRONT_TULIPS: { x: number; base: number; scale: number; tone: TulipTone }[] = [
  { x: 112, base: 470, scale: 0.45, tone: 'pink' },
  { x: 96, base: 480, scale: 0.36, tone: 'yellow' },
  { x: 140, base: 468, scale: 0.34, tone: 'lilac' },
  { x: 304, base: 470, scale: 0.46, tone: 'pink' },
  { x: 326, base: 478, scale: 0.38, tone: 'yellow' },
  { x: 346, base: 468, scale: 0.34, tone: 'lilac' },
  { x: 372, base: 482, scale: 0.48, tone: 'pink' },
  { x: 18, base: 540, scale: 0.55, tone: 'yellow' },
  { x: 46, base: 548, scale: 0.46, tone: 'pink' },
  { x: 360, base: 540, scale: 0.55, tone: 'lilac' },
  { x: 384, base: 552, scale: 0.46, tone: 'yellow' },
];

const FRONT_STARS: { x: number; y: number; scale: number; tone: StarTone }[] = [
  { x: 8, y: 500, scale: 0.5, tone: 'pink' },
  { x: 66, y: 512, scale: 0.6, tone: 'cream' },
  { x: 120, y: 500, scale: 0.5, tone: 'pink' },
  { x: 268, y: 488, scale: 0.45, tone: 'cream' },
  { x: 290, y: 500, scale: 0.5, tone: 'lilac' },
  { x: 334, y: 506, scale: 0.6, tone: 'cream' },
  { x: 40, y: 620, scale: 0.7, tone: 'pink' },
  { x: 356, y: 616, scale: 0.7, tone: 'cream' },
  { x: 196, y: 690, scale: 0.7, tone: 'lilac' },
  { x: 12, y: 690, scale: 0.8, tone: 'cream' },
  { x: 380, y: 694, scale: 0.8, tone: 'pink' },
];

const Facets = ({ facets }: { facets: Facet[] }) => (
  <G>
    {facets.map((facet, index) => <Path key={index} d={facet.d} fill={facet.fill} />)}
  </G>
);

// Estático y pesado (muchos pliegues): se memoriza para no volver a dibujarlo.
export const OrigamiForestScene = memo(function OrigamiForestScene() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 760" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="origami-sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#DDEFEA" />
          <Stop offset="0.5" stopColor="#F1F2E4" />
          <Stop offset="1" stopColor="#FCEBDA" />
        </LinearGradient>
        <RadialGradient id="origami-glow" cx="196" cy="300" r="210" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFE7C4" stopOpacity="0.75" />
          <Stop offset="0.55" stopColor="#FFEBD0" stopOpacity="0.3" />
          <Stop offset="1" stopColor="#FFEBD0" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Cielo con luz dorada detrás de las montañas, nubes y grullas. */}
      <Rect width="390" height="760" fill="url(#origami-sky)" />
      <Rect width="390" height="520" fill="url(#origami-glow)" />
      <Cloud x={40} y={58} scale={1.25} />
      <Cloud x={176} y={64} scale={0.8} />
      <Cloud x={70} y={122} scale={1.45} />
      <Cloud x={330} y={92} scale={1.8} />
      <Cloud x={196} y={196} scale={0.95} />
      <Crane x={150} y={104} scale={1.05} light="#F6C9D2" shade="#E9A9B8" />
      <Crane x={186} y={134} scale={0.72} light="#DCCFF2" shade="#C3B0E6" />
      <Crane x={92} y={180} scale={0.55} light="#FBE3B8" shade="#EFCB8F" />

      {/* Dos cordilleras plegadas: la lejana más pálida. */}
      <Mountain apex={[128, 252]} left={20} right={250} base={350} colors={['#F0EEF6', '#E7E5F1', '#DEDDEC']} />
      <Mountain apex={[262, 246]} left={150} right={380} base={350} colors={['#EEEFF6', '#E4E6F1', '#D9DDEB']} />
      <Mountain apex={[58, 246]} left={-70} right={185} base={350} colors={['#E4E3F2', '#D6D6EC', '#C8CBE3']} />
      <Mountain apex={[324, 240]} left={205} right={455} base={350} colors={['#E1E6F1', '#D2D9EB', '#C3CCE2']} />
      <Mountain apex={[196, 226]} left={90} right={312} base={350} colors={['#E8E5F3', '#DAD7EE', '#CCCCE6']} />

      <Facets facets={FAR_MEADOW} />
      {TREE_LINE.map(({ index, x, height, blossom }) => (blossom ? (
        <RoundTree
          key={index}
          x={x}
          y={350 + ((index * 13) % 6) - height * 0.35}
          radius={15 + (index % 3) * 2}
          colors={BLOSSOM.far}
          base={374}
        />
      ) : (
        <Pine
          key={index}
          x={x}
          base={374 + ((index * 13) % 6)}
          height={height}
          width={28 + ((index * 7) % 8)}
          light="#AFD0A8"
          shade="#93BC98"
          trunk="#C6B09C"
        />
      )))}

      <Facets facets={MEADOW} />
      {MEADOW_TULIPS.map((tulip, index) => <Tulip key={index} {...tulip} />)}
      {MEADOW_STARS.map((star, index) => <StarFlower key={index} {...star} />)}

      <RoundTree x={118} y={360} radius={30} colors={BLOSSOM.pink} base={432} />
      <Pine x={150} base={432} height={128} width={62} light="#A0CB96" shade="#80B585" />
      <RoundTree x={268} y={362} radius={30} colors={BLOSSOM.lilac} base={430} />

      <Facets facets={MIDDLE_GROUND} />

      {/* Pinos grandes a la izquierda, donde antes estaba el bambú. */}
      <Pine x={-16} base={506} height={470} width={124} light="#7FBC8B" shade="#5B9670" />
      <Pine x={30} base={478} height={400} width={112} light="#8CC693" shade="#66A479" />
      <Pine x={88} base={458} height={290} width={88} light="#9ACD9B" shade="#76B083" />

      <RoundTree x={352} y={300} radius={52} colors={BLOSSOM.deepPink} base={458} />
      <Pine x={394} base={476} height={320} width={100} light="#83BF8E" shade="#5F9E73" />
      <Pine x={318} base={446} height={160} width={66} light="#9CCB99" shade="#7AB282" />

      {/* Piedras de papel donde se posa el pajarito. */}
      <Stone x={80} y={476} rx={30} ry={22} />
      <Stone x={36} y={494} rx={40} ry={26} />

      {FRONT_TULIPS.map((tulip, index) => <Tulip key={index} {...tulip} />)}
      {FRONT_STARS.slice(0, 6).map((star, index) => <StarFlower key={index} {...star} />)}

      <Facets facets={NEAR_GROUND} />

      {/* Hojas de papel en las esquinas de abajo. */}
      <Path d="M0 650L20 566L34 648Z" fill="#86B880" />
      <Path d="M0 650L20 566L8 652Z" fill="#9CCB8E" />
      <Path d="M24 660L60 584L48 664Z" fill="#73A773" />
      <Path d="M24 660L60 584L36 662Z" fill="#88BA84" />
      <Path d="M390 640L368 560L356 642Z" fill="#86B880" />
      <Path d="M390 640L368 560L380 644Z" fill="#73A773" />
      <Path d="M364 660L330 586L342 664Z" fill="#88BA84" />
      <Path d="M364 660L330 586L354 662Z" fill="#73A773" />
      {FRONT_STARS.slice(6).map((star, index) => <StarFlower key={index} {...star} />)}
    </Svg>
  );
});
