import { Request } from 'express';
import { AuditLogModel } from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

export async function recordAuditLog(
  req: Request,
  action: string,
  targetType: string,
  targetId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const orgId = req.orgId;
  const actorId = req.user?.userId || req.apiKey?.id || 'system';

  if (!orgId) {
    logger.warn({ action, targetType }, 'Attempted to record audit log without orgId');
    return;
  }

  try {
    await AuditLogModel.create({
      orgId,
      actorId,
      action,
      targetType,
      targetId,
      details,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) {
    logger.error({ err, action, orgId }, 'Failed to write audit log entry');
  }
}
