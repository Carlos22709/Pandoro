import { type Ref, useState } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { type PaletteTone, palette, toneColors } from '@/theme/palette';

type AuthInputProps = Omit<TextInputProps, 'style'> & {
  label: string;
  tone: PaletteTone;
  ref?: Ref<TextInput>;
};

export function AuthInput({ label, tone, ref, onFocus, onBlur, ...inputProps }: AuthInputProps) {
  const [focused, setFocused] = useState(false);
  const colors = toneColors[tone];

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={palette.inkSoft}
        selectionColor={colors.deep}
        cursorColor={colors.deep}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[styles.input, focused && { borderColor: colors.deep, backgroundColor: palette.white }]}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    marginLeft: 6,
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    height: 58,
    paddingHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(81, 64, 93, 0.1)',
    backgroundColor: palette.cream,
    color: palette.ink,
    fontSize: 16,
    fontWeight: '500',
    // En web, el anillo de foco "auto" del navegador ignora el ancho; con estilo sólido
    // y ancho 0 desaparece y el borde del tono hace de indicador de foco.
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
});
