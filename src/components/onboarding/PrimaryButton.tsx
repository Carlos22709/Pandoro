import { Pressable, StyleSheet, Text } from 'react-native';

import { type PaletteTone, palette, toneColors } from '@/theme/palette';

type PrimaryButtonProps = {
  label: string;
  tone: Extract<PaletteTone, 'pink' | 'lilac' | 'blue' | 'yellow'>;
  onPress: () => void;
  // "soft": fondo crema con borde del tono, para la acción secundaria.
  variant?: 'filled' | 'soft';
};

export function PrimaryButton({ label, tone, onPress, variant = 'filled' }: PrimaryButtonProps) {
  const colors = toneColors[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'filled'
          ? { backgroundColor: colors.main }
          : [styles.soft, { borderColor: colors.main }],
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 56,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soft: {
    backgroundColor: palette.white,
    borderWidth: 1.5,
  },
  label: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
});
