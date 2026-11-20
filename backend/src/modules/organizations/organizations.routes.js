import { Router } from 'express';
import { db } from '../../db/store.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { enforceTenantIsolation } from '../../middleware/tenant.js';
import { authorizeRoles } from '../../middleware/rbac.js';

export const organizationsRouter = Router();

organizationsRouter.use(authenticateJWT);

// List accessible organizations
organizationsRouter.get('/', (req, res) => {
  const isPlatformAdmin = req.user.role === 'platform_admin';
  const orgs = [];
  for (const org of db.organizations.values()) {
    if (isPlatformAdmin || org.id === req.user.orgId) {
      orgs.push(org);
    }
  }
  return res.json({ data: orgs });
});

// Get organization details with tenant check
organizationsRouter.get('/:id', enforceTenantIsolation, (req, res) => {
  const org = db.organizations.get(req.params.id);
  if (!org) {
    return res.status(404).json({ error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' } });
  }
  return res.json({ data: org });
});

// List members in current tenant
organizationsRouter.get('/:id/members', enforceTenantIsolation, (req, res) => {
  const members = [];
  for (const m of db.memberships.values()) {
    if (m.orgId === req.params.id) {
      const u = db.users.get(m.userId);
      members.push({
        id: m.id,
        userId: m.userId,
        email: u?.email,
        fullName: u?.fullName,
        role: m.role,
        joinedAt: m.createdAt,
      });
    }
  }
  return res.json({ data: members });
});
