import { db } from '../../db/store.js';

export class ResilientJobQueue {
  constructor() {
    this.jobs = [];
    this.deadLetterQueue = [];
    this.processedIdempotencyKeys = new Set();
    this.handlers = new Map();
    this.isProcessing = false;
  }

  registerHandler(jobType, handlerFn) {
    this.handlers.set(jobType, handlerFn);
  }

  async enqueue({ type, payload, idempotencyKey = null, maxRetries = 3 }) {
    // 1. Idempotency Check
    if (idempotencyKey) {
      if (this.processedIdempotencyKeys.has(idempotencyKey)) {
        return {
          status: 'IGNORED_DUPLICATE',
          message: `Job with idempotency key ${idempotencyKey} already processed. Deduplicated.`,
          idempotencyKey,
        };
      }
    }

    const job = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      payload,
      idempotencyKey,
      attempts: 0,
      maxRetries,
      status: 'PENDING',
      error: null,
      createdAt: new Date().toISOString(),
    };

    this.jobs.push(job);
    await this.triggerProcessing();
    return { status: 'ENQUEUED', jobId: job.id, idempotencyKey };
  }

  async triggerProcessing() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.jobs.length > 0) {
      const job = this.jobs.shift();
      const handler = this.handlers.get(job.type);

      if (!handler) {
        job.status = 'FAILED_NO_HANDLER';
        this.deadLetterQueue.push(job);
        continue;
      }

      job.attempts += 1;
      try {
        await handler(job.payload);
        job.status = 'COMPLETED';

        // Record idempotency on success
        if (job.idempotencyKey) {
          this.processedIdempotencyKeys.add(job.idempotencyKey);
          db.checkAndRecordIdempotency(job.idempotencyKey, job.type, { jobId: job.id, status: 'COMPLETED' });
        }
      } catch (err) {
        job.error = err.message;
        if (job.attempts < job.maxRetries) {
          job.status = 'RETRYING';
          // Exponential backoff simulation: delay before pushing back
          const backoffMs = Math.min(100 * Math.pow(2, job.attempts), 2000);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          this.jobs.push(job);
        } else {
          // Exceeded max retries -> Move to Dead Letter Queue (DLQ)
          job.status = 'DEAD_LETTER';
          this.deadLetterQueue.push(job);
          db.logActivity({
            orgId: job.payload?.orgId || 'system',
            entityType: 'JOB_QUEUE',
            entityId: job.id,
            action: 'MOVED_TO_DLQ',
            performedBy: 'system_worker',
            payload: { error: err.message, attempts: job.attempts, jobType: job.type },
          });
        }
      }
    }

    this.isProcessing = false;
  }

  getMetrics() {
    return {
      pending: this.jobs.length,
      deadLetter: this.deadLetterQueue.length,
      deduplicatedKeysCount: this.processedIdempotencyKeys.size,
    };
  }
}

export const jobQueue = new ResilientJobQueue();

// Register Default Notification Handler
jobQueue.registerHandler('NOTIFICATION_EMAIL', async (payload) => {
  // If simulated failure requested in payload
  if (payload.simulateFailure && !payload._retried) {
    payload._retried = true;
    throw new Error('Temporary SMTP connection timeout');
  }
  return { delivered: true, recipient: payload.recipient };
});
