import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { Users, UserPlus, Shield, Trash2, Mail, Check, ShieldAlert } from 'lucide-react';

interface TeamPageProps {
  orgId: string;
}

export const TeamPage: React.FC<TeamPageProps> = ({ orgId }) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('analyst');
  const [inviteResult, setInviteResult] = useState<any>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const { data: membersData, refetch } = useQuery({
    queryKey: ['members', orgId],
    queryFn: async () => {
      const res = await apiRequest(`/orgs/${orgId}/members`);
      return res.members;
    },
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest(`/orgs/${orgId}/members/invite`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });
      setInviteResult(res);
      setEmail('');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Invitation failed');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      await apiRequest(`/orgs/${orgId}/members/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to update member role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await apiRequest(`/orgs/${orgId}/members/${userId}`, { method: 'DELETE' });
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Team & Access Control (RBAC)</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Role-Based Access Control enforcing least privilege across Owner, Admin, Analyst, Viewer, and Billing
          </p>
        </div>
        <button
          onClick={() => { setShowInviteModal(true); setInviteResult(null); }}
          className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {inviteResult && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
          <p className="font-bold">Invitation Token Generated (Single-use, 7 days):</p>
          <p className="font-mono bg-white dark:bg-slate-900 p-2 border border-emerald-300 dark:border-emerald-700 rounded select-all">{inviteResult.inviteToken}</p>
        </div>
      )}

      {/* RBAC Reference Card */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
        <h2 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-600" />
          Role Permissions Matrix
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
          <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-emerald-600">Owner</span>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">Full root control, transfer ownership, billing</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-blue-600">Admin</span>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">Manage members, sources, API keys, webhooks</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-indigo-600">Analyst</span>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">Query analytics, dashboards, exports</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-amber-600">Billing</span>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">VAT invoices, Chapa payments, usage</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-600 dark:text-slate-300">Viewer</span>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">Read-only dashboard inspection</p>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
            <tr>
              <th className="py-3 px-4">Member Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Assigned Role</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(membersData || []).map((m: any) => (
              <tr key={m.id || m.userId} className="border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{m.user?.name || 'Member'}</td>
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{m.user?.email}</td>
                <td className="py-3 px-4">
                  {m.role === 'owner' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      Owner
                    </span>
                  ) : (
                    <select
                      value={m.role}
                      disabled={updatingUserId === m.userId}
                      onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                      className="text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer text-slate-800 dark:text-slate-200"
                    >
                      <option value="admin">Admin</option>
                      <option value="analyst">Analyst</option>
                      <option value="billing">Billing</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  {m.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      className="text-rose-600 hover:text-rose-800 text-xs font-semibold transition"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && !inviteResult && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Invite New Team Member</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="colleague@company.et"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role Assignment</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="admin">Admin (Manage members, integrations & settings)</option>
                  <option value="analyst">Analyst (Query analytics, reports & dashboards)</option>
                  <option value="billing">Billing (Manage subscription & download VAT receipts)</option>
                  <option value="viewer">Viewer (Read-only view access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  Generate Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
