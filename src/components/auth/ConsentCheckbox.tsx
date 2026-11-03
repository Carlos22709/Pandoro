import { StyleSheet, Text } from 'react-native';

import { AuthCheckbox } from '@/components/auth/AuthCheckbox';
import { palette } from '@/theme/palette';
import { fonts } from '@/theme/typography';

type ConsentCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  // Se marca el error solo después de intentar continuar sin aceptar.
  showError: boolean;
};

// Un solo texto de autorización para el registro y para ConsentGate (Ley 1581, decisión 1).
// Cuando Andrea publique el aviso definitivo (fila 34), cambia aquí y PRIVACY_NOTICE_VERSION.
export function ConsentCheckbox({ checked, onChange, showError }: ConsentCheckboxProps) {
  return (
    <AuthCheckbox
      checked={checked}
      onChange={onChange}
      accessibilityLabel="Acepto los términos y condiciones y el tratamiento de mis datos"
      error={showError ? 'Necesitas aceptarlos para continuar.' : undefined}
    >
      Acepto los <Text style={styles.emphasis}>términos y condiciones</Text> y el{' '}
      <Text style={styles.emphasis}>tratamiento de mis datos</Text>.
    </AuthCheckbox>
  );
}

const styles = StyleSheet.create({
  emphasis: {
    fontFamily: fonts.semibold,
    color: palette.ink,
  },
});
