import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

type AnimatedActionButtonProps = {
  label: string;
  onPress: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  accessibilityLabel?: string;
};

export function AnimatedActionButton({
  label,
  onPress,
  children,
  variant = 'secondary',
  accessibilityLabel,
}: AnimatedActionButtonProps) {
  const pressed = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));
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
        style={[
          styles.pressable,
          variant === 'primary' ? styles.primary : styles.secondary,
        ]}
      >
        <View style={styles.iconContent}>{children}</View>
        <Text
          numberOfLines={2}
          style={[styles.label, variant === 'primary' && styles.primaryLabel]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  pressable: {
    width: '100%',
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ui.space.sm,
    paddingHorizontal: ui.space.md,
    borderRadius: ui.radius.card,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: palette.lilacDeep,
    borderColor: palette.lilacDeep,
  },
  secondary: {
    backgroundColor: 'rgba(255, 252, 247, 0.94)',
    borderColor: ui.surface.border,
  },
  iconContent: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typeScale.body,
    fontFamily: fonts.bold,
    lineHeight: 20,
    color: palette.ink,
    textAlign: 'left',
  },
  primaryLabel: {
    color: palette.white,
  },
});
