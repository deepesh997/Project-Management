import { Router } from 'express';
import { db } from '../../db/store.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { enforceTenantIsolation } from '../../middleware/tenant.js';
import { authorizeRoles } from '../../middleware/rbac.js';

export const auditRouter = Router();

auditRouter.use(authenticateJWT);
auditRouter.use(enforceTenantIsolation);

// Get immutable audit timeline (Restricted to auditor, org_owner, and platform_admin)
auditRouter.get(
  '/logs',
  authorizeRoles('platform_admin', 'org_owner', 'auditor'),
  (req, res) => {
    const limit = parseInt(req.query.limit || '50', 10);
    const logs = db.getActivityLogs(req.orgId, limit);

    return res.json({
      data: logs,
      meta: {
        total: logs.length,
        orgId: req.orgId,
        queriedBy: req.user.email,
        role: req.user.role,
      },
    });
  }
);
