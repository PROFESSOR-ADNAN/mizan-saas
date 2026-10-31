import { WebhookEndpointModel } from '../../../server/dist/models/WebhookEndpoint.js';
import { WebhookDeliveryModel } from '../../../server/dist/models/WebhookDelivery.js';
import { decryptSecret, signHmac } from '../../../server/dist/utils/crypto.js';
import { safeHttpRequest } from '../utils/ssrfGuard.js';
import { config } from '../../../server/dist/config/index.js';
import { logger } from '../../../server/dist/utils/logger.js';

export async function dispatchWebhookJob(deliveryId: string): Promise<boolean> {
  const delivery = await WebhookDeliveryModel.findById(deliveryId);
  if (!delivery || delivery.status === 'delivered') return true;

  const endpoint = await WebhookEndpointModel.findById(delivery.endpointId);
  if (!endpoint || !endpoint.enabled) {
    delivery.status = 'failed';
    await delivery.save();
    return false;
  }

  let rawSecret: string;
  try {
    rawSecret = decryptSecret(endpoint.secretEncrypted, config.WEBHOOK_SIGNING_MASTER_KEY);
  } catch (err) {
    logger.error({ err, endpointId: endpoint._id }, 'Failed to decrypt webhook endpoint secret');
    return false;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(delivery.payload);
  const signaturePayload = `${timestamp}.${payloadString}`;
  const signature = signHmac(signaturePayload, rawSecret);

  try {
    const response = await safeHttpRequest(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mizan-Event': delivery.eventType,
        'X-Mizan-Delivery-Id': delivery._id.toString(),
        'X-Mizan-Signature': `t=${timestamp},v1=${signature}`,
      },
      body: payloadString,
    });

    const isSuccess = response.statusCode >= 200 && response.statusCode < 300;

    delivery.statusCode = response.statusCode;
    delivery.durationMs = response.durationMs;
    delivery.responseBodySnippet = response.body;

    if (isSuccess) {
      delivery.status = 'delivered';
      endpoint.consecutiveFailures = 0;
      await Promise.all([delivery.save(), endpoint.save()]);
      return true;
    } else {
      delivery.attempt += 1;
      endpoint.consecutiveFailures += 1;

      if (endpoint.consecutiveFailures >= 20) {
        endpoint.enabled = false;
        endpoint.lastFailureReason = 'AUTO_DISABLED_AFTER_20_FAILURES';
        logger.warn({ endpointId: endpoint._id }, 'Webhook endpoint auto-disabled after 20 consecutive failures');
      }

      await Promise.all([delivery.save(), endpoint.save()]);
      return false;
    }
  } catch (err: any) {
    logger.warn({ err: err.message, endpointId: endpoint._id }, 'Webhook dispatch failed or blocked by SSRF guard');
    delivery.attempt += 1;
    delivery.status = err.name === 'SSRFSecurityError' ? 'aborted_security_violation' : 'failed';
    delivery.responseBodySnippet = err.message;
    await delivery.save();
    return false;
  }
}
