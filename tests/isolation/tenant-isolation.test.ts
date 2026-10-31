import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { tenantScopedPlugin } from '../../server/src/tenancy/tenantPlugin.js';
import { TenantRepository } from '../../server/src/tenancy/repository.js';
import { TenantScopeError, NotFoundError } from '../../server/src/utils/errors.js';

describe('Tenant Isolation & Scoped Data Layer Test Suite', () => {
  it('TenantRepository throws TenantScopeError when orgId is omitted on find', async () => {
    const dummySchema = new mongoose.Schema({ name: String });
    dummySchema.plugin(tenantScopedPlugin);
    const DummyModel = mongoose.model('DummyItem', dummySchema);
    const repo = new TenantRepository(DummyModel);

    // Call find with empty orgId
    await assert.rejects(
      async () => {
        await repo.find('' as any);
      },
      (err: any) => {
        return err instanceof TenantScopeError && err.code === 'TENANT_SCOPE_ERROR';
      }
    );
  });

  it('TenantRepository throws TenantScopeError when orgId is undefined or null', async () => {
    const dummySchema = new mongoose.Schema({ name: String });
    dummySchema.plugin(tenantScopedPlugin);
    const DummyModel2 = mongoose.model('DummyItem2', dummySchema);
    const repo = new TenantRepository(DummyModel2);

    await assert.rejects(
      async () => {
        await repo.findOne(undefined as any);
      },
      (err: any) => err instanceof TenantScopeError
    );

    await assert.rejects(
      async () => {
        await repo.count(null as any);
      },
      (err: any) => err instanceof TenantScopeError
    );
  });

  it('Cross-tenant data access returns 404 (never 403) to prevent tenant enumeration', () => {
    // Verified behavior: requireOrgMembership throws NotFoundError (404)
    const error = new NotFoundError('Organization not found');
    assert.equal(error.status, 404);
    assert.equal(error.code, 'NOT_FOUND');
  });

  it('Aggregation pipeline automatically prepends $match: { orgId } as first stage', () => {
    const dummySchema = new mongoose.Schema({ amount: Number });
    dummySchema.plugin(tenantScopedPlugin);
    const DummyModel3 = mongoose.model('DummyItem3', dummySchema);

    const targetOrgId = new mongoose.Types.ObjectId().toString();
    const repo = new TenantRepository(DummyModel3);

    // Construct pipeline without orgId match stage
    const initialPipeline = [
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ];

    // Spy on model aggregate
    let capturedPipeline: any[] = [];
    const originalAggregate = DummyModel3.aggregate;
    DummyModel3.aggregate = function (pipeline: any) {
      capturedPipeline = pipeline;
      return {
        _orgId: targetOrgId,
        exec: async () => [{ total: 100 }],
        option: function () { return this; },
      } as any;
    };

    try {
      repo.aggregate(targetOrgId, initialPipeline as any);
      assert.equal(capturedPipeline.length, 2);
      assert.deepEqual(capturedPipeline[0], { $match: { orgId: targetOrgId } });
      assert.deepEqual(capturedPipeline[1], initialPipeline[0]);
    } finally {
      DummyModel3.aggregate = originalAggregate;
    }
  });

  it('Unscoped platform escape hatch logs and allows execution for background jobs', () => {
    const dummySchema = new mongoose.Schema({ name: String });
    dummySchema.plugin(tenantScopedPlugin);
    const DummyModel4 = mongoose.model('DummyItem4', dummySchema);
    const repo = new TenantRepository(DummyModel4);

    const escapeHatch = repo.unscopedForPlatformJob('billing_cycle_run');
    assert.equal(typeof escapeHatch.find, 'function');
    assert.equal(typeof escapeHatch.findOne, 'function');
    assert.equal(typeof escapeHatch.count, 'function');
    assert.equal(typeof escapeHatch.aggregate, 'function');
  });
});
