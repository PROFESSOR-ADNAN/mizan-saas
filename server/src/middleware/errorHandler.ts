import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ProblemDetails } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req.headers['x-request-id'] as string) || req.id || 'req_unknown';

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const invalidParams = err.issues.map((issue) => ({
      name: issue.path.join('.'),
      reason: issue.message,
    }));

    const problem: ProblemDetails = {
      type: 'https://mizan.et/problems/validation-error',
      title: 'Validation Failed',
      status: 422,
      detail: 'The submitted request payload failed schema validation.',
      instance: req.originalUrl,
      code: 'VALIDATION_ERROR',
      invalidParams,
    };

    res.setHeader('Content-Type', 'application/problem+json');
    res.status(422).json(problem);
    return;
  }

  // Handle Mizan AppErrors (TenantScopeError, NotFoundError, ForbiddenError, etc.)
  if (err instanceof AppError) {
    if (err.status >= 500) {
      logger.error({ err, requestId, path: req.originalUrl }, err.message);
    } else {
      logger.warn({ code: err.code, status: err.status, requestId, path: req.originalUrl }, err.message);
    }

    const problem = err.toProblemDetails(req.originalUrl);
    res.setHeader('Content-Type', 'application/problem+json');
    res.status(err.status).json(problem);
    return;
  }

  // Handle MongoDB / Mongoose duplicate key errors
  if (err.code === 11000) {
    const key = Object.keys(err.keyPattern || {})[0] || 'resource';
    const problem: ProblemDetails = {
      type: 'https://mizan.et/problems/conflict',
      title: 'Resource Conflict',
      status: 409,
      detail: `A record with this ${key} already exists.`,
      instance: req.originalUrl,
      code: 'DUPLICATE_KEY_CONFLICT',
    };

    res.setHeader('Content-Type', 'application/problem+json');
    res.status(409).json(problem);
    return;
  }

  // Unhandled internal server errors
  logger.error({ err, requestId, path: req.originalUrl }, 'Unhandled internal server exception');

  const problem: ProblemDetails = {
    type: 'https://mizan.et/problems/internal-server-error',
    title: 'Internal Server Error',
    status: 500,
    detail: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please contact support with the request ID.'
      : err.message || 'Unknown internal error',
    instance: req.originalUrl,
    code: 'INTERNAL_ERROR',
  };

  res.setHeader('Content-Type', 'application/problem+json');
  res.status(500).json(problem);
}
