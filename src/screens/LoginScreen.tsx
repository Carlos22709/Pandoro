import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthInput, type AuthInputRef } from '@/components/auth/AuthInput';
import { AuthLayout, AuthLink } from '@/components/auth/AuthLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAuthSubmit } from '@/components/auth/useAuthSubmit';
import { validateLogin, validateResetRequest } from '@/services/auth/authRules';

export function LoginScreen() {
  const router = useRouter();
  const { signIn, sendPasswordReset } = useAuth();
  const { submit, submitting, error, notice } = useAuthSubmit();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const passwordRef = useRef<AuthInputRef>(null);

  const login = () => submit({
    problem: validateLogin({ email, password }),
    action: () => signIn(email, password),
  });

  const recover = () => submit({
    problem: validateResetRequest(email),
    action: () => sendPasswordReset(email),
    successNotice: 'Si existe una cuenta con ese correo, te enviamos un enlace para recuperarla.',
  });

  return (
    <AuthLayout
      tone="blue"
      title={'Qué bueno verte\nde nuevo'}
      subtitle="Tus tareas siguen donde las dejaste."
      submitLabel="Iniciar sesión"
      onSubmit={login}
      submitting={submitting}
      error={error}
      notice={notice}
      switchPrompt="¿Aún no tienes una cuenta?"
      switchLabel="Crear cuenta"
      onSwitch={() => router.replace('/register')}
    >
      <AuthInput
        label="Correo electrónico"
        value={email}
        onChangeText={setEmail}
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
        value={password}
        onChangeText={setPassword}
        placeholder="Tu contraseña"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={login}
      />

      <View style={styles.forgot}>
        <AuthLink label="¿Olvidaste tu contraseña?" onPress={recover} />
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
