'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { useSidebar } from '../../lib/sidebar-context';
import { UserRole } from '../../types';

const roleLabels: Record<UserRole, { label: string; color: string; dot: string }> = {
  platform_admin: { label: 'Platform Admin', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  org_owner: { label: 'Organization Owner', color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  project_manager: { label: 'Project Manager', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  team_member: { label: 'Team Member', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  auditor: { label: 'Compliance Auditor', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
};

export function Topbar() {
  const { user } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
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
    <header className="h-14 bg-white/90 backdrop-blur-xl border-b border-black/[0.08] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Leading Edge: Sidebar Toggle, Org Title & Database Engine */}
      <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
        {/* Apple HIG Sidebar Toggle Button */}
        <button
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expand Sidebar (⌘B)' : 'Collapse Sidebar (⌘B)'}
          className="p-1.5 rounded-[8px] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.05] active:scale-95 transition-all flex items-center justify-center border border-transparent hover:border-black/[0.06]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>

        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-[#007AFF] shadow-xs"></div>
          <Link href="/" className="text-sm font-semibold text-[#1D1D1F] tracking-tight hover:text-[#007AFF] transition-colors truncate max-w-[160px] sm:max-w-none">
            Acme Technologies Inc.
          </Link>
        </div>

        <span className="text-[10px] bg-black/[0.04] text-[#6E6E73] px-2 py-0.5 rounded-[5px] border border-black/[0.06] font-medium tracking-wide">
          Enterprise
        </span>

        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-0.5 rounded-[6px] bg-emerald-50/90 border border-emerald-200/80 text-[11px] text-emerald-800 font-medium shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Supabase PostgreSQL 16</span>
        </div>
      </div>

      {/* Center Area: Spotlight Search Input */}
      <div className="hidden md:flex items-center max-w-xs lg:max-w-sm w-full mx-3">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8E8E93]">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            readOnly
            placeholder="Search tasks, roadmaps, members (⌘K)..."
            className="w-full pl-9 pr-12 py-1.5 bg-black/[0.03] hover:bg-black/[0.05] border border-black/[0.06] rounded-[8px] text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:ring-1 focus:ring-[#007AFF] transition-all cursor-pointer"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#8E8E93] bg-white border border-black/[0.08] rounded shadow-xs">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Trailing Edge: Stream Status, Role Badge & User Avatar */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* SSE Stream Status Indicator */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2 py-0.5 rounded-[6px] bg-blue-50/90 border border-blue-200/80 text-[11px] text-blue-700 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]"></span>
          <span className="font-mono text-[10px]">SSE Stream</span>
        </div>

        {/* User Role Pill */}
        <span className={`text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full border font-medium flex items-center space-x-1 ${badge.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
          <span className="truncate max-w-[120px]">{badge.label}</span>
        </span>

        {/* User Avatar Capsule */}
        <div className="flex items-center space-x-2 pl-2 border-l border-black/[0.08]">
          <div
            title={`${user?.fullName || 'User'} (${user?.email || 'user@acme.com'})`}
            className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#007AFF]/15 to-[#5856D6]/25 border border-[#007AFF]/30 text-[#007AFF] flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer hover:scale-105 transition-transform"
          >
            {getInitials(user?.fullName)}
          </div>
          <span className="text-xs font-semibold text-[#1D1D1F] hidden sm:inline truncate max-w-[90px]">
            {user?.fullName?.split(' ')[0] || 'User'}
          </span>
        </div>
      </div>
    </header>
  );
}
