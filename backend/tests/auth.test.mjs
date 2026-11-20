import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

test('Auth API - Full Authentication & Token Lifecycle Suite', async (t) => {
  let accessToken = '';
  let refreshToken = '';

  await t.test('POST /api/v1/auth/login - Success with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@acme.com', password: 'Password123!' });

    assert.equal(res.status, 200);
    assert.ok(res.body.accessToken);
    assert.ok(res.body.refreshToken);
    assert.equal(res.body.user.email, 'owner@acme.com');
    assert.equal(res.body.user.role, 'org_owner');

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  await t.test('POST /api/v1/auth/login - Failure with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@acme.com', password: 'WrongPassword999!' });

    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
  });

  await t.test('GET /api/v1/auth/me - Authenticated profile fetch', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, 'owner@acme.com');
    assert.equal(res.body.user.role, 'org_owner');
  });

  await t.test('POST /api/v1/auth/refresh - Rotate refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    assert.equal(res.status, 200);
    assert.ok(res.body.accessToken);
    assert.ok(res.body.refreshToken);
    assert.notEqual(res.body.refreshToken, refreshToken); // Token rotated!
  });

  await t.test('POST /api/v1/auth/logout - Revokes token JTI', async () => {
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    assert.equal(logoutRes.status, 200);

    // Try using the revoked token now
    const tryRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    assert.equal(tryRes.status, 401);
    assert.equal(tryRes.body.error.code, 'TOKEN_REVOKED');
  });
});
