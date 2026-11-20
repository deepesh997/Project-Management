# Capstone Challenge Technical Resolution Report

## 1. Problem Statement
> **Challenge**: Two users update the same task at nearly the same time. The platform must prevent silent overwrites, preserve a complete activity history, and avoid duplicate notifications when background jobs retry.

## 2. Multi-Tier Solution Architecture

### Tier 1: Database Schema & Atomic Concurrency Control (OCC)
In PostgreSQL, the `tasks` table includes:
```sql
ALTER TABLE tasks ADD COLUMN version INT NOT NULL DEFAULT 1;
```
When an update is submitted, the backend executes an atomic Compare-And-Swap (CAS):
```sql
UPDATE tasks
SET title = $1, status = $2, version = version + 1, updated_at = NOW()
WHERE id = $3 AND version = $expectedVersion AND org_id = $orgId
RETURNING *;
```
- If `affected_rows == 1`: The write succeeds, version is incremented, and the update commits.
- If `affected_rows == 0`: A collision occurred. The server queries the latest state and responds with HTTP `409 Conflict`.

### Tier 2: API Contract & Field-Level Diff Payload
The 409 Conflict response contains complete collision diagnostics:
```json
{
  "error": {
    "code": "CONCURRENCY_CONFLICT",
    "message": "Stale update rejected. Another user has modified this task since you loaded it.",
    "currentVersion": 2,
    "attemptedVersion": 1,
    "diff": {
      "attemptedUpdates": { "status": "DONE" },
      "serverState": { "status": "IN_REVIEW", "version": 2, "updatedAt": "..." }
    }
  }
}
```

### Tier 3: Frontend Interactive Conflict Resolution
In Next.js (`frontend/src/components/tasks/ConflictResolutionModal.tsx`), when a 409 is caught:
1. The form submission is paused without wiping the user's input.
2. A side-by-side comparison displays "Your Changes (v1)" vs "Server Current State (v2)".
3. The user can reload the latest server state or deliberately merge their edits.

### Tier 4: Immutable Audit Trail
Every collision triggers an audit entry in `activity_logs`:
- `action`: `OCC_CONFLICT_DETECTED`
- `payload`: Contains attempted version, live version, and conflicting fields.

### Tier 5: Duplicate Notification Prevention on Retries
To prevent notification storms when background workers retry:
- Notifications are assigned an idempotency key tied to the task's specific version:
  `idempotencyKey = "task_update:" + task.id + ":v" + task.version`
- The `ResilientJobQueue` checks this key before firing notification emails. Repeated dispatches or job retries are immediately deduplicated (`status: 'IGNORED_DUPLICATE'`).

## 3. Automated Verification Results
- **Test File**: `backend/tests/concurrency_occ.test.mjs`
- **Result**: PASSED (100%)
  - User A updated task from v1 to v2.
  - User B's concurrent update with v1 was rejected with HTTP 409 Conflict.
  - Activity log recorded `OCC_CONFLICT_DETECTED`.
  - Zero silent overwrites detected.
