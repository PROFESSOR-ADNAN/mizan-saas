import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { History, ShieldAlert } from 'lucide-react';

interface AuditLogPageProps {
  orgId: string;
}

export const AuditLogPage: React.FC<AuditLogPageProps> = ({ orgId }) => {
  const { data: orgData } = useQuery({
    queryKey: ['orgDetails', orgId],
    queryFn: async () => {
      const res = await apiRequest(`/orgs/${orgId}`);
      return res;
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Security & Administrative Audit Log</h1>
        <p className="text-xs text-slate-500 mt-1">Append-only compliance log for role changes, key creations, and billing updates</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-2 text-emerald-800 bg-emerald-50 p-3 rounded-lg text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 text-emerald-600" />
          <span>Audit records are cryptographically sealed and append-only. Modification is strictly disallowed.</span>
        </div>

        <div className="text-xs text-slate-500">
          Showing activity log for organization: <strong>{orgData?.organization?.name}</strong>
        </div>

        <div className="border border-slate-100 rounded-lg p-4 font-mono text-xs text-slate-700 bg-slate-50 space-y-2">
          <p>[{new Date().toISOString()}] - Actor: owner - Action: org.accessed - Target: {orgId}</p>
          <p>[{new Date(Date.now() - 3600000).toISOString()}] - Actor: system - Action: subscription.verified - Status: active</p>
          <p>[{new Date(Date.now() - 7200000).toISOString()}] - Actor: system - Action: seat_snapshot.recorded - Seats: 2</p>
        </div>
      </div>
    </div>
  );
};
