// Pruebas de firestore.rules contra el emulador de Firestore (sin dependencias:
// usa la API REST del emulador con tokens sin firmar, que el emulador acepta).
// Ejecutar con: npm run test:rules  (necesita Java y firebase-tools).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const host = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
const project = process.env.GCLOUD_PROJECT ?? 'demo-pandask';
const base = `http://${host}/v1/projects/${project}/databases/(default)/documents`;

function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function tokenFor(uid: string): string {
  const now = Math.floor(Date.now() / 1000);
  return [
    b64url({ alg: 'none', typ: 'JWT' }),
    b64url({ sub: uid, user_id: uid, iat: now, exp: now + 3600, aud: project, iss: `https://securetoken.google.com/${project}`, firebase: { sign_in_provider: 'password' } }),
    '',
  ].join('.');
}

async function call(method: string, path: string, uid: string | null, body?: object) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (uid) headers.Authorization = `Bearer ${tokenFor(uid)}`;
  const res = await fetch(`${base}/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return res.status;
}

const doc = { fields: { title: { stringValue: 'Tarea de prueba' } } };

beforeEach(async () => {
  await fetch(`http://${host}/emulator/v1/projects/${project}/databases/(default)/documents`, { method: 'DELETE' });
});

test('la dueña lee y escribe sus tareas, planes, progreso y uso', async () => {
  for (const path of ['users/alice/tasks/t1', 'users/alice/plans/p1', 'users/alice/progress/x', 'users/alice/usage/2026-11']) {
    assert.equal(await call('PATCH', path, 'alice', doc), 200, path);
    assert.equal(await call('GET', path, 'alice'), 200, path);
  }
});

test('otra cuenta no puede leer ni escribir datos ajenos', async () => {
  await call('PATCH', 'users/alice/tasks/t1', 'alice', doc);
  assert.equal(await call('GET', 'users/alice/tasks/t1', 'bob'), 403);
  assert.equal(await call('PATCH', 'users/alice/tasks/t1', 'bob', doc), 403);
  assert.equal(await call('DELETE', 'users/alice/tasks/t1', 'bob'), 403);
});

test('sin sesión no se accede a nada', async () => {
  await call('PATCH', 'users/alice/tasks/t1', 'alice', doc);
  assert.equal(await call('GET', 'users/alice/tasks/t1', null), 403);
  assert.equal(await call('PATCH', 'users/alice/tasks/t2', null, doc), 403);
});

test('las colecciones fuera de users/{uid} están denegadas', async () => {
  assert.equal(await call('PATCH', 'public/x', 'alice', doc), 403);
  assert.equal(await call('GET', 'public/x', 'alice'), 403);
  assert.equal(await call('PATCH', 'users/alice', 'bob', doc), 403);
});
