import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, type TextInput, View } from 'react-native';

import { AuthInput } from '@/components/auth/AuthInput';
import { AuthLayout, AuthLink } from '@/components/auth/AuthLayout';
import { useEnterApp } from '@/components/auth/useEnterApp';

export function LoginScreen() {
  const router = useRouter();
  const enterApp = useEnterApp();
  const passwordRef = useRef<TextInput>(null);

  return (
    <AuthLayout
      tone="blue"
      title={'Qué bueno verte\nde nuevo'}
      subtitle="Ingresa para continuar con Pandoro"
      submitLabel="Iniciar sesión"
      onSubmit={enterApp}
      switchPrompt="¿Aún no tienes una cuenta?"
      switchLabel="Crear cuenta"
      onSwitch={() => router.replace('/register')}
    >
      <AuthInput
        label="Correo electrónico"
        tone="blue"
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
        tone="blue"
        placeholder="Tu contraseña"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={enterApp}
      />

      {/* Prototipo: sin recuperación real, solo respuesta visual al pulsar. */}
      <View style={styles.forgot}>
        <AuthLink label="¿Olvidaste tu contraseña?" tone="blue" onPress={() => {}} />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  forgot: {
    alignItems: 'flex-end',
    marginTop: -6,
    paddingRight: 6,
  },
});
