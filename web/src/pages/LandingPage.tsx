import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShieldCheck,
  Receipt,
  Layers,
  Zap,
  CheckCircle2,
  CreditCard,
  ArrowRight,
  BarChart3,
  Users,
  Building2,
  ChevronRight,
  Store,
  BadgePercent,
  Cpu,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('mizan_token');
    if (token) {
      setHasToken(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
              ሚ
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
                MIZAN <span className="text-emerald-400 font-normal text-sm font-sans">| ሚዛን</span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Sales & Billing Analytics
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#solutions" className="hover:text-emerald-400 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            {hasToken ? (
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/20 transition-all"
              >
                Go to Workspace <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 text-sm font-semibold transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/20 transition-all"
                >
                  Start Free Trial <ChevronRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-28 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 -translate-y-1/2 w-[400px] h-[250px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-6 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Built for Ethiopian Businesses & Retailers 🇪🇹
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
            The Intelligent Sales & Billing Analytics Engine for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Ethiopia
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Consolidate <strong>Telebirr</strong>, <strong>CBE Birr</strong>, <strong>Cash</strong>, and <strong>Chapa</strong> transactions in real time. Get santim-exact accounting, automated 15% VAT invoicing, and multi-branch intelligence.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
            >
              Start 14-Day Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-base border border-slate-700 transition-all"
            >
              Sign In to Dashboard
            </Link>
          </div>

          <p className="mt-4 text-xs text-slate-400 font-medium">
            Zero credit card required • Instant tenant setup in 30 seconds • 100% Ethiopian Birr (ETB)
          </p>

          {/* Interactive Live Dashboard Mock Preview */}
          <div className="mt-16 max-w-5xl mx-auto rounded-2xl p-1.5 bg-gradient-to-b from-slate-700/80 via-slate-800/40 to-slate-900 border border-slate-700/80 shadow-2xl">
            <div className="bg-slate-950 rounded-xl p-4 sm:p-6 text-left space-y-6">
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-400">mizan-saas.vercel.app / orgs / addis-retail / dashboard</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-md font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE STREAMING
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gross Sales (MTD)</div>
                  <div className="text-xl sm:text-2xl font-black text-white">842,500.00 <span className="text-xs font-normal text-emerald-400">ETB</span></div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <TrendingUp className="w-3 h-3" /> +18.4% vs last month
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Transactions</div>
                  <div className="text-xl sm:text-2xl font-black text-white">14,280 <span className="text-xs font-normal text-slate-400">sales</span></div>
                  <div className="text-[11px] text-slate-400 font-medium">Across 4 retail branches</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ERCA VAT (15%)</div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">109,891.30 <span className="text-xs font-normal text-slate-300">ETB</span></div>
                  <div className="text-[11px] text-slate-400 font-medium">Exact integer santim math</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Top Payment Channel</div>
                  <div className="text-xl sm:text-2xl font-black text-white">Telebirr <span className="text-xs font-normal text-emerald-400">(64%)</span></div>
                  <div className="text-[11px] text-slate-400 font-medium">Followed by CBE Birr (24%)</div>
                </div>
              </div>

              {/* Payment Rail Visualizer */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-300">Live Channel Volume Distribution</span>
                  <span className="text-slate-400 font-mono">14,280 processed today</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-800 flex overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '64%' }} title="Telebirr: 64%" />
                  <div className="h-full bg-blue-500" style={{ width: '24%' }} title="CBE Birr: 24%" />
                  <div className="h-full bg-amber-500" style={{ width: '9%' }} title="Cash: 9%" />
                  <div className="h-full bg-purple-500" style={{ width: '3%' }} title="Chapa/Card: 3%" />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Telebirr (64%)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> CBE Birr (24%)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> In-Store Cash (9%)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Chapa / Cards (3%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Features Section */}
      <section id="features" className="py-24 bg-slate-950/80 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Designed for Ethiopian Commerce</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Everything your business needs to measure sales and automate billing
            </p>
            <p className="text-slate-400 text-base">
              Built from scratch to overcome the unique challenges of multi-channel payments, tax compliance, and multi-branch retail in Ethiopia.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <BadgePercent className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Zero-Float Santim Accounting</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                JavaScript standard floating numbers lose precision. Mizan stores every transaction in exact integer <strong>santim (1 ETB = 100 santims)</strong>, ensuring zero rounding discrepancies on audit.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Automated ERCA 15% VAT Invoicing</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Generate downloadable, tax-compliant PDF invoices with complete Ethiopian TIN numbers, subtotal breakdowns, and tax line items ready for government accounting.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Chapa Integration & Webhooks</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Charge subscribers or customers seamlessly via Chapa. Dual-verified HMAC-SHA256 webhooks instantly settle invoices and reactivate subscriptions without human intervention.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Multi-Branch Tenancy (Bole, Piassa...)</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Isolate data by physical branch or organization. Assign granular role-based permissions (Owner, Admin, Manager, Cashier) with full cryptographic isolation.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Ultra-Fast POS Event Ingestion</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Connect your electronic cash registers or backend with scoped API keys. Process batches of up to 100 sales per request with automatic deduplication.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Full Audit Logs & SSRF Defense</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Every sensitive action (plan changes, API key creations, user deletions) is recorded in an immutable audit trail with actor IP, timestamp, and details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="solutions" className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Simple & Streamlined</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">How Mizan Powers Your Business</p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 relative space-y-4">
              <div className="text-4xl font-black text-slate-800">01</div>
              <h3 className="text-xl font-bold text-white">Create Organization & API Keys</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Register your business, invite team members, and generate scoped API keys for your retail POS or online payment gateways.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 relative space-y-4">
              <div className="text-4xl font-black text-slate-800">02</div>
              <h3 className="text-xl font-bold text-white">Stream Sales in Real Time</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Transactions flow in with automated channel tags (Telebirr, CBE Birr, Cash). Redis pre-aggregates charts so queries load in milliseconds.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 relative space-y-4">
              <div className="text-4xl font-black text-slate-800">03</div>
              <h3 className="text-xl font-bold text-white">Automate Invoices & Chapa Payouts</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Issue 15% VAT invoices, track overage quotas, and accept customer payments directly through Chapa without manual reconciliation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pricing Section (ETB) */}
      <section id="pricing" className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Fair & Transparent</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Pricing in Ethiopian Birr (ETB)</p>
            <p className="text-slate-400 text-sm">Choose the plan that fits your branch network. Upgrade or downgrade anytime.</p>
          </div>

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Plan 1: Free */}
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Free (የነጻ እቅድ)</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">0</span>
                  <span className="text-sm text-slate-400">ETB / month</span>
                </div>
                <p className="text-xs text-slate-400">Perfect for single stores and testing integration.</p>

                <ul className="space-y-3 pt-4 border-t border-slate-800 text-sm text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Up to 10,000 monthly transactions
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 1 Branch location
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 2 Team member seats
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Live Sales Dashboard
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-center text-sm transition-all"
              >
                Get Started Free
              </Link>
            </div>

            {/* Plan 2: Starter (Featured) */}
            <div className="p-8 rounded-2xl bg-slate-900 border-2 border-emerald-500 relative flex flex-col justify-between space-y-6 shadow-2xl shadow-emerald-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-black tracking-wide uppercase">
                Most Popular
              </div>

              <div className="space-y-4">
                <div className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Starter (ጀማሪ እቅድ)</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">1,500</span>
                  <span className="text-sm text-slate-400">ETB / month</span>
                </div>
                <p className="text-xs text-slate-400">For growing retail shops, cafes, and e-commerce stores.</p>

                <ul className="space-y-3 pt-4 border-t border-slate-800 text-sm text-slate-200">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Up to 100,000 monthly transactions
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Up to 3 Branch locations
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 5 Team seats included
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Automated 15% VAT PDF Invoices
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Chapa Automated Checkout & Webhooks
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-center text-sm shadow-lg shadow-emerald-500/20 transition-all"
              >
                Start 14-Day Free Trial
              </Link>
            </div>

            {/* Plan 3: Business */}
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Business (የንግድ እቅድ)</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">4,500</span>
                  <span className="text-sm text-slate-400">ETB / month</span>
                </div>
                <p className="text-xs text-slate-400">For multi-branch supermarket chains and large enterprises.</p>

                <ul className="space-y-3 pt-4 border-t border-slate-800 text-sm text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 1,000,000+ monthly transactions
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Unlimited Branch locations
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 15 Seats included (+150 ETB/seat)
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> High-Throughput POS Batch Ingestion
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Full Audit Trail & Priority Support
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-center text-sm transition-all"
              >
                Start Business Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section id="faq" className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Frequently Asked Questions</h2>
            <p className="text-3xl font-extrabold text-white tracking-tight">Got Questions? We Have Answers.</p>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h3 className="font-bold text-white text-base">Do I need a credit card to sign up?</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                No! You can register in under 30 seconds with just your business name and email. You get a full 14-day free trial of all Business features with zero financial commitment.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h3 className="font-bold text-white text-base">Which Ethiopian payment methods can Mizan track?</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Mizan natively tracks Telebirr, CBE Birr, Awash Bank, in-store physical Cash, and Chapa online card/mobile money payments across all your sales points.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h3 className="font-bold text-white text-base">How does the 15% VAT calculation work?</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Mizan uses half-up integer santim arithmetic (e.g. 15 santims on 100 santims) compliant with Ethiopian Ministry of Revenues (ERCA) guidelines. Invoices include your TIN, breakdown of VAT, and subtotal.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h3 className="font-bold text-white text-base">How does Chapa payment work for subscription plans?</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                When you upgrade to Starter or Business, Mizan launches a Chapa checkout window where you can pay via Telebirr or CBE Birr. Once verified, your account status updates instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Bottom CTA */}
      <section className="py-20 bg-gradient-to-b from-slate-950 to-slate-900 border-t border-slate-800 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to modernize your sales analytics?
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Join forward-thinking Ethiopian merchants and SaaS teams tracking every santim with Mizan.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
            >
              Start Free Trial Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="py-8 bg-slate-950 border-t border-slate-800/80 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xs">
              ሚ
            </div>
            <span className="font-semibold text-slate-300">MIZAN (ሚዛን)</span>
            <span>© {new Date().getFullYear()} All rights reserved. Addis Ababa, Ethiopia.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-slate-300 transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-slate-300 transition-colors">Register</Link>
            <a href="#pricing" className="hover:text-slate-300 transition-colors">Pricing</a>
            <a href="#features" className="hover:text-slate-300 transition-colors">Features</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
