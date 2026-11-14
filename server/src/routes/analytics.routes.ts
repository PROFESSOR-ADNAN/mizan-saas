import { Router, Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';
import { MetricQuerySchema } from '@mizan/shared';
import { requirePermission } from '../middleware/rbac.js';

const router = Router({ mergeParams: true });

router.get('/query', requirePermission('data:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = MetricQuerySchema.parse({
      metric: req.query.metric,
      granularity: req.query.granularity,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      channel: req.query.channel,
      branch: req.query.branch,
      sourceId: req.query.sourceId,
    });

    const data = await AnalyticsService.queryMetrics(req.orgId!, req.user?.userId || null, {
      metric: parsed.metric,
      granularity: parsed.granularity,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      channel: parsed.channel,
      branch: parsed.branch,
      sourceId: parsed.sourceId,
    });

    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
});

router.get('/branches', requirePermission('data:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branches = await AnalyticsService.queryBranchBreakdown(req.orgId!);
    res.status(200).json({ branches });
  } catch (err) {
    next(err);
  }
});

export default router;
