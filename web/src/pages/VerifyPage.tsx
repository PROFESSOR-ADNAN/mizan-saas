import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { CheckCircle2, AlertCircle, Mail, Phone, ArrowLeft, Send, ShieldCheck, RefreshCw } from 'lucide-react';

export const VerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [emailCode, setEmailCode] = useState(searchParams.get('code') || '');
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');

  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [phoneMsg, setPhoneMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [emailCooldown, setEmailCooldown] = useState(0);
  const [phoneCooldown, setPhoneCooldown] = useState(0);

  // Fetch current user
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const res = await apiRequest('/auth/me');
      return res.user;
    },
  });

  useEffect(() => {
    if (user?.phone) {
      setPhoneInput(user.phone);
    }
  }, [user]);

  // Timers for resend cooldowns
  useEffect(() => {
    if (emailCooldown > 0) {
      const timer = setTimeout(() => setEmailCooldown(emailCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCooldown]);

  useEffect(() => {
    if (phoneCooldown > 0) {
      const timer = setTimeout(() => setPhoneCooldown(phoneCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [phoneCooldown]);

  // Mutations
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/auth/email/send-verification', { method: 'POST' });
    },
    onSuccess: () => {
      setEmailMsg({ type: 'success', text: 'Verification email sent! Please check your inbox or spam.' });
      setEmailCooldown(60);
    },
    onError: (err: any) => {
      setEmailMsg({ type: 'error', text: err.message || 'Failed to send verification email' });
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest('/auth/email/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
    },
    onSuccess: () => {
      setEmailMsg({ type: 'success', text: 'Email successfully verified! Welcome aboard.' });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (err: any) => {
      setEmailMsg({ type: 'error', text: err.message || 'Verification failed. Please check the code.' });
    },
  });

  const sendPhoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      return apiRequest('/auth/phone/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
    },
    onSuccess: () => {
      setPhoneMsg({ type: 'success', text: '6-digit OTP dispatched via Afro Message SMS!' });
      setPhoneCooldown(60);
    },
    onError: (err: any) => {
      setPhoneMsg({ type: 'error', text: err.message || 'Failed to send SMS OTP' });
    },
  });

  const verifyPhoneMutation = useMutation({
    mutationFn: async (vars: { phone: string; code: string }) => {
      return apiRequest('/auth/phone/verify-otp', {
        method: 'POST',
        body: JSON.stringify(vars),
      });
    },
    onSuccess: () => {
      setPhoneMsg({ type: 'success', text: 'Phone successfully verified via Afro Message!' });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (err: any) => {
      setPhoneMsg({ type: 'error', text: err.message || 'OTP verification failed' });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm">
        Loading verification center...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
              ሚ
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Security & Verification <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </h1>
              <p className="text-xs text-slate-400">Verify your Email and Ethiopian Phone to secure your Mizan account</p>
            </div>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        {/* 1. Email Verification Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Email Address</div>
                <div className="text-xs text-slate-400 font-mono">{user?.email}</div>
              </div>
            </div>

            {user?.isEmailVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Email Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4" /> Unverified
              </span>
            )}
          </div>

          {emailMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-medium ${
                emailMsg.type === 'success'
                  ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/50 border border-rose-800 text-rose-300'
              }`}
            >
              {emailMsg.text}
            </div>
          )}

          {!user?.isEmailVerified && (
            <div className="pt-3 border-t border-slate-800/80 space-y-4">
              <p className="text-xs text-slate-400">
                Enter the 6-digit code sent to your email, or click <strong>Resend Code</strong> to receive a fresh verification email.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full sm:w-48 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center font-mono text-lg tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => verifyEmailMutation.mutate(emailCode)}
                  disabled={emailCode.length < 6 || verifyEmailMutation.isPending}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all shadow-md shadow-emerald-500/20"
                >
                  {verifyEmailMutation.isPending ? 'Verifying...' : 'Verify Email Code'}
                </button>
                <button
                  onClick={() => sendEmailMutation.mutate()}
                  disabled={sendEmailMutation.isPending || emailCooldown > 0}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {emailCooldown > 0 ? `Resend in ${emailCooldown}s` : 'Resend Email Code'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. Phone (Afro Message) Verification Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Ethiopian Phone Number</div>
                <div className="text-xs text-slate-400 font-mono">
                  {user?.phone || 'No phone number linked yet'}
                </div>
              </div>
            </div>

            {user?.isPhoneVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Phone Verified (Afro Message)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4" /> Unverified
              </span>
            )}
          </div>

          {phoneMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-medium ${
                phoneMsg.type === 'success'
                  ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/50 border border-rose-800 text-rose-300'
              }`}
            >
              {phoneMsg.text}
            </div>
          )}

          {!user?.isPhoneVerified && (
            <div className="pt-3 border-t border-slate-800/80 space-y-4">
              <p className="text-xs text-slate-400">
                We use <strong>Afro Message</strong> to deliver high-priority SMS OTP codes to your Telebirr (09...) or Safaricom (07...) line.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="tel"
                  placeholder="0912345678 or +251..."
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full sm:w-64 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  onClick={() => sendPhoneMutation.mutate(phoneInput)}
                  disabled={phoneInput.length < 9 || sendPhoneMutation.isPending || phoneCooldown > 0}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  {phoneCooldown > 0 ? `Resend in ${phoneCooldown}s` : 'Send SMS via Afro Message'}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit SMS OTP"
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full sm:w-64 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center font-mono text-base tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => verifyPhoneMutation.mutate({ phone: phoneInput, code: phoneOtp })}
                  disabled={phoneOtp.length < 6 || verifyPhoneMutation.isPending}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all shadow-md shadow-emerald-500/20"
                >
                  {verifyPhoneMutation.isPending ? 'Verifying...' : 'Verify Phone OTP'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 pt-8">
        MIZAN (ሚዛን) Security & Trust &bull; Powered by Afro Message & Gmail SMTP
      </div>
    </div>
  );
};
