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
  Zap,
  Download,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Radio,
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
  const [isSimulating, setIsSimulating] = useState(false);
  const [simToast, setSimToast] = useState<string | null>(null);

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
    refetchInterval: 30000,
  });

  // Query branch-by-branch comparison
  const { data: branchData, refetch: refetchBranches } = useQuery({
    queryKey: ['branchAnalytics', orgId],
    queryFn: async () => {
      const res = await apiRequest(`/orgs/${orgId}/analytics/branches`);
      return res.branches || [];
    },
    refetchInterval: 30000,
  });

  // Query usage metering for quota warnings
  const { data: meterData } = useQuery({
    queryKey: ['meterWarning', orgId],
    queryFn: async () => {
      const res = await apiRequest(`/orgs/${orgId}/billing/meters`);
      return res.meters;
    },
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

  const handleSimulateSales = async (count: number, channel?: string) => {
    setIsSimulating(true);
    try {
      const res = await apiRequest(`/orgs/${orgId}/simulate-sales`, {
        method: 'POST',
        body: JSON.stringify({ count, channel }),
      });
      setSimToast(res.message || `Simulated ${count} sales!`);
      refetch();
      refetchBranches();
      setTimeout(() => setSimToast(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExportCsv = () => {
    if (!metricsData || metricsData.length === 0) {
      alert('No data available to export.');
      return;
    }
    const headers = ['Date', 'Revenue_ETB', 'Orders', 'Units_Sold', 'Expenses_ETB', 'Gross_Profit_ETB'];
    const rows = metricsData.map((d: any) => [
      String(d.timestamp).slice(0, 10),
      (d.revenue / 100).toFixed(2),
      d.orders,
      d.units,
      (d.expenses / 100).toFixed(2),
      ((d.revenue - d.expenses) / 100).toFixed(2),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mizan-sales-analytics-${datePreset}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const percentUsed = meterData?.percentUsed || 0;

  return (
    <div className="space-y-6">
      {/* 1. Low Quota / Hard Cap Warning Banner */}
      {percentUsed >= 80 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl flex items-center justify-between text-amber-900 dark:text-amber-200 text-sm shadow-sm">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-bold">Event Ingestion Quota Notice: </span>
              <span>
                You have consumed <strong>{percentUsed}%</strong> of your monthly event allowance ({meterData?.eventsIngested?.toLocaleString()} / {meterData?.includedEvents?.toLocaleString()}).
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-200 dark:bg-amber-900/60 rounded-md">
            {meterData?.isHardCapped ? 'Capped on Free' : 'Overage Active: 0.05 ETB/event'}
          </span>
        </div>
      )}

      {/* 2. Interactive POS Live Simulator Toolbar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 rounded-xl border border-slate-700/80 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold tracking-tight text-white">Live Ethiopian POS Simulator</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1.5" /> READY
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Fire test transactions into the real ingestion pipeline to watch rollups update live.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSimulateSales(1, 'telebirr')}
            disabled={isSimulating}
            className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 border border-emerald-500/40 shadow-sm disabled:opacity-50"
          >
            <span>+1 Telebirr</span>
            <span className="text-[10px] opacity-80">(120 ETB)</span>
          </button>

          <button
            onClick={() => handleSimulateSales(1, 'cbebirr')}
            disabled={isSimulating}
            className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 border border-blue-500/40 shadow-sm disabled:opacity-50"
          >
            <span>+1 CBE Birr</span>
            <span className="text-[10px] opacity-80">(350 ETB)</span>
          </button>

          <button
            onClick={() => handleSimulateSales(1, 'cash')}
            disabled={isSimulating}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 border border-slate-600 shadow-sm disabled:opacity-50"
          >
            <span>+1 Cash</span>
            <span className="text-[10px] opacity-80">(85 ETB)</span>
          </button>

          <button
            onClick={() => handleSimulateSales(20)}
            disabled={isSimulating}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-xs font-black transition flex items-center space-x-1.5 shadow-md disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Burst 20 Sales</span>
          </button>
        </div>
      </div>

      {/* Simulator Toast Notification */}
      {simToast && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 font-semibold flex items-center space-x-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{simToast}</span>
        </div>
      )}

      {/* 3. Top Header & Global Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('dashboard.title')}</h1>
          <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {t('dashboard.asOf')} {now.toLocaleTimeString()} (Addis Ababa)
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {t('dashboard.rollupLag')}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Fiscal Year & Date Range Preset Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-900 text-xs">
            <button
              onClick={() => setDatePreset('30d')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                datePreset === '30d' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t('dashboard.filters.presetAll')}
            </button>
            <button
              onClick={() => setDatePreset('fiscal')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                datePreset === 'fiscal' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t('dashboard.filters.presetFiscal')}
            </button>
          </div>

          {/* Table / Chart Toggle for Accessibility */}
          <button
            onClick={() => setShowTableMode(!showTableMode)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            title="Toggle Accessibility Data Table View"
          >
            {showTableMode ? <BarChart2 className="w-3.5 h-3.5" /> : <TableIcon className="w-3.5 h-3.5" />}
            <span>{showTableMode ? 'Chart View' : 'Table View'}</span>
          </button>

          {/* Export to CSV Button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Expiring Share Link Button */}
          <button
            onClick={handleCreateShareLink}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Link</span>
          </button>
        </div>
      </div>

      {shareUrl && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
          <span>Read-only share link active (expires in 30 days): <strong className="font-mono">{shareUrl}</strong></span>
          <button onClick={() => setShareUrl(null)} className="text-xs font-bold text-emerald-900 dark:text-emerald-100 underline">Dismiss</button>
        </div>
      )}

      {/* 4 Primary Number Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('dashboard.metrics.revenue')}</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{formatEtb(totalRevenue)}</div>
          <span className="text-xs text-slate-400 mt-1 block">Gross sales volume</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('dashboard.metrics.orders')}</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"><ShoppingCart className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{totalOrders.toLocaleString()}</div>
          <span className="text-xs text-slate-400 mt-1 block">Completed receipts</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('dashboard.metrics.units')}</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"><Package className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{totalUnits.toLocaleString()}</div>
          <span className="text-xs text-slate-400 mt-1 block">Individual items</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('dashboard.metrics.expenses')}</span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400"><ArrowDownRight className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{formatEtb(totalExpenses)}</div>
          <span className="text-xs text-slate-400 mt-1 block">Logged operational costs</span>
        </div>
      </div>

      {/* Main Charts or Data Table Alternative */}
      {showTableMode ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Accessibility Data Table (WCAG 2.2 Compliant)</h2>
            <button
              onClick={handleExportCsv}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
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
                <tr key={idx} className="border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="py-2.5 px-4 font-medium">{String(row.timestamp).slice(0, 10)}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">{formatEtb(row.revenue || 0)}</td>
                  <td className="py-2.5 px-4">{row.orders}</td>
                  <td className="py-2.5 px-4">{row.units}</td>
                  <td className="py-2.5 px-4 text-rose-600 dark:text-rose-400">{formatEtb(row.expenses || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Row 1: Daily Revenue Trend + Orders Volume */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend Line Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">{t('dashboard.charts.revenueTrend')}</h2>
              <div className="h-72 w-full">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading analytics trend...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metricsData || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(val) => String(val).slice(5, 10)}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        stroke="#94a3b8"
                      />
                      <YAxis
                        tickFormatter={(val) => `${Math.round(val / 100000)}k`}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        stroke="#94a3b8"
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
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Orders Distribution</h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricsData || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="timestamp" tickFormatter={(val) => String(val).slice(8, 10)} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2: Multi-Branch Performance Comparison (Item 7) */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Multi-Branch Sales Comparison (Addis Ababa Retail Network)</h2>
              </div>
              <span className="text-xs text-slate-400">Aggregated real-time by branch location</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchData || []} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" tickFormatter={(val) => `${Math.round(val / 1000)}k ETB`} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis dataKey="branch" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={140} />
                    <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString()} ETB`, 'Revenue']} />
                    <Bar dataKey="revenueETB" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Branch Leaderboard List */}
              <div className="space-y-3 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-700/80 pt-4 lg:pt-0 lg:pl-6">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Branch Ranking</h3>
                {(branchData || []).slice(0, 5).map((b: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-300">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{b.branch}</span>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {b.revenueETB ? b.revenueETB.toLocaleString() : (b.revenueSantim / 100).toLocaleString()} ETB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
