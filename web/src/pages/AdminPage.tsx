import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { ShieldCheck, Search, PauseCircle, PlayCircle, PlusCircle, Gift } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: tenantsData, refetch } = useQuery({
    queryKey: ['adminTenants', searchTerm],
    queryFn: async () => {
      const res = await apiRequest(`/admin/tenants?search=${encodeURIComponent(searchTerm)}`);
      return res.tenants;
    },
  });

  const handleSuspend = async (orgId: string) => {
    if (!confirm('Suspend this tenant? Their dashboards will become read-only.')) return;
    try {
      await apiRequest(`/admin/tenants/${orgId}/suspend`, { method: 'POST', body: JSON.stringify({ reason: 'Admin review' }) });
      refetch();
    } catch (err: any) {
      alert(err.message || 'Suspension failed');
    }
  };

  const handleUnsuspend = async (orgId: string) => {
    try {
      await apiRequest(`/admin/tenants/${orgId}/unsuspend`, { method: 'POST' });
      refetch();
    } catch (err: any) {
      alert(err.message || 'Unsuspension failed');
    }
  };

  const handleExtendTrial = async (orgId: string) => {
    const days = prompt('Enter number of additional trial days (e.g. 14):', '14');
    if (!days) return;
    try {
      await apiRequest(`/admin/tenants/${orgId}/extend-trial`, {
        method: 'POST',
        body: JSON.stringify({ days: parseInt(days, 10) }),
      });
      alert('Trial extended successfully');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to extend trial');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl font-bold text-slate-900">Platform Admin Console</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Supervise tenants, manage subscriptions, and grant credits</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by shop name, slug, or TIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-500"
            />
          </div>
          <span className="text-xs text-slate-400">Platform Admins cannot inspect tenant raw sales events</span>
        </div>

        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-700">
            <tr>
              <th className="py-3 px-4">Organization Name</th>
              <th className="py-3 px-4">Slug</th>
              <th className="py-3 px-4">TIN</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(tenantsData || []).map((t: any) => (
              <tr key={t._id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 font-semibold text-slate-900">{t.name}</td>
                <td className="py-3 px-4 font-mono text-xs text-slate-500">{t.slug}</td>
                <td className="py-3 px-4 font-mono text-xs">{t.tin || 'N/A'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    t.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button
                    onClick={() => handleExtendTrial(t._id)}
                    className="inline-flex items-center text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 px-2 py-1 rounded"
                    title="Extend Trial"
                  >
                    <Gift className="w-3 h-3 mr-1" /> Extend Trial
                  </button>
                  {t.status === 'active' ? (
                    <button
                      onClick={() => handleSuspend(t._id)}
                      className="inline-flex items-center text-xs font-semibold text-rose-600 hover:text-rose-800"
                    >
                      <PauseCircle className="w-3 h-3 mr-1" /> Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnsuspend(t._id)}
                      className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                    >
                      <PlayCircle className="w-3 h-3 mr-1" /> Unsuspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
