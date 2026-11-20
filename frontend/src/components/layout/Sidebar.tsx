'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '../../types';

interface SidebarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export function Sidebar({ currentRole, onRoleChange }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/', roles: ['platform_admin', 'org_owner', 'project_manager', 'team_member', 'auditor'] },
    { label: 'Tasks & Kanban (OCC)', href: '/tasks', roles: ['platform_admin', 'org_owner', 'project_manager', 'team_member'] },
    { label: 'Projects & Milestones', href: '/projects', roles: ['platform_admin', 'org_owner', 'project_manager'] },
    { label: 'Analytics (FastAPI)', href: '/analytics', roles: ['platform_admin', 'org_owner', 'project_manager'] },
    { label: 'Audit Timeline', href: '/audit', roles: ['platform_admin', 'org_owner', 'auditor'] },
    { label: 'Tenant Settings', href: '/settings', roles: ['platform_admin', 'org_owner'] },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(currentRole));

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            WS
          </div>
          <span className="font-bold text-lg tracking-tight">WorkSphere</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">v1.0</span>
      </div>

      {/* Role Switcher for Assessment 01 Demonstration */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Active Role Simulation
        </label>
        <select
          value={currentRole}
          onChange={(e) => onRoleChange(e.target.value as UserRole)}
          aria-label="Active Role Simulation"
          className="w-full bg-slate-800 text-sm text-slate-200 border border-slate-700 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        >
          <option value="org_owner">Organization Owner</option>
          <option value="project_manager">Project Manager</option>
          <option value="team_member">Team Member</option>
          <option value="auditor">Auditor (Compliance)</option>
          <option value="platform_admin">Platform Administrator</option>
        </select>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
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

      <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-slate-300">Tenant:</span>
          <span className="font-mono text-indigo-400">org-acme-101</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Isolation Mode:</span>
          <span className="text-emerald-400 font-medium">Strict Enforced</span>
        </div>
      </div>
    </aside>
  );
}
