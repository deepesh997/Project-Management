# Incident Drill 05: Stale Task Updates & Capstone Concurrency Collision

## 1. Scenario (Capstone Challenge)
- Two users (e.g. Project Manager and Developer) open the exact same task in their browsers at the same time. Both see Version 1.
- User A edits the title and clicks Save -> API updates task to Version 2.
- 500ms later, User B (who still had the form open with Version 1) submits changes.

## 2. Threat & Business Hazard
- Without concurrency protection, User B's stale write silently overwrites User A's changes, leading to lost work and audit inconsistencies.

## 3. WorkSphere Solution: Optimistic Concurrency Control (OCC)
1. **Version Column**: The `tasks` table includes an integer column `version INT NOT NULL DEFAULT 1`.
2. **Client Contract**: Every update request MUST provide `expectedVersion`.
3. **Atomic CAS**:
   ```sql
   UPDATE tasks
   SET title = $1, status = $2, version = version + 1, updated_at = NOW()
   WHERE id = $3 AND version = $expectedVersion AND org_id = $orgId
   RETURNING *;
   ```
4. **Collision Handling**:
   - If version matches: returns HTTP 200 with new version counter.
   - If version mismatches: rejects with HTTP `409 Conflict`.
   - Returns a structured payload containing current server state and field diff.
   - Frontend displays the `ConflictResolutionModal` so the user can inspect changes side-by-side.
   - Preserves `OCC_CONFLICT_DETECTED` in audit logs.
   - Avoids duplicate notification spam through versioned idempotency keys.

## 4. Verification Evidence
- Automated test `backend/tests/concurrency_occ.test.mjs` PASSED.
- User A update succeeded (v2). User B update rejected with 409 Conflict.
- Silent overwrite was completely prevented.
