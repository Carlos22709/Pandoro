import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  authErrorMessage,
  NOT_CONFIGURED_MESSAGE,
  validateLogin,
  validateRegistration,
  validateResetRequest,
} from '../src/services/auth/authRules';

const valid = { name: 'Ana', email: 'ana@correo.com', password: 'secreto1', confirmation: 'secreto1' };

test('los códigos de Firebase se traducen a los mensajes acordados', () => {
  const expected: Record<string, string> = {
    'auth/invalid-email': 'El correo electrónico no tiene un formato válido.',
    'auth/user-not-found': 'No se encontró una cuenta con esos datos.',
    'auth/wrong-password': 'El correo o la contraseña son incorrectos.',
    'auth/email-already-in-use': 'Ya existe una cuenta registrada con este correo.',
    'auth/weak-password': 'La contraseña no cumple los requisitos mínimos.',
    'auth/too-many-requests': 'Se alcanzó el límite de intentos. Intenta más tarde.',
    'auth/network-request-failed': 'No fue posible conectar con el servicio.',
    'auth/invalid-credential': 'Las credenciales proporcionadas no son válidas.',
    'auth/user-disabled': 'Esta cuenta está deshabilitada.',
  };
  for (const [code, message] of Object.entries(expected)) {
    assert.equal(authErrorMessage({ code }), message);
  }
});

test('un error técnico nunca llega al usuario', () => {
  const technical = 'Firebase: Error (auth/internal-error).';
  const message = authErrorMessage({ code: 'auth/internal-error', message: technical });
  assert.equal(message.includes('Firebase'), false);
  assert.equal(authErrorMessage(new Error(technical)).includes('Firebase'), false);
  assert.equal(authErrorMessage(null).includes('Firebase'), false);
});

test('una clave de API inválida se reporta como falta de configuración', () => {
  assert.equal(authErrorMessage({ code: 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' }), NOT_CONFIGURED_MESSAGE);
});

test('el inicio de sesión exige correo válido y contraseña', () => {
  assert.equal(validateLogin({ email: ' ana@correo.com ', password: 'x' }), null);
  assert.ok(validateLogin({ email: '', password: 'x' }));
  assert.ok(validateLogin({ email: 'ana', password: 'x' }));
  assert.ok(validateLogin({ email: 'ana@correo.com', password: '' }));
});

test('el registro valida nombre, correo, largo y confirmación', () => {
  assert.equal(validateRegistration(valid), null);
  assert.ok(validateRegistration({ ...valid, name: '  ' }));
  assert.ok(validateRegistration({ ...valid, email: 'ana@correo' }));
  assert.ok(validateRegistration({ ...valid, password: '12345', confirmation: '12345' }));
  assert.equal(validateRegistration({ ...valid, confirmation: 'otra' }), 'Las contraseñas no coinciden.');
});

test('recuperar la contraseña exige un correo válido', () => {
  assert.equal(validateResetRequest('ana@correo.com'), null);
  assert.ok(validateResetRequest(''));
});
