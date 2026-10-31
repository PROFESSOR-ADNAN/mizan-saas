import { Router, Request, Response, NextFunction } from 'express';
import { OrgService } from '../services/org.service.js';
import { CreateOrgSchema, UpdateOrgSchema, TransferOwnershipSchema } from '@mizan/shared';
import { requireAuth } from '../middleware/auth.js';
import { requireOrgMembership } from '../middleware/tenancy.js';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditLog } from '../middleware/audit.js';

import memberRoutes from './member.routes.js';
import teamRoutes from './team.routes.js';
import datasourceRoutes from './datasource.routes.js';
import apikeyRoutes from './apikey.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import analyticsRoutes from './analytics.routes.js';
import billingRoutes from './billing.routes.js';
import webhookRoutes from './webhook.routes.js';
import importRoutes from './import.routes.js';

const router = Router();

router.use(requireAuth);

// List all user organizations
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgs = await OrgService.listUserOrgs(req.user!.userId);
    res.status(200).json({ organizations: orgs });
  } catch (err) {
    next(err);
  }
});

// Create new organization
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateOrgSchema.parse(req.body);
    const org = await OrgService.createOrg(req.user!.userId, data);
    res.status(201).json({ organization: org });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Organization-Scoped Routes (/:orgId/...)
// ==========================================

const orgScoped = Router({ mergeParams: true });
orgScoped.use(requireOrgMembership);

// Get Organization Details
orgScoped.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await OrgService.getOrgById(req.orgId!);
    res.status(200).json({ organization: org, role: req.membership!.role });
  } catch (err) {
    next(err);
  }
});

// Update Organization Settings
orgScoped.patch('/', requirePermission('org:update'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedUpdates = UpdateOrgSchema.parse(req.body);
    const updates: any = { ...parsedUpdates };
    if (updates.spendCapSantim === null) {
      delete updates.spendCapSantim;
    }
    const org = await OrgService.updateOrg(req.orgId!, updates);
    await recordAuditLog(req, 'org.updated', 'Organization', req.orgId, updates);
    res.status(200).json({ organization: org });
  } catch (err) {
    next(err);
  }
});

// Request Organization Deletion (30-day grace period)
orgScoped.delete('/', requirePermission('org:delete'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await OrgService.requestDeletion(req.orgId!);
    await recordAuditLog(req, 'org.deletion_requested', 'Organization', req.orgId);
    res.status(200).json({
      message: 'Organization scheduled for deletion in 30 days. Contact support to cancel.',
      pendingDeletionAt: org.pendingDeletionAt,
    });
  } catch (err) {
    next(err);
  }
});

// Transfer Ownership
orgScoped.post('/transfer-ownership', requirePermission('org:transfer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { newOwnerUserId } = TransferOwnershipSchema.parse(req.body);
    await OrgService.transferOwnership(req.orgId!, req.user!.userId, newOwnerUserId);
    await recordAuditLog(req, 'org.ownership_transferred', 'Organization', req.orgId, { newOwnerUserId });
    res.status(200).json({ message: 'Ownership transferred successfully' });
  } catch (err) {
    next(err);
  }
});

// Mount Subresources
orgScoped.use('/members', memberRoutes);
orgScoped.use('/teams', teamRoutes);
orgScoped.use('/datasources', datasourceRoutes);
orgScoped.use('/apikeys', apikeyRoutes);
orgScoped.use('/dashboards', dashboardRoutes);
orgScoped.use('/analytics', analyticsRoutes);
orgScoped.use('/billing', billingRoutes);
orgScoped.use('/webhooks', webhookRoutes);
orgScoped.use('/imports', importRoutes);

router.use('/:orgId', orgScoped);

export default router;
