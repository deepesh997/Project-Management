import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

test('User Management & Invitations Engine Suite', async (t) => {
  let ownerToken = '';
  let memberToken = '';
  let createdInviteId = '';

  await t.test('Setup: Authenticate Owner and Member', async () => {
    const resOwner = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@acme.com', password: 'Password123!' });
    ownerToken = resOwner.body.accessToken;

    const resMember = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'member@acme.com', password: 'Password123!' });
    memberToken = resMember.body.accessToken;
  });

  await t.test('GET /api/v1/organizations/:id/members - List members', async () => {
    const res = await request(app)
      .get('/api/v1/organizations/org-acme-101/members')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('X-Tenant-ID', 'org-acme-101');

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 4);
    assert.ok(res.body.data.some((m) => m.email === 'owner@acme.com'));
  });

  await t.test('POST /api/v1/organizations/:id/invitations - Owner invites new developer', async () => {
    const res = await request(app)
      .post('/api/v1/organizations/org-acme-101/invitations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('X-Tenant-ID', 'org-acme-101')
      .send({
        email: 'developer.candidate@acme.com',
        role: 'team_member',
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.email, 'developer.candidate@acme.com');
    assert.equal(res.body.data.status, 'PENDING');
    createdInviteId = res.body.data.id;
  });

  await t.test('GET /api/v1/organizations/:id/invitations - List pending invites', async () => {
    const res = await request(app)
      .get('/api/v1/organizations/org-acme-101/invitations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('X-Tenant-ID', 'org-acme-101');

    assert.equal(res.status, 200);
    assert.ok(res.body.data.some((inv) => inv.id === createdInviteId));
  });

  await t.test('PUT /api/v1/organizations/:id/members/:userId - Owner promotes member to PM', async () => {
    const res = await request(app)
      .put('/api/v1/organizations/org-acme-101/members/usr-member-1')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('X-Tenant-ID', 'org-acme-101')
      .send({ role: 'project_manager' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.role, 'project_manager');
  });

  await t.test('Security: Team member cannot change roles (403 Forbidden)', async () => {
    const res = await request(app)
      .put('/api/v1/organizations/org-acme-101/members/usr-pm-1')
      .set('Authorization', `Bearer ${memberToken}`)
      .set('X-Tenant-ID', 'org-acme-101')
      .send({ role: 'org_owner' });

    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'INSUFFICIENT_PERMISSIONS');
  });

  await t.test('DELETE /api/v1/organizations/:id/invitations/:invId - Revoke invitation', async () => {
    const res = await request(app)
      .delete(`/api/v1/organizations/org-acme-101/invitations/${createdInviteId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('X-Tenant-ID', 'org-acme-101');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
