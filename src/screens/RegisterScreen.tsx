import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, type TextInput } from 'react-native';

import { AuthCheckbox } from '@/components/auth/AuthCheckbox';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useEnterApp } from '@/components/auth/useEnterApp';
import { palette } from '@/theme/palette';
import { fonts } from '@/theme/typography';

export function RegisterScreen() {
  const router = useRouter();
  const enterApp = useEnterApp();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);

  // Sin aceptar términos y tratamiento de datos no se crea la cuenta.
  const submit = () => {
    if (!acceptedTerms) {
      setTriedSubmit(true);
      return;
    }
    enterApp();
  };

  return (
    <AuthLayout
      tone="pink"
      title="Crea tu cuenta"
      submitLabel="Crear cuenta"
      onSubmit={submit}
      switchPrompt="¿Ya tienes una cuenta?"
      switchLabel="Iniciar sesión"
      onSwitch={() => router.replace('/login')}
    >
      <AuthInput
        label="Nombre"
        placeholder="¿Cómo te llamas?"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <AuthInput
        ref={emailRef}
        label="Correo electrónico"
        placeholder="tu@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <AuthInput
        ref={passwordRef}
        label="Contraseña"
        placeholder="Crea una contraseña"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <AuthInput
        ref={confirmRef}
        label="Confirmar contraseña"
        placeholder="Repite tu contraseña"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <AuthCheckbox
        checked={acceptedTerms}
        onChange={setAcceptedTerms}
        accessibilityLabel="Acepto los términos y condiciones y el tratamiento de mis datos"
        error={triedSubmit ? 'Necesitas aceptarlos para crear tu cuenta.' : undefined}
      >
        Acepto los <Text style={styles.emphasis}>términos y condiciones</Text> y el{' '}
        <Text style={styles.emphasis}>tratamiento de mis datos</Text>.
      </AuthCheckbox>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  emphasis: {
    fontFamily: fonts.semibold,
    color: palette.ink,
  },
});
