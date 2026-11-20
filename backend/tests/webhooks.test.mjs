import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import request from 'supertest';
import { app } from '../src/app.js';
import { config } from '../src/config/env.js';

test('Third-Party Webhooks & HMAC Signature Security Suite', async (t) => {
  const secret = config.webhook.secret;

  await t.test('Verifies valid HMAC-SHA256 signed incoming webhook', async () => {
    const payload = { eventId: 'evt-101', type: 'PAYMENT_SUCCEEDED', amount: 9900 };
    const rawPayload = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${rawPayload}`)
      .digest('hex');

    const res = await request(app)
      .post('/api/v1/integrations/webhooks/incoming')
      .set('x-worksphere-signature', signature)
      .set('x-worksphere-timestamp', timestamp)
      .send(payload);

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'VERIFIED_AND_PROCESSED');
  });

  await t.test('Rejects webhook with forged/tampered signature', async () => {
    const payload = { eventId: 'evt-102', type: 'PAYMENT_SUCCEEDED', amount: 9900 };
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const forgedSignature = crypto.randomBytes(32).toString('hex');

    const res = await request(app)
      .post('/api/v1/integrations/webhooks/incoming')
      .set('x-worksphere-signature', forgedSignature)
      .set('x-worksphere-timestamp', timestamp)
      .send(payload);

    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'INVALID_SIGNATURE');
  });

  await t.test('Replay attack protection: Rejects webhook with expired timestamp (> 300s old)', async () => {
    const payload = { eventId: 'evt-103', type: 'PAYMENT_SUCCEEDED', amount: 9900 };
    const rawPayload = JSON.stringify(payload);
    const expiredTimestamp = (Math.floor(Date.now() / 1000) - 600).toString(); // 10 minutes ago!

    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${expiredTimestamp}.${rawPayload}`)
      .digest('hex');

    const res = await request(app)
      .post('/api/v1/integrations/webhooks/incoming')
      .set('x-worksphere-signature', signature)
      .set('x-worksphere-timestamp', expiredTimestamp)
      .send(payload);

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'TIMESTAMP_EXPIRED');
  });

  await t.test('Deduplicates duplicate webhook event delivery', async () => {
    const payload = { eventId: 'evt-idempotent-200', type: 'INVOICE_PAID', amount: 5000 };
    const rawPayload = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${rawPayload}`)
      .digest('hex');

    // 1st delivery
    const res1 = await request(app)
      .post('/api/v1/integrations/webhooks/incoming')
      .set('x-worksphere-signature', signature)
      .set('x-worksphere-timestamp', timestamp)
      .set('idempotency-key', 'idemp-wh-unique-200')
      .send(payload);

    assert.equal(res1.status, 200);
    assert.equal(res1.body.status, 'VERIFIED_AND_PROCESSED');

    // 2nd delivery with same idempotency key (duplicate webhook)
    const res2 = await request(app)
      .post('/api/v1/integrations/webhooks/incoming')
      .set('x-worksphere-signature', signature)
      .set('x-worksphere-timestamp', timestamp)
      .set('idempotency-key', 'idemp-wh-unique-200')
      .send(payload);

    assert.equal(res2.status, 200);
    assert.equal(res2.body.status, 'DUPLICATE_IGNORED');
  });
});
