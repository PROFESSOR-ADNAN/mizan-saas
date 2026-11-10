import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiRequest, API_BASE } from '../api/client.js';
import { CreditCard, FileText, CheckCircle2, AlertTriangle, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface BillingPageProps {
  orgId: string;
}

export const BillingPage: React.FC<BillingPageProps> = ({ orgId }) => {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleDownloadPdf = (invoiceId: string, invoiceNumber: string) => {
    window.open(`${API_BASE}/orgs/${orgId}/billing/invoices/${invoiceId}/pdf`, '_blank');
  };

  const percentUsed = metersData?.percentUsed || 0;
  const isCapped = metersData?.isHardCapped;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('billing.title')}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Usage-metered monthly billing in Ethiopian Birr (ETB) through Chapa
          </p>
        </div>
        <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>VAT Registered: 15% Standard Allocation</span>
        </div>
      </div>

      {/* Usage Meter Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('billing.currentPlan')}</span>
            <h2 className="text-2xl font-bold text-slate-900 capitalize mt-1">
              {metersData?.planName || 'Starter'} Plan
              {metersData?.status === 'trialing' && (
                <span className="ml-2 text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  14-Day Free Trial
                </span>
              )}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Current Period</span>
            <p className="font-semibold text-slate-800 text-sm">{metersData?.period || '2026-11'}</p>
          </div>
        </div>

        {/* Progress Bar with Color Thresholds (50%, 80%, 100%) */}
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-slate-700">
              {metersData?.eventsIngested?.toLocaleString() || 0} / {metersData?.includedEvents?.toLocaleString() || 0} Events Ingested
            </span>
            <span className={percentUsed >= 100 ? 'text-rose-600' : percentUsed >= 80 ? 'text-amber-600' : 'text-slate-600'}>
              {percentUsed}% Used
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentUsed >= 100 ? 'bg-rose-500' : percentUsed >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, percentUsed)}%` }}
            />
          </div>
        </div>

        {isCapped && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-xs text-rose-800 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Monthly quota reached on Free plan. Ingestion will return 429 until upgraded to Starter or Business.</span>
          </div>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">{t('billing.invoices')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-700">
              <tr>
                <th className="py-3 px-4">{t('billing.invoiceNumber')}</th>
                <th className="py-3 px-4">{t('billing.period')}</th>
                <th className="py-3 px-4">{t('billing.amount')}</th>
                <th className="py-3 px-4">{t('billing.status')}</th>
                <th className="py-3 px-4 text-right">{t('billing.action')}</th>
              </tr>
            </thead>
            <tbody>
              {(invoicesData || []).map((inv: any) => (
                <tr key={inv._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4">{inv.period}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {(inv.totalSantim / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB
                    <span className="text-xs text-slate-400 block font-normal">incl. 15% VAT</span>
                  </td>
                  <td className="py-3 px-4">
                    {inv.status === 'paid' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                        Open / Unpaid
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleDownloadPdf(inv._id, inv.invoiceNumber)}
                      className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" /> {t('billing.pdfDownload')}
                    </button>
                    {inv.status !== 'paid' && (
                      <button
                        onClick={() => handlePayInvoice(inv._id)}
                        disabled={isProcessing}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition"
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-1" /> Pay with Chapa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
