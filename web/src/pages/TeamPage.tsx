import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { Users, UserPlus, Shield, Trash2, Mail } from 'lucide-react';

interface TeamPageProps {
  orgId: string;
}

export const TeamPage: React.FC<TeamPageProps> = ({ orgId }) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('analyst');
  const [inviteResult, setInviteResult] = useState<any>(null);

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
      <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Team & Members</h1>
          <p className="text-xs text-slate-500 mt-1">Manage team access and roles (Owner, Admin, Analyst, Viewer, Billing)</p>
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
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
          <p className="font-bold">Invitation Token Generated (Single-use, 7 days):</p>
          <p className="font-mono bg-white p-2 border border-emerald-300 rounded select-all">{inviteResult.inviteToken}</p>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-700">
            <tr>
              <th className="py-3 px-4">Member Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Assigned Role</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(membersData || []).map((m: any) => (
              <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 font-semibold text-slate-900">{m.user?.name || 'Member'}</td>
                <td className="py-3 px-4 text-slate-500">{m.user?.email}</td>
                <td className="py-3 px-4">
                  <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                    {m.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {m.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      className="text-rose-600 hover:text-rose-800 text-xs font-semibold"
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Invite New Team Member</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="colleague@company.et"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="admin">Admin (Full store & member management)</option>
                  <option value="analyst">Analyst (Dashboards, queries, CSV imports)</option>
                  <option value="billing">Billing (Invoices, VAT, payments)</option>
                  <option value="viewer">Viewer (Read-only dashboards)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
