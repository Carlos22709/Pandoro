import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppIcon } from '@/components/icons/AppIcon';
import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

// Avance hacia el próximo lugar del mundo (0–1). Al desbloquear uno vuelve a empezar.
export function ProgressWidget({ value }: { value: number }) {
  const percent = Math.round(value * 100);
  const fill = useSharedValue(value);

  useEffect(() => {
    fill.value = withTiming(value, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [fill, value]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Progreso hacia el próximo lugar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={styles.container}
    >
      <AppIcon name="sprout" size={20} color={palette.greenDeep} strokeWidth={2.2} />
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
      <Text style={styles.value}>{percent}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 132,
    height: 42,
    paddingHorizontal: 10,
    borderRadius: ui.radius.control,
    backgroundColor: 'rgba(255, 252, 247, 0.9)',
    borderWidth: 1,
    borderColor: ui.surface.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    height: 5,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: palette.creamStrong,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: palette.green,
  },
  value: {
    ...typeScale.caption,
    fontFamily: fonts.semibold,
    color: palette.inkSoft,
  },
});
