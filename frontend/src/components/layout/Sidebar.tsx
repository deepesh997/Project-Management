'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { UserRole } from '../../types/index.ts';

const roleLabels: Record<UserRole, { label: string; badgeClass: string }> = {
  platform_admin: { label: 'Platform Admin', badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  org_owner: { label: 'Organization Owner', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  project_manager: { label: 'Project Manager', badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  team_member: { label: 'Team Member', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  auditor: { label: 'Auditor (Compliance)', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const currentRole: UserRole = user?.role || 'team_member';
  const roleInfo = roleLabels[currentRole] || roleLabels.team_member;

  const navItems = [
    { label: 'Overview', href: '/', roles: ['platform_admin', 'org_owner', 'project_manager', 'team_member', 'auditor'] },
    { label: 'Tasks & Kanban (OCC)', href: '/tasks', roles: ['platform_admin', 'org_owner', 'project_manager', 'team_member'] },
    { label: 'Projects & Milestones', href: '/projects', roles: ['platform_admin', 'org_owner', 'project_manager'] },
    { label: 'Team & User Management', href: '/team', roles: ['platform_admin', 'org_owner', 'project_manager'] },
    { label: 'Analytics (FastAPI)', href: '/analytics', roles: ['platform_admin', 'org_owner', 'project_manager'] },
    { label: 'Audit Timeline', href: '/audit', roles: ['platform_admin', 'org_owner', 'auditor'] },
    { label: 'Tenant Settings', href: '/settings', roles: ['platform_admin', 'org_owner'] },
  ];

  const filteredNav = navItems.filter((item) =>
    currentRole === 'platform_admin' || item.roles.includes(currentRole)
  );

  const getInitials = (name?: string) => {
    if (!name) return 'WS';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            WS
          </div>
          <span className="font-bold text-lg tracking-tight text-white">WorkSphere</span>
        </Link>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono font-medium border border-slate-700">
          SaaS v1.0
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Workspace Navigation
        </div>
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Authenticated User Profile & Sign Out (Replaced Artificial Simulation Dropdown) */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
            {getInitials(user?.fullName)}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-sm font-semibold text-white truncate">
              {user?.fullName || 'Authenticated User'}
            </div>
            <div className="text-[11px] text-slate-400 truncate">{user?.email || 'user@acme.com'}</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className={`text-[11px] px-2 py-0.5 rounded-md border font-semibold ${roleInfo.badgeClass}`}>
            {roleInfo.label}
          </span>
          <button
            onClick={() => logout()}
            className="text-xs text-rose-400 hover:text-rose-300 hover:underline font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>

        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
          <span>Tenant:</span>
          <span className="font-mono text-indigo-400 font-semibold">{user?.orgId || 'org-acme-101'}</span>
        </div>
      </div>
    </aside>
  );
}
