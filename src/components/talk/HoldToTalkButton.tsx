import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { VoiceBird } from '@/components/art/VoiceBird';
import { palette } from '@/theme/palette';

type HoldToTalkButtonProps = {
  listening: boolean;
  disabled: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
};

// Alturas y ritmos fijos: la onda parece voz sin depender del micrófono.
const BARS = [
  { peak: 14, duration: 260, delay: 0 },
  { peak: 24, duration: 320, delay: 90 },
  { peak: 18, duration: 240, delay: 40 },
  { peak: 28, duration: 300, delay: 140 },
];

function WaveBar({ listening, peak, duration, delay }: { listening: boolean } & (typeof BARS)[number]) {
  const height = useSharedValue(5);

  useEffect(() => {
    if (!listening) {
      cancelAnimation(height);
      height.value = withTiming(5, { duration: 180 });
      return;
    }
    height.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(peak, { duration, easing: Easing.inOut(Easing.quad) }),
          withTiming(peak * 0.35, { duration: duration * 0.8, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, duration, height, listening, peak]);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));

  return <Animated.View style={[styles.bar, listening && styles.barActive, animatedStyle]} />;
}

function Wave({ listening, mirrored = false }: { listening: boolean; mirrored?: boolean }) {
  const bars = mirrored ? [...BARS].reverse() : BARS;
  return (
    <View style={styles.wave}>
      {bars.map((bar, index) => (
        <WaveBar key={index} listening={listening} {...bar} />
      ))}
    </View>
  );
}

export function HoldToTalkButton({ listening, disabled, onPressIn, onPressOut }: HoldToTalkButtonProps) {
  const press = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    press.value = withSpring(listening ? 1 : 0, { damping: 13, stiffness: 190 });
    if (listening) {
      ring.value = 0;
      ring.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }), -1, false);
    } else {
      cancelAnimation(ring);
      ring.value = withTiming(0, { duration: 160 });
    }
  }, [listening, press, ring]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + press.value * 0.1 }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: press.value * (1 - ring.value) * 0.55,
    transform: [{ scale: 1 + ring.value * 0.45 }],
  }));

  return (
    <View style={styles.container}>
      <Wave listening={listening} mirrored />
      <View style={styles.buttonSlot}>
        <Animated.View pointerEvents="none" style={[styles.ring, ringStyle]} />
        <Animated.View style={buttonStyle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mantén pulsado para hablar con Pandoro"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            // En navegadores táctiles, sin onLongPress el menú contextual corta la
            // pulsación a los ~500 ms; con él, react-native-web lo bloquea.
            onLongPress={() => undefined}
            style={[styles.button, disabled && styles.buttonDisabled]}
          >
            <VoiceBird size={50} />
          </Pressable>
        </Animated.View>
      </View>
      <Wave listening={listening} />
    </View>
  );
}

const BUTTON = 76;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  wave: {
    width: 44,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(148, 123, 179, 0.28)',
  },
  barActive: {
    backgroundColor: palette.lilacDeep,
  },
  buttonSlot: {
    width: BUTTON + 20,
    height: BUTTON + 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    backgroundColor: palette.lilac,
  },
  button: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.lilacDeep,
    userSelect: 'none',
    borderWidth: 3,
    borderColor: 'rgba(255, 252, 245, 0.9)',
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
