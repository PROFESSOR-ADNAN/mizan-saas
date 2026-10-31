import { dataSourceRepo } from '../models/DataSource.js';
import { NotFoundError } from '../utils/errors.js';

export class DataSourceService {
  static async list(orgId: string): Promise<any[]> {
    return dataSourceRepo.find(orgId, {});
  }

  static async create(orgId: string, data: { name: string; type?: any; description?: string }): Promise<any> {
    return dataSourceRepo.create(orgId, {
      name: data.name,
      type: data.type || 'pos',
      description: data.description,
    });
  }

  static async getById(orgId: string, id: string): Promise<any> {
    const doc = await dataSourceRepo.findById(orgId, id);
    if (!doc) throw new NotFoundError('Data source not found');
    return doc;
  }
}
