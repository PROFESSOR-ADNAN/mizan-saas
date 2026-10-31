import { Schema, Query, Aggregate } from 'mongoose';
import { TenantScopeError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface TenantScopedOptions {
  unscopedForPlatformJob?: boolean;
  platformJobName?: string;
}

/**
 * Mongoose plugin that enforces tenant isolation at the database query level.
 * Prevents any query or mutation from executing without a valid orgId,
 * unless explicitly bypassed with unscopedForPlatformJob: true (which is logged).
 */
export function tenantScopedPlugin(schema: Schema): void {
  // Ensure orgId exists on the schema and is indexed
  if (!schema.path('orgId')) {
    schema.add({
      orgId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
      },
    });
  }

  // List of query operations to intercept
  const queryOps = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'findOneAndDelete',
    'findOneAndReplace',
    'updateOne',
    'updateMany',
    'deleteOne',
    'deleteMany',
    'countDocuments',
    'estimatedDocumentCount',
  ];

  for (const op of queryOps) {
    schema.pre(op as any, function (this: Query<any, any>) {
      const options = this.getOptions() as TenantScopedOptions;

      // Platform escape hatch for background billing/reconciliation jobs
      if (options && options.unscopedForPlatformJob) {
        logger.info(
          {
            model: this.model.modelName,
            op,
            job: options.platformJobName || 'unnamed_platform_job',
          },
          'UNSCOPED_PLATFORM_JOB_ESCAPE_HATCH_INVOKED'
        );
        return;
      }

      const filter = this.getFilter();
      if (!filter || !filter.orgId) {
        logger.error(
          {
            model: this.model.modelName,
            op,
            filter,
          },
          'TENANT_ISOLATION_VIOLATION_PREVENTED: Missing orgId on query'
        );
        throw new TenantScopeError(
          `TenantScopeError: Query on model '${this.model.modelName}' attempted without orgId filter.`
        );
      }
    });
  }

  // Pre-aggregate hook: Inject $match: { orgId } as the very first pipeline stage
  schema.pre('aggregate', function (this: Aggregate<any>) {
    const options = (this as any).options as TenantScopedOptions;

    if (options && options.unscopedForPlatformJob) {
      logger.info(
        {
          model: (this as any)._model?.modelName || 'UnknownModel',
          job: options.platformJobName || 'unnamed_platform_job',
        },
        'UNSCOPED_PLATFORM_JOB_AGGREGATION_ESCAPE_HATCH'
      );
      return;
    }

    const pipeline = this.pipeline();
    const firstStage = pipeline[0] as any;

    // Check if first stage is already a match on orgId
    const hasOrgIdMatch =
      firstStage &&
      firstStage.$match &&
      firstStage.$match.orgId !== undefined;

    if (!hasOrgIdMatch) {
      // Look for orgId in options passed to aggregate()
      const orgId = (this as any)._orgId || (options as any)?.orgId;
      if (!orgId) {
        logger.error(
          {
            model: (this as any)._model?.modelName || 'UnknownModel',
            pipeline,
          },
          'TENANT_ISOLATION_VIOLATION_PREVENTED: Aggregation pipeline missing orgId'
        );
        throw new TenantScopeError(
          `TenantScopeError: Aggregation on model '${(this as any)._model?.modelName}' missing orgId in first $match stage.`
        );
      }

      // Prepend $match: { orgId }
      pipeline.unshift({ $match: { orgId } });
    }
  });
}
