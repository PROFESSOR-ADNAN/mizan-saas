import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/auth/demo', { method: 'POST' });
      localStorage.setItem('mizan_token', res.accessToken);
      if (res.orgId) {
        navigate(`/orgs/${res.orgId}/dashboard`);
      } else {
        const orgsRes = await apiRequest('/orgs');
        const defaultOrgId = orgsRes.organizations?.[0]?.org?._id;
        navigate(defaultOrgId ? `/orgs/${defaultOrgId}/dashboard` : '/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Demo provisioning failed.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, totpCode: totpCode || undefined }),
      });

      if (res.mfaRequired) {
        setMfaRequired(true);
        setIsLoading(false);
        return;
      }

      localStorage.setItem('mizan_token', res.accessToken);
      // Fetch user orgs
      const orgsRes = await apiRequest('/orgs');
      const defaultOrgId = orgsRes.organizations?.[0]?.org?._id;
      if (defaultOrgId) {
        navigate(`/orgs/${defaultOrgId}/dashboard`);
      } else {
        navigate('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl mx-auto shadow-sm">
            ሚ
          </div>
          <h1 className="text-xl font-bold text-slate-900">Sign in to Mizan</h1>
          <p className="text-xs text-slate-500">Sales & Billing Analytics for Ethiopian Businesses</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="owner@store.et"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>

          {mfaRequired && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit 2FA Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-center font-mono tracking-widest focus:outline-none focus:border-emerald-500"
                placeholder="123456"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition disabled:bg-slate-300"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-medium">or explore live</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isDemoLoading || isLoading}
          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-lg text-xs shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-75"
        >
          <span>{isDemoLoading ? 'Provisioning Demo Workspace...' : '⚡ 1-Click Portfolio Demo Login'}</span>
        </button>
        <p className="text-[11px] text-center text-slate-400 -mt-2">
          Instant access to Bole Fresh Mart with 2,000 real Ethiopian transactions
        </p>

        <div className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-emerald-600 hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
