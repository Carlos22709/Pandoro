import { useRouter } from 'expo-router';
import { useRef } from 'react';
import type { TextInput } from 'react-native';

import { AuthInput } from '@/components/auth/AuthInput';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useEnterApp } from '@/components/auth/useEnterApp';

export function RegisterScreen() {
  const router = useRouter();
  const enterApp = useEnterApp();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  return (
    <AuthLayout
      tone="pink"
      title="Crea tu cuenta"
      subtitle="Nombre, correo y contraseña. Nada más."
      submitLabel="Crear cuenta"
      onSubmit={enterApp}
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
        onSubmitEditing={enterApp}
      />
    </AuthLayout>
  );
}
