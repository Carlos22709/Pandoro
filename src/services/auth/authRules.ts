// Reglas sin dependencias de Firebase para poder probarlas directamente.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mínimo por defecto de Firebase. Si el proyecto exige más, lo rechaza el servidor
// y llega como auth/password-does-not-meet-requirements.
export const MIN_PASSWORD_LENGTH = 6;

export const NOT_CONFIGURED_MESSAGE = 'El acceso todavía no está configurado en esta app.';
const DEFAULT_MESSAGE = 'No pudimos completar la solicitud. Intenta de nuevo.';

const AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'El correo electrónico no tiene un formato válido.',
  'auth/user-not-found': 'No se encontró una cuenta con esos datos.',
  'auth/wrong-password': 'El correo o la contraseña son incorrectos.',
  'auth/invalid-credential': 'Las credenciales proporcionadas no son válidas.',
  'auth/email-already-in-use': 'Ya existe una cuenta registrada con este correo.',
  'auth/weak-password': 'La contraseña no cumple los requisitos mínimos.',
  'auth/password-does-not-meet-requirements': 'La contraseña no cumple los requisitos mínimos.',
  'auth/too-many-requests': 'Se alcanzó el límite de intentos. Intenta más tarde.',
  'auth/network-request-failed': 'No fue posible conectar con el servicio.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada.',
  'auth/operation-not-allowed': 'El acceso con correo y contraseña no está habilitado.',
  'auth/invalid-api-key': NOT_CONFIGURED_MESSAGE,
  'auth/configuration-not-found': NOT_CONFIGURED_MESSAGE,
};

export function authErrorMessage(failure: unknown) {
  const code = (failure as { code?: unknown } | null)?.code;
  if (typeof code !== 'string') return DEFAULT_MESSAGE;
  if (code.startsWith('auth/api-key')) return NOT_CONFIGURED_MESSAGE;
  return AUTH_MESSAGES[code] ?? DEFAULT_MESSAGE;
}

function validateEmail(email: string) {
  if (!email.trim()) return 'Escribe tu correo electrónico.';
  if (!EMAIL_PATTERN.test(email.trim())) return AUTH_MESSAGES['auth/invalid-email'];
  return null;
}

export function validateResetRequest(email: string) {
  return validateEmail(email);
}

export function validateLogin({ email, password }: { email: string; password: string }) {
  return validateEmail(email) ?? (password ? null : 'Escribe tu contraseña.');
}

export function validateRegistration({ name, email, password, confirmation }: {
  name: string;
  email: string;
  password: string;
  confirmation: string;
}) {
  if (!name.trim()) return 'Escribe tu nombre.';
  const emailProblem = validateEmail(email);
  if (emailProblem) return emailProblem;
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return password === confirmation ? null : 'Las contraseñas no coinciden.';
}
