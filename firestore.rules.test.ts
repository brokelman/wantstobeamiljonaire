import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesContent = fs.readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');

test('Firestore rules enforce default deny and verified identity', () => {
  assert.ok(rulesContent.includes('allow read, write: if false;'));
  assert.ok(rulesContent.includes('request.auth.token.email_verified == true'));
});

test('Firestore rules enforce Dirty Dozen protections and 3-step fields on /ideas/{ideaId}', () => {
  assert.ok(rulesContent.includes('isValidId(ideaId)'));
  assert.ok(rulesContent.includes('data.keys().hasAll(['));
  assert.ok(rulesContent.includes('data.keys().hasOnly(['));
  assert.ok(rulesContent.includes("'revenueModel'"));
  assert.ok(rulesContent.includes("'dotRawFeedback'"));
  assert.ok(rulesContent.includes("'aiRealityScore'"));
  assert.ok(rulesContent.includes("'businessCaseSummary'"));
  assert.ok(rulesContent.includes('data.title.size() >= 3 && data.title.size() <= 120'));
  assert.ok(rulesContent.includes('data.revenueModel.size() >= 5 && data.revenueModel.size() <= 1500'));
  assert.ok(rulesContent.includes('incoming().authorUid == existing().authorUid'));
  assert.ok(rulesContent.includes('incoming().createdAt == existing().createdAt'));
  assert.ok(rulesContent.includes('incoming().createdAt == request.time'));
  assert.ok(rulesContent.includes('incoming().updatedAt == request.time'));
});
