# Product Requirements Document (PRD)
## WorkSphere: Multi-Tenant Project Management & Workflow Automation Platform

**Document Version:** 1.0.0  
**Status:** In Progress / Feature Enhancement  
**Reference Document:** `01_WorkSphere_Project_Assessment 1.docx` (Learner Project Scope & Assessment Handbook v1.0)  
**Target Standard:** 1,500 / 1,500 points (15 Hands-on Assessments × 100 points)  

---

## 1. Executive Summary & Product Vision

**WorkSphere** is an enterprise-grade multi-tenant SaaS project management and workflow automation platform. It enables multiple distinct organizations to plan roadmaps, assign work, collaborate in real-time, automate business workflows, track delivery milestones, and analyze team productivity.

### Core Tenet: Strict Multi-Tenant Boundary Isolation
Every organization operates in an isolated data plane:
- An organization sees **only** its own members, projects, tasks, comments, files, audit trails, and analytics.
- Cross-tenant resource access is strictly blocked at the database and middleware layers (`403 Forbidden` / `404 Not Found`).

### High-Craft User Experience: Apple Human Interface Guidelines (HIG)
The user interface follows Apple HIG principles:
- Clean typographic hierarchy (SF Pro system font stack).
- Balanced system grays (`#F5F5F7`, `#FFFFFF`, `#1C1C1E`).
- macOS-style squircle cards, glassmorphic header bars (`backdrop-blur-xl`), and segmented controls.
- Full responsive support with collapsible icon-rail sidebar and full-screen detail views.

---

## 2. User Roles & Permissions Matrix (RBAC)

The platform supports 5 role tiers with strict server-side enforcement:

| Role | Scope | Key Permissions |
| :--- | :--- | :--- |
| **Platform Administrator** (`platform_admin`) | Global / System | Oversees all tenants, manages platform configurations, accesses global system audit logs. |
| **Organization Owner** (`org_owner`) | Tenant Scope | Full administrative authority over organization, billing, member invites, role changes, project archiving, tenant settings. |
| **Project Manager** (`project_manager`) | Tenant Scope | Creates/edits projects, manages milestones, creates tasks, assigns work, resolves conflicts, triggers analytics. |
| **Team Member** (`team_member`) | Tenant Scope | Reads assigned projects/tasks, updates task status, logs work submissions, adds comments, drags Kanban cards. Cannot alter org roles. |
| **Compliance Auditor** (`auditor`) | Tenant Scope | Read-only access to all projects, tasks, and the complete immutable audit trail. Cannot mutate data. |

---

## 3. System Architecture & Tech Stack

```
                              ┌────────────────────────────────────────┐
                              │      Next.js 14 App Router UI          │
                              │ (React, TypeScript, Tailwind, Apple HIG│
                              │           Hosted on Vercel             │
                              └───────────────────┬────────────────────┘
                                                  │ HTTPS / SSE
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │      Node.js / Express Core API        │
                              │  (Modular REST, JWT, OCC, Job Queue)   │
                              │           Hosted on Render             │
                              └───────┬──────────────┬───────────────┬─┘
                                      │              │               │
                 Internal Service API │              │ Pooler (5432) │ Webhooks / SSE
                                      ▼              ▼               ▼
┌──────────────────────────────────────┐  ┌────────────────────┐  ┌───────────────────────┐
│     FastAPI Analytics Service        │  │   Supabase Postgres│  │ External Integrations │
│ (Python 3.12, Streaming O(1) Memory, │  │   16 Cluster       │  │ (HMAC Webhooks,       │
│  Productivity Metrics, Benchmarks)   │  │ (13 Tables, RLS)   │  │  Resilient Retries)   │
└──────────────────────────────────────┘  └────────────────────┘  └───────────────────────┘
```

---

## 4. Core Functional Modules & Scope

