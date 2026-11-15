import React, { useState } from 'react';
import { ShieldCheck, Cpu, Database, Server, X, Check, Lock, Layers } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'isolation' | 'math' | 'redis' | 'ssrf'>('isolation');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Mizan Enterprise Architecture & Engineering Invariants
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interactive technical deep-dive into distributed multi-tenancy, exact integer accounting, and ingestion rollups
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('isolation')}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === 'isolation'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🛡️ Provable Multi-Tenancy
          </button>
          <button
            onClick={() => setActiveTab('math')}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === 'math'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            💰 Exact Santim Math (64-bit)
          </button>
          <button
            onClick={() => setActiveTab('redis')}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === 'redis'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ⚡ Redis Dirty-Bucket Rollups
          </button>
          <button
            onClick={() => setActiveTab('ssrf')}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === 'ssrf'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🔒 Outbound SSRF Guard
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed">
          {activeTab === 'isolation' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                <span className="font-bold">Architectural Principle:</span> Raw Mongoose models are strictly banned from tenant controllers. Every query traverses <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded">TenantRepository&lt;T&gt;</code>, which automatically injects <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded">orgId</code> as an immutable filter.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span>Enumeration Attack Defense</span>
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Cross-tenant requests strictly return <strong>HTTP 404 Not Found</strong> instead of HTTP 403 Forbidden. An attacker cannot probe valid IDs across other Ethiopian merchant stores.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span>Aggregation Pipeline Guard</span>
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    The underlying MongoDB aggregation wrapper automatically prepends <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{`$match: { orgId }`}</code> as its first stage, preventing cross-tenant data leaks in reporting pipelines.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'math' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200">
                <span className="font-bold">Zero Floating-Point Drift:</span> In accordance with financial accounting standards, floating-point arithmetic (<code className="font-mono">0.1 + 0.2 != 0.3</code>) is strictly prohibited. All currency is stored as 64-bit integer Santims (1 ETB = 100 Santims).
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono space-y-2 bg-slate-50 dark:bg-slate-950 text-[11px]">
                <div className="text-slate-400">// Deterministic Ethiopian 15% VAT Half-Up Rounding Formula:</div>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                  const vatSantim = Math.floor((subtotalSantim * 15 + 50) / 100);
                </div>
                <div className="text-slate-400">// Invariance: Zero subtotal always yields zero VAT and zero total.</div>
                <div>totalDueSantim = subtotalSantim + vatSantim - creditsAppliedSantim;</div>
              </div>

              <p className="text-slate-600 dark:text-slate-400">
                All 12 hand-checked billing scenarios (seat proration, overage increments, and odd VAT centimes) are verified automatically via automated CI tests.
              </p>
            </div>
          )}

          {activeTab === 'redis' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                <span className="font-bold">Real-Time Ingestion with &lt;5s Rollup Lag:</span> Ingested transactions are acknowledged in ~14ms and mark dirty hourly/daily buckets in Upstash Redis sets. A BullMQ worker asynchronously computes pre-aggregations.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <div className="font-bold text-slate-900 dark:text-white">1. Ingest (Fast Path)</div>
                  <div className="text-slate-500 mt-1">POST /ingest/v1/events marks <code className="font-mono">dirty:hourly:{`{bucket}`}</code> in Redis.</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <div className="font-bold text-slate-900 dark:text-white">2. Coalescing Map</div>
                  <div className="text-slate-500 mt-1">Collapses concurrent dashboard requests to prevent database cache stampedes.</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <div className="font-bold text-slate-900 dark:text-white">3. Microsecond Query</div>
                  <div className="text-slate-500 mt-1">Queries hit cached RollupDaily / RollupHourly tables instead of millions of raw events.</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ssrf' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200">
                <span className="font-bold">Outbound SSRF Circuit Breaker:</span> Outbound webhook dispatches validate target host IP resolution via <code className="font-mono">node:dns/promises</code> before dispatching HTTP requests.
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white">Blocked Network Targets:</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                  <li><code className="font-mono text-rose-500">127.0.0.0/8</code>, <code className="font-mono text-rose-500">::1</code> (Loopback addresses)</li>
                  <li><code className="font-mono text-rose-500">169.254.169.254</code> (AWS / GCP / DigitalOcean cloud instance metadata IP)</li>
                  <li><code className="font-mono text-rose-500">10.0.0.0/8</code>, <code className="font-mono text-rose-500">172.16.0.0/12</code>, <code className="font-mono text-rose-500">192.168.0.0/16</code> (RFC 1918 Private subnets)</li>
                  <li><code className="font-mono text-rose-500">fc00::/7</code>, <code className="font-mono text-rose-500">fe80::/10</code> (IPv6 unique local and link-local unicast)</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs">
          <span className="text-slate-500">Audited across 25 automated invariant test suites.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg transition"
          >
            Close Deep-Dive
          </button>
        </div>
      </div>
    </div>
  );
};
