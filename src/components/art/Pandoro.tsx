import { useId } from 'react';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

// Variantes de color de la cabeza (onboarding). "splash" es el Pandoro de Inicio.
export type PandoroVariant = 'splash' | 'pink' | 'blue' | 'yellow';

type PandoroProps = { size?: number };

// Silueta de la cabeza: la elipse original (140, 100, 110 × 82) con pequeñas
// variaciones orgánicas para que no parezca una elipse matemática.
const PANDORO_HEAD_PATH =
  'M251.5 100C251.6 108.5 248.9 117.4 245.2 125.5S236.2 141.6 229.5 148.5S214.4 162 205.1 166.8S184.7 175.2 173.8 177.7S151.3 181.5 140 181.4S117.2 179.8 106.2 177.5S83.9 172 74.4 167.3S55.6 156.2 49.1 149.2S38.4 133.5 35.4 125.3S30.8 108.4 31 100S33.2 83 36.5 74.9S44.3 58.5 50.8 51.7S66.5 38.9 75.7 34S95.4 24.8 106.1 22.2S128.7 18.3 140 18.3S163.4 19.3 174 22S194.6 29.7 203.6 34.8S221 45.8 227.8 52.5S240.4 66.8 244.3 74.7S251.3 91.5 251.5 100Z';

type Oval = { cx: number; cy: number; rx: number; ry: number; rotate: number };

// Partes oscuras: se dibujan y a la vez recortan sus reflejos.
const EARS = [
  { cx: 62, cy: 55, r: 40 },
  { cx: 218, cy: 55, r: 40 },
] as const;
const ARMS: readonly Oval[] = [
  { cx: 106, cy: 193, rx: 24.5, ry: 31, rotate: -18 },
  { cx: 174, cy: 193, rx: 24.5, ry: 31, rotate: 18 },
];
const LEGS: readonly Oval[] = [
  { cx: 92, cy: 237, rx: 32, ry: 27, rotate: 13 },
  { cx: 188, cy: 237, rx: 32, ry: 27, rotate: -13 },
];

// Pigmentos de las iluminaciones. Rosa y lila son protagonistas; azul y amarillo, acentos.
// Los "rim" son versiones claras para reflejos discretos sobre el morado oscuro.
const PIGMENTS = {
  pink: '#F4A3C4',
  lilac: '#C0A2F0',
  blue: '#8FA8F6',
  yellow: '#F8D77E',
  cheek: '#F4919F',
  rimPink: '#F7C3D8',
  rimLilac: '#D6C2F7',
  rimBlue: '#C0D0F8',
} as const;

type Pigment = keyof typeof PIGMENTS;

// Una iluminación es un óvalo con degradado radial que se desvanece hasta transparente,
// así que nunca muestra un borde. Varias luces solapadas forman una zona orgánica.
type Light = Oval & { pigment: Pigment; opacity: number };

const light = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotate: number,
  pigment: Pigment,
  opacity: number,
): Light => ({ cx, cy, rx, ry, rotate, pigment, opacity });

// Intensidad global de todas las iluminaciones (1 = valores de las tablas).
const LIGHT_INTENSITY = 1;

// Cabeza: el centro del rostro, los ojos y las mejillas quedan fuera de las luces.
const HEAD_LIGHTS = {
  // Principal: rosa en la parte superior izquierda que se vuelve lila hacia el lateral.
  pinkLavenderLight: [
    light(86, 40, 62, 32, -14, 'pink', 0.74),
    light(122, 28, 34, 17, -4, 'pink', 0.4),
    light(50, 68, 24, 40, 20, 'lilac', 0.6),
    light(66, 50, 28, 20, -30, 'lilac', 0.32),
  ],
  // Toque mantequilla en la parte superior derecha.
  yellowLight: [light(178, 36, 32, 18, 14, 'yellow', 0.58)],
  // Lateral derecho, más tenue: azul que se funde en lila hacia la mandíbula.
  blueLight: [
    light(236, 92, 18, 42, -8, 'blue', 0.44),
    light(224, 144, 20, 22, 32, 'lilac', 0.26),
  ],
} satisfies Record<string, readonly Light[]>;

