# Incident Drill 02: Redis Outage & In-Memory Resilient Fallback

## 1. Trigger & Symptom
- **Alert**: Redis cluster crashes or network partition isolates the cache/broker container.
- **Symptom**: Connection refused on port 6379; real-time event publishing throws connection errors.

## 2. Root Cause Analysis (RCA)
- Redis node killed by OOM killer due to unbounded key retention in volatile cache.

## 3. Resilience Mechanism & Recovery
1. The Express Core API incorporates an automatic resilient fallback: when Redis is unreachable, the system gracefully falls back to internal Node.js in-process EventEmitter and in-memory queue.
2. Background jobs continue processing in memory without dropping client write operations.
3. Once Redis container restarts, the queue flushes unacknowledged jobs back to Redis.

## 4. Verification Evidence
- Simulated Redis termination while running task updates.
- Express API returned HTTP 200 OK without unhandled exception.
- SSE stream continued delivering events locally.
