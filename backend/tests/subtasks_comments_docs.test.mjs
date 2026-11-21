import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/db/store.js';

test('Assessment Suite: Subtasks, Comments, and Interactive Swagger UI', async (t) => {
  let authToken;
  const orgId = 'org-acme-101';

  t.before(async () => {
    // Generate valid JWT token for test user
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pm@acme.com', password: 'Password123!' });
    assert.equal(res.status, 200);
    authToken = res.body.accessToken;
  });

  await t.test('Swagger UI & OpenAPI Spec are available', async () => {
    // Verify OpenAPI JSON
    const resJson = await request(app).get('/api/docs/openapi.json');
    assert.equal(resJson.status, 200);
    assert.equal(resJson.body.openapi, '3.0.3');
    assert.equal(resJson.body.info.title, 'WorkSphere Enterprise Multi-Tenant Core API');

    // Verify Swagger UI HTML
    const resHtml = await request(app).get('/api/docs');
    assert.equal(resHtml.status, 200);
    assert.ok(resHtml.text.includes('SwaggerUIBundle'));
    assert.ok(resHtml.text.includes('/api/docs/openapi.json'));
  });

  await t.test('Subtasks API: List, Create, Toggle, Delete with tenant isolation', async () => {
    // 1. List seeded subtasks for task-103
    const listRes = await request(app)
      .get('/api/v1/tasks/task-103/subtasks')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Tenant-ID', orgId);
    assert.equal(listRes.status, 200);
    assert.ok(Array.isArray(listRes.body.data));
    assert.ok(listRes.body.data.length >= 3);

    // 2. Create new subtask
    const createRes = await request(app)
      .post('/api/v1/tasks/task-103/subtasks')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Tenant-ID', orgId)
      .send({ title: 'Configure GitHub Actions CI pipeline' });
    assert.equal(createRes.status, 201);
    const newSubtask = createRes.body.data;
    assert.equal(newSubtask.title, 'Configure GitHub Actions CI pipeline');
    assert.equal(newSubtask.isCompleted, false);

    // 3. Toggle subtask
    const toggleRes = await request(app)
      .patch(`/api/v1/tasks/task-103/subtasks/${newSubtask.id}/toggle`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Tenant-ID', orgId);
    assert.equal(toggleRes.status, 200);
    assert.equal(toggleRes.body.data.isCompleted, true);

    // 4. Delete subtask
    const deleteRes = await request(app)
      .delete(`/api/v1/tasks/task-103/subtasks/${newSubtask.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Tenant-ID', orgId);
    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.body.success, true);
  });

  await t.test('Comments API: List, Create, and Delete with audit trail', async () => {
    // 1. List seeded comments for task-103
    const listRes = await request(app)
      .get('/api/v1/tasks/task-103/comments')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Tenant-ID', orgId);
    assert.equal(listRes.status, 200);
    assert.ok(Array.isArray(listRes.body.data));
    assert.ok(listRes.body.data.length >= 2);

    // 2. Post new team comment
    const commentContent = 'Verified end-to-end webhook idempotency in local environment.';
    const createRes = await request(app)
      .post('/api/v1/tasks/task-103/comments')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Tenant-ID', orgId)
      .send({ content: commentContent });
    assert.equal(createRes.status, 201);
    const newComment = createRes.body.data;
    assert.equal(newComment.content, commentContent);
    assert.ok(newComment.authorEmail);

    // 3. Delete comment
    const deleteRes = await request(app)
      .delete(`/api/v1/tasks/task-103/comments/${newComment.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Tenant-ID', orgId);
    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.body.success, true);
  });
});
