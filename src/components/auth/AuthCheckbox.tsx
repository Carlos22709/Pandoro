import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { palette } from '@/theme/palette';
import { typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

type AuthCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  accessibilityLabel: string;
  error?: string;
  children: ReactNode;
};

export function AuthCheckbox({ checked, onChange, accessibilityLabel, error, children }: AuthCheckboxProps) {
  const showError = Boolean(error) && !checked;

  return (
    <View style={styles.field}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={accessibilityLabel}
        aria-checked={checked}
        onPress={() => onChange(!checked)}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={[styles.box, checked && styles.boxChecked, showError && styles.boxError]}>
          {checked && (
            <Svg width={14} height={14} viewBox="0 0 14 14">
              <Polyline
                points="2.5,7.5 5.5,10.5 11.5,3.5"
                fill="none"
                stroke={palette.white}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
        </View>
        <Text style={styles.label}>{children}</Text>
      </Pressable>
      {showError && (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  row: {
    minHeight: ui.size.touch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ui.space.md,
  },
  box: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: ui.surface.borderStrong,
    backgroundColor: ui.surface.base,
  },
  boxChecked: {
    borderColor: palette.lilacDeep,
    backgroundColor: palette.lilacDeep,
  },
  boxError: {
    borderColor: palette.pinkDeep,
  },
  label: {
    ...typeScale.small,
    flex: 1,
    color: palette.inkSoft,
  },
  error: {
    ...typeScale.small,
    paddingLeft: 24 + ui.space.md,
    color: palette.pinkDeep,
  },
  pressed: {
    opacity: 0.7,
  },
});
