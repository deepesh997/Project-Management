import { db } from '../db/store.js';

export function enforceTenantIsolation(req, res, next) {
  const headerTenant = req.headers['x-tenant-id'];
  const userOrg = req.user?.orgId;
  const isPlatformAdmin = req.user?.role === 'platform_admin';

  const effectiveOrgId = headerTenant || userOrg;

  if (!effectiveOrgId) {
    return res.status(400).json({
      error: {
        code: 'MISSING_TENANT_ID',
        message: 'No tenant organization identifier specified in header X-Tenant-ID or user session',
        requestId: req.id,
      },
    });
  }

  // Cross-tenant verification: unless platform_admin, user must belong to effectiveOrgId
  if (!isPlatformAdmin && userOrg && userOrg !== effectiveOrgId) {
    // Audit intrusion attempt!
    db.logActivity({
      orgId: effectiveOrgId,
      entityType: 'SECURITY',
      entityId: req.user?.id || 'anonymous',
      action: 'CROSS_TENANT_ACCESS_DENIED',
      performedBy: req.user?.id || 'anonymous',
      payload: {
        userOrgId: userOrg,
        attemptedTargetOrgId: effectiveOrgId,
        path: req.originalUrl,
        ip: req.ip,
      },
    });

    return res.status(403).json({
      error: {
        code: 'TENANT_ACCESS_FORBIDDEN',
        message: 'Forbidden: You do not have permissions to access resources belonging to another organization.',
        requestId: req.id,
      },
    });
  }

  req.orgId = effectiveOrgId;
  next();
}
