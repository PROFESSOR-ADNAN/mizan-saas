/**
 * Mizan Official TypeScript / Node.js Client SDK
 * Production-grade ingestion & analytics client for Ethiopian Businesses
 */

export interface MizanEvent {
  eventId: string;
  type: 'sale' | 'expense' | 'refund';
  amount: number; // In Ethiopian Santim (1 ETB = 100 Santims)
  currency?: 'ETB';
  channel?: 'telebirr' | 'cbebirr' | 'cash' | 'chapa' | 'card';
  branch?: string;
  occurredAt?: string;
  customerPhone?: string;
  items?: Array<{
    sku: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface IngestResponse {
  accepted: number;
  rejected: number;
  duplicates: number;
  processingTimeMs: number;
}

export class MizanClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(options: { apiKey: string; baseUrl?: string }) {
    if (!options.apiKey) {
      throw new Error('Mizan API key is required');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://mizan-api-3lif.onrender.com';
  }

  /**
   * Ingest a batch of point-of-sale transactions into Mizan in real-time.
   */
  async ingestEvents(events: MizanEvent[]): Promise<IngestResponse> {
    const res = await fetch(`${this.baseUrl}/ingest/v1/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mizan-Key': this.apiKey,
      },
      body: JSON.stringify({ events }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(`Mizan Ingest Error (${res.status}): ${errBody.detail || errBody.message || res.statusText}`);
    }

    return res.json() as Promise<IngestResponse>;
  }

  /**
   * Helper to convert Ethiopian Birr (ETB) into santim integers.
   */
  static etbToSantim(etbAmount: number): number {
    return Math.round(etbAmount * 100);
  }

  /**
   * Helper to convert Santims back into ETB with 2 decimal places.
   */
  static santimToEtb(santimAmount: number): number {
    return santimAmount / 100;
  }
}
