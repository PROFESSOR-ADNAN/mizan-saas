import { Model, FilterQuery, UpdateQuery, Document } from 'mongoose';
import { TenantScopeError } from '../utils/errors.js';

export interface UnscopedPlatformJobOps<T> {
  find: (filter: FilterQuery<T>, proj?: any, opts?: any) => any;
  findOne: (filter: FilterQuery<T>, proj?: any, opts?: any) => any;
  count: (filter: FilterQuery<T>, opts?: any) => any;
  aggregate: (pipeline: any[]) => any;
}

export class TenantRepository<T extends Document = any> {
  constructor(private readonly model: Model<T>) {}

  private validateOrgId(orgId: string | unknown): string {
    if (!orgId || (typeof orgId !== 'string' && typeof (orgId as any).toString !== 'function')) {
      throw new TenantScopeError(`TenantRepository[${this.model.modelName}]: Valid orgId is required.`);
    }
    return orgId.toString();
  }

  async find(
    orgId: string,
    filter: FilterQuery<T> = {},
    projection?: any,
    options: any = {}
  ): Promise<T[]> {
    const validOrgId = this.validateOrgId(orgId);
    return this.model.find({ ...filter, orgId: validOrgId } as FilterQuery<T>, projection, options) as unknown as Promise<T[]>;
  }

  async findOne(
    orgId: string,
    filter: FilterQuery<T> = {},
    projection?: any,
    options: any = {}
  ): Promise<T | null> {
    const validOrgId = this.validateOrgId(orgId);
    return this.model.findOne({ ...filter, orgId: validOrgId } as FilterQuery<T>, projection, options) as unknown as Promise<T | null>;
  }

  async findById(
    orgId: string,
    id: string,
    projection?: any,
    options: any = {}
  ): Promise<T | null> {
    const validOrgId = this.validateOrgId(orgId);
    return this.model.findOne({ _id: id, orgId: validOrgId } as FilterQuery<T>, projection, options) as unknown as Promise<T | null>;
  }

  async create(orgId: string, data: Partial<T>): Promise<T> {
    const validOrgId = this.validateOrgId(orgId);
    return this.model.create({ ...data, orgId: validOrgId });
  }

  async insertMany(orgId: string, docs: Partial<T>[], options: any = {}): Promise<T[]> {
    const validOrgId = this.validateOrgId(orgId);
    const tenantDocs = docs.map((d) => ({ ...d, orgId: validOrgId }));
    return (this.model.insertMany as any)(tenantDocs, options);
  }

  async updateOne(
    orgId: string,
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: any = {}
  ): Promise<any> {
    const validOrgId = this.validateOrgId(orgId);
    return this.model.updateOne({ ...filter, orgId: validOrgId } as FilterQuery<T>, update, options);
  }

  async updateMany(
    orgId: string,
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: any = {}
  ): Promise<any> {
    const validOrgId = this.validateOrgId(orgId);
    return this.model.updateMany({ ...filter, orgId: validOrgId } as FilterQuery<T>, update, options);
  }

  async deleteOne(orgId: string, filter: FilterQuery<T>, options: any = {}): Promise<any> {
    const validOrgId = this.validateOrgId(orgId);
    return this.model.deleteOne({ ...filter, orgId: validOrgId } as FilterQuery<T>, options);
  }

  async deleteMany(orgId: string, filter: FilterQuery<T>, options: any = {}): Promise<any> {
    const validOrgId = this.validateOrgId(orgId);
    return this.model.deleteMany({ ...filter, orgId: validOrgId } as FilterQuery<T>, options);
  }

  async count(orgId: string, filter: FilterQuery<T> = {}, options: any = {}): Promise<number> {
    const validOrgId = this.validateOrgId(orgId);
    return this.model.countDocuments({ ...filter, orgId: validOrgId } as FilterQuery<T>, options);
  }

  async aggregate<R = any>(
    orgId: string,
    pipeline: any[],
    options: any = {}
  ): Promise<R[]> {
    const validOrgId = this.validateOrgId(orgId);
    // Prepend $match: { orgId }
    const scopedPipeline: any[] = [
      { $match: { orgId: validOrgId } },
      ...pipeline,
    ];
    const agg = this.model.aggregate(scopedPipeline, options);
    (agg as any)._orgId = validOrgId;
    return agg.exec();
  }

  /**
   * Escape hatch for platform background jobs (such as billing-cycle and reconciliation).
   */
  unscopedForPlatformJob(jobName: string): UnscopedPlatformJobOps<T> {
    return {
      find: (filter: FilterQuery<T>, proj?: any, opts: any = {}) =>
        this.model.find(filter, proj, { ...opts, unscopedForPlatformJob: true, platformJobName: jobName }),
      findOne: (filter: FilterQuery<T>, proj?: any, opts: any = {}) =>
        this.model.findOne(filter, proj, { ...opts, unscopedForPlatformJob: true, platformJobName: jobName }),
      count: (filter: FilterQuery<T>, opts: any = {}) =>
        this.model.countDocuments(filter, { ...opts, unscopedForPlatformJob: true, platformJobName: jobName }),
      aggregate: (pipeline: any[]) =>
        this.model.aggregate(pipeline).option({ unscopedForPlatformJob: true, platformJobName: jobName }),
    };
  }
}
