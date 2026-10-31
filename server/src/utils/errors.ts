/**
 * RFC 9457 Problem Details Error Hierarchy
 */

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  invalidParams?: Array<{ name: string; reason: string }>;
  code?: string;
}

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly invalidParams?: Array<{ name: string; reason: string }>;

  constructor(
    message: string,
    status = 500,
    code = 'INTERNAL_ERROR',
    invalidParams?: Array<{ name: string; reason: string }>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.invalidParams = invalidParams;
    Error.captureStackTrace(this, this.constructor);
  }

  toProblemDetails(instance?: string): ProblemDetails {
    return {
      type: `https://mizan.et/problems/${this.code.toLowerCase().replace(/_/g, '-')}`,
      title: this.name.replace(/([A-Z])/g, ' $1').trim(),
      status: this.status,
      detail: this.message,
      instance,
      code: this.code,
      invalidParams: this.invalidParams,
    };
  }
}

export class TenantScopeError extends AppError {
  constructor(message = 'Tenant isolation violation: orgId is strictly required for this operation') {
    super(message, 500, 'TENANT_SCOPE_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', invalidParams?: Array<{ name: string; reason: string }>) {
    super(message, 422, 'VALIDATION_ERROR', invalidParams);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class StateTransitionError extends AppError {
  constructor(message = 'Invalid state transition') {
    super(message, 400, 'INVALID_STATE_TRANSITION');
  }
}
