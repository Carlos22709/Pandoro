import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'soft' | 'text';
  loading?: boolean;
};

export function PrimaryButton({ label, onPress, variant = 'filled', loading = false }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-busy={loading}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'filled' && styles.filled,
        variant === 'soft' && styles.soft,
        variant === 'text' && styles.textButton,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'filled' ? palette.white : palette.lilacDeep} />
      ) : (
        <Text style={[styles.label, variant === 'filled' ? styles.filledLabel : styles.secondaryLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: ui.size.control,
    borderRadius: ui.radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ui.space.lg,
  },
  filled: {
    backgroundColor: palette.lilacDeep,
  },
  soft: {
    backgroundColor: ui.surface.base,
    borderWidth: 1,
    borderColor: ui.surface.borderStrong,
  },
  textButton: {
    minHeight: ui.size.touch,
  },
  label: {
    ...typeScale.body,
    fontFamily: fonts.bold,
    lineHeight: 20,
  },
  filledLabel: {
    color: palette.white,
  },
  secondaryLabel: {
    color: palette.lilacDeep,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
});
