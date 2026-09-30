import { useEffect, useId } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { palette } from '@/theme/palette';

type SparkleSpec = { x: number; y: number; size: number; delay: number; color: string };

// Posiciones relativas al nodo del lugar (0–1).
const SPARKLES: readonly SparkleSpec[] = [
  { x: 0.16, y: 0.34, size: 16, delay: 80, color: palette.yellow },
  { x: 0.82, y: 0.22, size: 20, delay: 220, color: palette.white },
  { x: 0.5, y: 0.08, size: 14, delay: 360, color: palette.yellow },
  { x: 0.9, y: 0.6, size: 13, delay: 460, color: palette.pink },
  { x: 0.08, y: 0.7, size: 12, delay: 540, color: palette.white },
  { x: 0.64, y: 0.44, size: 11, delay: 300, color: palette.white },
];

function Sparkle({ spec, width, height }: { spec: SparkleSpec; width: number; height: number }) {
  const life = useSharedValue(0);

  useEffect(() => {
    life.value = withDelay(spec.delay, withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }));
  }, [life, spec]);

  const animatedStyle = useAnimatedStyle(() => {
    const grow = life.value < 0.4 ? life.value / 0.4 : 1 - (life.value - 0.4) / 0.6;
    return {
      opacity: grow,
      transform: [{ translateY: -life.value * 14 }, { scale: 0.3 + grow * 0.7 }, { rotate: `${life.value * 60}deg` }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.sparkle,
        { left: spec.x * width - spec.size / 2, top: spec.y * height - spec.size / 2 },
        animatedStyle,
      ]}
    >
      <Svg width={spec.size} height={spec.size} viewBox="0 0 20 20">
        <Path d="M10 0Q11 9 20 10Q11 11 10 20Q9 11 0 10Q9 9 10 0Z" fill={spec.color} />
      </Svg>
    </Animated.View>
  );
}

// Resplandor y destellos del momento en que un lugar se desbloquea.
export function LandmarkBloom({ width, height }: { width: number; height: number }) {
  const gradientId = `bloom-${useId().replace(/:/g, '')}`;
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withSequence(
      withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 1300, easing: Easing.in(Easing.quad) }),
    );
  }, [glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.7 + glow.value * 0.4 }],
  }));

  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.glow, glowStyle]}>
        <Svg width={width} height={height} viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id={gradientId} cx="50" cy="62" r="50" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFE9B0" stopOpacity="0.95" />
              <Stop offset="0.6" stopColor="#FFE3A6" stopOpacity="0.4" />
              <Stop offset="1" stopColor="#FFE3A6" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="62" r="50" fill={`url(#${gradientId})`} />
        </Svg>
      </Animated.View>
      <Animated.View pointerEvents="none" style={styles.sparkles}>
        {SPARKLES.map((spec, index) => (
          <Sparkle key={index} spec={spec} width={width} height={height} />
        ))}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  sparkles: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 3,
  },
  sparkle: {
    position: 'absolute',
  },
});
