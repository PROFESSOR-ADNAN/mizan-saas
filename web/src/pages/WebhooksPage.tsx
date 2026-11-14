import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import {
  Webhook,
  Plus,
  Send,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface WebhooksPageProps {
  orgId: string;
}

export const WebhooksPage: React.FC<WebhooksPageProps> = ({ orgId }) => {
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  // SSRF Guard Sandbox State
  const [testUrl, setTestUrl] = useState('http://169.254.169.254/latest/meta-data/');
  const [ssrfResult, setSsrfResult] = useState<any>(null);
  const [isVerifyingSsrf, setIsVerifyingSsrf] = useState(false);

  const { data: endpointsData, refetch: refetchEndpoints } = useQuery({
    queryKey: ['webhooks', orgId],
    queryFn: async () => {
      const res = await apiRequest(`/orgs/${orgId}/webhooks/endpoints`);
      return res.endpoints;
    },
  });

  const { data: deliveriesData, refetch: refetchDeliveries } = useQuery({
    queryKey: ['webhookDeliveries', orgId],
    queryFn: async () => {
      const res = await apiRequest(`/orgs/${orgId}/webhooks/deliveries`);
      return res.deliveries;
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest(`/orgs/${orgId}/webhooks/endpoints`, {
        method: 'POST',
        body: JSON.stringify({
          url,
          events: ['invoice.paid', 'usage.threshold_reached'],
        }),
      });
      setCreatedSecret(res.signingSecret);
      setUrl('');
      refetchEndpoints();
    } catch (err: any) {
      alert(err.message || 'Failed to create webhook endpoint');
    }
  };

  const handleTestPing = async (endpointId: string) => {
    try {
      await apiRequest(`/orgs/${orgId}/webhooks/endpoints/${endpointId}/test-ping`, { method: 'POST' });
      alert('Test ping enqueued');
      refetchDeliveries();
    } catch (err: any) {
      alert(err.message || 'Test ping failed');
    }
  };

  const handleVerifySsrf = async (customUrl?: string) => {
    const target = customUrl || testUrl;
    setIsVerifyingSsrf(true);
    setSsrfResult(null);
    try {
      const res = await apiRequest(`/orgs/${orgId}/webhooks/verify-target-url`, {
        method: 'POST',
        body: JSON.stringify({ url: target }),
      });
      setSsrfResult(res);
    } catch (err: any) {
      setSsrfResult({ error: err.message || 'Verification failed' });
    } finally {
      setIsVerifyingSsrf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Outbound Webhooks & Event Subscriptions</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Deliver HMAC-SHA256 signed events with automated exponential retry and SSRF circuit-breakers
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setCreatedSecret(null); }}
          className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Webhook Endpoint</span>
        </button>
      </div>

      {createdSecret && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200 space-y-1">
          <p className="font-bold">Signing Secret (Store securely now):</p>
          <p className="font-mono bg-white dark:bg-slate-900 p-2 border border-amber-300 dark:border-amber-700 rounded select-all">{createdSecret}</p>
        </div>
      )}

      {/* Interactive SSRF Guard Verification Sandbox (Item 19) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Enterprise SSRF Protection & Private IP Sandbox
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Validates target DNS against RFC 1918, AWS/GCP metadata (169.254.169.254), and loopback before enqueuing requests.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Test Presets:</span>
          <button
            onClick={() => { setTestUrl('http://169.254.169.254/latest/meta-data/'); handleVerifySsrf('http://169.254.169.254/latest/meta-data/'); }}
            className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-[11px] font-mono font-medium hover:bg-rose-100"
          >
            AWS Metadata IP
          </button>
          <button
            onClick={() => { setTestUrl('http://127.0.0.1:8080/internal'); handleVerifySsrf('http://127.0.0.1:8080/internal'); }}
            className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] font-mono font-medium hover:bg-amber-100"
          >
            127.0.0.1 Loopback
          </button>
          <button
            onClick={() => { setTestUrl('http://10.0.0.5:5000/db'); handleVerifySsrf('http://10.0.0.5:5000/db'); }}
            className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-[11px] font-mono font-medium hover:bg-purple-100"
          >
            10.0.0.0/8 VPC
          </button>
          <button
            onClick={() => { setTestUrl('https://httpbin.org/post'); handleVerifySsrf('https://httpbin.org/post'); }}
            className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] font-mono font-medium hover:bg-emerald-100"
          >
            Public Endpoint
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="flex-1 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
            placeholder="https://..."
          />
          <button
            onClick={() => handleVerifySsrf()}
            disabled={isVerifyingSsrf}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <span>{isVerifyingSsrf ? 'Checking...' : 'Run SSRF Check'}</span>
          </button>
        </div>

        {ssrfResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-mono space-y-1 ${
              ssrfResult.isBlocked
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <div className="flex items-center space-x-2 font-bold">
              {ssrfResult.isBlocked ? (
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>Verdict: {ssrfResult.verdict || 'ANALYZED'}</span>
            </div>
            <p className="text-[11px] opacity-90">{ssrfResult.reason}</p>
            {ssrfResult.resolvedIps && (
              <p className="text-[11px] opacity-80">
                Resolved IP(s): {ssrfResult.resolvedIps.join(', ')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Endpoints Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-slate-200">Active Endpoints</div>
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
            <tr>
              <th className="py-3 px-4">Destination URL</th>
              <th className="py-3 px-4">Subscribed Events</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(endpointsData || []).map((ep: any) => (
              <tr key={ep.id || ep._id} className="border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                <td className="py-3 px-4 font-mono text-xs text-slate-900 dark:text-white">{ep.url}</td>
                <td className="py-3 px-4 text-xs">{(ep.events || []).join(', ')}</td>
                <td className="py-3 px-4">
                  {ep.enabled ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      Disabled
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button
                    onClick={() => handleTestPing(ep.id || ep._id)}
                    className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600"
                  >
                    <Send className="w-3 h-3 mr-1" /> Test Ping
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-slate-200">Recent Webhook Deliveries</div>
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
            <tr>
              <th className="py-3 px-4">Event</th>
              <th className="py-3 px-4">Status Code</th>
              <th className="py-3 px-4">Attempts</th>
              <th className="py-3 px-4">Delivery Time</th>
            </tr>
          </thead>
          <tbody>
            {(deliveriesData || []).map((d: any) => (
              <tr key={d._id} className="border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                <td className="py-3 px-4 font-mono text-xs text-slate-900 dark:text-white">{d.eventType}</td>
                <td className="py-3 px-4">
                  {d.statusCode >= 200 && d.statusCode < 300 ? (
                    <span className="font-bold text-emerald-600">{d.statusCode} OK</span>
                  ) : (
                    <span className="font-bold text-rose-600">{d.statusCode || 'Failed'}</span>
                  )}
                </td>
                <td className="py-3 px-4">{d.attemptCount || 1} / 5</td>
                <td className="py-3 px-4 text-xs text-slate-400">
                  {d.createdAt ? new Date(d.createdAt).toLocaleTimeString() : 'Recent'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Webhook Endpoint</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Destination URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.yourcompany.et/webhooks"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  Create Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
