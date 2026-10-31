/**
 * Mizan High-Throughput Ingestion Load Test
 * Target: 500 events/sec sustained ingestion in batches of 100
 */
import http from 'node:http';

const INGEST_URL = process.env.INGEST_URL || 'http://localhost:4001/api/v1/ingest';
const API_KEY = process.env.LOAD_TEST_API_KEY || 'mzn_live_loadtestdummykey';
const DURATION_SECONDS = parseInt(process.env.DURATION_SEC || '10', 10);
const BATCH_SIZE = 100;
const BATCHES_PER_SEC = 5; // 5 * 100 = 500 events/sec

console.log('====================================================');
console.log(' Starting Mizan 500 evt/s Sustained Load Test');
console.log(` Target: ${INGEST_URL}`);
console.log(` Duration: ${DURATION_SECONDS}s, Batch Size: ${BATCH_SIZE}, Rate: 500 events/sec`);
console.log('====================================================');

let totalSent = 0;
let totalBatches = 0;
let successfulBatches = 0;
let failedBatches = 0;
const latencies = [];

function generateBatch(batchNum) {
  const events = [];
  const now = new Date().toISOString();
  for (let i = 0; i < BATCH_SIZE; i++) {
    events.push({
      eventId: `load_evt_${Date.now()}_${batchNum}_${i}`,
      type: i % 4 === 0 ? 'expense' : 'sale',
      timestamp: now,
      amountSantim: Math.floor(Math.random() * 50000) + 1000,
      currency: 'ETB',
      channel: ['pos', 'telegram', 'manual', 'website'][i % 4],
      branch: 'Main Shop',
      customer: {
        id: `cust_${i % 20}`,
        isRepeat: i % 3 === 0
      },
      items: [
        { sku: `SKU-${i % 10}`, name: `Item ${i % 10}`, quantity: 1, unitPriceSantim: 1000 }
      ]
    });
  }
  return JSON.stringify({ events });
}

function sendBatch(batchNum) {
  return new Promise((resolve) => {
    const payload = generateBatch(batchNum);
    const url = new URL(INGEST_URL);
    const start = performance.now();

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          const duration = performance.now() - start;
          latencies.push(duration);
          totalBatches++;
          totalSent += BATCH_SIZE;

          if (res.statusCode >= 200 && res.statusCode < 300) {
            successfulBatches++;
          } else {
            failedBatches++;
          }
          resolve();
        });
      }
    );

    req.on('error', () => {
      latencies.push(performance.now() - start);
      totalBatches++;
      totalSent += BATCH_SIZE;
      failedBatches++;
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

async function runLoadTest() {
  const startTime = Date.now();
  let batchCounter = 0;

  const interval = setInterval(async () => {
    if (Date.now() - startTime >= DURATION_SECONDS * 1000) {
      clearInterval(interval);
      printReport();
      return;
    }

    const promises = [];
    for (let b = 0; b < BATCHES_PER_SEC; b++) {
      promises.push(sendBatch(++batchCounter));
    }
    await Promise.all(promises);
  }, 1000);
}

function printReport() {
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const avg = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);

  console.log('\n================ Load Test Report ================');
  console.log(`Total Events Sent:       ${totalSent}`);
  console.log(`Total Batches Sent:      ${totalBatches}`);
  console.log(`Successful Batches:      ${successfulBatches}`);
  console.log(`Failed Batches:          ${failedBatches}`);
  console.log(`Success Rate:            ${((successfulBatches / (totalBatches || 1)) * 100).toFixed(2)}%`);
  console.log(`Avg Latency:             ${avg.toFixed(2)}ms`);
  console.log(`p50 Latency:             ${p50.toFixed(2)}ms`);
  console.log(`p95 Latency:             ${p95.toFixed(2)}ms`);
  console.log(`p99 Latency:             ${p99.toFixed(2)}ms`);
  console.log('==================================================');
}

runLoadTest();
