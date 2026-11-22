import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CELEBRATE_ARMS,
  CELEBRATE_JUMP,
  WALK_ARM_OPEN,
  WALK_ARM_SWING,
  WALK_BODY_SHIFT,
  WALK_LEG_LIFT,
  WALK_LEG_KICK,
  addPoses,
  celebratePose,
  neutralPose,
  walkPose,
  type PandoroPose,
} from '../src/services/progress/pandaPose';

const HOPS = 6;
const SAMPLES = Array.from({ length: 401 }, (_, index) => index / 400);

const values = (pose: PandoroPose) => Object.values(pose);

test('quieto, en el punto de partida o de llegada, Pandoro está en pose neutra', () => {
  assert.deepEqual(walkPose(0, HOPS), neutralPose());
  assert.deepEqual(walkPose(1, HOPS), neutralPose());
  assert.deepEqual(celebratePose(0), neutralPose());
  assert.deepEqual(celebratePose(1), neutralPose());
});

test('al caminar, el brazo contrario a la pata que sube se abre más', () => {
  // Con la pata izquierda arriba, el brazo derecho es el más abierto, y al revés.
  const left = walkPose(1 / (2 * HOPS), HOPS);
  assert.ok(left.legLiftLeft > 0 && left.armRight > left.armLeft);

  const right = walkPose(3 / (2 * HOPS), HOPS);
  assert.ok(right.legLiftRight > 0 && right.armLeft > right.armRight);
});

test('al caminar, los brazos van abiertos a los lados casi todo el tiempo', () => {
  const pose = walkPose(0.5 + 1 / (4 * HOPS), HOPS);
  assert.ok(pose.armLeft > 0 && pose.armRight > 0);
  assert.ok(Math.abs(pose.armLeft + pose.armRight - 2 * WALK_ARM_OPEN) < 1e-9);
});

test('al caminar, solo una pata se levanta a la vez', () => {
  for (const progress of SAMPLES) {
    const pose = walkPose(progress, HOPS);
    assert.ok(pose.legLiftLeft === 0 || pose.legLiftRight === 0);
  }
});

test('al caminar, el cuerpo se carga sobre la pata que pisa', () => {
  // Con la pata izquierda en el aire el cuerpo se va a la derecha, y al revés.
  const left = walkPose(1 / (2 * HOPS), HOPS);
  assert.ok(left.legLiftLeft > 0 && left.shift > 0 && left.lean > 0);

  const right = walkPose(3 / (2 * HOPS), HOPS);
  assert.ok(right.legLiftRight > 0 && right.shift < 0 && right.lean < 0);
});

test('al caminar, ningún movimiento pasa de su tope', () => {
  for (const progress of SAMPLES) {
    const pose = walkPose(progress, HOPS);
    assert.ok(Math.abs(pose.shift) <= WALK_BODY_SHIFT + 1e-9);
    assert.ok(Math.abs(pose.legLeft) <= WALK_LEG_KICK + 1e-9);
    assert.ok(Math.abs(pose.legRight) <= WALK_LEG_KICK + 1e-9);
    assert.ok(pose.armLeft >= 0 && pose.armLeft <= WALK_ARM_OPEN + WALK_ARM_SWING + 1e-9);
    assert.ok(pose.armRight >= 0 && pose.armRight <= WALK_ARM_OPEN + WALK_ARM_SWING + 1e-9);
    assert.ok(pose.legLiftLeft >= 0 && pose.legLiftLeft <= WALK_LEG_LIFT + 1e-9);
    assert.ok(pose.legLiftRight >= 0 && pose.legLiftRight <= WALK_LEG_LIFT + 1e-9);
    values(pose).forEach((value) => assert.ok(Number.isFinite(value)));
  }
});

test('el paso arranca y termina suave: cerca de los extremos casi no hay movimiento', () => {
  const start = walkPose(0.005, HOPS);
  const end = walkPose(0.995, HOPS);

  assert.ok(Math.abs(start.legLeft) < 1);
  assert.ok(Math.abs(end.legLeft) < 1);
  // Los brazos aún no terminan de abrirse al arrancar ni ya se cerraron casi del todo al llegar.
  assert.ok(start.armLeft < WALK_ARM_OPEN * 0.5);
  assert.ok(end.armLeft < WALK_ARM_OPEN * 0.5);
});

test('la celebración salta, abre los brazos y vuelve al suelo', () => {
  const peak = celebratePose(0.5);

  assert.ok(peak.lift < -CELEBRATE_JUMP * 0.9);
  assert.ok(peak.armLeft > CELEBRATE_ARMS * 0.9);
  assert.ok(peak.armRight > CELEBRATE_ARMS * 0.9);
  // Se agacha antes de saltar y se aplasta un poco al aterrizar.
  assert.ok(celebratePose(0.2).squash < -0.05);
  assert.ok(celebratePose(0.9).squash < 0);
  // Nunca se hunde bajo el suelo ni pasa del salto.
  for (const progress of SAMPLES) {
    const pose = celebratePose(progress);
    assert.ok(pose.lift <= 0 && pose.lift >= -CELEBRATE_JUMP - 1e-9);
    values(pose).forEach((value) => assert.ok(Number.isFinite(value)));
  }
});

test('las orejas se mueven en espejo al celebrar', () => {
  for (const progress of SAMPLES) {
    const pose = celebratePose(progress);
    assert.ok(Math.abs(pose.earLeft + pose.earRight) < 1e-9);
  }
});

test('sumar poses suma cada parte y la pose neutra no cambia nada', () => {
  const pose = walkPose(0.3, HOPS);
  assert.deepEqual(addPoses(pose, neutralPose()), pose);

  const celebrate = celebratePose(0.5);
  const both = addPoses(pose, celebrate);
  assert.equal(both.lift, pose.lift + celebrate.lift);
  assert.equal(both.armLeft, pose.armLeft + celebrate.armLeft);
});
