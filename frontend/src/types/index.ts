export type UserRole =
  | 'platform_admin'
  | 'org_owner'
  | 'project_manager'
  | 'team_member'
  | 'auditor';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  orgId: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  projectId: string;
  orgId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  creatorId: string;
  dueDate: string | null;
  estimatedHours: number;
  actualHours: number;
  version: number; // OCC Version Counter
  createdAt: string;
  updatedAt: string;
}

export interface OCCConflictError {
  code: 'CONCURRENCY_CONFLICT';
  message: string;
  currentVersion: number;
  attemptedVersion: number;
  currentRecord: Task;
  diff: {
    attemptedUpdates: Partial<Task>;
    serverState: Partial<Task>;
  };
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  description: string;
  status: string;
  ownerId: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  orgId: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  payload: Record<string, any>;
  createdAt: string;
}

export interface AnalyticsSummary {
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  overdue_tasks: number;
  health_score: number;
  avg_cycle_time_hours: number;
  total_estimated_hours: number;
  total_actual_hours: number;
  workload_by_assignee: Array<{
    assignee_id: string;
    assignee_name: string;
    total_assigned: number;
    in_progress: number;
    completed: number;
    overdue: number;
    total_estimated_hours: number;
    total_actual_hours: number;
  }>;
}
