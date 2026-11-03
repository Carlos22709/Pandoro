import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';

import { AuthInput, type AuthInputRef } from '@/components/auth/AuthInput';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAuthSubmit } from '@/components/auth/useAuthSubmit';
import { validateRegistration } from '@/services/auth/authRules';

export function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { submit, submitting, error } = useAuthSubmit();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const emailRef = useRef<AuthInputRef>(null);
  const passwordRef = useRef<AuthInputRef>(null);
  const confirmRef = useRef<AuthInputRef>(null);

  const createAccount = () => submit({
    problem: validateRegistration({ name, email, password, confirmation }),
    action: () => register(name, email, password),
  });

  return (
    <AuthLayout
      tone="pink"
      title="Crea tu cuenta"
      submitLabel="Crear cuenta"
      onSubmit={createAccount}
      submitting={submitting}
      error={error}
      switchPrompt="¿Ya tienes una cuenta?"
      switchLabel="Iniciar sesión"
      onSwitch={() => router.replace('/login')}
    >
      <AuthInput
        label="Nombre"
        value={name}
        onChangeText={setName}
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
        value={confirmation}
        onChangeText={setConfirmation}
        placeholder="Repite tu contraseña"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={createAccount}
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
