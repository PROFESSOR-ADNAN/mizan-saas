import { parse } from 'csv-parse';
import { Readable } from 'node:stream';
import { importJobRepo, ImportJobModel } from '../models/ImportJob.js';
import { IngestService } from './ingest.service.js';
import { NotFoundError } from '../utils/errors.js';
import { sha256 } from '../utils/crypto.js';

export function sanitizeCsvField(field: unknown): string {
  if (field === null || field === undefined) return '';
  const str = String(field).trim();
  // Neutralize formula injection
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

export class ImportService {
  /**
   * Processes uploaded CSV sales data using streaming to prevent memory exhaustion.
   */
  static async processCsvStream(
    orgId: string,
    sourceId: string,
    filename: string,
    csvStream: Readable
  ): Promise<any> {
    const job = await importJobRepo.create(orgId, {
      sourceId: sourceId as any,
      filename,
      status: 'processing',
      startedAt: new Date(),
    });

    const parser = csvStream.pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        bom: true, // UTF-8 BOM tolerance
        trim: true,
      })
    );

    let rowCount = 0;
    let accepted = 0;
    let duplicates = 0;
    let errors = 0;
    const batch: any[] = [];
    const errorRows: Array<{ row: number; error: string }> = [];

    try {
      for await (const record of parser) {
        rowCount++;

        // Map CSV fields
        const eventId = record.eventId || record.id || `csv_${sha256(JSON.stringify(record)).slice(0, 16)}`;
        const occurredAt = record.occurredAt || record.date || new Date().toISOString();
        const amount = record.amount ? Math.round(parseFloat(record.amount) * 100) : 0; // ETB to santim

        batch.push({
          eventId,
          type: record.type || 'sale',
          occurredAt,
          amount,
          currency: 'ETB',
          channel: record.channel,
          branch: record.branch,
          customerRef: record.customerRef,
        });

        if (batch.length >= 100) {
          const res = await IngestService.processBatch(orgId, sourceId, batch, { isBackfill: true });
          accepted += res.accepted;
          duplicates += res.duplicates;
          errors += res.rejected;
          batch.length = 0;
        }
      }

      if (batch.length > 0) {
        const res = await IngestService.processBatch(orgId, sourceId, batch, { isBackfill: true });
        accepted += res.accepted;
        duplicates += res.duplicates;
        errors += res.rejected;
      }

      job.status = 'completed';
      job.totalRows = rowCount;
      job.processedRows = rowCount;
      job.acceptedCount = accepted;
      job.duplicateCount = duplicates;
      job.errorCount = errors;
      job.completedAt = new Date();
      await job.save();

      return job;
    } catch (err: any) {
      job.status = 'failed';
      job.errorMessage = err.message;
      job.completedAt = new Date();
      await job.save();
      throw err;
    }
  }

  static async getJob(orgId: string, jobId: string): Promise<any> {
    const job = await importJobRepo.findById(orgId, jobId);
    if (!job) throw new NotFoundError('Import job not found');
    return job;
  }
}
