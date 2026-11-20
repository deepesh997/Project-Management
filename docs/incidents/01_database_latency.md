# Incident Drill 01: Database Latency & Connection Pool Saturation

## 1. Trigger & Symptom
- **Alert**: P99 API response times exceed 2,500ms; PostgreSQL active connections reach pool maximum (100% capacity).
- **Impact**: HTTP 504 Gateway Timeouts on task queries; connection queue starvation.

## 2. Root Cause Analysis (RCA)
- Unindexed queries performing sequential table scans on `activity_logs` and `tasks` when filtering by `org_id` and timestamps.
- Long-running uncommitted transactions holding row locks on tasks.

## 3. Remediation & Action Steps
1. Scale PgBouncer pool mode from `session` to `transaction` mode.
2. Apply missing composite index: `CREATE INDEX CONCURRENTLY idx_activity_org_time ON activity_logs(org_id, created_at DESC);`
3. Set statement timeout limit in PostgreSQL: `SET statement_timeout = '3000ms';`
4. Enable query slow-log tracking (`log_min_duration_statement = 500`).

## 4. Verification Evidence
- Post-fix query execution plan shows Index Scan using `idx_activity_org_time` with cost dropping from 1,240 to 4.2.
- P99 latency restored to <45ms.
