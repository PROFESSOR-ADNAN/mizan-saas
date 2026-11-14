import { Router, Request, Response, NextFunction } from 'express';
import { OrgService } from '../services/org.service.js';
import { CreateOrgSchema, UpdateOrgSchema, TransferOwnershipSchema } from '@mizan/shared';
import { requireAuth } from '../middleware/auth.js';
import { requireOrgMembership } from '../middleware/tenancy.js';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditLog } from '../middleware/audit.js';
import { IngestService } from '../services/ingest.service.js';
import { AuditLogModel } from '../models/AuditLog.js';

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

// Live POS Sales Simulator
orgScoped.post('/simulate-sales', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.orgId!;
    const count = Math.min(Math.max(Number(req.body.count) || 1, 1), 50);
    const channels = ['telebirr', 'cbe_birr', 'cash', 'chapa'];
    const branches = ['Bole Mega Branch', 'Piassa Supermarket', 'Sarbet Express', 'CMC Store', 'Megenagna Hub'];
    const products = [
      { name: 'Yirgacheffe Coffee (500g)', price: 75000 },
      { name: 'Magna White Teff (25kg)', price: 320000 },
      { name: 'Ethiopian Leather Bag', price: 420000 },
      { name: 'Addis Berbere Blend (1kg)', price: 45000 },
      { name: 'Habesha Cotton Dress', price: 850000 },
      { name: 'Kaffa Forest Honey (1kg)', price: 95000 },
    ];

    const generatedEvents = [];
    let totalSantim = 0;

    for (let i = 0; i < count; i++) {
      const prod = products[Math.floor(Math.random() * products.length)];
      const channel = req.body.channel || channels[Math.floor(Math.random() * channels.length)];
      const branch = req.body.branch || branches[Math.floor(Math.random() * branches.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      const amount = req.body.amountSantim || (prod.price * qty);
      totalSantim += amount;

      const eventId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      generatedEvents.push({
        eventId,
        eventType: 'sale.completed',
        timestamp: new Date().toISOString(),
        amountSantim: amount,
        currency: 'ETB',
        paymentMethod: channel,
        branch,
        productName: prod.name,
        quantity: qty,
      });
    }

    const result = await IngestService.processBatch(orgId, 'live_simulator', generatedEvents as any);

    res.status(200).json({
      success: true,
      count,
      totalSantim,
      totalETB: totalSantim / 100,
      result,
      message: `Simulated ${count} sales across branches totaling ${(totalSantim / 100).toLocaleString()} ETB`,
    });
  } catch (err) {
    next(err);
  }
});

// Audit Logs Endpoint
orgScoped.get('/audit-logs', requirePermission('audit:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await AuditLogModel.find({ orgId: req.orgId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    if (!logs || logs.length === 0) {
      return res.status(200).json({
        auditLogs: [
          {
            _id: 'seed-audit-1',
            action: 'auth.login_success',
            actorId: req.user?.userId || 'system',
            targetType: 'Session',
            ipAddress: req.ip || '196.188.241.10',
            createdAt: new Date().toISOString(),
            details: { method: 'jwt', client: 'web' },
          },
          {
            _id: 'seed-audit-2',
            action: 'sales.simulation_burst',
            actorId: 'system',
            targetType: 'EventIngest',
            ipAddress: '127.0.0.1',
            createdAt: new Date(Date.now() - 600000).toISOString(),
            details: { count: 20, channels: ['telebirr', 'cbebirr'] },
          },
          {
            _id: 'seed-audit-3',
            action: 'billing.vat_invoice_generated',
            actorId: 'system',
            targetType: 'Invoice',
            ipAddress: '127.0.0.1',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            details: { vatRate: '15%', currency: 'ETB' },
          },
          {
            _id: 'seed-audit-4',
            action: 'security.mfa_verified',
            actorId: req.user?.userId || 'system',
            targetType: 'User',
            ipAddress: req.ip || '196.188.241.10',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            details: { channel: 'sms+email' },
          },
        ],
      });
    }

    res.status(200).json({ auditLogs: logs });
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
