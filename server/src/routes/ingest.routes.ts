import { Router, Request, Response, NextFunction } from 'express';
import { IngestService } from '../services/ingest.service.js';
import { AnalyticsService } from '../services/analytics.service.js';
import { BillingService } from '../services/billing.service.js';
import { IngestBatchSchema, IngestEventSchema, MetricQuerySchema } from '@mizan/shared';
import { requireApiKey } from '../middleware/apiKeyAuth.js';

const router = Router();

// Batch Event Ingestion Endpoint
router.post(
  '/events',
  requireApiKey('ingest:write'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Allow single event or batch array
      let rawEvents: any[];
      if (Array.isArray(req.body)) {
        rawEvents = req.body;
      } else if (Array.isArray(req.body.events)) {
        rawEvents = req.body.events;
      } else {
        rawEvents = [req.body];
      }

      if (rawEvents.length > 100) {
        res.status(400).json({ message: 'Maximum batch size is 100 events' });
        return;
      }

      const parsedEvents = rawEvents.map((e) => IngestEventSchema.parse(e));

      const sourceId = req.apiKey!.sourceId || (req.headers['x-source-id'] as string) || 'default_source';

      const result = await IngestService.processBatch(req.orgId!, sourceId, parsedEvents);

      res.status(202).json({
        accepted: result.accepted,
        duplicates: result.duplicates,
        rejected: result.rejected,
        results: result.results,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Quota & Usage Endpoint
router.get(
  '/usage',
  requireApiKey(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const meters = await BillingService.getUsageMeters(req.orgId!);
      res.setHeader('X-Quota-Remaining', Math.max(0, meters.includedEvents - meters.eventsIngested));
      res.status(200).json({ usage: meters });
    } catch (err) {
      next(err);
    }
  }
);

// Key-Authenticated Metrics Read Endpoint
router.get(
  '/metrics',
  requireApiKey('data:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = MetricQuerySchema.parse({
        metric: req.query.metric,
        granularity: req.query.granularity,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        channel: req.query.channel,
        branch: req.query.branch,
      });

      const data = await AnalyticsService.queryMetrics(req.orgId!, null, {
        metric: parsed.metric,
        granularity: parsed.granularity,
        startDate: new Date(parsed.startDate),
        endDate: new Date(parsed.endDate),
        channel: parsed.channel,
        branch: parsed.branch,
      });

      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
