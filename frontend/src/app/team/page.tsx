'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { useAuth } from '../../lib/auth-context';
import { UserRole } from '../../types';

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

const roleStyles: Record<UserRole, { label: string; badge: string }> = {
  platform_admin: { label: 'Platform Admin', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  org_owner: { label: 'Organization Owner', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  project_manager: { label: 'Project Manager', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  team_member: { label: 'Team Member', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  auditor: { label: 'Compliance Auditor', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
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
      const membersRes = await fetch(`${API_BASE_URL}/organizations/${orgId}/members`, {
        headers: getHeaders(),
      });
      if (membersRes.ok) {
        const json = await membersRes.json();
        setMembers(json.data || []);
      } else {
        setMembers([
          { id: 'mem-1', userId: 'usr-owner-1', email: 'owner@acme.com', fullName: 'Elena Vance (Owner)', role: 'org_owner', isActive: true, joinedAt: '2026-11-01' },
          { id: 'mem-2', userId: 'usr-pm-1', email: 'pm@acme.com', fullName: 'Marcus Brody (PM)', role: 'project_manager', isActive: true, joinedAt: '2026-11-02' },
          { id: 'mem-3', userId: 'usr-member-1', email: 'member@acme.com', fullName: 'Sarah Connor (Dev)', role: 'team_member', isActive: true, joinedAt: '2026-11-03' },
          { id: 'mem-4', userId: 'usr-auditor-1', email: 'auditor@acme.com', fullName: 'Arthur Pendelton (Auditor)', role: 'auditor', isActive: true, joinedAt: '2026-11-04' },
        ]);
      }

      const invitesRes = await fetch(`${API_BASE_URL}/organizations/${orgId}/invitations`, {
        headers: getHeaders(),
      });
      if (invitesRes.ok) {
        const json = await invitesRes.json();
        setInvitations(json.data || []);
      }
    } catch {
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
        setNotification({ type: 'error', message: json.error?.message || 'Failed to dispatch invitation' });
      } else {
        setNotification({ type: 'success', message: `Invitation dispatched to ${inviteEmail} (Worker Job Enqueued)` });
        setInviteEmail('');
        setIsInviteModalOpen(false);
        loadMembersAndInvites();
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error connecting to API server' });
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
        setNotification({ type: 'error', message: err.error?.message || 'Role change rejected' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error connecting to API server' });
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!confirm('Are you sure you want to remove this collaborator from the organization?')) return;

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

  const getInitials = (name?: string) => {
    if (!name) return 'WS';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (!hasRole('org_owner', 'project_manager', 'platform_admin')) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#F5F5F7]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-y-auto">
          <Topbar />
          <main className="p-8 max-w-md mx-auto my-auto text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xl mx-auto border border-rose-200">
              !
            </div>
            <h2 className="text-xl font-bold text-[#1D1D1F]">Access Restricted</h2>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              Team Member and User Management is restricted to Organization Owners, Administrators, and Project Managers.
            </p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F7]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />

        <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
                Team & User Management
              </h2>
              <p className="text-xs text-[#6E6E73]">
                Tenant Scope: <span className="font-mono text-[#007AFF] font-semibold">{orgId}</span> • Role-Based Access Control (RBAC)
              </p>
            </div>
            {isOwnerOrAdmin && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all flex items-center space-x-1.5"
              >
                <span>+</span>
                <span>Invite Team Member</span>
              </button>
            )}
          </div>

          {notification && (
            <div
              className={`p-3.5 rounded-[10px] text-xs flex justify-between items-center shadow-xs ${
                notification.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              <span>{notification.message}</span>
              <button onClick={() => setNotification(null)} className="font-bold text-xs ml-2">
                ✕
              </button>
            </div>
          )}

          {/* Active Members Table */}
          <div className="apple-card overflow-hidden">
            <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-[#1D1D1F]">Active Collaborators</h3>
                <p className="text-[11px] text-[#6E6E73]">Team members with authorized workspace access</p>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/[0.04] text-[#6E6E73] font-mono">
                {members.length} Total
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FBFBFD] text-[#86868B] uppercase text-[10px] font-semibold border-b border-black/[0.06] tracking-wider">
                  <tr>
                    <th className="py-3 px-6">Member</th>
                    <th className="py-3 px-6">Assigned Role</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Joined Date</th>
                    {isOwnerOrAdmin && <th className="py-3 px-6 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {members.map((member) => {
                    const style = roleStyles[member.role] || roleStyles.team_member;
                    return (
                      <tr key={member.id} className="hover:bg-black/[0.015] transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-[#007AFF]/10 text-[#007AFF] font-bold text-xs flex items-center justify-center shrink-0 border border-[#007AFF]/20">
                              {getInitials(member.fullName)}
                            </div>
                            <div>
                              <div className="font-semibold text-[#1D1D1F]">{member.fullName}</div>
                              <div className="text-[11px] text-[#86868B] font-mono">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          {isOwnerOrAdmin && member.userId !== user?.id ? (
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.userId, e.target.value as UserRole)}
                              className="px-2 py-1 border border-black/[0.12] rounded-[6px] text-xs bg-white text-[#1D1D1F] focus:ring-1 focus:ring-[#007AFF] outline-none"
                            >
                              <option value="org_owner">Organization Owner</option>
                              <option value="project_manager">Project Manager</option>
                              <option value="team_member">Team Member</option>
                              <option value="auditor">Compliance Auditor</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-[4px] border font-medium text-[10px] ${style.badge}`}>
                              {style.label}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="inline-flex items-center space-x-1.5 text-[#34C759] font-medium text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]"></span>
                            <span>Active</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-[#86868B] font-mono text-[11px]">
                          {member.joinedAt?.split('T')[0] || '2026-11-01'}
                        </td>
                        {isOwnerOrAdmin && (
                          <td className="py-3.5 px-6 text-right">
                            {member.userId !== user?.id && member.role !== 'org_owner' ? (
                              <button
                                onClick={() => handleRemoveMember(member.userId)}
                                className="text-rose-600 hover:text-rose-800 text-xs font-medium hover:underline"
                              >
                                Remove
                              </button>
                            ) : (
                              <span className="text-[11px] text-[#86868B]">Protected</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Invitations Card */}
          {invitations.length > 0 && (
            <div className="apple-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                <h3 className="font-semibold text-sm text-[#1D1D1F]">Pending Workspace Invitations</h3>
                <span className="text-[11px] text-[#86868B]">Enqueued in Email Job Dispatcher</span>
              </div>
              <div className="divide-y divide-black/[0.04]">
                {invitations.map((inv) => (
                  <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-[11px] text-[#1D1D1F] font-medium">{inv.email}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        {inv.role}
                      </span>
                      <span className="text-[11px] text-[#86868B]">Expires in 7 days</span>
                    </div>
                    {isOwnerOrAdmin && (
                      <button
                        onClick={() => handleCancelInvite(inv.id)}
                        className="text-xs text-rose-600 hover:text-rose-800 hover:underline font-medium"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invite Member Modal Sheet */}
          {isInviteModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-apple-sheet max-w-md w-full p-6 space-y-5 border border-black/10 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center border-b border-black/[0.08] pb-3">
                  <h3 className="font-semibold text-base text-[#1D1D1F]">Invite Team Member</h3>
                  <button
                    onClick={() => setIsInviteModalOpen(false)}
                    className="text-[#8E8E93] hover:text-[#1D1D1F] w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/[0.05] transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSendInvite} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="engineer@acme.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                      Target Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                    >
                      <option value="project_manager">Project Manager</option>
                      <option value="team_member">Team Member</option>
                      <option value="auditor">Compliance Auditor</option>
                    </select>
                  </div>

                  <div className="bg-[#F5F5F7] p-3 rounded-[10px] text-[11px] text-[#6E6E73] border border-black/[0.06]">
                    <strong>Asynchronous Job Queue:</strong> Sending an invitation dispatches a resilient background queue job with exponential retry backoff and DLQ telemetry.
                  </div>

                  <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-black/[0.08]">
                    <button
                      type="button"
                      onClick={() => setIsInviteModalOpen(false)}
                      className="px-3.5 py-1.5 text-xs text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-[8px] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
                    >
                      {isSubmitting ? 'Enqueuing...' : 'Send Invitation'}
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
