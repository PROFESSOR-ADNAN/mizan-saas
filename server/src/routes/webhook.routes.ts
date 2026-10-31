import { Router, Request, Response, NextFunction } from 'express';
import { WebhookService } from '../services/webhook.service.js';
import { CreateWebhookEndpointSchema } from '@mizan/shared';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = Router({ mergeParams: true });

router.get('/endpoints', requirePermission('webhooks:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const endpoints = await WebhookService.listEndpoints(req.orgId!);
    res.status(200).json({ endpoints });
  } catch (err) {
    next(err);
  }
});

router.post('/endpoints', requirePermission('webhooks:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateWebhookEndpointSchema.parse(req.body);
    const result = await WebhookService.createEndpoint(req.orgId!, data);
    await recordAuditLog(req, 'webhook.created', 'WebhookEndpoint', result.endpoint.id, { url: data.url });

    res.status(201).json({
      endpoint: result.endpoint,
      signingSecret: result.rawSecret,
      warning: 'Store this webhook signing secret securely. It will never be shown again.',
    });
  } catch (err) {
    next(err);
  }
});

router.get('/deliveries', requirePermission('webhooks:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deliveries = await WebhookService.listDeliveries(req.orgId!, req.query.endpointId as string);
    res.status(200).json({ deliveries });
  } catch (err) {
    next(err);
  }
});

router.post('/endpoints/:endpointId/test-ping', requirePermission('webhooks:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const delivery = await WebhookService.testPing(req.orgId!, req.params.endpointId);
    res.status(200).json({ message: 'Test ping enqueued', deliveryId: delivery._id });
  } catch (err) {
    next(err);
  }
});

export default router;
