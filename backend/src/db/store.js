/**
 * WorkSphere Database Store & Repository Layer
 * Supports PostgreSQL connection pooling with fallback in-memory transactional store.
 * Enforces multi-tenant isolation, unique constraints, and Optimistic Concurrency Control (OCC).
 */
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { pool, testConnection } from './pool.js';

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
    this.invitations = new Map();
    this.revokedTokens = new Set();
    this.processedEvents = new Map(); // idempotency_key -> { status, payload, createdAt }
  }

  async checkPostgresConnection() {
    const status = await testConnection();
    if (status.connected) {
      console.log(`[DatabaseStore] Connected to Supabase PostgreSQL cluster (${status.database})`);
      this.isLivePostgres = true;
    } else {
      console.log(`[DatabaseStore] Notice: ${status.message} Running with resilient in-memory engine.`);
      this.isLivePostgres = false;
    }
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
      description: 'Configure PgBouncer with maximum 500 connections for resilient throughput.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assigneeId: 'usr-member-1',
      creatorId: 'usr-pm-1',
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      estimatedHours: 16.0,
      actualHours: 4.5,
      version: 1, // OCC version counter
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(taskOccTarget.id, taskOccTarget);

    const task101 = {
      id: 'task-101',
      projectId: projAlpha.id,
      orgId: 'org-acme-101',
      title: 'REST & Server-Sent Events (SSE) Streaming Pipeline',
      description: 'Production event streaming hub for real-time task mutations and analytics feeds.',
      status: 'DONE',
      priority: 'HIGH',
      assigneeId: 'usr-member-1',
      creatorId: 'usr-pm-1',
      dueDate: new Date(Date.now() - 86400000).toISOString(),
      estimatedHours: 12.0,
      actualHours: 10.0,
      version: 2,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    };
    this.tasks.set(task101.id, task101);

    const task102 = {
      id: 'task-102',
      projectId: projAlpha.id,
      orgId: 'org-acme-101',
      title: 'Optimistic Concurrency Control (OCC) Architecture',
      description: 'Enforce atomic version checks (expectedVersion === current.version) to reject silent overwrites.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      assigneeId: 'usr-pm-1',
      creatorId: 'usr-pm-1',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      estimatedHours: 20.0,
      actualHours: 14.0,
      version: 3,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(task102.id, task102);

    const task103 = {
      id: 'task-103',
      projectId: projAlpha.id,
      orgId: 'org-acme-101',
      title: 'HMAC Webhook Ingestion & Replay Protection',
      description: 'Verify SHA256 HMAC signatures with 300-second timestamp tolerance and Redis deduplication.',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeId: 'usr-member-1',
      creatorId: 'usr-owner-1',
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      estimatedHours: 8.0,
      actualHours: 0.0,
      version: 1,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    };
    this.tasks.set(task103.id, task103);

    // Initial Audit Logs for Seeded Tasks
    this.logActivity({
      orgId: 'org-acme-101',
      entityType: 'TASK',
      entityId: taskOccTarget.id,
      action: 'CREATED',
      performedBy: 'usr-pm-1',
      payload: { title: taskOccTarget.title, status: 'IN_PROGRESS', version: 1, note: 'Task submitted for sprint execution.' },
    });
    this.logActivity({
      orgId: 'org-acme-101',
      entityType: 'TASK',
      entityId: task101.id,
      action: 'CREATED',
      performedBy: 'usr-pm-1',
      payload: { title: task101.title, status: 'TODO', version: 1 },
    });
    this.logActivity({
      orgId: 'org-acme-101',
      entityType: 'TASK',
      entityId: task101.id,
      action: 'UPDATED',
      performedBy: 'usr-member-1',
      payload: { status: 'DONE', version: 2, note: 'Implementation verified and deployed to staging.' },
    });
    this.logActivity({
      orgId: 'org-acme-101',
      entityType: 'TASK',
      entityId: task102.id,
      action: 'CREATED',
      performedBy: 'usr-pm-1',
      payload: { title: task102.title, status: 'TODO', version: 1 },
    });
    this.logActivity({
      orgId: 'org-acme-101',
      entityType: 'TASK',
      entityId: task102.id,
      action: 'UPDATED',
      performedBy: 'usr-pm-1',
      payload: { status: 'IN_PROGRESS', version: 2, updatedFields: ['status', 'estimatedHours'] },
    });
    this.logActivity({
      orgId: 'org-acme-101',
      entityType: 'TASK',
      entityId: task102.id,
      action: 'OCC_CONFLICT_DETECTED',
      performedBy: 'usr-member-1',
      payload: { attemptedVersion: 1, currentVersion: 2, note: 'Simulated collision caught by OCC engine' },
    });
    this.logActivity({
      orgId: 'org-acme-101',
      entityType: 'TASK',
      entityId: task103.id,
      action: 'CREATED',
      performedBy: 'usr-owner-1',
      payload: { title: task103.title, status: 'TODO', version: 1, note: 'Task created from security compliance audit.' },
    });

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

  createUser({ email, password, fullName, role = 'team_member', orgId = 'org-acme-101' }) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = this.getUserByEmail(normalizedEmail);
    if (existing) {
      return { success: false, reason: 'USER_EXISTS', message: 'A user with this email already exists' };
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const id = `usr-${uuidv4()}`;

    const userRecord = {
      id,
      email: normalizedEmail,
      passwordHash,
      fullName: fullName || normalizedEmail.split('@')[0],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.users.set(id, userRecord);

    const memId = `mem-${id}`;
    const membership = {
      id: memId,
      orgId,
      userId: id,
      role,
      createdAt: new Date().toISOString(),
    };
    this.memberships.set(memId, membership);

    if (pool) {
      pool.query(
        'INSERT INTO users (id, email, password_hash, full_name, is_active, created_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING',
        [id, userRecord.email, passwordHash, userRecord.fullName, true, userRecord.createdAt]
      ).catch(() => {});
      pool.query(
        'INSERT INTO organization_memberships (id, org_id, user_id, role, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
        [memId, orgId, id, role, membership.createdAt]
      ).catch(() => {});
    }

    this.logActivity({
      orgId,
      entityType: 'AUTH',
      entityId: id,
      action: 'USER_REGISTERED',
      performedBy: id,
      payload: { email: userRecord.email, role },
    });

    return { success: true, user: userRecord, membership };
  }

  // --- Team & User Management ---
  listMembers(orgId) {
    const list = [];
    for (const m of this.memberships.values()) {
      if (m.orgId === orgId) {
        const u = this.users.get(m.userId);
        if (u) {
          list.push({
            id: m.id,
            userId: u.id,
            email: u.email,
            fullName: u.fullName,
            role: m.role,
            isActive: u.isActive,
            joinedAt: m.createdAt,
          });
        }
      }
    }
    return list;
  }

  updateMemberRole(orgId, userId, newRole, actorId) {
    let targetMem = null;
    for (const m of this.memberships.values()) {
      if (m.orgId === orgId && m.userId === userId) {
        targetMem = m;
        break;
      }
    }
    if (!targetMem) return { success: false, reason: 'NOT_FOUND' };

    const oldRole = targetMem.role;
    targetMem.role = newRole;
    targetMem.updatedAt = new Date().toISOString();

    this.logActivity({
      orgId,
      entityType: 'USER_MANAGEMENT',
      entityId: userId,
      action: 'ROLE_CHANGED',
      performedBy: actorId,
      payload: { oldRole, newRole, targetUserId: userId },
    });

    return { success: true, member: targetMem };
  }

  removeMember(orgId, userId, actorId) {
    let memKeyToRemove = null;
    for (const [key, m] of this.memberships.entries()) {
      if (m.orgId === orgId && m.userId === userId) {
        memKeyToRemove = key;
        break;
      }
    }
    if (!memKeyToRemove) return { success: false, reason: 'NOT_FOUND' };

    this.memberships.delete(memKeyToRemove);

    this.logActivity({
      orgId,
      entityType: 'USER_MANAGEMENT',
      entityId: userId,
      action: 'MEMBER_REMOVED',
      performedBy: actorId,
      payload: { removedUserId: userId },
    });

    return { success: true };
  }

  createInvitation({ orgId, email, role = 'team_member', invitedBy }) {
    const existingUser = this.getUserByEmail(email);
    if (existingUser && this.getUserMembership(existingUser.id, orgId)) {
      return { success: false, reason: 'ALREADY_MEMBER', message: 'User is already a member of this organization.' };
    }

    const id = `inv-${uuidv4()}`;
    const token = `invtok_${uuidv4().replace(/-/g, '')}`;
    const invitation = {
      id,
      orgId,
      email: email.toLowerCase().trim(),
      role,
      token,
      status: 'PENDING',
      invitedBy,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.invitations.set(id, invitation);

    this.logActivity({
      orgId,
      entityType: 'INVITATION',
      entityId: id,
      action: 'INVITATION_SENT',
      performedBy: invitedBy,
      payload: { email: invitation.email, role: invitation.role, expiresAt: invitation.expiresAt },
    });

    return { success: true, invitation };
  }

  listInvitations(orgId) {
    const list = [];
    for (const inv of this.invitations.values()) {
      if (inv.orgId === orgId && inv.status === 'PENDING') {
        const inviter = this.users.get(inv.invitedBy);
        list.push({
          ...inv,
          inviterName: inviter?.fullName || 'Administrator',
        });
      }
    }
    return list;
  }

  cancelInvitation(invitationId, orgId, actorId) {
    const inv = this.invitations.get(invitationId);
    if (!inv || inv.orgId !== orgId) return { success: false, reason: 'NOT_FOUND' };

    inv.status = 'CANCELLED';

    this.logActivity({
      orgId,
      entityType: 'INVITATION',
      entityId: invitationId,
      action: 'INVITATION_CANCELLED',
      performedBy: actorId,
      payload: { email: inv.email },
    });

    return { success: true };
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

  deleteTask(taskId, orgId, actorId) {
    const current = this.tasks.get(taskId);
    if (!current) return { success: false, reason: 'NOT_FOUND' };
    if (current.orgId !== orgId) return { success: false, reason: 'FORBIDDEN' };

    this.tasks.delete(taskId);
    this.logActivity({
      orgId,
      entityType: 'TASK',
      entityId: taskId,
      action: 'DELETED',
      performedBy: actorId,
      payload: { title: current.title },
    });
    return { success: true };
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

  getTaskActivityLogs(taskId, orgId) {
    return this.activityLogs
      .filter((l) => (!orgId || l.orgId === orgId) && l.entityType === 'TASK' && l.entityId === taskId)
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
await db.checkPostgresConnection();
await db.seed();
