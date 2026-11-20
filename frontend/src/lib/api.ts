import type { Task, OCCConflictError, AnalyticsSummary, Project, ActivityLog } from '../types/index.ts';

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

  static async getTasks(): Promise<Task[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const json = await res.json();
      return json.data;
    } catch {
      // Return demo fixture if backend is offline
      return [
        {
          id: 'task-demo-1',
          projectId: 'proj-acme-alpha',
          orgId: 'org-acme-101',
          title: 'Database Sharding & Connection Pool Tuning',
          description: 'Configure PgBouncer with maximum 500 connections.',
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
          id: 'task-demo-2',
          projectId: 'proj-acme-alpha',
          orgId: 'org-acme-101',
          title: 'Implement OAuth2 / OIDC Single Sign-On',
          description: 'Support Google Workspace and Okta enterprise SSO.',
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
      ];
    }
  }

  static async updateTaskWithOCC(taskId: string, updates: Partial<Task>, expectedVersion: number): Promise<{ success: boolean; task?: Task; conflict?: OCCConflictError }> {
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
}
