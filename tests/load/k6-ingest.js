import http from 'k6/http';
import { check, sleep } from 'k6';

// 1,000 req/sec Sustained Ingestion Benchmark for Mizan
export const options = {
  stages: [
    { duration: '30s', target: 200 },  // Ramp up to 200 VUs
    { duration: '1m', target: 500 },   // Sustain 500 VUs (~1,000 req/sec)
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<40'],   // 95% of requests must complete below 40ms
    http_req_failed: ['rate<0.01'],    // Error rate must be under 1%
  },
};

const BASE_URL = __ENV.MIZAN_API_URL || 'https://mizan-api-3lif.onrender.com';
const API_KEY = __ENV.MIZAN_API_KEY || 'mzn_live_demo_test_key_here';

const CHANNELS = ['telebirr', 'cbebirr', 'cash', 'chapa'];
const BRANCHES = ['Bole Road Mega Mall', 'Piassa Churchill Ave', 'Sarbet Old Airport', 'CMC Micheal Square'];

export default function () {
  const channel = CHANNELS[Math.floor(Math.random() * CHANNELS.length)];
  const branch = BRANCHES[Math.floor(Math.random() * BRANCHES.length)];
  const amount = Math.floor(Math.random() * 50000) + 5000; // 50 to 500 ETB in santim

  const payload = JSON.stringify({
    events: [
      {
        eventId: `k6_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: 'sale',
        amount: amount,
        currency: 'ETB',
        channel: channel,
        branch: branch,
        occurredAt: new Date().toISOString(),
        items: [
          { sku: 'COF-YIRG-01', name: 'Yirgacheffe Coffee', quantity: 1, price: amount }
        ]
      }
    ]
  });

  const headers = {
    'Content-Type': 'application/json',
    'X-Mizan-Key': API_KEY,
  };

  const res = http.post(`${BASE_URL}/ingest/v1/events`, payload, { headers });

  check(res, {
    'status is 202': (r) => r.status === 202,
    'latency is under 50ms': (r) => r.timings.duration < 50,
  });

  sleep(0.1);
}