// Rubor suave bajo los ojos; va por debajo de las manchas de los ojos.
const CHEEK_LIGHTS: readonly Light[] = [
  light(72, 141, 17, 11, -8, 'cheek', 0.72),
  light(208, 141, 17, 11, 8, 'cheek', 0.72),
];

// Cuerpo: la mayor parte queda crema.
const BODY_LIGHTS = {
  chestLight: [
    light(140, 194, 30, 18, 0, 'pink', 0.36),
    light(150, 210, 18, 14, 20, 'lilac', 0.24),
  ],
  sideLight: [
    light(206, 196, 16, 40, 8, 'blue', 0.44),
    light(198, 232, 18, 18, 0, 'lilac', 0.26),
  ],
  accentLight: [light(70, 186, 12, 24, -10, 'yellow', 0.42)],
} satisfies Record<string, readonly Light[]>;

// Reflejos muy discretos en el borde de las partes oscuras.
const EAR_RIMS: readonly Light[] = [
  light(28, 24, 30, 14, -45, 'rimPink', 0.3),
  light(252, 24, 30, 14, 45, 'rimBlue', 0.26),
];
const ARM_RIMS: readonly Light[] = [
  light(78, 180, 9, 24, -18, 'rimLilac', 0.26),
  light(202, 180, 9, 24, 18, 'rimBlue', 0.22),
];
const LEG_RIMS: readonly Light[] = [
  light(70, 210, 22, 8, 20, 'rimPink', 0.24),
  light(210, 210, 22, 8, -20, 'rimLilac', 0.24),
];

type LightFamily = 'pink' | 'lilac' | 'blue' | 'yellow';

// Cada variante intercambia pigmentos de la cabeza; la forma de las luces no cambia.
const VARIANT_SWAPS: Record<PandoroVariant, Partial<Record<LightFamily, LightFamily>>> = {
  splash: {},
  pink: { blue: 'pink' },
  blue: { pink: 'blue', blue: 'pink' },
  yellow: { pink: 'yellow', yellow: 'pink' },
};

export function usePandoroIds() {
  const svgId = useId().replace(/:/g, '');
  const pigments = Object.fromEntries(
    Object.keys(PIGMENTS).map((pigment) => [pigment, `${svgId}-light-${pigment}`]),
  ) as Record<Pigment, string>;

  return {
    headClip: `${svgId}-head-clip`,
    bodyClip: `${svgId}-body-clip`,
    earsClip: `${svgId}-ears-clip`,
    armsClip: `${svgId}-arms-clip`,
    legsClip: `${svgId}-legs-clip`,
    headFur: `${svgId}-head-fur`,
    bodyFur: `${svgId}-body-fur`,
    darkFur: `${svgId}-dark-fur`,
    pawPad: `${svgId}-paw-pad`,
    pigments,
  };
}

type PandoroIds = ReturnType<typeof usePandoroIds>;

const ovalTransform = ({ cx, cy, rotate }: Oval) => `rotate(${rotate} ${cx} ${cy})`;

type LightsProps = {
  lights: readonly Light[];
  ids: PandoroIds;
  swaps?: Partial<Record<LightFamily, LightFamily>>;
};

function Lights({ lights, ids, swaps = {} }: LightsProps) {
  return (
    <>
      {lights.map((item, index) => {
        const pigment = swaps[item.pigment as LightFamily] ?? item.pigment;
        return (
          <Ellipse
            key={index}
            cx={item.cx}
            cy={item.cy}
            rx={item.rx}
            ry={item.ry}
            transform={ovalTransform(item)}
            fill={`url(#${ids.pigments[pigment]})`}
            opacity={item.opacity * LIGHT_INTENSITY}
          />
        );
      })}
    </>
  );
}

