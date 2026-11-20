'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { useAuth } from '../../lib/auth-context';
import { UserRole } from '../../types/index.ts';

interface Member {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  joinedAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  status: string;
  inviterName: string;
  expiresAt: string;
}

const roleColors: Record<UserRole, string> = {
  platform_admin: 'bg-rose-100 text-rose-800 border-rose-200',
  org_owner: 'bg-purple-100 text-purple-800 border-purple-200',
  project_manager: 'bg-blue-100 text-blue-800 border-blue-200',
  team_member: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  auditor: 'bg-amber-100 text-amber-800 border-amber-200',
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function TeamPage() {
  const { user, token, hasRole } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('team_member');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orgId = user?.orgId || 'org-acme-101';
  const isOwnerOrAdmin = hasRole('org_owner', 'platform_admin');

  useEffect(() => {
    loadMembersAndInvites();
  }, [user]);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-Tenant-ID': orgId,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const loadMembersAndInvites = async () => {
    try {
      // 1. Fetch Members
      const membersRes = await fetch(`${API_BASE_URL}/organizations/${orgId}/members`, {
        headers: getHeaders(),
      });
      if (membersRes.ok) {
        const json = await membersRes.json();
        setMembers(json.data || []);
      } else {
        // Fallback default fixture
        setMembers([
          { id: 'mem-1', userId: 'usr-owner-1', email: 'owner@acme.com', fullName: 'Elena Vance (Owner)', role: 'org_owner', isActive: true, joinedAt: '2026-11-01' },
          { id: 'mem-2', userId: 'usr-pm-1', email: 'pm@acme.com', fullName: 'Marcus Brody (PM)', role: 'project_manager', isActive: true, joinedAt: '2026-11-02' },
          { id: 'mem-3', userId: 'usr-member-1', email: 'member@acme.com', fullName: 'Sarah Connor (Dev)', role: 'team_member', isActive: true, joinedAt: '2026-11-03' },
          { id: 'mem-4', userId: 'usr-auditor-1', email: 'auditor@acme.com', fullName: 'Arthur Pendelton (Auditor)', role: 'auditor', isActive: true, joinedAt: '2026-11-04' },
        ]);
      }

      // 2. Fetch Invitations
      const invitesRes = await fetch(`${API_BASE_URL}/organizations/${orgId}/invitations`, {
        headers: getHeaders(),
      });
      if (invitesRes.ok) {
        const json = await invitesRes.json();
        setInvitations(json.data || []);
      }
    } catch {
      // Fallback
      setMembers([
        { id: 'mem-1', userId: 'usr-owner-1', email: 'owner@acme.com', fullName: 'Elena Vance (Owner)', role: 'org_owner', isActive: true, joinedAt: '2026-11-01' },
        { id: 'mem-2', userId: 'usr-pm-1', email: 'pm@acme.com', fullName: 'Marcus Brody (PM)', role: 'project_manager', isActive: true, joinedAt: '2026-11-02' },
        { id: 'mem-3', userId: 'usr-member-1', email: 'member@acme.com', fullName: 'Sarah Connor (Dev)', role: 'team_member', isActive: true, joinedAt: '2026-11-03' },
        { id: 'mem-4', userId: 'usr-auditor-1', email: 'auditor@acme.com', fullName: 'Arthur Pendelton (Auditor)', role: 'auditor', isActive: true, joinedAt: '2026-11-04' },
      ]);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsSubmitting(true);
    setNotification(null);

    try {
      const res = await fetch(`${API_BASE_URL}/organizations/${orgId}/invitations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const json = await res.json();
      if (!res.ok) {
        setNotification({ type: 'error', message: json.error?.message || 'Failed to send invitation' });
      } else {
        setNotification({ type: 'success', message: `Invitation dispatched to ${inviteEmail} (Job Enqueued)` });
        setInviteEmail('');
        setIsInviteModalOpen(false);
        loadMembersAndInvites();
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error connecting to backend' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    try {
      const res = await fetch(`${API_BASE_URL}/organizations/${orgId}/members/${targetUserId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setNotification({ type: 'success', message: 'Member role updated successfully' });
        loadMembersAndInvites();
      } else {
        const err = await res.json();
        setNotification({ type: 'error', message: err.error?.message || 'Role update rejected' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error' });
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!confirm('Are you sure you want to remove this user from the organization?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/organizations/${orgId}/members/${targetUserId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (res.ok) {
        setNotification({ type: 'success', message: 'Member removed from organization' });
        loadMembersAndInvites();
      } else {
        const err = await res.json();
        setNotification({ type: 'error', message: err.error?.message || 'Failed to remove member' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error' });
    }
  };

  const handleCancelInvite = async (invId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/organizations/${orgId}/invitations/${invId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Invitation revoked' });
        loadMembersAndInvites();
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error' });
    }
  };

  if (!hasRole('org_owner', 'project_manager', 'platform_admin')) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-y-auto">
          <Topbar />
          <main className="p-8 max-w-4xl mx-auto my-auto text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-2xl mx-auto">
              !
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Access Restricted</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              User Management & Team Onboarding is restricted to Organization Owners, Administrators, and Project Managers.
            </p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />

        <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">User Management & Organization Team</h2>
              <p className="text-sm text-slate-500">
                Tenant: <span className="font-mono text-indigo-600 font-semibold">{orgId}</span> • Role-Based Access Control (RBAC)
              </p>
            </div>
            {isOwnerOrAdmin && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
              >
                <span>+</span>
                <span>Invite New Member</span>
              </button>
            )}
          </div>

          {notification && (
            <div
              className={`p-4 rounded-lg text-sm flex justify-between items-center ${
                notification.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <span>{notification.message}</span>
              <button onClick={() => setNotification(null)} className="font-bold ml-2">
                ✕
              </button>
            </div>
          )}

          {/* Active Members Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Active Organization Members</h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {members.length} Members
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-6">Member</th>
                    <th className="py-3 px-6">Email</th>
                    <th className="py-3 px-6">Role</th>
                    <th className="py-3 px-6">Joined Date</th>
                    {isOwnerOrAdmin && <th className="py-3 px-6 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {m.fullName.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900">{m.fullName}</span>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-600">{m.email}</td>
                      <td className="py-4 px-6">
                        {isOwnerOrAdmin && m.userId !== user?.id ? (
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.userId, e.target.value as UserRole)}
                            className="text-xs font-semibold rounded px-2 py-1 border border-slate-300 focus:ring-1 focus:ring-indigo-500 bg-white"
                          >
                            <option value="org_owner">Organization Owner</option>
                            <option value="project_manager">Project Manager</option>
                            <option value="team_member">Team Member</option>
                            <option value="auditor">Auditor</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                              roleColors[m.role] || roleColors.team_member
                            }`}
                          >
                            {m.role.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">{m.joinedAt.split('T')[0]}</td>
                      {isOwnerOrAdmin && (
                        <td className="py-4 px-6 text-right">
                          {m.userId !== user?.id && (
                            <button
                              onClick={() => handleRemoveMember(m.userId)}
                              className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Invitations Section */}
          {invitations.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Pending Invitations</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {invitations.length} Pending
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {invitations.map((inv) => (
                  <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                        ✉
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{inv.email}</div>
                        <div className="text-xs text-slate-400">
                          Role: <strong className="text-slate-600">{inv.role}</strong> • Invited by:{' '}
                          <span className="text-slate-600">{inv.inviterName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-slate-400">
                        Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                      </span>
                      {isOwnerOrAdmin && (
                        <button
                          onClick={() => handleCancelInvite(inv.id)}
                          className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded border border-rose-200 font-medium transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invite User Modal */}
          {isInviteModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-lg text-slate-900">Invite New Team Member</h3>
                  <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSendInvite} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Corporate Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="colleague@acme.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Assign Initial Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="team_member">Team Member (Developer / Contributor)</option>
                      <option value="project_manager">Project Manager (Can create projects & tasks)</option>
                      <option value="auditor">Auditor (Read-only compliance & audit timeline)</option>
                      <option value="org_owner">Organization Owner (Full administrative privileges)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 border border-slate-100">
                    An onboarding invitation token will be generated and an asynchronous dispatch job will be queued with deduplication protection.
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsInviteModalOpen(false)}
                      className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Invitation'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
