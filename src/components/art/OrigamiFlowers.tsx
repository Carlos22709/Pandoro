import Svg, { Path } from 'react-native-svg';

// Tulipán de papel plegado que se despliega en el pasto de Inicio con el Bosque de origami.

export type OrigamiTulipTone = 'pink' | 'yellow' | 'lilac';

const TULIP_TONES: Record<OrigamiTulipTone, { light: string; base: string; deep: string; fold: string }> = {
  pink: { light: '#F7C9D0', base: '#F1B0BC', deep: '#DB8C9D', fold: '#FCE3E6' },
  yellow: { light: '#F9E2A8', base: '#F2D08A', deep: '#D9AE62', fold: '#FCF0CF' },
  lilac: { light: '#E3D6F5', base: '#CDBBEB', deep: '#A993CF', fold: '#F1EAFB' },
};

const LEAF = { light: '#9CCB8E', base: '#7DB27A', deep: '#689E6A' } as const;

// Lienzo 40 × 90 con el tallo apoyado en y = 88.
export const ORIGAMI_TULIP_RATIO = 90 / 40;

export function OrigamiTulip({ size = 30, tone = 'pink' }: { size?: number; tone?: OrigamiTulipTone }) {
  const petal = TULIP_TONES[tone];

  return (
    <Svg width={size} height={size * ORIGAMI_TULIP_RATIO} viewBox="0 0 40 90">
      <Path d="M20 88C20 72 21 58 20 44" fill="none" stroke={LEAF.base} strokeWidth="2.6" strokeLinecap="round" />
      <Path d="M20 86L5 58L15 69Z" fill={LEAF.light} />
      <Path d="M20 86L15 69L19 72Z" fill={LEAF.base} />
      <Path d="M20 80L34 62L25 72Z" fill={LEAF.base} />
      <Path d="M20 80L25 72L23 77Z" fill={LEAF.deep} />

      {/* Pétalo trasero asomando por la muesca y las dos mitades plegadas del frente. */}
      <Path d="M13 27L20 12L27 27Z" fill={petal.deep} />
      <Path d="M8 22L20 30L20 46L11 40Z" fill={petal.light} />
      <Path d="M20 30L32 22L29 40L20 46Z" fill={petal.base} />
      <Path d="M8 22L20 30L14 31Z" fill={petal.fold} />
    </Svg>
  );
}
