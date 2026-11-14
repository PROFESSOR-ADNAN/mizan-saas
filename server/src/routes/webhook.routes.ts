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

// SSRF Guard Security Verifier Demonstration Endpoint
router.post('/verify-target-url', async (req: Request, res: Response) => {
  try {
    const url = req.body.url;
    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }
    const { isPrivateOrRestrictedIp } = await import('../utils/ssrfGuard.js');
    const dns = await import('node:dns/promises');
    const parsed = new URL(url);
    const addresses = await dns.lookup(parsed.hostname, { all: true });
    const blocked = addresses.some((a) => isPrivateOrRestrictedIp(a.address));

    res.status(200).json({
      url,
      hostname: parsed.hostname,
      resolvedIps: addresses.map((a) => a.address),
      isBlocked: blocked,
      verdict: blocked ? 'BLOCKED_BY_SSRF_GUARD' : 'PERMITTED_PUBLIC_ENDPOINT',
      reason: blocked ? 'Resolves to private, loopback, or cloud metadata IP address' : 'Legitimate public IP',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
