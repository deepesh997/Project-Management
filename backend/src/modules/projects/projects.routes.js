import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../db/store.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { enforceTenantIsolation } from '../../middleware/tenant.js';
import { authorizeRoles } from '../../middleware/rbac.js';
import { validateBody } from '../../middleware/validation.js';

export const projectsRouter = Router();

projectsRouter.use(authenticateJWT);
projectsRouter.use(enforceTenantIsolation);

const createProjectSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED']).optional(),
  startDate: z.string().optional(),
  targetEndDate: z.string().optional(),
});

projectsRouter.get('/', (req, res) => {
  const projects = [];
  for (const p of db.projects.values()) {
    if (p.orgId === req.orgId) {
      projects.push(p);
    }
  }
  return res.json({ data: projects });
});

projectsRouter.post(
  '/',
  authorizeRoles('platform_admin', 'org_owner', 'project_manager'),
  validateBody(createProjectSchema),
  (req, res) => {
    const id = `proj-${Date.now()}`;
    const project = {
      id,
      orgId: req.orgId,
      name: req.body.name,
      description: req.body.description || '',
      status: req.body.status || 'ACTIVE',
      ownerId: req.user.id,
      startDate: req.body.startDate || null,
      targetEndDate: req.body.targetEndDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.projects.set(id, project);

    db.logActivity({
      orgId: req.orgId,
      entityType: 'PROJECT',
      entityId: id,
      action: 'CREATED',
      performedBy: req.user.id,
      payload: { name: project.name },
    });

    return res.status(201).json({ data: project });
  }
);

projectsRouter.get('/:id', (req, res) => {
  const project = db.projects.get(req.params.id);
  if (!project || project.orgId !== req.orgId) {
    return res.status(404).json({ error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } });
  }
  return res.json({ data: project });
});

projectsRouter.delete(
  '/:id',
  authorizeRoles('platform_admin', 'org_owner'),
  (req, res) => {
    const project = db.projects.get(req.params.id);
    if (!project || project.orgId !== req.orgId) {
      return res.status(404).json({ error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } });
    }
    db.projects.delete(req.params.id);
    db.logActivity({
      orgId: req.orgId,
      entityType: 'PROJECT',
      entityId: req.params.id,
      action: 'DELETED',
      performedBy: req.user.id,
      payload: { name: project.name },
    });
    return res.json({ success: true, message: 'Project deleted' });
  }
);
