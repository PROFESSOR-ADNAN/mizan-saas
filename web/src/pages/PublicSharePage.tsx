import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, TrendingUp, ShoppingCart, Package } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const PublicSharePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['publicShare', token],
    queryFn: async () => {
      const res = await fetch(`/api/v1/share/${token}`);
      if (!res.ok) throw new Error('Shared dashboard link is invalid or expired');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Loading public dashboard snapshot...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-sm">
          <h1 className="text-lg font-bold text-slate-900 mb-2">Link Expired or Invalid</h1>
          <p className="text-xs text-slate-500">This temporary share link has expired or been revoked by the owner.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase text-emerald-600 tracking-wider">Mizan Read-Only Snapshot</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{data.title}</h1>
          <p className="text-xs text-slate-500 mt-1">{data.description || 'Verified aggregate retail dashboard'}</p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <p className="flex items-center justify-end"><Clock className="w-3.5 h-3.5 mr-1" /> Snapshot as of {new Date(data.asOf).toLocaleTimeString()}</p>
          <p className="mt-0.5">Strictly Read-Only Access</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">30-Day Revenue Trend (ETB)</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.data || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="timestamp" tickFormatter={(v) => String(v).slice(5, 10)} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${Math.round(v / 100000)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${(Number(v) / 100).toLocaleString()} ETB`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
