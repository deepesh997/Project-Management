# Contributing to WorkSphere

Thank you for contributing to WorkSphere! To ensure reliability, multi-tenant safety, and concurrency correctness, please follow these guidelines.

## Branching Model
- `main`: Production-ready code only. Direct commits are restricted.
- `develop`: Integration branch for tested features.
- `feature/<name>`: Individual feature work branched from `develop`.
- `fix/<name>`: Bug fixes and regression repairs.

## Commit Message Format (Conventional Commits)
Format: `<type>(<scope>): <short description>`
- `feat(tasks)`: Add Optimistic Concurrency Control to task updates
- `fix(auth)`: Prevent token reuse after revocation
- `test(concurrency)`: Add automated race condition test suite
- `docs(api)`: Update OpenAPI specification for webhook headers

## Code Review Checklist (CodeRabbit Standard)
Every PR must verify:
- [ ] No server-side authorization bypasses or unvalidated user inputs.
- [ ] Tenant boundaries strictly enforced using `req.orgId`.
- [ ] Concurrency-sensitive updates include `expectedVersion` and handle `409 Conflict`.
- [ ] Background jobs specify unique idempotency keys.
- [ ] 100% passing tests for backend, frontend, and analytics microservice.
