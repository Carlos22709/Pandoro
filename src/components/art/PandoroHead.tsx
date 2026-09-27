import Svg from 'react-native-svg';

import { PandoroDefs, PandoroHeadGroup, type PandoroVariant, usePandoroIds } from './Pandoro';

export type PandoroHeadVariant = PandoroVariant;

type PandoroHeadProps = {
  size?: number;
  variant?: PandoroHeadVariant;
};

// Recorte del lienzo de Pandoro (280 × 280) alrededor de la cabeza y las orejas.
const HEAD_FRAME = { x: 14, y: 8, width: 252, height: 182 };

// La misma cabeza que el Pandoro de Inicio; la variante solo cambia el color de las manchas.
export function PandoroHead({ size = 230, variant = 'splash' }: PandoroHeadProps) {
  const ids = usePandoroIds();

  return (
    <Svg
      width={size}
      height={(size * HEAD_FRAME.height) / HEAD_FRAME.width}
      viewBox={`${HEAD_FRAME.x} ${HEAD_FRAME.y} ${HEAD_FRAME.width} ${HEAD_FRAME.height}`}
      accessibilityLabel="Cabeza de Pandoro"
    >
      <PandoroDefs ids={ids} />
      <PandoroHeadGroup ids={ids} variant={variant} />
    </Svg>
  );
}
