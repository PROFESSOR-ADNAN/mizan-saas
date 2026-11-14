import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import {
  History,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Key,
  CreditCard,
  UserCheck,
  Zap,
  Globe,
  Lock,
} from 'lucide-react';

interface AuditLogPageProps {
  orgId: string;
}

export const AuditLogPage: React.FC<AuditLogPageProps> = ({ orgId }) => {
  const [filterAction, setFilterAction] = useState<string>('all');

  const { data: logsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['auditLogs', orgId],
    queryFn: async () => {
      const res = await apiRequest(`/orgs/${orgId}/audit-logs`);
      return res.auditLogs || [];
    },
    refetchInterval: 15000,
  });

  const logs = logsData || [];

  const getActionBadge = (action: string) => {
    if (action.startsWith('auth') || action.startsWith('security')) {
      return {
        icon: Lock,
        bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        label: 'AUTH & SECURITY',
      };
    }
    if (action.startsWith('billing')) {
      return {
        icon: CreditCard,
        bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        label: 'BILLING & VAT',
      };
    }
    if (action.startsWith('member')) {
      return {
        icon: UserCheck,
        bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        label: 'RBAC / ACCESS',
      };
    }
    if (action.startsWith('sales') || action.startsWith('event')) {
      return {
        icon: Zap,
        bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        label: 'INGEST / POS',
      };
    }
    return {
      icon: History,
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      label: 'SYSTEM',
    };
  };

  const filteredLogs = logs.filter((log: any) => {
    if (filterAction === 'all') return true;
    return log.action.toLowerCase().includes(filterAction);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Security & Administrative Audit Log</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tamper-evident, cryptographically indexed compliance log for RBAC changes, API keys, and VAT invoices
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Events</option>
            <option value="auth">Auth & Security</option>
            <option value="billing">Billing & Invoices</option>
            <option value="member">Team & RBAC</option>
            <option value="sales">Sales & Ingest</option>
          </select>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            title="Refresh Audit Log"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Compliance Immuntability Banner */}
      <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-xl text-xs font-medium shadow-sm">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>
          Compliance Notice: Audit log entries are write-once, append-only records stored with cryptographic event hashes. Deletion and modification are disabled at the database layer.
        </span>
      </div>

      {/* Visual Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading security audit records...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No audit records matching filter.</div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
            {filteredLogs.map((log: any, idx: number) => {
              const badge = getActionBadge(log.action);
              const Icon = badge.icon;
              const dateStr = log.createdAt ? new Date(log.createdAt).toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' }) : 'Recent';

              return (
                <div key={log._id || idx} className="relative group">
                  {/* Timeline Bullet */}
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-800 border-2 border-emerald-500 shadow-sm group-hover:scale-125 transition-transform" />

                  <div className="bg-slate-50 dark:bg-slate-900/70 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {badge.label}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {log.action}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {dateStr} (EAT)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Actor: </span>
                        <span className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px]">
                          {log.actorEmail || log.actorId}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Target: </span>
                        <span className="font-mono text-[11px]">{log.targetType} {log.targetId ? `(${log.targetId})` : ''}</span>
                      </div>
                      {log.ipAddress && (
                        <div className="flex items-center space-x-1">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span className="font-mono text-[11px]">{log.ipAddress}</span>
                        </div>
                      )}
                    </div>

                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <pre className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800 overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
