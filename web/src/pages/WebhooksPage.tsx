import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { Webhook, Plus, Send, CheckCircle2, XCircle } from 'lucide-react';

interface WebhooksPageProps {
  orgId: string;
}

export const WebhooksPage: React.FC<WebhooksPageProps> = ({ orgId }) => {
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Outbound Webhooks</h1>
          <p className="text-xs text-slate-500 mt-1">Receive signed notifications (invoice.paid, usage.threshold_reached)</p>
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
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
          <p className="font-bold">Signing Secret (Store securely now):</p>
          <p className="font-mono bg-white p-2 border border-amber-300 rounded select-all">{createdSecret}</p>
        </div>
      )}

      {/* Endpoints Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-800">Active Endpoints</div>
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-700">
            <tr>
              <th className="py-3 px-4">Destination URL</th>
              <th className="py-3 px-4">Subscribed Events</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(endpointsData || []).map((ep: any) => (
              <tr key={ep.id || ep._id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 font-mono text-xs text-slate-900">{ep.url}</td>
                <td className="py-3 px-4 text-xs">{(ep.events || []).join(', ')}</td>
                <td className="py-3 px-4">
                  {ep.enabled ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700">
                      Disabled
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleTestPing(ep.id || ep._id)}
                    className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                  >
                    <Send className="w-3 h-3 mr-1" /> Ping Test
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && !createdSecret && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add Webhook Endpoint</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">HTTPS Destination URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://your-domain.com/webhooks"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
                <span className="text-xs text-slate-400 block mt-1">Must use HTTPS. Private & metadata IPs are blocked.</span>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Add Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
