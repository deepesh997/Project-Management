'use client';

import React from 'react';
import { useAuth } from '../../lib/auth-context';
import { UserRole } from '../../types/index.ts';

const roleLabels: Record<UserRole, { label: string; color: string }> = {
  platform_admin: { label: 'Platform Administrator', color: 'bg-rose-500/10 text-rose-600 border-rose-500/30' },
  org_owner: { label: 'Organization Owner', color: 'bg-purple-500/10 text-purple-700 border-purple-500/30' },
  project_manager: { label: 'Project Manager', color: 'bg-blue-500/10 text-blue-700 border-blue-500/30' },
  team_member: { label: 'Team Member', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' },
  auditor: { label: 'Auditor', color: 'bg-amber-500/10 text-amber-700 border-amber-500/30' },
};

export function Topbar() {
  const { user } = useAuth();
  const currentRole: UserRole = user?.role || 'team_member';
  const badge = roleLabels[currentRole] || roleLabels.team_member;

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
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm shrink-0">
      <div className="flex items-center space-x-3">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Acme Technologies Inc.</h1>
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-medium">
          Enterprise Plan
        </span>
        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-medium">
          Supabase Live
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Logged in as:</span>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${badge.color}`}>
            {badge.label}
          </span>
        </div>

        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-300 text-indigo-700 flex items-center justify-center font-bold text-xs">
            {getInitials(user?.fullName)}
          </div>
          <span className="text-sm font-semibold text-slate-700 hidden sm:inline">
            {user?.fullName || 'User'}
          </span>
        </div>
      </div>
    </header>
  );
}
