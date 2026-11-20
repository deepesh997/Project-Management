# WorkSphere Production Deployment & Hardening Guide

## 1. Production Architecture Overview
In production, WorkSphere runs across multiple isolated tiers behind an Nginx reverse proxy with TLS 1.3 encryption:
- **Edge / Reverse Proxy**: Nginx with SSL termination, HTTP/2, DDoS rate limiting (30 req/s), and strict security headers.
- **Frontend Tier**: Next.js App Router deployed with standalone Node output behind the proxy.
- **Core Business API**: Node.js Express REST API running with non-root user containers on internal Docker/Kubernetes bridge network.
- **Analytics Microservice**: Python 3.12 FastAPI microservice handling heavy streaming data transformations.
- **Data Tier**: PostgreSQL 16 with connection pooling (PgBouncer) and read replicas.
- **Cache / Message Queue**: Redis 7 cluster for pub/sub real-time SSE dispatch and BullMQ background job processing.

## 2. Hardening & Security Controls
1. **Network Isolation**: PostgreSQL and Redis are NOT exposed to the public internet; they bind strictly to internal container networks (`worksphere-net`).
2. **Non-Root Execution**: All application Dockerfiles run as unprivileged users (`appuser` UID 1000, `nextjs` UID 1001).
3. **Secret Zero Management**: Production secrets are injected at runtime via Kubernetes Secrets or AWS Secrets Manager. No passwords or private keys exist in version control.
4. **Tenant Enforced at Database and API**: All queries require an explicit `org_id` filter. Cross-tenant access triggers an immediate security alert and HTTP 403 Forbidden.

## 3. Monitoring & Health Endpoints
- Express API Liveness: `GET /healthz`
- Express API Readiness: `GET /readyz`
- FastAPI Analytics Liveness: `GET /healthz`
- FastAPI Analytics Readiness: `GET /readyz`
- Reverse Proxy: `GET /nginx-health`
