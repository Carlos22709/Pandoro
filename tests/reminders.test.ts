// expo-notifications se reemplaza por un simulacro con la misma forma (NotificationsAdapter).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createReminderService,
  reminderDate,
  reminderId,
  REMINDER_CONTENT,
  upcomingNotice,
  type NotificationsAdapter,
  type PermissionStatus,
} from '../src/services/reminders/reminderService';

function mockNotifications(permission: PermissionStatus, afterRequest: PermissionStatus = permission) {
  const scheduled = new Map<string, Parameters<NotificationsAdapter['scheduleNotificationAsync']>[0]>();
  const calls = { requests: 0 };
  let status = permission;
  const adapter: NotificationsAdapter = {
    getPermissionsAsync: async () => status,
    requestPermissionsAsync: async () => { calls.requests += 1; status = afterRequest; return status; },
    scheduleNotificationAsync: async (request) => { scheduled.set(request.identifier, request); return request.identifier; },
    cancelScheduledNotificationAsync: async (id) => { scheduled.delete(id); },
    getAllScheduledNotificationsAsync: async () => [...scheduled.keys()].map((identifier) => ({ identifier })),
  };
  return { adapter, scheduled, calls };
}

const NOW = new Date(2026, 10, 2, 10, 0); // 2 nov 2026, 10:00 local
const granted = { granted: true, canAskAgain: true };
const undetermined = { granted: false, canAskAgain: true };
const blocked = { granted: false, canAskAgain: false };

test('el aviso es a las 8:00 del día de la tarea y solo si es futuro', () => {
  assert.deepEqual(reminderDate('2026-11-03', NOW), new Date(2026, 10, 3, 8, 0));
  assert.equal(reminderDate('2026-11-02', NOW), null);
  assert.equal(reminderDate(undefined, NOW), null);
  assert.equal(reminderDate('mañana', NOW), null);
  assert.equal(reminderDate('2026-02-31', NOW), null);
});

test('programa avisos sin contenido sensible', async () => {
  const { adapter, scheduled } = mockNotifications(granted);
  const service = createReminderService(adapter, () => NOW);
  const result = await service.syncReminders([
    { id: 'a', completed: false, dueDate: '2026-11-03' },
    { id: 'b', completed: true, dueDate: '2026-11-04' },
    { id: 'c', completed: false },
    { id: 'd', completed: false, dueDate: '2026-11-01' },
  ], true);
  assert.equal(result, 'scheduled');
  assert.deepEqual([...scheduled.keys()], [reminderId('a')]);
  const request = scheduled.get(reminderId('a'))!;
  assert.deepEqual(request.content, { ...REMINDER_CONTENT, data: { taskId: 'a' } });
  assert.equal(request.trigger.type, 'date');
  assert.deepEqual(request.trigger.date, new Date(2026, 10, 3, 8, 0));
});

test('el texto del aviso nunca incluye el título de la tarea', async () => {
  const { adapter, scheduled } = mockNotifications(granted);
  const service = createReminderService(adapter, () => NOW);
  await service.scheduleTaskReminder({ id: 'x', completed: false, dueDate: '2026-11-05' });
  const { content } = scheduled.get(reminderId('x'))!;
  assert.doesNotMatch(JSON.stringify(content), /Cita médica|Parcial/);
  assert.equal(content.body, REMINDER_CONTENT.body);
});

test('pide permiso la primera vez y solo si hay algo que recordar', async () => {
  const empty = mockNotifications(undetermined, granted);
  await createReminderService(empty.adapter, () => NOW).syncReminders([{ id: 'a', completed: false }], true);
  assert.equal(empty.calls.requests, 0);

  const first = mockNotifications(undetermined, granted);
  const result = await createReminderService(first.adapter, () => NOW)
    .syncReminders([{ id: 'a', completed: false, dueDate: '2026-11-03' }], true);
  assert.equal(first.calls.requests, 1);
  assert.equal(result, 'scheduled');
});

test('si el permiso está negado no programa ni vuelve a preguntar', async () => {
  const { adapter, scheduled, calls } = mockNotifications(blocked);
  const result = await createReminderService(adapter, () => NOW)
    .syncReminders([{ id: 'a', completed: false, dueDate: '2026-11-03' }], true);
  assert.equal(result, 'denied');
  assert.equal(calls.requests, 0);
  assert.equal(scheduled.size, 0);
});

test('reprogramar reemplaza el aviso y completar o desactivar lo cancela', async () => {
  const { adapter, scheduled } = mockNotifications(granted);
  const service = createReminderService(adapter, () => NOW);
  await service.syncReminders([{ id: 'a', completed: false, dueDate: '2026-11-03' }], true);
  await service.syncReminders([{ id: 'a', completed: false, dueDate: '2026-11-06' }], true);
  assert.equal(scheduled.size, 1);
  assert.deepEqual(scheduled.get(reminderId('a'))!.trigger.date, new Date(2026, 10, 6, 8, 0));

  await service.syncReminders([{ id: 'a', completed: true, dueDate: '2026-11-06' }], true);
  assert.equal(scheduled.size, 0);

  await service.syncReminders([{ id: 'a', completed: false, dueDate: '2026-11-06' }], true);
  assert.equal(await service.syncReminders([{ id: 'a', completed: false, dueDate: '2026-11-06' }], false), 'disabled');
  assert.equal(scheduled.size, 0);
});

test('no toca notificaciones ajenas a Pandask', async () => {
  const { adapter, scheduled } = mockNotifications(granted);
  scheduled.set('otra-app', { identifier: 'otra-app', content: { title: '', body: '', data: {} }, trigger: { type: 'date', date: NOW } });
  await createReminderService(adapter, () => NOW).syncReminders([], false);
  assert.ok(scheduled.has('otra-app'));
});

test('en la web no hay adaptador y se avisa al abrir la app', async () => {
  assert.equal(await createReminderService(null).syncReminders([], true), 'unsupported');
  const tasks = [
    { id: 'a', completed: false, dueDate: '2026-11-02' },
    { id: 'b', completed: false, dueDate: '2026-11-02' },
    { id: 'c', completed: true, dueDate: '2026-11-02' },
  ];
  assert.equal(upcomingNotice(tasks, NOW), 'Tienes 2 tareas para hoy.');
  assert.equal(upcomingNotice([{ id: 'd', completed: false, dueDate: '2026-11-03' }], NOW), 'Mañana tienes 1 tarea.');
  assert.equal(upcomingNotice([{ id: 'e', completed: false }], NOW), null);
});
