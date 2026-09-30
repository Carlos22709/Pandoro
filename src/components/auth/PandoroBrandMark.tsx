import Animated, { ZoomIn } from 'react-native-reanimated';

import { PandoroHead, type PandoroHeadVariant } from '@/components/art/PandoroHead';

type PandoroBrandMarkProps = {
  variant: PandoroHeadVariant;
  size?: number;
};

// Cabeza de Pandoro a tamaño de marca, con la misma entrada que el onboarding.
export function PandoroBrandMark({ variant, size = 116 }: PandoroBrandMarkProps) {
  return (
    <Animated.View entering={ZoomIn.duration(220)} accessible accessibilityLabel="Pandoro">
      <PandoroHead size={size} variant={variant} />
    </Animated.View>
  );
}
