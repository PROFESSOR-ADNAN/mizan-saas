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

router.get('/forecast', requirePermission('data:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forecast = await AnalyticsService.getDemandForecast(req.orgId!);
    res.status(200).json({ forecast });
  } catch (err) {
    next(err);
  }
});

router.get('/anomalies', requirePermission('data:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const anomalies = await AnalyticsService.detectAnomalies(req.orgId!);
    res.status(200).json({ anomalies });
  } catch (err) {
    next(err);
  }
});

router.get('/rfm', requirePermission('data:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rfm = await AnalyticsService.getRFMAnalysis(req.orgId!);
    res.status(200).json(rfm);
  } catch (err) {
    next(err);
  }
});

router.get('/heatmap', requirePermission('data:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const heatmap = await AnalyticsService.getTradingHeatmap(req.orgId!);
    res.status(200).json({ heatmap });
  } catch (err) {
    next(err);
  }
});

export default router;
