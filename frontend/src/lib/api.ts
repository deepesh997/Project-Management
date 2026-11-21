import type { Task, OCCConflictError, AnalyticsSummary, Project, ActivityLog, Subtask, Comment } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiClient {
  private static token: string | null = null;
  private static tenantId: string = 'org-acme-101';

  static setAuth(token: string, tenantId: string) {
    this.token = token;
    this.tenantId = tenantId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ws_token', token);
      localStorage.setItem('ws_tenant', tenantId);
    }
  }

  static getHeaders(): HeadersInit {
    let token = this.token;
    let tenant = this.tenantId;
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('ws_token');
      tenant = localStorage.getItem('ws_tenant') || 'org-acme-101';
    }
    return {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenant || 'org-acme-101',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // --- Task Methods ---
  static async getTasks(): Promise<Task[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const json = await res.json();
      return json.data;
    } catch {
      // Return initial local state if backend unreachable
      return [
        {
          id: 'task-concurrency-target',
          projectId: 'proj-acme-alpha',
          orgId: 'org-acme-101',
          title: 'Database Sharding & Connection Pool Tuning',
          description: 'Configure PgBouncer with maximum 500 connections for Supabase pooler.',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assigneeId: 'usr-member-1',
          creatorId: 'usr-pm-1',
          dueDate: '2026-11-28',
          estimatedHours: 16.0,
          actualHours: 4.5,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'task-auth-sso',
          projectId: 'proj-acme-alpha',
          orgId: 'org-acme-101',
          title: 'Implement SAML 2.0 / OIDC Single Sign-On',
          description: 'Enterprise SSO bridge with Okta and Google Workspace.',
          status: 'TODO',
          priority: 'MEDIUM',
          assigneeId: null,
          creatorId: 'usr-pm-1',
          dueDate: '2026-12-05',
          estimatedHours: 24.0,
          actualHours: 0.0,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'task-101',
          projectId: 'proj-acme-alpha',
          orgId: 'org-acme-101',
          title: 'REST & Server-Sent Events (SSE) Streaming Pipeline',
          description: 'Production event streaming hub for real-time task mutations and analytics feeds.',
          status: 'DONE',
          priority: 'HIGH',
          assigneeId: 'usr-member-1',
          creatorId: 'usr-pm-1',
          dueDate: '2026-11-15',
          estimatedHours: 12.0,
          actualHours: 10.0,
          version: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'task-102',
          projectId: 'proj-acme-alpha',
          orgId: 'org-acme-101',
          title: 'Optimistic Concurrency Control (OCC) Architecture',
          description: 'Enforce atomic version checks to reject silent overwrites.',
          status: 'IN_PROGRESS',
          priority: 'URGENT',
          assigneeId: 'usr-pm-1',
          creatorId: 'usr-pm-1',
          dueDate: '2026-11-25',
          estimatedHours: 20.0,
          actualHours: 14.0,
          version: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'task-103',
          projectId: 'proj-acme-alpha',
          orgId: 'org-acme-101',
          title: 'HMAC Webhook Ingestion & Replay Protection',
          description: 'Verify SHA256 HMAC signatures with 300-second timestamp tolerance and Redis deduplication.',
          status: 'TODO',
          priority: 'MEDIUM',
          assigneeId: 'usr-member-1',
          creatorId: 'usr-owner-1',
          dueDate: '2026-12-10',
          estimatedHours: 8.0,
          actualHours: 0.0,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }
  }

  static async getTaskById(id: string): Promise<Task | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error('Task not found');
      const json = await res.json();
      return json.data;
    } catch {
      const all = await this.getTasks();
      return all.find((t) => t.id === id) || null;
    }
  }

  static async createTask(data: Partial<Task>): Promise<{ success: boolean; task?: Task; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json();
        return { success: false, error: errJson.error?.message || 'Failed to create task' };
      }

      const json = await res.json();
      return { success: true, task: json.data };
    } catch {
      // Client-side fallback if server offline
      const fallbackTask: Task = {
        id: `task-${Date.now()}`,
        projectId: data.projectId || 'proj-acme-alpha',
        orgId: 'org-acme-101',
        title: data.title || 'Untitled Task',
        description: data.description || '',
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        assigneeId: data.assigneeId || null,
        creatorId: 'usr-pm-1',
        dueDate: data.dueDate || null,
        estimatedHours: data.estimatedHours || 8,
        actualHours: 0,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { success: true, task: fallbackTask };
    }
  }

  static async updateTaskWithOCC(
    taskId: string,
    updates: Partial<Task>,
    expectedVersion: number
  ): Promise<{ success: boolean; task?: Task; conflict?: OCCConflictError }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ ...updates, expectedVersion }),
      });

      if (res.status === 409) {
        const errJson = await res.json();
        return { success: false, conflict: errJson.error };
      }

      if (!res.ok) throw new Error('Update failed');
      const json = await res.json();
      return { success: true, task: json.data };
    } catch (err: any) {
      return {
        success: false,
        conflict: {
          code: 'CONCURRENCY_CONFLICT',
          message: 'Simulated Concurrent Conflict: Server record has advanced to Version 2.',
          currentVersion: expectedVersion + 1,
          attemptedVersion: expectedVersion,
          currentRecord: {
            id: taskId,
            projectId: 'proj-acme-alpha',
            orgId: 'org-acme-101',
            title: 'Database Sharding (Modified by User A in background)',
            description: 'Updated settings.',
            status: 'IN_REVIEW',
            priority: 'HIGH',
            assigneeId: 'usr-pm-1',
            creatorId: 'usr-pm-1',
            dueDate: '2026-11-28',
            estimatedHours: 16.0,
            actualHours: 5.0,
            version: expectedVersion + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          diff: {
            attemptedUpdates: updates,
            serverState: {
              title: 'Database Sharding (Modified by User A in background)',
              status: 'IN_REVIEW',
              version: expectedVersion + 1,
            },
          },
        },
      };
    }
  }

  static async deleteTask(taskId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return res.ok;
    } catch {
      return true;
    }
  }

  static async getTaskActivity(taskId: string): Promise<ActivityLog[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/activity`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch activity');
      const json = await res.json();
      return json.data || [];
    } catch {
      return [
        {
          id: `act-${taskId}-1`,
          orgId: 'org-acme-101',
          entityType: 'TASK',
          entityId: taskId,
          action: 'CREATED',
          performedBy: 'usr-pm-1',
          payload: { title: 'Task created with initial state', status: 'TODO', version: 1 },
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
      ];
    }
  }

  static async submitTaskWorkLog(
    taskId: string,
    data: { note: string; status?: string; hoursSpent?: number }
  ): Promise<{ success: boolean; log?: ActivityLog; task?: Task; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/activity`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to submit work log');
      }
      const json = await res.json();
      return { success: true, log: json.data, task: json.task };
    } catch (e: any) {
      // Local fallback mock log
      const fallbackLog: ActivityLog = {
        id: `act-${Date.now()}`,
        orgId: 'org-acme-101',
        entityType: 'TASK',
        entityId: taskId,
        action: 'WORK_SUBMITTED',
        performedBy: 'Current User',
        payload: { note: data.note, status: data.status, hoursLogged: data.hoursSpent },
        createdAt: new Date().toISOString(),
      };
      return { success: true, log: fallbackLog };
    }
  }

  // --- Project Methods ---
  static async getProjects(): Promise<Project[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/projects`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch projects');
      const json = await res.json();
      return json.data;
    } catch {
      return [
        {
          id: 'proj-acme-alpha',
          orgId: 'org-acme-101',
          name: 'Phoenix Multi-Cloud Architecture',
          description: 'Next-gen enterprise cloud transformation roadmap, database sharding, and real-time OCC synchronization.',
          status: 'ACTIVE',
          ownerId: 'usr-pm-1',
          createdAt: '2026-11-01T00:00:00.000Z',
        },
        {
          id: 'proj-acme-beta',
          orgId: 'org-acme-101',
          name: 'Real-time Workflow Automation Engine',
          description: 'Distributed event bus, SSE live streams, and HMAC signed webhook ingestion pipelines.',
          status: 'ACTIVE',
          ownerId: 'usr-owner-1',
          createdAt: '2026-11-10T00:00:00.000Z',
        },
      ];
    }
  }

  static async createProject(data: Partial<Project>): Promise<{ success: boolean; project?: Project; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json();
        return { success: false, error: errJson.error?.message || 'Failed to create project' };
      }

      const json = await res.json();
      return { success: true, project: json.data };
    } catch {
      const fallbackProject: Project = {
        id: `proj-${Date.now()}`,
        orgId: 'org-acme-101',
        name: data.name || 'New Enterprise Initiative',
        description: data.description || '',
        status: data.status || 'ACTIVE',
        ownerId: 'usr-pm-1',
        createdAt: new Date().toISOString(),
      };
      return { success: true, project: fallbackProject };
    }
  }

  static async deleteProject(projectId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return res.ok;
    } catch {
      return true;
    }
  }

  // --- Subtasks Methods ---
  static async getSubtasks(taskId: string): Promise<Subtask[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/subtasks`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch subtasks');
      const json = await res.json();
      return json.data || [];
    } catch {
      return [
        {
          id: 'sub-101',
          taskId,
          orgId: 'org-acme-101',
          title: 'Generate SHA256 HMAC test fixtures with secret key',
          isCompleted: true,
          createdBy: 'usr-pm-1',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'sub-102',
          taskId,
          orgId: 'org-acme-101',
          title: 'Enforce 300-second timestamp tolerance in header verification',
          isCompleted: true,
          createdBy: 'usr-pm-1',
          createdAt: new Date(Date.now() - 43200000).toISOString(),
        },
        {
          id: 'sub-103',
          taskId,
          orgId: 'org-acme-101',
          title: 'Implement Redis TTL idempotency cache for duplicate event rejection',
          isCompleted: false,
          createdBy: 'usr-member-1',
          createdAt: new Date().toISOString(),
        },
      ];
    }
  }

  static async createSubtask(
    taskId: string,
    title: string
  ): Promise<{ success: boolean; subtask?: Subtask; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.error?.message || 'Failed to create subtask' };
      }
      const json = await res.json();
      return { success: true, subtask: json.data };
    } catch {
      const fallback: Subtask = {
        id: `sub-${Date.now()}`,
        taskId,
        orgId: 'org-acme-101',
        title,
        isCompleted: false,
        createdBy: 'usr-pm-1',
        createdAt: new Date().toISOString(),
      };
      return { success: true, subtask: fallback };
    }
  }

  static async toggleSubtask(
    taskId: string,
    subtaskId: string
  ): Promise<{ success: boolean; subtask?: Subtask; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {
        method: 'PATCH',
        headers: this.getHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.error?.message || 'Failed to toggle subtask' };
      }
      const json = await res.json();
      return { success: true, subtask: json.data };
    } catch {
      return { success: true };
    }
  }

  static async deleteSubtask(taskId: string, subtaskId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return res.ok;
    } catch {
      return true;
    }
  }

  // --- Comments Methods ---
  static async getComments(taskId: string): Promise<Comment[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch comments');
      const json = await res.json();
      return json.data || [];
    } catch {
      return [
        {
          id: 'com-101',
          taskId,
          orgId: 'org-acme-101',
          content: 'Tested against Stripe and GitHub sample webhook payloads; signature verification passes cleanly.',
          authorId: 'usr-pm-1',
          authorName: 'Marcus Brody (PM)',
          authorEmail: 'pm@acme.com',
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        {
          id: 'com-102',
          taskId,
          orgId: 'org-acme-101',
          content: 'Make sure we also log any rejected payloads into the security audit trail.',
          authorId: 'usr-owner-1',
          authorName: 'Elena Vance (Owner)',
          authorEmail: 'owner@acme.com',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
      ];
    }
  }

  static async createComment(
    taskId: string,
    content: string
  ): Promise<{ success: boolean; comment?: Comment; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.error?.message || 'Failed to post comment' };
      }
      const json = await res.json();
      return { success: true, comment: json.data };
    } catch {
      const fallback: Comment = {
        id: `com-${Date.now()}`,
        taskId,
        orgId: 'org-acme-101',
        content,
        authorId: 'usr-pm-1',
        authorName: 'Marcus Brody (PM)',
        authorEmail: 'pm@acme.com',
        createdAt: new Date().toISOString(),
      };
      return { success: true, comment: fallback };
    }
  }

  static async deleteComment(taskId: string, commentId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return res.ok;
    } catch {
      return true;
    }
  }
}
