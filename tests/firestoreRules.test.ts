// Revisión estática de firestore.rules. Las pruebas reales contra el
// emulador están en tests/rules/ (npm run test:rules, requiere Java).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8')
  .replace(/\/\/.*$/gm, '');

test('usa rules_version 2', () => {
  assert.match(rules, /rules_version\s*=\s*'2'/);
});

test('solo el dueño accede a users/{uid}/**', () => {
  assert.match(rules, /match \/users\/\{uid\}\/\{document=\*\*\}/);
  assert.match(rules, /request\.auth != null && request\.auth\.uid == uid/);
});

test('todo lo demás está denegado', () => {
  assert.match(rules, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;\s*\}/);
});

test('no hay reglas abiertas', () => {
  assert.doesNotMatch(rules, /if\s+true/);
  assert.doesNotMatch(rules, /allow\s+[a-z, ]+;/);
  const allows = rules.match(/allow [^;]+;/g) ?? [];
  assert.equal(allows.length, 2);
});
