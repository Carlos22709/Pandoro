import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { OrigamiTulip } from '@/components/art/OrigamiFlowers';
import { OrigamiForestScene } from '@/components/art/OrigamiForestScene';
import { OrigamiFox } from '@/components/art/OrigamiFox';

// Lo que el Bosque de origami trae a Inicio. La primera vez que se ve, el bosque de
// papel aparece sobre el de bambú y después las piezas del frente se despliegan desde
// su base, una tras otra, con el zorro al final.
export type OrigamiRevealPhase = 'hidden' | 'revealing' | 'shown';

const BACKDROP_FADE_MS = 900;
const UNFOLD_START_MS = 650;
export const ORIGAMI_REVEAL_MS = 2300;

type UnfoldProps = {
  phase: OrigamiRevealPhase;
  delay: number;
  style: ViewStyle;
  hop?: boolean;
  children: ReactNode;
};

function Unfold({ phase, delay, style, hop = false, children }: UnfoldProps) {
  const unfold = useSharedValue(phase === 'shown' ? 1 : 0);
  const lift = useSharedValue(0);

  useEffect(() => {
    if (phase !== 'revealing') {
      unfold.value = phase === 'shown' ? 1 : 0;
      return;
    }
    unfold.value = 0;
    unfold.value = withDelay(UNFOLD_START_MS + delay, withSpring(1, { damping: 12, stiffness: 150 }));
    if (hop) {
      lift.value = withDelay(
        UNFOLD_START_MS + delay + 380,
        withSequence(
          withTiming(-12, { duration: 170, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 170, easing: Easing.in(Easing.quad) }),
        ),
      );
    }
  }, [delay, hop, lift, phase, unfold]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, unfold.value * 2.5),
    transform: [
      { translateY: lift.value },
      { scaleX: 0.72 + unfold.value * 0.28 },
      { scaleY: unfold.value },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.piece, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// Pasto de Inicio: se ancla al suelo donde está sentado Pandoro, así que funciona
// en cualquier alto de pantalla. Tulipanes a la izquierda y el zorro a la derecha.
export function OrigamiGround({ phase, foxSize }: { phase: OrigamiRevealPhase; foxSize: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Unfold phase={phase} delay={0} style={{ left: 16, bottom: -10 }}>
        <OrigamiTulip size={34} tone="pink" />
      </Unfold>
      <Unfold phase={phase} delay={110} style={{ left: 46, bottom: -12 }}>
        <OrigamiTulip size={27} tone="yellow" />
      </Unfold>
      <Unfold phase={phase} delay={200} style={{ left: 2, bottom: -14 }}>
        <OrigamiTulip size={22} tone="lilac" />
      </Unfold>
      {/* Detrás de la cola del zorro, para enmarcarlo. */}
      <Unfold phase={phase} delay={330} style={{ right: 4, bottom: -4 }}>
        <OrigamiTulip size={26} tone="pink" />
      </Unfold>
      <Unfold phase={phase} delay={520} hop style={{ right: 12, bottom: -6 }}>
        <OrigamiFox size={foxSize} />
      </Unfold>
    </View>
  );
}

// Fondo completo del Bosque de origami. Se funde sobre el bosque de bambú.
export function OrigamiBackdrop({ phase }: { phase: OrigamiRevealPhase }) {
  const opacity = useSharedValue(phase === 'shown' ? 1 : 0);

  useEffect(() => {
    if (phase !== 'revealing') {
      opacity.value = phase === 'shown' ? 1 : 0;
      return;
    }
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: BACKDROP_FADE_MS, easing: Easing.inOut(Easing.quad) });
  }, [opacity, phase]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, animatedStyle]}>
      <OrigamiForestScene />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    transformOrigin: 'bottom',
  },
});