export function PandoroDefs({ ids }: { ids: PandoroIds }) {
  return (
    <Defs>
      <ClipPath id={ids.headClip}>
        <Path d={PANDORO_HEAD_PATH} />
      </ClipPath>
      <ClipPath id={ids.bodyClip}>
        <Ellipse cx="140" cy="190" rx="77" ry="70" />
      </ClipPath>
      <ClipPath id={ids.earsClip}>
        {EARS.map((ear, index) => <Circle key={index} {...ear} />)}
      </ClipPath>
      <ClipPath id={ids.armsClip}>
        {ARMS.map((arm, index) => <Ellipse key={index} {...arm} transform={ovalTransform(arm)} />)}
      </ClipPath>
      <ClipPath id={ids.legsClip}>
        {LEGS.map((leg, index) => <Ellipse key={index} {...leg} transform={ovalTransform(leg)} />)}
      </ClipPath>

      <RadialGradient id={ids.headFur} cx="40%" cy="28%" rx="72%" ry="82%">
        <Stop offset="0%" stopColor="#FFF8E8" />
        <Stop offset="70%" stopColor="#FFF4E3" />
        <Stop offset="100%" stopColor="#F9EADB" />
      </RadialGradient>
      <RadialGradient id={ids.bodyFur} cx="42%" cy="25%" rx="70%" ry="86%">
        <Stop offset="0%" stopColor="#FFF8E8" />
        <Stop offset="72%" stopColor="#FFF3E1" />
        <Stop offset="100%" stopColor="#F5E4D2" />
      </RadialGradient>
      <LinearGradient id={ids.darkFur} x1="18%" y1="8%" x2="84%" y2="94%">
        <Stop offset="0%" stopColor="#56425C" />
        <Stop offset="55%" stopColor="#49364F" />
        <Stop offset="100%" stopColor="#3F2F45" />
      </LinearGradient>
      <LinearGradient id={ids.pawPad} x1="15%" y1="10%" x2="85%" y2="90%">
        <Stop offset="0%" stopColor="#F3AAB3" />
        <Stop offset="100%" stopColor="#DD8392" />
      </LinearGradient>

      {/* Caída suave con el foco algo desplazado: el pigmento se acumula hacia un lado
          como en un lavado de acuarela, sin llegar a formar borde. */}
      {(Object.keys(PIGMENTS) as Pigment[]).map((pigment) => (
        <RadialGradient
          key={pigment}
          id={ids.pigments[pigment]}
          cx="50%"
          cy="50%"
          rx="50%"
          ry="50%"
          fx="44%"
          fy="42%"
        >
          <Stop offset="0%" stopColor={PIGMENTS[pigment]} stopOpacity={1} />
          <Stop offset="40%" stopColor={PIGMENTS[pigment]} stopOpacity={0.8} />
          <Stop offset="72%" stopColor={PIGMENTS[pigment]} stopOpacity={0.32} />
          <Stop offset="100%" stopColor={PIGMENTS[pigment]} stopOpacity={0} />
        </RadialGradient>
      ))}
    </Defs>
  );
}

type PandoroHeadGroupProps = { ids: PandoroIds; variant?: PandoroVariant };

