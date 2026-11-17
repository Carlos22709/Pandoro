import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createAccountDeletionService,
  deleteUserDocuments,
  RecentLoginRequiredError,
  USER_SUBCOLLECTIONS,
  DELETE_BATCH_SIZE,
  type AccountDeletionDeps,
} from '../src/services/data/accountDeletion';

type StoredDoc = { collection: string | null; id: string };

function mockDeps(options?: {
  uid?: string;
  email?: string | null;
  collections?: Record<string, string[]>;
  deleteAuthUser?: AccountDeletionDeps['deleteAuthUser'];
  reauthenticate?: AccountDeletionDeps['reauthenticate'];
  currentUser?: AccountDeletionDeps['currentUser'];
}) {
  const uid = options?.uid ?? 'user-1';
  const store = new Map<string, Set<string>>();
  for (const name of USER_SUBCOLLECTIONS) {
    store.set(name, new Set(options?.collections?.[name] ?? []));
  }
  let userDoc = true;
  const calls: string[] = [];
  const deleted: StoredDoc[] = [];

  const deps: AccountDeletionDeps = {
    async listCollection(_, collectionName) {
      calls.push(`list:${collectionName}`);
      return [...(store.get(collectionName) ?? [])];
    },
    async deleteDocs(_, collectionName, ids) {
      calls.push(`delete:${collectionName}:${ids.length}`);
      const bucket = store.get(collectionName) ?? new Set();
      ids.forEach((id) => {
        bucket.delete(id);
        deleted.push({ collection: collectionName, id });
      });
    },
    async deleteUserDoc(target) {
      calls.push(`deleteUserDoc:${target}`);
      userDoc = false;
      deleted.push({ collection: null, id: target });
    },
    async cancelReminders() {
      calls.push('reminders');
    },
    currentUser: options?.currentUser ?? (() => ({ uid, email: options?.email ?? 'ana@correo.com' })),
    reauthenticate: options?.reauthenticate ?? (async () => {
      calls.push('reauth');
    }),
    deleteAuthUser: options?.deleteAuthUser ?? (async () => {
      calls.push('auth');
    }),
    async clearLocalData() {
      calls.push('clear');
    },
    async flushPendingWrites() {
      calls.push('flush');
    },
  };

  return { deps, calls, deleted, store, isUserDocPresent: () => userDoc };
}

test('borra las subcolecciones conocidas y al final el documento del usuario', async () => {
  const { deps, deleted, store, isUserDocPresent } = mockDeps({
    collections: {
      tasks: ['t1', 't2'],
      completions: ['t1'],
      progress: ['world'],
      plans: ['p1'],
      usage: ['2026-11'],
    },
  });

  await deleteUserDocuments('user-1', deps);

  assert.deepEqual(
    deleted.filter((item) => item.collection).map((item) => `${item.collection}/${item.id}`),
    ['tasks/t1', 'tasks/t2', 'completions/t1', 'progress/world', 'plans/p1', 'usage/2026-11'],
  );
  assert.deepEqual(deleted.at(-1), { collection: null, id: 'user-1' });
  for (const name of USER_SUBCOLLECTIONS) assert.equal(store.get(name)?.size, 0);
  assert.equal(isUserDocPresent(), false);
});

test('si no hay documentos en las subcolecciones, igual borra users/{uid}', async () => {
  const { deps, calls } = mockDeps();
  await deleteUserDocuments('user-1', deps);
  assert.deepEqual(calls.filter((item) => item.startsWith('delete:')), []);
  assert.equal(calls.at(-1), 'deleteUserDoc:user-1');
});

test('parte los borrados en lotes de 450', async () => {
  const ids = Array.from({ length: DELETE_BATCH_SIZE + 20 }, (_, index) => `t${index}`);
  const { deps, calls } = mockDeps({ collections: { tasks: ids } });
  await deleteUserDocuments('user-1', deps);
  const taskDeletes = calls.filter((item) => item.startsWith('delete:tasks:'));
  assert.deepEqual(taskDeletes, [`delete:tasks:${DELETE_BATCH_SIZE}`, 'delete:tasks:20']);
});

test('el flujo completo vacía datos, cancela avisos y borra la cuenta, en ese orden', async () => {
  const { deps, calls } = mockDeps({ collections: { tasks: ['t1'] } });
  await createAccountDeletionService(deps).deleteAccount();
  assert.deepEqual(
    calls,
    [
      'flush',
      'list:tasks',
      'delete:tasks:1',
      'list:completions',
      'list:progress',
      'list:plans',
      'list:usage',
      'deleteUserDoc:user-1',
      'reminders',
      'auth',
      'clear',
    ],
  );
});

test('con contraseña, reautentica antes de borrar datos', async () => {
  const { deps, calls } = mockDeps();
  await createAccountDeletionService(deps).deleteAccount('secreto1');
  assert.equal(calls[0], 'reauth');
  assert.equal(calls[1], 'flush');
  assert.ok(calls.includes('auth'));
});

test('si Firebase exige un inicio reciente, los datos ya se borraron y se puede reintentar con la contraseña', async () => {
  let attempts = 0;
  const { deps, calls, store, isUserDocPresent } = mockDeps({
    collections: { tasks: ['t1'] },
    deleteAuthUser: async () => {
      attempts += 1;
      calls.push('auth');
      if (attempts === 1) {
        const error = new Error('recent');
        (error as { code?: string }).code = 'auth/requires-recent-login';
        throw error;
      }
    },
  });
  const service = createAccountDeletionService(deps);

  await assert.rejects(() => service.deleteAccount(), RecentLoginRequiredError);
  assert.equal(store.get('tasks')?.size, 0);
  assert.equal(isUserDocPresent(), false);
  assert.ok(calls.includes('reminders'));
  assert.equal(calls.includes('clear'), false);
  const afterFirst = calls.length;

  await service.deleteAccount('secreto1');
  assert.equal(calls[afterFirst], 'reauth');
  assert.equal(calls[afterFirst + 1], 'flush');
  assert.equal(calls.filter((item) => item === 'auth').length, 2);
  assert.ok(calls.includes('clear'));
});

test('sin sesión activa no toca los datos', async () => {
  const { deps, calls } = mockDeps({ currentUser: () => null });
  await assert.rejects(
    () => createAccountDeletionService(deps).deleteAccount(),
    { message: 'No hay una sesión activa.' },
  );
  assert.deepEqual(calls, []);
});
