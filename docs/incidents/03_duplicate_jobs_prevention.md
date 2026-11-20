# Incident Drill 03: Duplicate Job Prevention & Idempotency Key Caching

## 1. Trigger & Symptom
- **Trigger**: Network glitch causes worker process restart; RabbitMQ/BullMQ redelivers the same task notification job 5 times.
- **Risk**: Customer receives 5 duplicate emails for the same task update.

## 2. Mitigation Architecture
- Every notification and background job generates a deterministic `idempotencyKey`:
  `task_update:${task.id}:v${task.version}`
- The `ResilientJobQueue` checks the idempotency store before executing handlers:
  If key exists -> Return `IGNORED_DUPLICATE` and bypass execution.

## 3. Verification Evidence
- Automated test `tests/job_queue.test.mjs`:
  - Job with key `idemp-key-100` submitted twice.
  - Test verified handler was executed exactly once (`executionCount === 1`).
  - Second attempt returned `{ status: 'IGNORED_DUPLICATE' }`.
