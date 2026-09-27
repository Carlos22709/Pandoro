import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { type PaletteTone, palette, toneColors } from '@/theme/palette';

type AnimatedActionButtonProps = {
  label: string;
  tone: Extract<PaletteTone, 'lilac' | 'blue' | 'pink'>;
  onPress: () => void;
  children: ReactNode;
  emphasized?: boolean;
  accessibilityLabel?: string;
};

export function AnimatedActionButton({
  label,
  tone,
  onPress,
  children,
  emphasized = false,
  accessibilityLabel,
}: AnimatedActionButtonProps) {
  const pressed = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));
  const colors = toneColors[tone];

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        onPress={onPress}
        onPressIn={() => {
          pressed.value = withTiming(0.95, { duration: 90 });
        }}
        onPressOut={() => {
          pressed.value = withTiming(1, { duration: 130 });
        }}
        style={styles.pressable}
      >
        <View
          style={[
            styles.iconSurface,
            {
              backgroundColor: colors.main,
              borderColor: colors.soft,
              shadowColor: colors.deep,
            },
            emphasized && styles.emphasized,
          ]}
        >
          <View
            pointerEvents="none"
            style={[styles.surfaceWash, { backgroundColor: colors.soft }]}
          />
          <View
            pointerEvents="none"
            style={[styles.surfaceTint, { backgroundColor: colors.deep }]}
          />
          <View style={styles.iconContent}>{children}</View>
        </View>
        <Text numberOfLines={2} style={styles.label}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, alignItems: 'center' },
  pressable: { width: '100%', alignItems: 'center' },
  iconSurface: {
    width: 84,
    height: 78,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 29,
    borderBottomRightRadius: 35,
    borderBottomLeftRadius: 27,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 5,
    elevation: 2,
  },
  emphasized: {
    width: 92,
    height: 84,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 32,
    borderBottomRightRadius: 39,
    borderBottomLeftRadius: 30,
  },
  surfaceWash: {
    position: 'absolute',
    top: 7,
    left: 9,
    width: 52,
    height: 34,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 19,
    borderBottomRightRadius: 23,
    borderBottomLeftRadius: 16,
    opacity: 0.38,
    transform: [{ rotate: '-5deg' }],
  },
  surfaceTint: {
    position: 'absolute',
    right: 7,
    bottom: 6,
    width: 31,
    height: 24,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 13,
    borderBottomRightRadius: 17,
    borderBottomLeftRadius: 12,
    opacity: 0.08,
    transform: [{ rotate: '7deg' }],
  },
  iconContent: {
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    minHeight: 42,
    marginTop: 8,
    paddingHorizontal: 2,
    color: palette.ink,
    textAlign: 'center',
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
});
