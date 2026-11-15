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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ email: 'google.merchant@addisstore.et', name: 'Google Merchant (Addis Ababa)' }),
      });
      localStorage.setItem('mizan_token', res.accessToken);
      if (res.orgId) {
        navigate(`/orgs/${res.orgId}/dashboard`);
      } else {
        const orgsRes = await apiRequest('/orgs');
        const defaultOrgId = orgsRes.organizations?.[0]?.org?._id;
        navigate(defaultOrgId ? `/orgs/${defaultOrgId}/dashboard` : '/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Google SSO failed.');
    } finally {
      setIsLoading(false);
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

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs shadow-sm transition flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google (SSO)</span>
        </button>

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
