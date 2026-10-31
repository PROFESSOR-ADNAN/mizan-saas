import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { Key, Plus, Trash2, Copy, Check, AlertCircle } from 'lucide-react';

interface ApiKeysPageProps {
  orgId: string;
}

export const ApiKeysPage: React.FC<ApiKeysPageProps> = ({ orgId }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [scope, setScope] = useState<'ingest:write' | 'data:read'>('ingest:write');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: keysData, refetch } = useQuery({
    queryKey: ['apiKeys', orgId],
    queryFn: async () => {
      const res = await apiRequest(`/orgs/${orgId}/apikeys`);
      return res.apiKeys;
    },
  });

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest(`/orgs/${orgId}/apikeys`, {
        method: 'POST',
        body: JSON.stringify({
          name: keyName,
          scopes: [scope],
        }),
      });
      setCreatedKey(res.plaintextKey);
      setKeyName('');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to create key');
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Ingestion using this key will immediately stop.')) return;
    try {
      await apiRequest(`/orgs/${orgId}/apikeys/${keyId}`, { method: 'DELETE' });
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke key');
    }
  };

  const handleCopy = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">API Keys</h1>
          <p className="text-xs text-slate-500 mt-1">Authenticate POS terminals and backend scripts</p>
        </div>
        <button
          onClick={() => { setShowCreateModal(true); setCreatedKey(null); }}
          className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Key</span>
        </button>
      </div>

      {/* Generated Key Alert Modal */}
      {createdKey && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
          <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Copy Your New API Key Now</span>
          </div>
          <p className="text-xs text-amber-700">
            This API key will <strong>never be shown again</strong>. Store it securely in your POS configuration or environment variables.
          </p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={createdKey}
              className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
            />
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Keys Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-700">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Prefix</th>
              <th className="py-3 px-4">Scopes</th>
              <th className="py-3 px-4">Last Used</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(keysData || []).map((k: any) => (
              <tr key={k._id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 font-semibold text-slate-900">{k.name}</td>
                <td className="py-3 px-4 font-mono text-xs text-slate-600">{k.keyPrefix}...</td>
                <td className="py-3 px-4">
                  {(k.scopes || []).map((s: string) => (
                    <span key={s} className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700 mr-1">
                      {s}
                    </span>
                  ))}
                </td>
                <td className="py-3 px-4 text-xs">
                  {k.lastUsedAt ? `${new Date(k.lastUsedAt).toLocaleDateString()} (${k.lastUsedIp || 'unknown'})` : 'Never'}
                </td>
                <td className="py-3 px-4 text-right">
                  {!k.revokedAt ? (
                    <button
                      onClick={() => handleRevoke(k._id)}
                      className="text-rose-600 hover:text-rose-800 text-xs font-semibold"
                    >
                      Revoke
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Revoked</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Creation Modal */}
      {showCreateModal && !createdKey && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Generate API Key</h2>
            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Key Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bole Branch POS Terminal"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Scope</label>
                <select
                  value={scope}
                  onChange={(e: any) => setScope(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="ingest:write">ingest:write (Event ingestion only)</option>
                  <option value="data:read">data:read (Metrics query read-only)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
