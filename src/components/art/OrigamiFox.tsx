import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

type OrigamiFoxProps = { size?: number };

// Zorro de papel plegado que llega a Inicio con el Bosque de origami. Está sentado y
// mira hacia la izquierda, hacia Pandoro. La luz entra por arriba a la izquierda: las
// caras de ese lado son más claras.
const FOX = {
  light: '#F7C08F',
  base: '#EFA56E',
  mid: '#E4935C',
  shade: '#D98752',
  deep: '#CF7D4B',
  cream: '#FFF3E1',
  creamShade: '#F0DEC6',
  innerEar: '#F6D7BE',
  innerEarShade: '#EDC3A2',
  ink: '#4F3A53',
} as const;

// Lienzo 132 × 140; el suelo queda en y = 126 (132 dentro del lienzo).
export const ORIGAMI_FOX_RATIO = 140 / 132;

export function OrigamiFox({ size = 96 }: OrigamiFoxProps) {
  return (
    <Svg width={size} height={size * ORIGAMI_FOX_RATIO} viewBox="0 -8 132 140" accessibilityLabel="Zorro de origami">
      <Ellipse cx="68" cy="127" rx="50" ry="4.5" fill="#6E8F5C" opacity=".2" />

      {/* Cola: se alza detrás del anca con la punta crema doblada. */}
      <Path d="M90 114L100 78L112 90Z" fill={FOX.base} />
      <Path d="M100 78L114 54L112 90Z" fill={FOX.light} />
      <Path d="M112 90L114 54L128 76Z" fill={FOX.mid} />
      <Path d="M90 114L112 90L124 110Z" fill={FOX.mid} />
      <Path d="M112 90L128 76L124 110Z" fill={FOX.deep} />
      <Path d="M103 64L112 41L114 54Z" fill={FOX.cream} />
      <Path d="M114 54L112 41L126 58L128 76Z" fill={FOX.creamShade} />

      {/* Lomo y costado. */}
      <Path d="M56 48L92 84L46 64Z" fill={FOX.light} />
      <Path d="M46 64L92 84L70 106L40 100Z" fill={FOX.base} />

      {/* Anca: una solapa redonda plegada sobre el costado. */}
      <Path d="M66 96L92 84L106 100L84 108Z" fill={FOX.base} />
      <Path d="M66 96L84 108L64 126L60 110Z" fill={FOX.mid} />
      <Path d="M84 108L106 100L106 116L96 126L64 126Z" fill={FOX.shade} />

      {/* Pecho y patas delanteras. */}
      <Path d="M27 50L46 64L40 100L24 92Z" fill={FOX.cream} />
      <Path d="M24 92L40 100L36 106L24 100Z" fill={FOX.creamShade} />
      <Path d="M24 99L35 104L35 126L24 126Z" fill={FOX.base} />
      <Path d="M35 104L40 100L47 104L47 126L35 126Z" fill={FOX.mid} />
      <Path d="M24 126V120H35V126Z" fill={FOX.cream} />
      <Path d="M35 126V120H47V126Z" fill={FOX.creamShade} />

      {/* Cabeza, un poco más grande que el cuerpo para que se vea tierno. */}
      <G transform="translate(36 60) scale(1.12) translate(-36 -60)">
        <Path d="M24 28L23 2L39 20Z" fill={FOX.base} />
        <Path d="M27.5 24L27 9L36 19.5Z" fill={FOX.innerEar} />
        <Path d="M46 19L60 3L63 30Z" fill={FOX.mid} />
        <Path d="M49.5 19.5L58.5 9.5L60.5 26Z" fill={FOX.innerEarShade} />
        <Path d="M24 28L39 20L46 19L63 30L40 38Z" fill={FOX.light} />
        <Path d="M24 28L40 38L6 48Z" fill={FOX.cream} />
        <Path d="M6 48L40 38L30 56Z" fill={FOX.creamShade} />
        <Path d="M63 30L60 50L40 38Z" fill={FOX.base} />
        <Path d="M40 38L60 50L30 56Z" fill={FOX.mid} />
        <Path d="M46 53L60 50L55 61Z" fill={FOX.cream} />
        <Circle cx="6.8" cy="47.6" r="2.4" fill={FOX.ink} />
        <Path d="M27.5 33Q31 30.4 34.5 32.6" fill="none" stroke={FOX.ink} strokeWidth="1.7" strokeLinecap="round" />
      </G>
    </Svg>
  );
}
