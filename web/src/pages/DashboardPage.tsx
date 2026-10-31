import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../api/client.js';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  ArrowDownRight,
  Share2,
  Calendar,
  Clock,
  Table as TableIcon,
  BarChart2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface DashboardPageProps {
  orgId: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ orgId }) => {
  const { t } = useTranslation();
  const [datePreset, setDatePreset] = useState<'30d' | 'fiscal'>('30d');
  const [showTableMode, setShowTableMode] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Compute date range
  const now = new Date();
  const startDate = datePreset === '30d'
    ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    : new Date(Date.UTC(now.getUTCFullYear() - (now.getUTCMonth() < 6 ? 1 : 0), 6, 8)); // July 8 (Hamle 1)

  // Query aggregated metrics
  const { data: metricsData, isLoading, refetch } = useQuery({
    queryKey: ['metrics', orgId, datePreset],
    queryFn: async () => {
      const res = await apiRequest(
        `/orgs/${orgId}/analytics/query?metric=revenue&granularity=day&startDate=${startDate.toISOString()}&endDate=${now.toISOString()}`
      );
      return res.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate totals
  const totalRevenue = (metricsData || []).reduce((acc: number, item: any) => acc + (item.revenue || 0), 0);
  const totalOrders = (metricsData || []).reduce((acc: number, item: any) => acc + (item.orders || 0), 0);
  const totalUnits = (metricsData || []).reduce((acc: number, item: any) => acc + (item.units || 0), 0);
  const totalExpenses = (metricsData || []).reduce((acc: number, item: any) => acc + (item.expenses || 0), 0);

  const formatEtb = (santim: number) => {
    return (santim / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ETB';
  };

  const handleCreateShareLink = async () => {
    try {
      const dashboards = await apiRequest(`/orgs/${orgId}/dashboards`);
      const defaultDash = dashboards.dashboards?.[0];
      if (defaultDash) {
        const res = await apiRequest(`/orgs/${orgId}/dashboards/${defaultDash._id}/share`, {
          method: 'POST',
          body: JSON.stringify({ expiresInDays: 30 }),
        });
        setShareUrl(res.shareUrl);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create share link');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Global Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('dashboard.title')}</h1>
          <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {t('dashboard.asOf')} {now.toLocaleTimeString()} (Addis Ababa)
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
              {t('dashboard.rollupLag')}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Fiscal Year & Date Range Preset Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setDatePreset('30d')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                datePreset === '30d' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
              }`}
            >
              {t('dashboard.filters.presetAll')}
            </button>
            <button
              onClick={() => setDatePreset('fiscal')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                datePreset === 'fiscal' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
              }`}
            >
              {t('dashboard.filters.presetFiscal')}
            </button>
          </div>

          {/* Table / Chart Toggle for Accessibility */}
          <button
            onClick={() => setShowTableMode(!showTableMode)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700"
            title="Toggle Accessibility Data Table View"
          >
            {showTableMode ? <BarChart2 className="w-3.5 h-3.5" /> : <TableIcon className="w-3.5 h-3.5" />}
            <span>{showTableMode ? 'Chart View' : 'Table View'}</span>
          </button>

          {/* Expiring Share Link Button */}
          <button
            onClick={handleCreateShareLink}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Link</span>
          </button>
        </div>
      </div>

      {shareUrl && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex items-center justify-between">
          <span>Read-only share link active (expires in 30 days): <strong>{shareUrl}</strong></span>
          <button onClick={() => setShareUrl(null)} className="text-xs font-bold text-emerald-900">Dismiss</button>
        </div>
      )}

      {/* 4 Primary Number Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dashboard.metrics.revenue')}</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{formatEtb(totalRevenue)}</div>
          <span className="text-xs text-slate-400 mt-1 block">Gross sales volume</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dashboard.metrics.orders')}</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><ShoppingCart className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{totalOrders.toLocaleString()}</div>
          <span className="text-xs text-slate-400 mt-1 block">Completed receipts</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dashboard.metrics.units')}</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><Package className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{totalUnits.toLocaleString()}</div>
          <span className="text-xs text-slate-400 mt-1 block">Individual items</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dashboard.metrics.expenses')}</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600"><ArrowDownRight className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{formatEtb(totalExpenses)}</div>
          <span className="text-xs text-slate-400 mt-1 block">Logged operational costs</span>
        </div>
      </div>

      {/* Main Charts or Data Table Alternative */}
      {showTableMode ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <h2 className="text-base font-bold text-slate-900 mb-4">Accessibility Data Table (WCAG 2.2 Alternative)</h2>
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-700">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Revenue (ETB)</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Units</th>
                <th className="py-3 px-4">Expenses (ETB)</th>
              </tr>
            </thead>
            <tbody>
              {(metricsData || []).map((row: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-medium">{String(row.timestamp).slice(0, 10)}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{formatEtb(row.revenue || 0)}</td>
                  <td className="py-2.5 px-4">{row.orders}</td>
                  <td className="py-2.5 px-4">{row.units}</td>
                  <td className="py-2.5 px-4 text-rose-600">{formatEtb(row.expenses || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend Line Chart */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-4">{t('dashboard.charts.revenueTrend')}</h2>
            <div className="h-72 w-full">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading analytics trend...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricsData || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(val) => String(val).slice(5, 10)}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      stroke="#cbd5e1"
                    />
                    <YAxis
                      tickFormatter={(val) => `${Math.round(val / 100000)}k`}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      stroke="#cbd5e1"
                    />
                    <Tooltip
                      formatter={(val: any) => [formatEtb(Number(val)), 'Revenue']}
                      labelFormatter={(label) => `Date: ${String(label).slice(0, 10)}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#16a34a"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#16a34a' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Orders Volume Bar Chart */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Orders Distribution</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricsData || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="timestamp" tickFormatter={(val) => String(val).slice(8, 10)} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
