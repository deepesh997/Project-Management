import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/db/store.js';

test('Capstone Challenge: Optimistic Concurrency Control (OCC) & Race Conditions', async (t) => {
  let userAToken = '';
  let userBToken = '';

  await t.test('Setup: Login User A (PM) and User B (Dev)', async () => {
    const resA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pm@acme.com', password: 'Password123!' });
    userAToken = resA.body.accessToken;

    const resB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'member@acme.com', password: 'Password123!' });
    userBToken = resB.body.accessToken;
  });

  await t.test('Both users read the task at Version 1', async () => {
    const res = await request(app)
      .get('/api/v1/tasks/task-concurrency-target')
      .set('Authorization', `Bearer ${userAToken}`)
      .set('X-Tenant-ID', 'org-acme-101');

    assert.equal(res.status, 200);
    assert.equal(res.body.data.version, 1);
  });

  await t.test('Concurrent Race: User A submits first and successfully updates to Version 2', async () => {
    const res = await request(app)
      .put('/api/v1/tasks/task-concurrency-target')
      .set('Authorization', `Bearer ${userAToken}`)
      .set('X-Tenant-ID', 'org-acme-101')
      .send({
        title: 'Database Sharding (Updated by User A)',
        status: 'IN_REVIEW',
        expectedVersion: 1, // User A saw v1
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.version, 2);
    assert.equal(res.body.data.title, 'Database Sharding (Updated by User A)');
  });

  await t.test('Concurrent Race: User B submits with stale expectedVersion 1 -> Rejected with 409 Conflict', async () => {
    const res = await request(app)
      .put('/api/v1/tasks/task-concurrency-target')
      .set('Authorization', `Bearer ${userBToken}`)
      .set('X-Tenant-ID', 'org-acme-101')
      .send({
        title: 'Database Sharding (Conflicting User B Update)',
        status: 'DONE',
        expectedVersion: 1, // Stale! Current version is now 2
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'CONCURRENCY_CONFLICT');
    assert.equal(res.body.error.currentVersion, 2);
    assert.equal(res.body.error.attemptedVersion, 1);
    assert.ok(res.body.error.diff, 'Should provide field-level diff');
    assert.equal(res.body.error.diff.serverState.title, 'Database Sharding (Updated by User A)');

    // Verify silent overwrite was PREVENTED:
    const currentTask = db.getTaskById('task-concurrency-target', 'org-acme-101');
    assert.equal(currentTask.title, 'Database Sharding (Updated by User A)');
    assert.equal(currentTask.version, 2);
  });

  await t.test('Activity audit logs preserved conflict event', async () => {
    const logs = db.getActivityLogs('org-acme-101');
    const conflictLog = logs.find((l) => l.action === 'OCC_CONFLICT_DETECTED');
    assert.ok(conflictLog, 'OCC_CONFLICT_DETECTED must be preserved in audit trail');
    assert.equal(conflictLog.payload.attemptedVersion, 1);
    assert.equal(conflictLog.payload.currentVersion, 2);
  });
});
