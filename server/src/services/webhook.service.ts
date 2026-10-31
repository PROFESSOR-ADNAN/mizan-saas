import crypto from 'node:crypto';
import { webhookEndpointRepo, WebhookEndpointModel } from '../models/WebhookEndpoint.js';
import { webhookDeliveryRepo, WebhookDeliveryModel } from '../models/WebhookDelivery.js';
import { encryptSecret } from '../utils/crypto.js';
import { config } from '../config/index.js';
import { NotFoundError } from '../utils/errors.js';

export class WebhookService {
  static async listEndpoints(orgId: string): Promise<any[]> {
    return webhookEndpointRepo.find(orgId, {}, { secretEncrypted: 0 });
  }

  static async createEndpoint(
    orgId: string,
    data: { url: string; events: string[] }
  ): Promise<{ endpoint: any; rawSecret: string }> {
    const rawSecret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    const secretEncrypted = encryptSecret(rawSecret, config.WEBHOOK_SIGNING_MASTER_KEY);

    const endpoint = await webhookEndpointRepo.create(orgId, {
      url: data.url,
      events: data.events,
      secretEncrypted,
      enabled: true,
    });

    return {
      endpoint: {
        id: endpoint._id,
        url: endpoint.url,
        events: endpoint.events,
        enabled: endpoint.enabled,
        createdAt: endpoint.createdAt,
      },
      rawSecret,
    };
  }

  static async listDeliveries(orgId: string, endpointId?: string): Promise<any[]> {
    const filter: any = {};
    if (endpointId) filter.endpointId = endpointId;
    return webhookDeliveryRepo.find(orgId, filter, null, {
      sort: { createdAt: -1 },
      limit: 50,
    });
  }

  static async testPing(orgId: string, endpointId: string): Promise<any> {
    const endpoint = await webhookEndpointRepo.findById(orgId, endpointId);
    if (!endpoint) throw new NotFoundError('Webhook endpoint not found');

    return webhookDeliveryRepo.create(orgId, {
      endpointId: endpoint._id as any,
      eventId: `ping_${Date.now()}`,
      eventType: 'ping',
      payload: { message: 'Mizan test webhook event ping' },
      status: 'pending',
      attempt: 1,
    });
  }
}