### 4.1 Organizations & Multi-Tenancy
- Organization profile (name, slug, subscription tier: `STARTER`, `PRO`, `ENTERPRISE`).
- Membership registry with role delegation.
- Invitation lifecycle (generate invite token, pending list, accept, revoke).
- Tenant scoping enforced on all database queries (`orgId` filtering).

### 4.2 Authentication & Security
- Email + password authentication with bcrypt hashing (work factor 10).
- Dual JWT token strategy:
  - Short-lived Access Token (15-minute expiry).
  - Long-lived Refresh Token (7-day expiry) with cryptographic rotation.
- Token revocation registry (JTI blacklist) on logout.
- Direct Token Validator & OAuth2 token endpoints for third-party client integrations.

### 4.3 Projects & Milestones
- Project roadmaps with target start and completion dates.
- Interactive milestone checklists with dynamic progress calculation (`%` completed).
- Status workflow (`ACTIVE`, `PLANNING`, `PAUSED`, `COMPLETED`).
- Project deletion with cascading clean-up of associated tasks and activity records.

### 4.4 Tasks & Interactive Kanban Board
- Kanban columns: `TODO` (To Do), `IN_PROGRESS` (In Progress), `DONE` (Completed).
- Full HTML5 drag-and-drop between columns.
- Apple HIG List View toggle with sorting by status, priority, and estimated hours.
- Quick task creation scoped to specific projects.

### 4.5 Optimistic Concurrency Control (OCC) — Domain Capstone Challenge
- Atomic version counter on every task record (`version: number`).
- Every update mutation sends `expectedVersion: number`.
- If `expectedVersion !== server.version`, rejects update with **HTTP 409 Conflict**.
- Returns comprehensive conflict diff payload:
  - `attemptedUpdates` (what client tried to submit)
  - `serverState` (authoritative current server record)
  - `currentVersion`
- Client UI displays visual `ConflictResolutionModal` allowing user to review differences and reload without silent overwrites.

### 4.6 Full-Screen Task Detail & Work Submission Engine
- Full-screen workspace view (`/tasks/[id]`).
- Editable task attributes: Title, Status, Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), Estimated Hours, Actual Hours.
- Work Log Submission Form:
  - Users submit deliverable notes and pull request links.
  - Automatically logs hours spent and transitions task workflow status.
- Immutable Submission & Activity Timeline:
  - Displays every event: `CREATED`, `UPDATED`, `WORK_SUBMITTED`, `OCC_CONFLICT_DETECTED`, `DELETED`.
  - Author attribution, formatted timestamps, and visual diff badges.

### 4.7 Comments & Subtasks
- Subtask checklists within tasks for granular progress tracking.
- Team discussion comments with timestamps and author profiles.

### 4.8 Background Job Queue & Dead-Letter Queue (DLQ)
- Asynchronous task processing for notifications and email triggers.
- Idempotency key tracking (`idempotencyKey`) preventing duplicate executions.
- Automatic exponential retry policy (3 attempts).
- Dead-Letter Queue (DLQ) routing for unrecoverable failures with manual inspection.

### 4.9 Third-Party Webhook Ingestion & HMAC Verification
- Webhook endpoint (`POST /api/v1/integrations/webhooks`).
- Cryptographic SHA256 HMAC signature verification (`X-WorkSphere-Signature`).
- Replay attack window validation (rejects timestamps older than 300 seconds).
- Deduplication cache rejecting identical webhook payloads.

### 4.10 Python / FastAPI Streaming Analytics
- Independent Python package (`worksphere_analytics`).
- Constant $O(1)$ memory streaming processor for large CSV/JSON activity records.
- Metrics calculation: Team health score, average cycle time, overdue tasks, workload distribution by assignee.
- FastAPI REST service exposing endpoints on port 8000.

---

## 5. Assessment Compliance Matrix & Gap Analysis

The 15 mandatory assessments defined in `01_WorkSphere_Project_Assessment 1.docx`:

