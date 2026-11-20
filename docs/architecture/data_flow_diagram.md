# WorkSphere Data Flow & Concurrency Lifecycle

```mermaid
flowchart TD
    Client["Client Web Browser<br/>(React / Next.js)"]
    API["Express Core API<br/>(/api/v1/tasks/:id)"]
    DB[("PostgreSQL Store")]
    Realtime["SSE Realtime Stream<br/>(Active Clients)"]
    JobQueue["Resilient Job Queue"]
    DLQ["Dead-Letter Queue (DLQ)"]

    Client -->|1. PUT /tasks/:id<br/>{ expectedVersion: 1, title: 'New' }| API
    API -->|2. Check Authentication & Tenant Isolation| API
    API -->|3. Atomic CAS: UPDATE WHERE id=$1 AND version=$expectedVersion| DB

    DB -->|4a. Version Match -> Success (v2)| API
    DB -.->|4b. Version Mismatch -> Conflict| API

    API -->|5a. Return 200 OK with Task v2| Client
    API -.->|5b. Return 409 Conflict with Diff Payload| Client

    API -->|6. Broadcast Event to Org Channel| Realtime
    API -->|7. Enqueue Notification Job<br/>idempotencyKey: task:id:v2| JobQueue

    JobQueue -->|8. Attempt Worker Processing| JobQueue
    JobQueue -.->|9. Exceeded 3 Retries on SMTP Outage| DLQ
```
