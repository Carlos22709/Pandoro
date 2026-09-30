import { useEffect } from 'react';
import { Modal, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Pandoro } from '@/components/art/Pandoro';
import { AppIcon } from '@/components/icons/AppIcon';
import { PrimaryButton } from '@/components/onboarding/PrimaryButton';
import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

type TaskCelebrationProps = {
  visible: boolean;
  title: string;
  completedTasks: number;
  placeName: string;
  onSeeWorld: () => void;
  onClose: () => void;
};

type ConfettiShape = 'leaf' | 'fold' | 'petal';

type ConfettiSpec = {
  x: number;
  delay: number;
  duration: number;
  spin: number;
  sway: number;
  size: number;
  color: string;
  shape: ConfettiShape;
};

// Valores fijos: la lluvia de papelitos sale igual en cada ensayo.
const CONFETTI: readonly ConfettiSpec[] = [
  { x: 0.06, delay: 0, duration: 2600, spin: 320, sway: 18, size: 14, color: palette.pink, shape: 'petal' },
  { x: 0.15, delay: 260, duration: 3100, spin: -260, sway: -14, size: 12, color: palette.green, shape: 'leaf' },
  { x: 0.24, delay: 120, duration: 2800, spin: 410, sway: 20, size: 11, color: palette.yellow, shape: 'fold' },
  { x: 0.33, delay: 420, duration: 3300, spin: -380, sway: 12, size: 13, color: palette.lilac, shape: 'petal' },
  { x: 0.42, delay: 60, duration: 2500, spin: 280, sway: -18, size: 12, color: palette.blue, shape: 'fold' },
  { x: 0.5, delay: 340, duration: 3000, spin: -300, sway: 16, size: 14, color: palette.green, shape: 'leaf' },
  { x: 0.58, delay: 180, duration: 2700, spin: 360, sway: -12, size: 11, color: palette.pink, shape: 'fold' },
  { x: 0.67, delay: 480, duration: 3200, spin: -420, sway: 18, size: 13, color: palette.yellow, shape: 'petal' },
  { x: 0.75, delay: 20, duration: 2600, spin: 300, sway: -16, size: 12, color: palette.lilac, shape: 'leaf' },
  { x: 0.83, delay: 300, duration: 2900, spin: -340, sway: 14, size: 14, color: palette.blue, shape: 'petal' },
  { x: 0.91, delay: 140, duration: 2750, spin: 390, sway: -20, size: 11, color: palette.green, shape: 'fold' },
  { x: 0.97, delay: 400, duration: 3150, spin: -280, sway: 12, size: 12, color: palette.pink, shape: 'leaf' },
];

function ConfettiPiece({ spec, height, width }: { spec: ConfettiSpec; height: number; width: number }) {
  const fall = useSharedValue(0);

  useEffect(() => {
    fall.value = withDelay(spec.delay, withTiming(1, { duration: spec.duration, easing: Easing.in(Easing.quad) }));
  }, [fall, spec]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fall.value < 0.85 ? 1 : (1 - fall.value) / 0.15,
    transform: [
      { translateY: -40 + fall.value * (height + 80) },
      { translateX: Math.sin(fall.value * Math.PI * 3) * spec.sway },
      { rotate: `${fall.value * spec.spin}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.confetti, { left: spec.x * width - spec.size / 2 }, animatedStyle]}>
      <Svg width={spec.size} height={spec.size} viewBox="0 0 20 20">
        {spec.shape === 'leaf' && <Path d="M10 1C16 5 17 13 10 19C3 13 4 5 10 1Z" fill={spec.color} />}
        {spec.shape === 'petal' && <Path d="M10 2C15 6 15 14 10 18C5 14 5 6 10 2Z" fill={spec.color} opacity=".92" />}
        {spec.shape === 'fold' && (
          <>
            <Path d="M2 10L10 2L18 10Z" fill={spec.color} />
            <Path d="M2 10L18 10L10 18Z" fill={spec.color} opacity=".7" />
          </>
        )}
      </Svg>
    </Animated.View>
  );
}

function CelebrationContent({
  title,
  completedTasks,
  placeName,
  onSeeWorld,
  onClose,
}: Omit<TaskCelebrationProps, 'visible'>) {
  const { width, height } = useWindowDimensions();
  const appear = useSharedValue(0);
  const hop = useSharedValue(0);

  useEffect(() => {
    appear.value = withSpring(1, { damping: 14, stiffness: 140 });
    hop.value = withDelay(
      260,
      withSequence(
        withTiming(-22, { duration: 220, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) }),
        withTiming(-11, { duration: 170, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 160, easing: Easing.in(Easing.quad) }),
      ),
    );
  }, [appear, hop]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, appear.value * 1.4),
    transform: [{ translateY: (1 - appear.value) * 26 }, { scale: 0.94 + appear.value * 0.06 }],
  }));

  const pandaStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hop.value }, { rotate: `${hop.value * 0.25}deg` }],
  }));

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {CONFETTI.map((spec, index) => (
          <ConfettiPiece key={index} spec={spec} height={height} width={width} />
        ))}
      </View>

      <Animated.View style={[styles.stack, cardStyle]}>
        <Animated.View pointerEvents="none" style={[styles.panda, pandaStyle]}>
          <Pandoro size={138} />
        </Animated.View>

        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.eyebrow}>Tarea completada</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>
            Llevas {completedTasks} tareas. Se abrió un nuevo lugar en tu mundo:
          </Text>
          <View style={styles.placePill}>
            <AppIcon name="sprout" color={palette.greenDeep} size={18} strokeWidth={2.2} />
            <Text style={styles.placeName}>{placeName}</Text>
          </View>

          <View style={styles.actions}>
            <PrimaryButton label="Ver mi mundo" onPress={onSeeWorld} />
            <PrimaryButton label="Seguir con mis tareas" variant="text" onPress={onClose} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// Aparece solo cuando una tarea desbloquea un lugar. No se cierra tocando fuera para
// que un toque nervioso en plena presentación no la haga desaparecer.
export function TaskCelebration({ visible, ...content }: TaskCelebrationProps) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      statusBarTranslucent
      onRequestClose={content.onClose}
    >
      {visible ? <CelebrationContent {...content} /> : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: 'rgba(61, 49, 67, 0.3)',
  },
  confetti: {
    position: 'absolute',
    top: 0,
  },
  stack: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  panda: {
    marginBottom: -30,
    zIndex: 2,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 34,
    paddingHorizontal: 22,
    paddingBottom: 12,
    borderRadius: ui.radius.panel,
    backgroundColor: ui.surface.base,
    borderWidth: 1,
    borderColor: ui.surface.border,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  eyebrow: {
    ...typeScale.caption,
    fontFamily: fonts.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: palette.greenDeep,
  },
  title: {
    ...typeScale.heading,
    marginTop: 6,
    color: palette.ink,
    textAlign: 'center',
  },
  body: {
    ...typeScale.small,
    lineHeight: 20,
    maxWidth: 280,
    marginTop: 10,
    color: palette.inkSoft,
    textAlign: 'center',
  },
  placePill: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    paddingHorizontal: 14,
    borderRadius: ui.radius.round,
    backgroundColor: palette.greenSoft,
  },
  placeName: {
    ...typeScale.small,
    fontFamily: fonts.bold,
    color: palette.greenDeep,
  },
  actions: {
    width: '100%',
    marginTop: 20,
    gap: 2,
  },
});