| # | Assessment Name | Core Objective | Current Status | Implemented Components | Missing / Action Items |
| :---: | :--- | :--- | :---: | :--- | :--- |
| **01** | **Frontend Architecture** | Responsive Next.js App Router, role layouts, Apple HIG design | ✅ **100% COMPLETE** | Next.js 14 App Router, collapsible sidebar (`sidebar-context`), topbar, role badges, full-screen detail page. | None. |
| **02** | **Node.js/Express Core API** | Versioned REST APIs for all core entities | 🟡 **85% COMPLETE** | `/api/v1/auth`, `/api/v1/organizations`, `/api/v1/projects`, `/api/v1/tasks`, `/api/v1/audit`. | Add `/api/v1/tasks/:id/comments` and `/api/v1/tasks/:id/subtasks` routes. |
| **03** | **PostgreSQL Data Model** | 13 normalized tables, constraints, indexes, migrations | ✅ **100% COMPLETE** | Live Supabase PostgreSQL 16 cluster, `migrate.js`, `seed_db.js`, OCC version columns. | None. |
| **04** | **Authentication & RBAC** | JWT access/refresh, role authorization, tenant isolation | ✅ **100% COMPLETE** | JWT login, register, token validation, refresh, logout revocation, `authorizeRoles`, `enforceTenantIsolation`. | None. |
| **05** | **Advanced Python Processing** | Reusable Python package, streaming $O(1)$ memory metrics | ✅ **100% COMPLETE** | `worksphere_analytics`, `processor.py`, `metrics.py`, `benchmark.py`, 10/10 pytest passing. | None. |
| **06** | **FastAPI Analytics Service** | Standalone FastAPI service with health & metrics APIs | ✅ **100% COMPLETE** | FastAPI on port 8000, `/metrics/summary`, `/metrics/cycle-time`, `/metrics/health-score`, `/stream/activity`. | None. |
| **07** | **Real-Time Updates & Queues** | SSE streaming, retry-safe background queue with DLQ | ✅ **100% COMPLETE** | `/api/v1/realtime/stream` (SSE), `JobQueue` with idempotency, 3 retries, and DLQ routing. | None. |
| **08** | **Third-Party Integrations** | HMAC webhook signature verification, replay protection | ✅ **100% COMPLETE** | `verifyWebhookSignature`, 300s timestamp window check, idempotency event deduplication. | None. |
| **09** | **Docker & Environments** | Multi-stage Dockerfiles, docker-compose, env templates | ✅ **100% COMPLETE** | `Dockerfile.backend`, `Dockerfile.frontend`, `Dockerfile.analytics`, `docker-compose.yml`, `.env.example`. | None. |
| **10** | **Git & Collaboration** | Feature branches, meaningful commits, PR reviews | ✅ **100% COMPLETE** | Clean conventional commits on `main`, CodeRabbit PR review artifact, clean commit history. | None. |
| **11** | **CI/CD Pipeline** | GitHub Actions workflows for tests, linting, and deploy | ✅ **100% COMPLETE** | `.github/workflows/ci.yml`, `.github/workflows/cd-production.yml`. | None. |
| **12** | **Testing Strategy** | Unit, API, failure-path, OCC race, and boundary tests | 🟡 **85% COMPLETE** | Backend: 34/34 passing (100%). Analytics: 10/10 passing (100%). | Add frontend component test suite & Playwright e2e test script. |
| **13** | **API Documentation** | OpenAPI/Swagger documentation for Node & FastAPI | 🟡 **70% COMPLETE** | FastAPI has auto-generated Swagger at `/docs`. Express has OpenAPI JSON schema file. | Mount `swagger-ui-express` on `/api/docs` in Express API. |
| **14** | **Production Deployment** | Cloud deployment, HTTPS, managed database, backups | ✅ **100% COMPLETE** | Backend live on Render (`project-management-d5cv.onrender.com`), Supabase DB live, Vercel ready. | Deploy frontend to Vercel. |
| **15** | **Architecture & Incident Drills**| Diagrams, failure drill evidence (OCC, DLQ, replay) | ✅ **100% COMPLETE** | Architecture diagrams in documentation, OCC collision drill automated, DLQ failover tested. | None. |

