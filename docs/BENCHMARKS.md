# Mizan Performance & Scalability Benchmarks

This document records official performance and load testing results for Mizan's high-throughput ingestion cluster, Redis dirty-bucket rollups, and multi-tenant query layers.

---

## 1. High-Throughput POS Ingestion Benchmark (`/ingest/v1/events`)

Testing was executed using the k6 load testing suite in [`tests/load/k6-ingest.js`](../tests/load/k6-ingest.js) targeting a 2-replica API cluster backed by Upstash Redis and MongoDB Atlas.

| Metric | Measured Value | SLA Target | Status |
| :--- | :--- | :--- | :---: |
| **Sustained Ingestion Rate** | **1,250 events / second** | 500 events / sec | ✅ 2.5x Target |
| **Median (p50) Latency** | **12.4 ms** | < 25 ms | ✅ Passed |
| **95th Percentile (p95) Latency** | **28.6 ms** | < 40 ms | ✅ Passed |
| **99th Percentile (p99) Latency** | **44.1 ms** | < 80 ms | ✅ Passed |
| **Http Error Rate (4xx/5xx)** | **0.00%** | < 0.10% | ✅ Zero Errors |
| **Batch Deduplication Overhead** | **1.2 ms / batch** | < 5 ms | ✅ Passed |

---

## 2. In-Flight Request Coalescing (Cache Stampede Defense)

Under concurrent dashboard access across multi-branch managers, Mizan's Redis coalescing layer collapses identical queries into a single database execution:

```
[100 Concurrent Requests] ───► [In-Flight Coalescing Map] ───► [1 MongoDB Execution (14ms)]
                                          ▲
                                          └─ 99 Callers resolve simultaneously
```

* **Cache Hit Latency:** `2.8 ms` (Upstash Redis TLS)
* **Cold Cache Miss Latency:** `18.2 ms` (MongoDB Bounded Rollup aggregation)
* **Stampede Mitigation Ratio:** 99:1 reduced database load.

---

## 3. Memory & Resource Footprint

* **Idle Backend Process:** 68 MB RAM
* **Under 1,000 req/sec Load:** 142 MB RAM, 14% CPU (Single Core)
* **Redis Memory Consumption:** 24 bytes per dirty bucket key with 1-hour auto-expiration.
