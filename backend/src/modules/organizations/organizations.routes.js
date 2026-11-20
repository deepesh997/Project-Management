import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../db/store.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { enforceTenantIsolation } from '../../middleware/tenant.js';
import { authorizeRoles } from '../../middleware/rbac.js';
import { validateBody } from '../../middleware/validation.js';
import { jobQueue } from '../queue/jobQueue.js';

export const organizationsRouter = Router();

organizationsRouter.use(authenticateJWT);

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['org_owner', 'project_manager', 'team_member', 'auditor']).default('team_member'),
});

const updateRoleSchema = z.object({
  role: z.enum(['org_owner', 'project_manager', 'team_member', 'auditor']),
});

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

// List members in organization
organizationsRouter.get('/:id/members', enforceTenantIsolation, (req, res) => {
  const members = db.listMembers(req.params.id);
  return res.json({ data: members });
});

// Update member role (Requires org_owner or platform_admin)
organizationsRouter.put(
  '/:id/members/:userId',
  enforceTenantIsolation,
  authorizeRoles('platform_admin', 'org_owner'),
  validateBody(updateRoleSchema),
  (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    const result = db.updateMemberRole(req.params.id, userId, role, req.user.id);
    if (!result.success) {
      return res.status(404).json({ error: { code: 'MEMBER_NOT_FOUND', message: 'Member not found in organization' } });
    }

    return res.json({ data: result.member, message: 'Member role updated successfully' });
  }
);

// Remove member from organization (Requires org_owner or platform_admin)
organizationsRouter.delete(
  '/:id/members/:userId',
  enforceTenantIsolation,
  authorizeRoles('platform_admin', 'org_owner'),
  (req, res) => {
    const { userId } = req.params;

    // Prevent removing self
    if (userId === req.user.id) {
      return res.status(400).json({ error: { code: 'CANNOT_REMOVE_SELF', message: 'You cannot remove yourself as owner' } });
    }

    const result = db.removeMember(req.params.id, userId, req.user.id);
    if (!result.success) {
      return res.status(404).json({ error: { code: 'MEMBER_NOT_FOUND', message: 'Member not found in organization' } });
    }

    return res.json({ success: true, message: 'Member removed from organization' });
  }
);

// List pending invitations for organization
organizationsRouter.get(
  '/:id/invitations',
  enforceTenantIsolation,
  authorizeRoles('platform_admin', 'org_owner', 'project_manager'),
  (req, res) => {
    const invitations = db.listInvitations(req.params.id);
    return res.json({ data: invitations });
  }
);

// Send invitation to new user (Requires org_owner, platform_admin, or project_manager)
organizationsRouter.post(
  '/:id/invitations',
  enforceTenantIsolation,
  authorizeRoles('platform_admin', 'org_owner', 'project_manager'),
  validateBody(inviteUserSchema),
  async (req, res) => {
    const { email, role } = req.body;
    const orgId = req.params.id;

    const result = db.createInvitation({
      orgId,
      email,
      role,
      invitedBy: req.user.id,
    });

    if (!result.success) {
      return res.status(400).json({
        error: { code: result.reason, message: result.message },
      });
    }

    const invitation = result.invitation;

    // Enqueue email dispatch job with idempotency key
    await jobQueue.enqueue({
      type: 'NOTIFICATION_EMAIL',
      payload: {
        orgId,
        recipient: email,
        subject: `You have been invited to join WorkSphere (${orgId})`,
        inviteToken: invitation.token,
      },
      idempotencyKey: `invite:${invitation.id}`,
    });

    return res.status(201).json({
      data: invitation,
      message: `Invitation generated and dispatched to ${email}`,
    });
  }
);

// Cancel / Revoke invitation
organizationsRouter.delete(
  '/:id/invitations/:invId',
  enforceTenantIsolation,
  authorizeRoles('platform_admin', 'org_owner', 'project_manager'),
  (req, res) => {
    const { invId } = req.params;
    const result = db.cancelInvitation(invId, req.params.id, req.user.id);
    if (!result.success) {
      return res.status(404).json({ error: { code: 'INVITATION_NOT_FOUND', message: 'Invitation not found' } });
    }

    return res.json({ success: true, message: 'Invitation cancelled successfully' });
  }
);