// Cabeza completa: orejas, pelaje, iluminaciones y cara. La comparten el Pandoro de
// Inicio y PandoroHead, así que cualquier cambio aquí se ve en todas las pantallas.
export function PandoroHeadGroup({ ids, variant = 'splash' }: PandoroHeadGroupProps) {
  const darkFur = `url(#${ids.darkFur})`;
  const swaps = VARIANT_SWAPS[variant];

  return (
    <G id="pandoroHead">
      <G id="pandoroEars">
        {EARS.map((ear, index) => <Circle key={index} {...ear} fill={darkFur} />)}
        <G clipPath={`url(#${ids.earsClip})`}>
          <Lights lights={EAR_RIMS} ids={ids} />
        </G>
      </G>

      <Path id="pandoroHeadBase" d={PANDORO_HEAD_PATH} fill={`url(#${ids.headFur})`} />

      <G id="pandoroHeadLighting" clipPath={`url(#${ids.headClip})`}>
        <G id="pinkLavenderLight">
          <Lights lights={HEAD_LIGHTS.pinkLavenderLight} ids={ids} swaps={swaps} />
        </G>
        <G id="yellowLight">
          <Lights lights={HEAD_LIGHTS.yellowLight} ids={ids} swaps={swaps} />
        </G>
        <G id="blueLight">
          <Lights lights={HEAD_LIGHTS.blueLight} ids={ids} swaps={swaps} />
        </G>
      </G>

      <G id="pandoroFace">
        <G id="pandoroCheeks">
          <Lights lights={CHEEK_LIGHTS} ids={ids} />
        </G>
        <Path
          d="M61 99C64 86 75 78 88 77C101 76 114 85 118 97C121 107 117 119 108 127C99 135 85 138 74 132C64 127 60 117 62 109C64 104 59 103 61 99Z"
          fill={darkFur}
        />
        <Path
          d="M161 99C165 87 177 78 190 79C204 80 216 90 218 104C220 116 214 128 202 134C191 139 177 135 168 126C160 119 157 108 161 99Z"
          fill={darkFur}
        />
        <Path d="M81 105c6-8 15-8 21 0" fill="none" stroke="#251F2A" strokeWidth="4" strokeLinecap="round" />
        <Path d="M178 105c6-8 15-8 21 0" fill="none" stroke="#251F2A" strokeWidth="4" strokeLinecap="round" />

        <Ellipse cx="140" cy="126" rx="9" ry="6.5" fill="#3E3044" />
        <Path d="M140 132v8c0 11-18 10-19-2m19 2c1 12 19 13 20-2" fill="none" stroke="#4B354A" strokeWidth="3.5" strokeLinecap="round" />
        <Path d="M131 142c6 10 13 10 19 0" fill="#E98291" />
      </G>
    </G>
  );
}

export function Pandoro({ size = 250 }: PandoroProps) {
  const ids = usePandoroIds();
  const darkFur = `url(#${ids.darkFur})`;

  return (
    <Svg width={size} height={size} viewBox="0 0 280 280" accessibilityLabel="Pandoro">
      <PandoroDefs ids={ids} />

      <Ellipse cx="140" cy="261" rx="88" ry="11" fill="#6F945F" opacity=".23" />

      <G id="pandoroBody">
        <Ellipse id="pandoroBodyBase" cx="140" cy="190" rx="77" ry="70" fill={`url(#${ids.bodyFur})`} />
        <G id="bodyLight" clipPath={`url(#${ids.bodyClip})`}>
          <Lights lights={BODY_LIGHTS.chestLight} ids={ids} />
          <Lights lights={BODY_LIGHTS.sideLight} ids={ids} />
          <Lights lights={BODY_LIGHTS.accentLight} ids={ids} />
        </G>
      </G>

      <PandoroHeadGroup ids={ids} />

      <G id="pandoroLimbs">
        {ARMS.map((arm, index) => <Ellipse key={index} {...arm} transform={ovalTransform(arm)} fill={darkFur} />)}
        <G clipPath={`url(#${ids.armsClip})`}>
          <Lights lights={ARM_RIMS} ids={ids} />
        </G>
        {LEGS.map((leg, index) => <Ellipse key={index} {...leg} transform={ovalTransform(leg)} fill={darkFur} />)}
        <G clipPath={`url(#${ids.legsClip})`}>
          <Lights lights={LEG_RIMS} ids={ids} />
        </G>

        <G fill={`url(#${ids.pawPad})`}>
          <Ellipse cx="89" cy="239" rx="9.5" ry="11" /><Circle cx="75" cy="229" r="5" /><Circle cx="85" cy="218" r="5" /><Circle cx="98" cy="220" r="5" />
          <Ellipse cx="191" cy="239" rx="9.5" ry="11" /><Circle cx="178" cy="220" r="5" /><Circle cx="191" cy="216" r="5" /><Circle cx="204" cy="228" r="5" />
        </G>
      </G>
    </Svg>
  );
}
