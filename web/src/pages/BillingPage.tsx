import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiRequest, API_BASE } from '../api/client.js';
import {
  CreditCard,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Download,
  Zap,
  Info,
  Smartphone,
  QrCode,
  FileSpreadsheet,
  X,
} from 'lucide-react';

interface BillingPageProps {
  orgId: string;
}

export const BillingPage: React.FC<BillingPageProps> = ({ orgId }) => {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [simulatingInvoiceId, setSimulatingInvoiceId] = useState<string | null>(null);
  const [showTestCards, setShowTestCards] = useState(false);
  const [selectedQrInvoice, setSelectedQrInvoice] = useState<any>(null);

  const { data: metersData, refetch: refetchMeters } = useQuery({
    queryKey: ['billingMeters', orgId],
    queryFn: async () => {
      const res = await apiRequest(`/orgs/${orgId}/billing/meters`);
      return res.meters;
    },
  });

  const { data: invoicesData, refetch: refetchInvoices } = useQuery({
    queryKey: ['invoices', orgId],
    queryFn: async () => {
      const res = await apiRequest(`/orgs/${orgId}/billing/invoices`);
      return res.invoices;
    },
  });

  const handlePayInvoice = async (invoiceId: string) => {
    setIsProcessing(true);
    try {
      const res = await apiRequest(`/orgs/${orgId}/billing/invoices/${invoiceId}/pay`, {
        method: 'POST',
      });
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch (err: any) {
      alert(err.message || 'Payment initialization failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulatePayment = async (invoiceId: string) => {
    setSimulatingInvoiceId(invoiceId);
    try {
      const res = await apiRequest(`/orgs/${orgId}/billing/invoices/${invoiceId}/simulate-payment`, {
        method: 'POST',
      });
      alert(res.message || 'Invoice marked paid in test sandbox!');
      refetchInvoices();
      if (selectedQrInvoice?._id === invoiceId) {
        setSelectedQrInvoice(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to simulate payment');
    } finally {
      setSimulatingInvoiceId(null);
    }
  };

  const handleDownloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const token = localStorage.getItem('mizan_token');
      const url = `${API_BASE}/orgs/${orgId}/billing/invoices/${invoiceId}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error('Failed to download invoice PDF');

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert(err.message || 'Invoice PDF download failed');
    }
  };

  const handleExportInvoicesCsv = () => {
    if (!invoicesData || invoicesData.length === 0) {
      alert('No invoices available to export.');
      return;
    }
    const headers = ['Invoice_Number', 'Fiscal_FS_No', 'Period', 'Subtotal_ETB', 'VAT_15_ETB', 'Total_ETB', 'Status', 'Paid_At'];
    const rows = invoicesData.map((inv: any) => [
      inv.invoiceNumber,
      inv.invoiceNumber.replace('INV-', 'FS-'),
      inv.period,
      (inv.subtotalSantim / 100).toFixed(2),
      (inv.vatSantim / 100).toFixed(2),
      (inv.totalSantim / 100).toFixed(2),
      inv.status,
      inv.paidAt ? new Date(inv.paidAt).toISOString() : 'N/A',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mizan-invoices-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (!invoicesData || invoicesData.length === 0) {
      alert('No data available to export.');
      return;
    }

    const content = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"/><title>Mizan Financial Audit</title></head>
    <body style="font-family:sans-serif;">
      <h2>MIZAN ETHIOPIAN SAAS - OFFICIAL FINANCIAL & VAT AUDIT REPORT</h2>
      <p>Generated: ${new Date().toISOString()} (Addis Ababa, EAT) | Ethiopian Ministry of Revenues Compliant</p>
      <table border="1" cellpadding="6" style="border-collapse:collapse;border:1px solid #cbd5e1;">
        <tr style="background:#10b981;color:#ffffff;font-weight:bold;">
          <th>Invoice Number</th><th>Fiscal FS No</th><th>Period</th><th>Subtotal (ETB)</th><th>15% VAT (ETB)</th><th>Total (ETB)</th><th>Status</th><th>Paid At</th>
        </tr>
        ${invoicesData.map((inv: any) => `
          <tr>
            <td style="font-family:monospace;font-weight:bold;">${inv.invoiceNumber}</td>
            <td style="font-family:monospace;">${inv.invoiceNumber.replace('INV-', 'FS-')}</td>
            <td>${inv.period}</td>
            <td>${(inv.subtotalSantim / 100).toFixed(2)}</td>
            <td>${(inv.vatSantim / 100).toFixed(2)}</td>
            <td style="font-weight:bold;">${(inv.totalSantim / 100).toFixed(2)}</td>
            <td>${inv.status.toUpperCase()}</td>
            <td>${inv.paidAt || 'N/A'}</td>
          </tr>
        `).join('')}
      </table>
    </body></html>`;

    const blob = new Blob([content], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mizan-financial-audit-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const percentUsed = metersData?.percentUsed || 0;
  const isCapped = metersData?.isHardCapped;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('billing.title')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Usage-metered monthly billing in Ethiopian Birr (ETB) through Chapa
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTestCards(!showTestCards)}
            className="inline-flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 px-3 py-1.5 rounded-lg text-xs font-semibold"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Chapa Sandbox Details</span>
          </button>
          <div className="inline-flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>VAT Registered: 15% Standard Allocation</span>
          </div>
        </div>
      </div>

      {/* Chapa Test Mode & Simulation Helper Drawer */}
      {showTestCards && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 p-5 rounded-xl border border-amber-200 dark:border-amber-700/60 shadow-sm text-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-bold text-amber-900 dark:text-amber-200">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Chapa Ethiopia Sandbox & Payment Testing Guide</span>
            </div>
            <button onClick={() => setShowTestCards(false)} className="text-amber-800 dark:text-amber-400 font-bold hover:underline">
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-700 dark:text-slate-300">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-amber-100 dark:border-slate-700">
              <p className="font-bold text-slate-900 dark:text-white">Telebirr Simulator</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Phone: <strong>0911000000</strong></p>
              <p className="text-[11px] text-slate-500">OTP Code: <strong>123456</strong></p>
              <p className="text-[10px] text-emerald-600 mt-1 font-semibold">Instant auto-confirm in Chapa</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-amber-100 dark:border-slate-700">
              <p className="font-bold text-slate-900 dark:text-white">CBE Birr / Bank Transfer</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Account: <strong>1000123456789</strong></p>
              <p className="text-[11px] text-slate-500">Branch: <strong>Addis Main Branch</strong></p>
              <p className="text-[10px] text-emerald-600 mt-1 font-semibold">Test reference allowed</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-amber-100 dark:border-slate-700">
              <p className="font-bold text-slate-900 dark:text-white">1-Click Fast Sandbox</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Click <strong>⚡ Simulate Paid</strong></p>
              <p className="text-[11px] text-slate-500">Updates database & marks invoice paid instantly</p>
              <p className="text-[10px] text-blue-600 mt-1 font-semibold">Perfect for portfolio review</p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Meter Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('billing.currentPlan')}</span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white capitalize mt-1">
              {metersData?.planName || 'Starter'} Plan
              {metersData?.status === 'trialing' && (
                <span className="ml-2 text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
                  14-Day Free Trial
                </span>
              )}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Current Period</span>
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{metersData?.period || '2026-11'}</p>
          </div>
        </div>

        {/* Progress Bar with Color Thresholds */}
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-slate-700 dark:text-slate-300">
              {metersData?.eventsIngested?.toLocaleString() || 0} / {metersData?.includedEvents?.toLocaleString() || 0} Events Ingested
            </span>
            <span className={percentUsed >= 100 ? 'text-rose-600 font-bold' : percentUsed >= 80 ? 'text-amber-600 font-bold' : 'text-slate-600 dark:text-slate-400'}>
              {percentUsed}% Used
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentUsed >= 100 ? 'bg-rose-500' : percentUsed >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, percentUsed)}%` }}
            />
          </div>
        </div>

        {isCapped && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center space-x-2 text-xs text-rose-800 dark:text-rose-200 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Monthly quota reached on Free plan. Ingestion will return 429 until upgraded to Starter or Business.</span>
          </div>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('billing.invoices')}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 transition"
              title="Download Multi-Sheet Financial Audit Workbook"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Audit Excel (.xls)</span>
            </button>
            <button
              onClick={handleExportInvoicesCsv}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
              <tr>
                <th className="py-3 px-4">{t('billing.invoiceNumber')}</th>
                <th className="py-3 px-4">Fiscal ESRM Machine Reg</th>
                <th className="py-3 px-4">{t('billing.period')}</th>
                <th className="py-3 px-4">{t('billing.amount')}</th>
                <th className="py-3 px-4">{t('billing.status')}</th>
                <th className="py-3 px-4 text-right">{t('billing.action')}</th>
              </tr>
            </thead>
            <tbody>
              {(invoicesData || []).map((inv: any) => (
                <tr key={inv._id} className="border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono">
                    <span className="text-slate-500">MRC: </span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">ETH-MZN-998234</span>
                    <span className="text-slate-400 block text-[11px]">FS: {inv.invoiceNumber.replace('INV-', 'FS-')}</span>
                  </td>
                  <td className="py-3 px-4">{inv.period}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {(inv.totalSantim / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB
                    <span className="text-xs text-slate-400 block font-normal">incl. 15% VAT</span>
                  </td>
                  <td className="py-3 px-4">
                    {inv.status === 'paid' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        Open / Unpaid
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleDownloadPdf(inv._id, inv.invoiceNumber)}
                      className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" /> {t('billing.pdfDownload')}
                    </button>
                    {inv.status !== 'paid' && (
                      <>
                        <button
                          onClick={() => setSelectedQrInvoice(inv)}
                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 rounded-lg hover:bg-blue-100 transition"
                        >
                          <QrCode className="w-3.5 h-3.5 mr-1" /> Telebirr QR
                        </button>
                        <button
                          onClick={() => handleSimulatePayment(inv._id)}
                          disabled={simulatingInvoiceId === inv._id}
                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-lg hover:bg-amber-100 transition disabled:opacity-50"
                        >
                          <Zap className="w-3.5 h-3.5 mr-1" />
                          {simulatingInvoiceId === inv._id ? 'Simulating...' : '⚡ Simulate Paid'}
                        </button>
                        <button
                          onClick={() => handlePayInvoice(inv._id)}
                          disabled={isProcessing}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" /> Pay with Chapa
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Telebirr / CBE Birr QR Code Modal (Item 1) */}
      {selectedQrInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-w-sm w-full space-y-4 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                Telebirr Dynamic Payment QR
              </span>
              <button onClick={() => setSelectedQrInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-xl border-2 border-dashed border-emerald-500/40 inline-block shadow-inner">
              {/* Telebirr / CBE Birr EmvCo Styled QR Code Representation */}
              <svg className="w-44 h-44 mx-auto" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="#ffffff" />
                {/* Outer Markers */}
                <rect x="10" y="10" width="24" height="24" fill="#0f172a" />
                <rect x="14" y="14" width="16" height="16" fill="#ffffff" />
                <rect x="18" y="18" width="8" height="8" fill="#0f172a" />

                <rect x="66" y="10" width="24" height="24" fill="#0f172a" />
                <rect x="70" y="14" width="16" height="16" fill="#ffffff" />
                <rect x="74" y="18" width="8" height="8" fill="#0f172a" />

                <rect x="10" y="66" width="24" height="24" fill="#0f172a" />
                <rect x="14" y="70" width="16" height="16" fill="#ffffff" />
                <rect x="18" y="74" width="8" height="8" fill="#0f172a" />

                {/* Data Matrix Elements */}
                <rect x="42" y="12" width="6" height="6" fill="#10b981" />
                <rect x="52" y="12" width="6" height="6" fill="#0f172a" />
                <rect x="42" y="24" width="6" height="6" fill="#0f172a" />
                <rect x="48" y="32" width="8" height="8" fill="#10b981" />
                <rect x="12" y="44" width="8" height="8" fill="#0f172a" />
                <rect x="28" y="44" width="6" height="6" fill="#10b981" />
                <rect x="40" y="44" width="6" height="6" fill="#0f172a" />
                <rect x="54" y="44" width="8" height="8" fill="#0f172a" />
                <rect x="70" y="44" width="8" height="8" fill="#10b981" />
                <rect x="84" y="44" width="6" height="6" fill="#0f172a" />
                <rect x="42" y="58" width="8" height="8" fill="#0f172a" />
                <rect x="56" y="58" width="6" height="6" fill="#10b981" />
                <rect x="72" y="58" width="6" height="6" fill="#0f172a" />
                <rect x="42" y="74" width="6" height="6" fill="#10b981" />
                <rect x="54" y="74" width="8" height="8" fill="#0f172a" />
                <rect x="70" y="74" width="8" height="8" fill="#10b981" />
                <rect x="84" y="74" width="6" height="6" fill="#0f172a" />

                {/* Center Ethio Logo Icon */}
                <circle cx="50" cy="50" r="10" fill="#059669" />
                <text x="50" y="54" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">ብር</text>
              </svg>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Amount: {(selectedQrInvoice.totalSantim / 100).toLocaleString()} ETB
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Merchant ID: <strong>MZN-TELE-88910</strong>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Ref: <strong>{selectedQrInvoice.invoiceNumber}</strong>
              </div>
            </div>

            <p className="text-[10px] text-slate-400">
              Open the <strong>Telebirr SuperApp</strong> or <strong>CBE Birr</strong>, tap <em>"Scan to Pay"</em>, and confirm the exact santim amount.
            </p>

            <button
              onClick={() => handleSimulatePayment(selectedQrInvoice._id)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition flex items-center justify-center space-x-1"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate Successful Mobile App Scan</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
