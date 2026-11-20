import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../db/store.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { enforceTenantIsolation } from '../../middleware/tenant.js';
import { authorizeRoles } from '../../middleware/rbac.js';
import { validateBody } from '../../middleware/validation.js';
import { realtimeBus } from '../realtime/events.js';
import { jobQueue } from '../queue/jobQueue.js';

export const tasksRouter = Router();

// Apply auth and tenant isolation across all task endpoints
tasksRouter.use(authenticateJWT);
tasksRouter.use(enforceTenantIsolation);

const createTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().nonnegative().optional(),
  actualHours: z.number().nonnegative().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  estimatedHours: z.number().nonnegative().optional(),
  actualHours: z.number().nonnegative().optional(),
  expectedVersion: z.number().int().positive({ message: 'expectedVersion is required for Optimistic Concurrency Control' }),
});

// List Tasks with Tenant Filtering & Pagination
tasksRouter.get('/', (req, res) => {
  const { projectId, assigneeId, status, limit = 50, offset = 0 } = req.query;
  const tasks = db.listTasks(req.orgId, {
    projectId: projectId ? String(projectId) : undefined,
    assigneeId: assigneeId ? String(assigneeId) : undefined,
    status: status ? String(status) : undefined,
  });

  const paginated = tasks.slice(Number(offset), Number(offset) + Number(limit));

  return res.json({
    data: paginated,
    meta: {
      total: tasks.length,
      limit: Number(limit),
      offset: Number(offset),
      orgId: req.orgId,
    },
  });
});

// Get Single Task by ID
tasksRouter.get('/:id', (req, res) => {
  const task = db.getTaskById(req.params.id, req.orgId);
  if (!task) {
    return res.status(404).json({
      error: { code: 'TASK_NOT_FOUND', message: `Task ${req.params.id} does not exist in current tenant scope` },
    });
  }
  return res.json({ data: task });
});

// Create Task
tasksRouter.post(
  '/',
  authorizeRoles('platform_admin', 'org_owner', 'project_manager', 'team_member'),
  validateBody(createTaskSchema),
  async (req, res) => {
    const taskData = { ...req.body, orgId: req.orgId };
    const task = db.createTask(taskData, req.user.id);

    // Broadcast Real-time event
    realtimeBus.broadcast(req.orgId, 'TASK_CREATED', { task });

    // Enqueue Notification Job with unique Idempotency Key
    await jobQueue.enqueue({
      type: 'NOTIFICATION_EMAIL',
      payload: {
        orgId: req.orgId,
        recipient: task.assigneeId || 'team@worksphere.io',
        subject: `New Task Created: ${task.title}`,
        taskId: task.id,
      },
      idempotencyKey: `task_create:${task.id}:v1`,
    });

    return res.status(201).json({ data: task });
  }
);

/**
 * Update Task with Optimistic Concurrency Control (OCC)
 * Capstone Requirement: Prevents silent overwrites, returns HTTP 409 Conflict with diff if stale.
 */
tasksRouter.put(
  '/:id',
  authorizeRoles('platform_admin', 'org_owner', 'project_manager', 'team_member'),
  validateBody(updateTaskSchema),
  async (req, res) => {
    const taskId = req.params.id;
    const { expectedVersion, ...updates } = req.body;

    const result = db.updateTaskWithOCC(taskId, req.orgId, updates, expectedVersion, req.user.id);

    if (!result.success) {
      if (result.reason === 'NOT_FOUND') {
        return res.status(404).json({
          error: { code: 'TASK_NOT_FOUND', message: `Task ${taskId} not found.` },
        });
      }

      if (result.reason === 'FORBIDDEN') {
        return res.status(403).json({
          error: { code: 'CROSS_TENANT_FORBIDDEN', message: 'Cannot modify task from another organization.' },
        });
      }

      if (result.reason === 'CONFLICT') {
        // Concurrency Conflict Detected!
        return res.status(409).json({
          error: {
            code: 'CONCURRENCY_CONFLICT',
            message: 'Stale update rejected. Another user has modified this task since you loaded it.',
            currentVersion: result.currentVersion,
            attemptedVersion: expectedVersion,
            currentRecord: result.currentRecord,
            diff: result.diff,
            resolutionAdvice: 'Reload latest version or review differences before resubmitting.',
          },
        });
      }
    }

    const updatedTask = result.task;

    // Broadcast Real-time update to all active workspace sessions
    realtimeBus.broadcast(req.orgId, 'TASK_UPDATED', { task: updatedTask, updatedBy: req.user.id });

    // Enqueue notification with version-specific idempotency key (deduplication guarantee!)
    await jobQueue.enqueue({
      type: 'NOTIFICATION_EMAIL',
      payload: {
        orgId: req.orgId,
        recipient: updatedTask.assigneeId || 'team@worksphere.io',
        subject: `Task Updated [v${updatedTask.version}]: ${updatedTask.title}`,
        taskId: updatedTask.id,
      },
      idempotencyKey: `task_update:${updatedTask.id}:v${updatedTask.version}`,
    });

    return res.json({
      data: updatedTask,
      meta: {
        version: updatedTask.version,
        message: 'Task updated successfully with OCC validation',
      },
    });
  }
);

// Delete Task
tasksRouter.delete(
  '/:id',
  authorizeRoles('platform_admin', 'org_owner', 'project_manager'),
  async (req, res) => {
    const result = db.deleteTask(req.params.id, req.orgId, req.user.id);
    if (!result.success) {
      if (result.reason === 'NOT_FOUND') {
        return res.status(404).json({ error: { code: 'TASK_NOT_FOUND', message: 'Task not found' } });
      }
      return res.status(403).json({ error: { code: 'CROSS_TENANT_FORBIDDEN', message: 'Unauthorized' } });
    }
    realtimeBus.broadcast(req.orgId, 'TASK_DELETED', { taskId: req.params.id });
    return res.json({ success: true, message: 'Task deleted successfully' });
  }
);