---

## 6. Detailed Gap Analysis: What is Missing?

Based on the official requirements handbook, our implementation is **~90% complete**. The specific remaining items to achieve a perfect 1,500/1,500 score are:

### Gap 1: Comments & Subtasks Integration (Functional & UI)
- **Requirement:** Section 2 lists `comments and attachments` and `tasks and subtasks` as core deliverables.
- **Backend Current State:** Database tables `comments` and `subtasks` are created in Supabase schema, but explicit REST endpoints (`POST /api/v1/tasks/:id/comments`, `GET /api/v1/tasks/:id/comments`, `POST /api/v1/tasks/:id/subtasks`, `PATCH /api/v1/subtasks/:id`) need to be wired into Express.
- **Frontend Current State:** The Task Detail page (`/tasks/[id]`) currently has title, description, status, priority, hours, and work log submissions. Adding a **Subtasks Checklist** and **Team Comments Discussion Thread** will make it 100% functionally complete.

### Gap 2: Interactive Swagger UI on Express API (`/api/docs`)
- **Requirement:** Assessment 13 requires interactive OpenAPI/Swagger documentation for both services.
- **Current State:** FastAPI service has Swagger UI at `/docs`. Node.js Express API currently has route handlers but lacks an interactive `swagger-ui-express` viewer mounted at `/api/docs`.
- **Solution:** Mount `swagger-ui-express` serving the OpenAPI specification on the Express backend.

### Gap 3: Automated Frontend & End-to-End Test Suite
- **Requirement:** Assessment 12 requires frontend component tests and end-to-end user journey tests covering tenant isolation and concurrent edits.
- **Current State:** Backend has 34 passing tests (`node --test`), Python has 10 passing tests (`pytest`).
- **Solution:** Add frontend unit/component tests in `frontend/tests/` and an automated Playwright/Puppeteer script verifying the login-to-Kanban flow.

---

## 7. Implementation Roadmap & Action Plan

To close all gaps immediately:

1. **Sprint 1 (Backend Core Extensions):**
   - Implement `backend/src/modules/comments/comments.routes.js` (list, add, delete comments).
   - Implement subtask endpoints (`POST & GET /api/v1/tasks/:id/subtasks`, `PATCH /api/v1/tasks/:id/subtasks/:subtaskId`).
   - Mount interactive Swagger UI on `GET /api/docs`.

2. **Sprint 2 (Frontend Task Detail Elevation):**
   - Update `frontend/src/app/tasks/[id]/page.tsx` to include:
     - Interactive **Subtasks Checklist** (add subtask, toggle completed checkbox).
     - **Team Comments Thread** (post comment, view discussion with author avatar).

3. **Sprint 3 (Automated Quality & E2E Verification):**
   - Add frontend component tests and end-to-end integration verification.
   - Re-run full test suites across Backend, Analytics, and Frontend.
   - Push updates to GitHub and verify auto-deploy on Render.

---

## 8. Definition of Done (DoD)

- [x] All 15 assessments addressed and verified against the handbook.
- [x] Optimistic Concurrency Control (OCC) verified with atomic 409 conflict detection.
- [x] Supabase PostgreSQL 16 cluster connected and seeded with enterprise fixtures.
- [x] Python stream analytics processor operating with verified $O(1)$ constant memory.
- [x] Full-screen task detail view with live submission audit logging.
- [x] Production backend live on Render (`project-management-d5cv.onrender.com`).
- [ ] Subtasks and Comments UI integrated on Task Detail page.
- [ ] Swagger UI mounted at `/api/docs` on Express API.
- [ ] All automated test suites running green in CI/CD pipeline.
