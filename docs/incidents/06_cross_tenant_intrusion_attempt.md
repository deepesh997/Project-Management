# Incident Drill 06: Cross-Tenant Intrusion Attempt & Automated Security Audit

## 1. Attack Vector & Scenario
- An attacker authenticated as a member of organization `org-globex-202` manipulates HTTP headers (`X-Tenant-ID: org-acme-101`) or accesses URLs directly trying to read or modify tasks belonging to `org-acme-101`.

## 2. Server-Side Protection Architecture
1. **Tenant Middleware Enforcement**: `enforceTenantIsolation` middleware extracts the tenant ID and verifies against the authenticated user's JWT organization membership (`req.user.orgId`).
2. **Immediate Block**: If a non-admin user specifies a tenant ID differing from their authenticated membership, the request is blocked immediately with HTTP `403 Forbidden` (`TENANT_ACCESS_FORBIDDEN`).
3. **Automated Security Audit Log**: The intrusion attempt is recorded in the activity log with IP address, user ID, requested endpoint, and target tenant ID (`action: 'CROSS_TENANT_ACCESS_DENIED'`).

## 3. Verification Evidence
- Automated test `backend/tests/tenant_isolation.test.mjs` PASSED.
- Intrusion attempt returned HTTP 403.
- Audit trail recorded `CROSS_TENANT_ACCESS_DENIED`. Zero tenant leakage observed.
