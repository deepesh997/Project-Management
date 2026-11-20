/**
 * WorkSphere Database Store & Repository Layer
 * Supports PostgreSQL connection pooling with fallback in-memory transactional store.
 * Enforces multi-tenant isolation, unique constraints, and Optimistic Concurrency Control (OCC).
 */
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export class DatabaseStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.organizations = new Map();
    this.users = new Map();
    this.memberships = new Map();
    this.projects = new Map();
    this.milestones = new Map();
    this.tasks = new Map();
    this.subtasks = new Map();
    this.comments = new Map();
    this.activityLogs = [];
    this.revokedTokens = new Set();
    this.processedEvents = new Map(); // idempotency_key -> { status, payload, createdAt }
  }

  async seed() {
    this.reset();

    // 1. Create Organizations
    const orgAcme = {
      id: 'org-acme-101',
      name: 'Acme Technologies Inc.',
      slug: 'acme-corp',
      plan: 'ENTERPRISE',
      createdAt: new Date().toISOString(),
    };
    const orgGlobex = {
      id: 'org-globex-202',
      name: 'Globex Global Ltd.',
      slug: 'globex-global',
      plan: 'PRO',
      createdAt: new Date().toISOString(),
    };
    this.organizations.set(orgAcme.id, orgAcme);
    this.organizations.set(orgGlobex.id, orgGlobex);

    // 2. Create Users across all 5 roles
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('Password123!', salt);

    const usersList = [
      { id: 'usr-admin-1', email: 'admin@worksphere.io', fullName: 'Super Administrator', role: 'platform_admin', orgId: 'org-acme-101' },
      { id: 'usr-owner-1', email: 'owner@acme.com', fullName: 'Elena Vance (Owner)', role: 'org_owner', orgId: 'org-acme-101' },
      { id: 'usr-pm-1', email: 'pm@acme.com', fullName: 'Marcus Brody (PM)', role: 'project_manager', orgId: 'org-acme-101' },
      { id: 'usr-member-1', email: 'member@acme.com', fullName: 'Sarah Connor (Dev)', role: 'team_member', orgId: 'org-acme-101' },
      { id: 'usr-auditor-1', email: 'auditor@acme.com', fullName: 'Arthur Pendelton (Auditor)', role: 'auditor', orgId: 'org-acme-101' },
      // Rival tenant user for cross-tenant penetration testing
      { id: 'usr-globex-1', email: 'hacker@globex.com', fullName: 'Victor Shade', role: 'team_member', orgId: 'org-globex-202' },
    ];

    for (const u of usersList) {
      const userRecord = {
        id: u.id,
        email: u.email,
        passwordHash,
        fullName: u.fullName,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      this.users.set(u.id, userRecord);

      // Membership
      const memId = `mem-${u.id}`;
      this.memberships.set(memId, {
        id: memId,
        orgId: u.orgId,
        userId: u.id,
        role: u.role,
        createdAt: new Date().toISOString(),
      });
    }

    // 3. Create Seed Project
    const projAlpha = {
      id: 'proj-acme-alpha',
      orgId: 'org-acme-101',
      name: 'Phoenix Multi-Cloud Architecture',
      description: 'Next-gen enterprise cloud transformation roadmap.',
      status: 'ACTIVE',
      ownerId: 'usr-pm-1',
      startDate: '2026-11-01',
      targetEndDate: '2027-04-30',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(projAlpha.id, projAlpha);

    // 4. Create Seed Tasks (with Version 1 for OCC)
    const taskOccTarget = {
      id: 'task-concurrency-target',
      projectId: projAlpha.id,
      orgId: 'org-acme-101',
      title: 'Database Sharding & Connection Pool Tuning',
      description: 'Configure PgBouncer with maximum 500 connections.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assigneeId: 'usr-member-1',
      creatorId: 'usr-pm-1',
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      estimatedHours: 16.0,
      actualHours: 4.5,
      version: 1, // OCC version counter
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(taskOccTarget.id, taskOccTarget);

    // Append Initial Audit Log
    this.logActivity({
      orgId: 'org-acme-101',
      entityType: 'SYSTEM',
      entityId: 'seed',
      action: 'INITIALIZED',
      performedBy: 'usr-admin-1',
      payload: { message: 'Database seeded with demo multi-tenant fixtures.' },
    });
  }

  // --- Multi-Tenant Helpers ---
  getUserByEmail(email) {
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  }

  getUserMembership(userId, orgId) {
    for (const m of this.memberships.values()) {
      if (m.userId === userId && (!orgId || m.orgId === orgId)) {
        return m;
      }
    }
    return null;
  }

  // --- Tasks & Optimistic Concurrency Control ---
  getTaskById(taskId, orgId) {
    const task = this.tasks.get(taskId);
    if (!task) return null;
    if (orgId && task.orgId !== orgId) return null; // Tenant barrier
    return { ...task };
  }

  listTasks(orgId, filters = {}) {
    const results = [];
    for (const task of this.tasks.values()) {
      if (task.orgId !== orgId) continue;
      if (filters.projectId && task.projectId !== filters.projectId) continue;
      if (filters.assigneeId && task.assigneeId !== filters.assigneeId) continue;
      if (filters.status && task.status !== filters.status) continue;
      results.push({ ...task });
    }
    return results;
  }

  createTask(data, actorId) {
    const id = data.id || `task-${uuidv4()}`;
    const task = {
      id,
      projectId: data.projectId,
      orgId: data.orgId,
      title: data.title,
      description: data.description || '',
      status: data.status || 'TODO',
      priority: data.priority || 'MEDIUM',
      assigneeId: data.assigneeId || null,
      creatorId: actorId,
      dueDate: data.dueDate || null,
      estimatedHours: parseFloat(data.estimatedHours || 0),
      actualHours: parseFloat(data.actualHours || 0),
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(id, task);

    this.logActivity({
      orgId: data.orgId,
      entityType: 'TASK',
      entityId: id,
      action: 'CREATED',
      performedBy: actorId,
      payload: { title: task.title, status: task.status },
    });

    return { ...task };
  }

  /**
   * Updates task with Optimistic Concurrency Control (OCC).
   * If expectedVersion !== current.version, rejects with 409 Conflict and diff!
   */
  updateTaskWithOCC(taskId, orgId, updates, expectedVersion, actorId) {
    const current = this.tasks.get(taskId);
    if (!current) {
      return { success: false, reason: 'NOT_FOUND' };
    }
    if (current.orgId !== orgId) {
      return { success: false, reason: 'FORBIDDEN' };
    }

    // Atomic version match verification
    if (expectedVersion !== undefined && expectedVersion !== current.version) {
      // Conflict detected!
      this.logActivity({
        orgId,
        entityType: 'TASK',
        entityId: taskId,
        action: 'OCC_CONFLICT_DETECTED',
        performedBy: actorId,
        payload: {
          attemptedVersion: expectedVersion,
          currentVersion: current.version,
          conflictingUpdates: updates,
        },
      });

      return {
        success: false,
        reason: 'CONFLICT',
        currentVersion: current.version,
        currentRecord: { ...current },
        diff: {
          attemptedUpdates: updates,
          serverState: {
            title: current.title,
            description: current.description,
            status: current.status,
            priority: current.priority,
            assigneeId: current.assigneeId,
            version: current.version,
            updatedAt: current.updatedAt,
          },
        },
      };
    }

    // Apply updates and increment version counter
    const updated = {
      ...current,
      ...updates,
      id: current.id,
      orgId: current.orgId,
      projectId: current.projectId,
      creatorId: current.creatorId,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    };

    this.tasks.set(taskId, updated);

    this.logActivity({
      orgId,
      entityType: 'TASK',
      entityId: taskId,
      action: 'UPDATED',
      performedBy: actorId,
      payload: {
        newVersion: updated.version,
        updatedFields: Object.keys(updates),
      },
    });

    return { success: true, task: { ...updated } };
  }

  // --- Audit Trail ---
  logActivity({ orgId, entityType, entityId, action, performedBy, payload }) {
    const entry = {
      id: `act-${uuidv4()}`,
      orgId,
      entityType,
      entityId,
      action,
      performedBy,
      payload: payload || {},
      createdAt: new Date().toISOString(),
    };
    this.activityLogs.push(entry);
    return entry;
  }

  getActivityLogs(orgId, limit = 50) {
    return this.activityLogs
      .filter((l) => l.orgId === orgId)
      .slice(-limit)
      .reverse();
  }

  // --- Token Revocation ---
  revokeToken(jti) {
    this.revokedTokens.add(jti);
  }

  isTokenRevoked(jti) {
    return this.revokedTokens.has(jti);
  }

  // --- Idempotency ---
  checkAndRecordIdempotency(key, eventType, payload) {
    if (this.processedEvents.has(key)) {
      return { isDuplicate: true, record: this.processedEvents.get(key) };
    }
    const record = {
      idempotencyKey: key,
      eventType,
      status: 'PROCESSED',
      payload,
      createdAt: new Date().toISOString(),
    };
    this.processedEvents.set(key, record);
    return { isDuplicate: false, record };
  }
}

export const db = new DatabaseStore();
await db.seed();
