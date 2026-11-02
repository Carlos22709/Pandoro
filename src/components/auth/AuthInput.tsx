import { type ComponentRef, type Ref, useState } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

export type AuthInputRef = ComponentRef<typeof TextInput>;

type AuthInputProps = Omit<TextInputProps, 'style'> & {
  label: string;
  ref?: Ref<AuthInputRef>;
};

export function AuthInput({ label, ref, onFocus, onBlur, ...inputProps }: AuthInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={palette.inkSoft}
        selectionColor={palette.lilacDeep}
        cursorColor={palette.lilacDeep}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[styles.input, focused && styles.inputFocused]}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    ...typeScale.small,
    fontFamily: fonts.semibold,
    color: palette.ink,
  },
  input: {
    height: ui.size.control,
    paddingHorizontal: ui.space.lg,
    borderRadius: ui.radius.control,
    borderWidth: 1,
    borderColor: ui.surface.border,
    backgroundColor: ui.surface.base,
    color: palette.ink,
    fontFamily: fonts.regular,
    fontSize: typeScale.body.fontSize,
    // En web, el anillo de foco "auto" del navegador ignora el ancho; con estilo sólido
    // y ancho 0 desaparece y el borde del tono hace de indicador de foco.
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  inputFocused: {
    borderColor: palette.lilacDeep,
    backgroundColor: palette.white,
  },
});
