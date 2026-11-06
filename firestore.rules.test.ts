import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesContent = fs.readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');

test('Firestore rules enforce default deny and verified identity', () => {
  assert.ok(rulesContent.includes('allow read, write: if false;'));
  assert.ok(rulesContent.includes('request.auth.token.email_verified == true'));
});

test('Firestore rules enforce Dirty Dozen protections and revenueModel validation on /ideas/{ideaId}', () => {
  // 1. Path variable hardening
  assert.ok(rulesContent.includes('isValidId(ideaId)'));
  // 2. Strict key allowlist (Shadow Field Guard)
  assert.ok(rulesContent.includes('data.keys().hasAll(['));
  assert.ok(rulesContent.includes('data.keys().hasOnly(['));
  assert.ok(rulesContent.includes("'revenueModel'"));
  // 3. String length boundaries
  assert.ok(rulesContent.includes('data.title.size() >= 3 && data.title.size() <= 120'));
  assert.ok(rulesContent.includes('data.revenueModel.size() >= 5 && data.revenueModel.size() <= 1500'));
  // 4. Immutable authorUid & createdAt on update
  assert.ok(rulesContent.includes('incoming().authorUid == existing().authorUid'));
  assert.ok(rulesContent.includes('incoming().createdAt == existing().createdAt'));
  // 5. Server timestamp integrity
  assert.ok(rulesContent.includes('incoming().createdAt == request.time'));
  assert.ok(rulesContent.includes('incoming().updatedAt == request.time'));
});
