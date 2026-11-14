import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { Key, Plus, Trash2, Copy, Check, AlertCircle, Code2, Terminal } from 'lucide-react';

interface ApiKeysPageProps {
  orgId: string;
}

export const ApiKeysPage: React.FC<ApiKeysPageProps> = ({ orgId }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [scope, setScope] = useState<'ingest:write' | 'data:read'>('ingest:write');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [snippetTab, setSnippetTab] = useState<'curl' | 'js' | 'python'>('curl');

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

  const displayKey = createdKey || 'mzn_live_your_actual_key_here';

  const snippets = {
    curl: `curl -X POST https://mizan-api-3lif.onrender.com/ingest/v1/events \\
  -H "Content-Type: application/json" \\
  -H "X-Mizan-Key: ${displayKey}" \\
  -d '{
    "events": [
      {
        "eventId": "pos_tx_${Date.now()}",
        "type": "sale",
        "amount": 25000,
        "currency": "ETB",
        "channel": "telebirr",
        "branch": "Bole Road Mall",
        "occurredAt": "${new Date().toISOString()}",
        "items": [
          { "sku": "YIRG-01", "name": "Yirgacheffe Coffee 250g", "quantity": 1, "price": 25000 }
        ]
      }
    ]
  }'`,
    js: `// POS Terminal / E-commerce Backend
const response = await fetch('https://mizan-api-3lif.onrender.com/ingest/v1/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Mizan-Key': '${displayKey}',
  },
  body: JSON.stringify({
    events: [{
      eventId: 'tx_' + Date.now(),
      type: 'sale',
      amount: 15000, // 150.00 ETB in santim
      channel: 'cbebirr',
      branch: 'Piassa Churchill Ave',
      occurredAt: new Date().toISOString(),
    }]
  })
});
const data = await response.json();
console.log('Ingested to Mizan in ' + data.processingTimeMs + 'ms');`,
    python: `# Python POS Client / ERP Sync Script
import requests
import datetime

url = "https://mizan-api-3lif.onrender.com/ingest/v1/events"
headers = {
    "Content-Type": "application/json",
    "X-Mizan-Key": "${displayKey}"
}
payload = {
    "events": [{
        "eventId": f"py_sale_{datetime.datetime.utcnow().timestamp()}",
        "type": "sale",
        "amount": 35000, # 350.00 ETB in santim
        "channel": "telebirr",
        "branch": "Sarbet Old Airport",
        "occurredAt": datetime.datetime.utcnow().isoformat() + "Z"
    }]
}
res = requests.post(url, json=payload, headers=headers)
print("Ingestion Status:", res.status_code, res.json())`,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">API Keys & POS Integration</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Authenticate POS terminals, e-commerce checkouts, and ERP pipelines</p>
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
        <div className="p-5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3">
          <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-200 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Copy Your New API Key Now</span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            This API key will <strong>never be shown again</strong>. Store it securely in your POS configuration or environment variables.
          </p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={createdKey}
              className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
            />
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex-shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Keys Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-slate-200">Active API Keys</div>
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
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
              <tr key={k._id} className="border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{k.name}</td>
                <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">{k.keyPrefix}...</td>
                <td className="py-3 px-4">
                  {(k.scopes || []).map((s: string) => (
                    <span key={s} className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 mr-1">
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
                      className="text-rose-600 hover:text-rose-800 text-xs font-semibold transition"
                    >
                      Revoke
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-semibold">Revoked</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Code Snippets Drawer (Item 17) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Quick Integration Snippets</h2>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-900 text-xs">
            <button
              onClick={() => setSnippetTab('curl')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                snippetTab === 'curl' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setSnippetTab('js')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                snippetTab === 'js' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Node.js (Fetch)
            </button>
            <button
              onClick={() => setSnippetTab('python')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                snippetTab === 'python' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Python
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
            {snippets[snippetTab]}
          </pre>
          <button
            onClick={() => {
              navigator.clipboard.writeText(snippets[snippetTab]);
              alert('Code snippet copied to clipboard!');
            }}
            className="absolute top-3 right-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-[11px] font-semibold transition"
          >
            Copy Code
          </button>
        </div>
      </div>

      {/* Modal */}
      {showCreateModal && !createdKey && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Generate API Key</h2>
            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Key Name / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bole Mall POS Register #1"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Scope</label>
                <select
                  value={scope}
                  onChange={(e: any) => setScope(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="ingest:write">Ingest Only (ingest:write) - Recommended for POS</option>
                  <option value="data:read">Read Analytics (data:read) - For Dashboards & BI</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm"
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
