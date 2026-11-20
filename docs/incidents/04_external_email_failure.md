# Incident Drill 04: External Email Provider Outage & Dead-Letter Queue (DLQ)

## 1. Trigger & Symptom
- **Trigger**: External SendGrid / SMTP provider returns HTTP 503 Service Unavailable or TCP connection timeout.
- **Risk**: Worker crashes or loops infinitely trying to deliver emails.

## 2. Recovery Architecture
1. **Exponential Backoff**: When email dispatch fails, the job is rescheduled with backoff:
   `backoffMs = min(100 * 2^attempts, 2000)`
2. **Dead-Letter Queue (DLQ)**: Once `attempts >= maxRetries` (default: 3), the job is moved out of active queue into `deadLetterQueue`.
3. **Audit Tracking**: A system activity log (`MOVED_TO_DLQ`) is recorded with the specific error payload.
4. **Manual Replay API**: Operators can inspect the DLQ and trigger redelivery once provider recovers.

## 3. Verification Evidence
- Automated test `tests/job_queue.test.mjs`:
  - Verified job failed twice on simulated error, then cleanly transitioned to `status: 'DEAD_LETTER'`.
  - Queue metric `deadLetter` incremented to 1; system remained stable.
