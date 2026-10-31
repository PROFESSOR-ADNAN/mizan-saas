import { Router, Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../services/apikey.service.js';
import { CreateApiKeySchema } from '@mizan/shared';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = Router({ mergeParams: true });

router.get('/', requirePermission('apikeys:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keys = await ApiKeyService.listApiKeys(req.orgId!);
    res.status(200).json({ apiKeys: keys });
  } catch (err) {
    next(err);
  }
});

router.post('/', requirePermission('apikeys:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateApiKeySchema.parse(req.body);
    const { apiKeyDoc, plaintextKey } = await ApiKeyService.createApiKey(req.orgId!, data);
    await recordAuditLog(req, 'apikey.created', 'ApiKey', apiKeyDoc._id.toString(), { name: data.name });

    res.status(201).json({
      apiKey: apiKeyDoc,
      plaintextKey, // Returned exactly once upon generation!
      warning: 'Store this key securely. It will never be displayed again.',
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:keyId', requirePermission('apikeys:manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ApiKeyService.revokeApiKey(req.orgId!, req.params.keyId);
    await recordAuditLog(req, 'apikey.revoked', 'ApiKey', req.params.keyId);
    res.status(200).json({ message: 'API key revoked successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
