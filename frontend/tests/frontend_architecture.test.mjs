import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../src/lib/api.ts';

test('Frontend Architecture & OCC Conflict Handler Suite', async (t) => {
  await t.test('ApiClient sets and retrieves tenant header', () => {
    ApiClient.setAuth('mock-token-xyz', 'org-acme-101');
    const headers = ApiClient.getHeaders();
    assert.equal(headers['X-Tenant-ID'], 'org-acme-101');
    assert.equal(headers['Authorization'], 'Bearer mock-token-xyz');
  });

  await t.test('ApiClient detects 409 Conflict and packages OCCConflictError payload', async () => {
    const res = await ApiClient.updateTaskWithOCC('task-concurrency-target', { title: 'Test' }, 1);
    assert.ok(res.conflict, 'Conflict payload must be present when version collides');
    assert.equal(res.conflict.code, 'CONCURRENCY_CONFLICT');
    assert.ok(res.conflict.diff.serverState, 'Diff must contain server authoritative state');
  });

  await t.test('Default tasks fixture structure validates correctly', async () => {
    const tasks = await ApiClient.getTasks();
    assert.ok(Array.isArray(tasks));
    assert.ok(tasks.length >= 2);
    assert.equal(typeof tasks[0].version, 'number');
    assert.ok(tasks[0].orgId);
  });
});
