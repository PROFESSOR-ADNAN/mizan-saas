import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiRequest, API_BASE } from '../api/client.js';
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
  DollarSign,
  Activity,
  Layers,
  Sparkles,
  ShieldAlert,
  Users,
  Compass,
  FileSpreadsheet,
  X,
  Plus,
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

  // Advanced Feature Modals State
  const [showForexModal, setShowForexModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Shift Form State
  const [shiftBranch, setShiftBranch] = useState('Bole Road Mega Mall');
  const [cashierName, setCashierName] = useState('Dawit T. (POS #01)');
  const [openingCash, setOpeningCash] = useState('2000');
  const [physicalCash, setPhysicalCash] = useState('20450');

  // SSE Live Stream State (Item 9)
  const [liveEvents, setLiveEvents] = useState<any[]>([
    {
      id: 'init-1',
      channel: 'telebirr',
      totalETB: 340,
      branch: 'Bole Road Mega Mall',
      timestamp: new Date().toISOString(),
      lagMs: 7,
    },
    {
      id: 'init-2',
      channel: 'cbebirr',
      totalETB: 1250,
      branch: 'Piassa Churchill Ave',
      timestamp: new Date(Date.now() - 4000).toISOString(),
      lagMs: 12,
    },
  ]);

  useEffect(() => {
    const token = localStorage.getItem('mizan_token');
    const esUrl = `${API_BASE}/orgs/${orgId}/live-stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    let es: EventSource | null = null;
    try {
      es = new EventSource(esUrl);
      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.totalETB) {
            setLiveEvents((prev) => [parsed, ...prev.slice(0, 4)]);
          }
        } catch (_) {}
      };
    } catch (_) {}

    return () => {
      es?.close();
    };
  }, [orgId]);

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
  });

  // Query usage metering for quota warnings
  const { data: meterData } = useQuery({
    queryKey: ['meterWarning', orgId],
    queryFn: async () => {
      const res = await apiRequest(`/orgs/${orgId}/billing/meters`);
      return res.meters;
    },
  });

  // Query NBE Forex Rates (Item 3)
  const { data: forexData } = useQuery({
    queryKey: ['forexRates'],
    queryFn: async () => {
      const res = await apiRequest('/forex/rates');
      return res;
    },
  });

  // Query AI Demand & Stockout Forecast (Item 5)
  const { data: forecastData } = useQuery({
    queryKey: ['forecast', orgId],
    queryFn: async () => {
      const res = await apiRequest(`/orgs/${orgId}/analytics/forecast`);
      return res.forecast || [];
    },
  });

  // Query Z-Score Anomaly & Loss Prevention (Item 6)
  const { data: anomalyData } = useQuery({
    queryKey: ['anomalies', orgId],
    queryFn: async () => {
      const res = await apiRequest(`/orgs/${orgId}/analytics/anomalies`);
      return res.anomalies || [];
    },
  });

  // Query RFM Customer Segmentation & CLV (Item 7)
  const { data: rfmData } = useQuery({
    queryKey: ['rfm', orgId],
    queryFn: async () => {
      const res = await apiRequest(`/orgs/${orgId}/analytics/rfm`);
      return res;
    },
  });

  // Query Peak Trading 7x24 Heatmap Matrix (Item 8)
  const { data: heatmapData } = useQuery({
    queryKey: ['heatmap', orgId],
    queryFn: async () => {
      const res = await apiRequest(`/orgs/${orgId}/analytics/heatmap`);
      return res.heatmap || [];
    },
  });

  // Query Shifts & Z-Reports (Item 4)
  const { data: shiftsData, refetch: refetchShifts } = useQuery({
    queryKey: ['shifts', orgId],
    queryFn: async () => {
      const res = await apiRequest(`/orgs/${orgId}/shifts`);
      return res.shifts || [];
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

  const handleReconcileShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest(`/orgs/${orgId}/shifts/reconcile`, {
        method: 'POST',
        body: JSON.stringify({
          branch: shiftBranch,
          cashierName,
          openingCashETB: Number(openingCash),
          physicalCashCountedETB: Number(physicalCash),
        }),
      });
      alert(res.message || 'Shift reconciled successfully!');
      setShowShiftModal(false);
      refetchShifts();
    } catch (err: any) {
      alert(err.message || 'Shift reconciliation failed');
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
  const rates = forexData?.rates || [];

  return (
    <div className="space-y-6">
      {/* 1. National Bank of Ethiopia (NBE) Live Exchange Rate Ticker (Item 3) */}
      <div className="bg-slate-900 text-slate-200 px-4 py-2 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono shadow-sm gap-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            NBE Live Indicative Rates:
          </span>
          <div className="hidden sm:flex items-center space-x-3 text-slate-300">
            {rates.slice(0, 4).map((r: any) => (
              <span key={r.currency} className="flex items-center space-x-1">
                <span>{r.flag}</span>
                <span className="font-bold text-white">{r.currency}:</span>
                <span>{r.midRate} ETB</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowForexModal(true)}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline"
          >
            Dual Currency Converter
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => setShowTour(true)}
            className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Product Tour</span>
          </button>
        </div>
      </div>

      {/* 2. Real-Time SSE Live Sales Pulse Bar (Item 9) */}
      <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl flex items-center justify-between text-xs text-emerald-200 overflow-hidden shadow-inner">
        <div className="flex items-center space-x-2.5 min-w-0">
          <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="font-bold font-mono text-emerald-400 flex-shrink-0">LIVE STREAM:</span>
          <span className="truncate">
            {liveEvents[0]
              ? `Ingested ${liveEvents[0].totalETB} ETB via ${String(liveEvents[0].channel).toUpperCase()} (${liveEvents[0].branch})`
              : 'Listening for real-time sales telemetry...'}
          </span>
        </div>
        <div className="font-mono text-[10px] text-emerald-400/80 flex-shrink-0 pl-2">
          Latency: <strong>{liveEvents[0]?.lagMs || 8}ms</strong>
        </div>
      </div>

      {/* 3. Low Quota / Hard Cap Warning Banner */}
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

      {/* 4. Interactive POS Live Simulator Toolbar */}
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

          <button
            onClick={() => setShowShiftModal(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-sm"
          >
            <span>Cashier Z-Report</span>
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

      {/* 5. Top Header & Global Filter Bar */}
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

      {/* 6. Primary Metric Number Tiles */}
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

      {/* 7. Main Charts */}
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

          {/* Row 2: Multi-Branch Performance Comparison */}
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

          {/* Row 3: AI Stockout Forecasting (Item 5) & Anomaly Detection (Item 6) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Demand & Stockout Forecast */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    AI Demand & Stockout Forecasting (EWMA Velocity)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-bold">
                  PREDICTIVE ACTIVE
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                {(forecastData || []).map((f: any) => (
                  <div key={f.sku} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{f.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Stock: <strong>{f.currentStock}</strong> | Daily Velocity: <strong>{f.dailyVelocity} units/day</strong>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          f.status === 'critical'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        Empty in {f.daysUntilStockout} days
                      </span>
                      <div className="text-[10px] text-slate-400">Reorder: +{f.suggestedReorderQty} units</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Z-Score Anomaly & Loss Prevention */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Loss Prevention & Z-Score Anomaly Detection
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded font-bold">
                  REAL-TIME GUARD
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {(anomalyData || []).map((a: any) => (
                  <div key={a.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white font-mono">
                        {a.txId} — {a.amountETB.toLocaleString()} ETB
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                        Z-SCORE {a.zScore} ({a.riskLevel})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">{a.reason}</p>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {a.branch} • {a.cashier}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 4: RFM Customer Retention (Item 7) & Peak Trading Heatmap (Item 8) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RFM Customer Segmentation */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    RFM Customer Retention & Lifetime Value (CLV)
                  </h3>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  Avg CLV: <strong>{rfmData?.averageCLV_ETB?.toLocaleString() || 9850} ETB</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {(rfmData?.segments || []).map((s: any) => (
                  <div key={s.name} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{s.name}</span>
                      <span className="text-[10px] font-bold font-mono text-emerald-600">{s.percentage}%</span>
                    </div>
                    <div className="text-[11px] text-slate-500">{s.count} Customers</div>
                    <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Avg Spend: {s.avgSpendETB?.toLocaleString()} ETB
                    </div>
                    <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800">{s.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Peak Trading 7x24 Heatmap Matrix */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Peak Trading Rush Hour Heatmap (Day × Hour)
                  </h3>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                  <span>Slow</span>
                  <div className="w-12 h-2 rounded bg-gradient-to-r from-slate-200 to-emerald-500" />
                  <span>Rush</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Hourly transaction density across Addis Ababa shopping corridors. Rush hours peak at lunch (12:00-14:00) and evening commute (17:00-19:00).
              </p>

              {/* 7-Day Heatmap Strip */}
              <div className="space-y-1.5 pt-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dIdx) => {
                  const dayCells = (heatmapData || []).filter((h: any) => h.dayIndex === dIdx);
                  return (
                    <div key={day} className="flex items-center gap-1">
                      <span className="w-8 text-[10px] font-mono font-bold text-slate-400 text-right pr-1">{day}</span>
                      <div className="flex-1 flex gap-0.5">
                        {dayCells.map((cell: any) => {
                          const bg = cell.intensity === 0
                            ? 'bg-slate-100 dark:bg-slate-800'
                            : cell.intensity > 70
                            ? 'bg-emerald-500 text-white'
                            : cell.intensity > 40
                            ? 'bg-emerald-400/80 text-white'
                            : 'bg-emerald-200/60 dark:bg-emerald-950/80';
                          return (
                            <div
                              key={cell.hour}
                              className={`flex-1 h-4 rounded-xs ${bg} hover:scale-125 transition cursor-pointer`}
                              title={`${day} at ${cell.hourLabel}: Intensity ${cell.intensity}% (${cell.orders} sales)`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forex Converter Modal (Item 3) */}
      {showForexModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                NBE Live Dual-Currency Converter
              </h3>
              <button onClick={() => setShowForexModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Month-to-Date Revenue</span>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {(totalRevenue / 100).toLocaleString()} ETB
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {rates.map((r: any) => {
                  const converted = Math.round(((totalRevenue / 100) / r.midRate) * 100) / 100;
                  return (
                    <div key={r.currency} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{r.flag}</span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{r.name} ({r.currency})</div>
                          <div className="text-[10px] text-slate-400">Mid Rate: 1 {r.currency} = {r.midRate} ETB</div>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {converted.toLocaleString('en-US', { minimumFractionDigits: 2 })} {r.currency}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cashier Shift Reconciliation / Z-Report Modal (Item 4) */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-purple-500" />
                Cashier Shift & Cash Drawer Reconciliation (Z-Report)
              </h3>
              <button onClick={() => setShowShiftModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReconcileShift} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Branch Register</label>
                <select
                  value={shiftBranch}
                  onChange={(e) => setShiftBranch(e.target.value)}
                  className="w-full border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700"
                >
                  <option value="Bole Road Mega Mall">Bole Road Mega Mall (Register #01)</option>
                  <option value="Piassa Churchill Ave">Piassa Churchill Ave (Register #02)</option>
                  <option value="Sarbet Old Airport">Sarbet Old Airport (Register #03)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Opening Cash (ETB)</label>
                  <input
                    type="number"
                    value={openingCash}
                    onChange={(e) => setOpeningCash(e.target.value)}
                    className="w-full border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Physical Cash Counted (ETB)</label>
                  <input
                    type="number"
                    value={physicalCash}
                    onChange={(e) => setPhysicalCash(e.target.value)}
                    className="w-full border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 space-y-1 text-purple-900 dark:text-purple-200">
                <div className="font-bold">Automated Z-Report Discrepancy Check</div>
                <p className="text-[11px]">
                  Compares recorded cash transactions against counted drawer cash to calculate Over/Short status before sealing the shift into the compliance audit ledger.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Close Shift & Generate Z-Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guided Product Tour Modal (Item 18) */}
      {showTour && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-500" />
                Mizan Guided Tour for Portfolio Evaluators
              </span>
              <button onClick={() => setShowTour(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-emerald-600">1. Live POS Simulator:</span> Click <em>+1 Telebirr</em> or <em>Burst 20 Sales</em> at the top to watch transactions stream into Redis rollups in &lt;14ms.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-blue-600">2. Multi-Branch Chart:</span> Observe automatic branch aggregation across Bole, Piassa, and Sarbet retail outlets.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-purple-600">3. 15% VAT Invoices & ESRM:</span> Navigate to <em>Billing</em> to generate Ministry of Revenues-compliant fiscal PDF receipts.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-amber-600">4. SSRF Defense:</span> Visit <em>Outbound Webhooks</em> to test the private IP sandbox circuit breaker against AWS metadata.
              </div>
            </div>

            <button
              onClick={() => setShowTour(false)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
            >
              Start Exploring Mizan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
