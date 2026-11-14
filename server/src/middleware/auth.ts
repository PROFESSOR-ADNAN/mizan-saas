import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { PlatformRole } from '@mizan/shared';

export interface AuthenticatedUser {
  userId: string;
  platformRole: PlatformRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      id?: string;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    throw new UnauthorizedError('Authentication token is required');
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      sub: string;
      role: PlatformRole;
    };

    req.user = {
      userId: decoded.sub,
      platformRole: decoded.role || 'user',
    };

    next();
  } catch (_err) {
    throw new UnauthorizedError('Invalid or expired authentication token');
  }
}

export function requirePlatformAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.platformRole !== 'platform_admin') {
    throw new ForbiddenError('Platform administrator privileges required');
  }
  next();
}
