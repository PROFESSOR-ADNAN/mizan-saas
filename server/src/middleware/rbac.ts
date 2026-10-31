import { Request, Response, NextFunction } from 'express';
import { Permission, hasPermission } from '@mizan/shared';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.membership) {
      throw new UnauthorizedError('Organization membership context is required');
    }

    const role = req.membership.role;
    if (!hasPermission(role, permission)) {
      throw new ForbiddenError(
        `Permission denied: Role '${role}' lacks required permission '${permission}'`
      );
    }

    next();
  };
}
