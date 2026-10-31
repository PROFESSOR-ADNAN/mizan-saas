import { Router, Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { CreateShareLinkSchema } from '@mizan/shared';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = Router({ mergeParams: true });

router.get('/', requirePermission('dashboards:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboards = await DashboardService.list(req.orgId!);
    res.status(200).json({ dashboards });
  } catch (err) {
    next(err);
  }
});

router.get('/:dashboardId', requirePermission('dashboards:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboard = await DashboardService.getById(req.orgId!, req.params.dashboardId);
    res.status(200).json({ dashboard });
  } catch (err) {
    next(err);
  }
});

router.post('/', requirePermission('dashboards:write'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboard = await DashboardService.create(req.orgId!, req.body);
    await recordAuditLog(req, 'dashboard.created', 'Dashboard', dashboard._id.toString());
    res.status(201).json({ dashboard });
  } catch (err) {
    next(err);
  }
});

router.patch('/:dashboardId', requirePermission('dashboards:write'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboard = await DashboardService.update(req.orgId!, req.params.dashboardId, req.body);
    await recordAuditLog(req, 'dashboard.updated', 'Dashboard', req.params.dashboardId);
    res.status(200).json({ dashboard });
  } catch (err) {
    next(err);
  }
});

router.delete('/:dashboardId', requirePermission('dashboards:delete'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await DashboardService.delete(req.orgId!, req.params.dashboardId);
    await recordAuditLog(req, 'dashboard.deleted', 'Dashboard', req.params.dashboardId);
    res.status(200).json({ message: 'Dashboard deleted successfully' });
  } catch (err) {
    next(err);
  }
});

router.post('/:dashboardId/share', requirePermission('dashboards:share'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { expiresInDays } = CreateShareLinkSchema.parse(req.body);
    const { token, expiresAt } = await DashboardService.createShareLink(req.orgId!, req.params.dashboardId, expiresInDays);
    await recordAuditLog(req, 'dashboard.share_created', 'ShareLink', req.params.dashboardId, { expiresInDays });

    res.status(201).json({
      shareToken: token,
      shareUrl: `${process.env.WEB_BASE_URL || 'http://localhost:5173'}/share/${token}`,
      expiresAt,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
