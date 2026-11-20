import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

test('Security & Multi-Tenant Isolation Suite', async (t) => {
  let acmeUserToken = '';
  let globexUserToken = '';

  await t.test('Setup auth tokens for Acme and Globex users', async () => {
    const acmeRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'member@acme.com', password: 'Password123!' });
    acmeUserToken = acmeRes.body.accessToken;

    const globexRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'hacker@globex.com', password: 'Password123!' });
    globexUserToken = globexRes.body.accessToken;
  });

  await t.test('Acme user can access Acme tasks', async () => {
    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${acmeUserToken}`)
      .set('X-Tenant-ID', 'org-acme-101');

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.meta.orgId, 'org-acme-101');
  });

  await t.test('Cross-Tenant Intrusion: Globex user attempted access to Acme tenant is FORBIDDEN', async () => {
    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${globexUserToken}`)
      .set('X-Tenant-ID', 'org-acme-101'); // Malicious cross-tenant attempt

    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'TENANT_ACCESS_FORBIDDEN');
  });

  await t.test('Cross-Tenant Direct Resource Access: Globex user cannot fetch task belonging to Acme', async () => {
    const res = await request(app)
      .get('/api/v1/tasks/task-concurrency-target')
      .set('Authorization', `Bearer ${globexUserToken}`)
      .set('X-Tenant-ID', 'org-globex-202');

    assert.equal(res.status, 404);
  });
});
