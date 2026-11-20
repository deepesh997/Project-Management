import test from 'node:test';
import assert from 'node:assert/strict';
import { ResilientJobQueue } from '../src/modules/queue/jobQueue.js';

test('Job Queue & Deduplication Engine Suite', async (t) => {
  const queue = new ResilientJobQueue();

  let executionCount = 0;
  queue.registerHandler('SEND_INVITATION', async (payload) => {
    executionCount += 1;
    if (payload.shouldFail) {
      throw new Error('Downstream provider 500 error');
    }
    return { ok: true };
  });

  await t.test('Successfully executes job and records idempotency key', async () => {
    const res = await queue.enqueue({
      type: 'SEND_INVITATION',
      payload: { email: 'invitee@acme.com' },
      idempotencyKey: 'idemp-key-100',
    });

    assert.equal(res.status, 'ENQUEUED');
    assert.equal(executionCount, 1);
  });

  await t.test('Deduplicates duplicate job with same idempotency key', async () => {
    const res = await queue.enqueue({
      type: 'SEND_INVITATION',
      payload: { email: 'invitee@acme.com' },
      idempotencyKey: 'idemp-key-100', // DUPLICATE KEY
    });

    assert.equal(res.status, 'IGNORED_DUPLICATE');
    assert.equal(executionCount, 1, 'Job handler should NOT execute a second time');
  });

  await t.test('Retries failing job and moves to Dead Letter Queue (DLQ) after maxRetries', async () => {
    const res = await queue.enqueue({
      type: 'SEND_INVITATION',
      payload: { shouldFail: true },
      idempotencyKey: 'idemp-fail-200',
      maxRetries: 2,
    });

    assert.equal(res.status, 'ENQUEUED');
    const metrics = queue.getMetrics();
    assert.equal(metrics.deadLetter, 1, 'Job must be moved to DLQ after exhausting retries');
  });
});
