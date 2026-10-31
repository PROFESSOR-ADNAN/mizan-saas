import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../utils/errors.js';
import { MembershipModel } from '../models/Membership.js';
import { OrganizationModel } from '../models/Organization.js';
import { redis } from '../config/redis.js';
import { OrgRole } from '@mizan/shared';
import { logger } from '../utils/logger.js';

export interface OrgMembershipContext {
  role: OrgRole;
  orgId: string;
}

declare global {
  namespace Express {
    interface Request {
      orgId?: string;
      membership?: OrgMembershipContext;
    }
  }
}

export async function requireOrgMembership(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const orgId = req.params.orgId;
  const userId = req.user?.userId;

  if (!orgId || !userId) {
    throw new NotFoundError('Organization not found');
  }

  try {
    // 1. Check fast Redis permission cache (TTL 60s)
    const cacheKey = `perm:${userId}:${orgId}`;
    const cachedRole = await redis.get(cacheKey);

    if (cachedRole) {
      req.orgId = orgId;
      req.membership = {
        orgId,
        role: cachedRole as OrgRole,
      };
      return next();
    }

    // 2. Query MongoDB for active membership using platform escape hatch
    // (Membership query must be unscoped because we are establishing the user's scope)
    const membership = await MembershipModel.findOne(
      { orgId, userId },
      null,
      { unscopedForPlatformJob: true, platformJobName: 'auth_membership_resolution' } as any
    );

    if (!membership) {
      logger.warn(
        { userId, orgId, ip: req.ip },
        'CROSS_TENANT_ACCESS_PREVENTED: Membership check failed, returning 404'
      );
      // Decision 3: Cross-tenant access returns 404, never 403
      throw new NotFoundError('Organization not found');
    }

    // 3. Verify organization exists and is not hard deleted
    const org = await OrganizationModel.findById(orgId);
    if (!org || org.status === 'deleted') {
      throw new NotFoundError('Organization not found');
    }

    // 4. Cache role in Redis for 60 seconds
    await redis.set(cacheKey, membership.role, 'EX', 60);

    req.orgId = orgId;
    req.membership = {
      orgId,
      role: membership.role as OrgRole,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Invalidate cached membership role in Redis on role update or member removal.
 */
export async function invalidateMembershipCache(userId: string, orgId: string): Promise<void> {
  await redis.del(`perm:${userId}:${orgId}`);
}
