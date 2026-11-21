'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { useSidebar } from '../../lib/sidebar-context';
import { UserRole } from '../../types';

const roleLabels: Record<UserRole, { label: string; badgeClass: string }> = {
  platform_admin: { label: 'Admin', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  org_owner: { label: 'Owner', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  project_manager: { label: 'PM', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  team_member: { label: 'Member', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  auditor: { label: 'Auditor', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export function Topbar() {
  const { user, logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const currentRole: UserRole = user?.role || 'team_member';
  const roleBadge = roleLabels[currentRole] || roleLabels.team_member;

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
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-black/[0.08] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Left: Sidebar Toggle, Workspace Title & Context */}
      <div className="flex items-center space-x-3 shrink-0">
        <button
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expand Sidebar (⌘B)' : 'Collapse Sidebar (⌘B)'}
          className="p-1.5 rounded-[8px] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04] active:scale-95 transition-all flex items-center justify-center border border-transparent hover:border-black/[0.06]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>

        <div className="h-4 w-px bg-black/[0.08] hidden sm:block" />

        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="font-semibold text-sm text-[#1D1D1F] tracking-tight group-hover:text-[#007AFF] transition-colors truncate max-w-[160px] sm:max-w-none">
              Acme Technologies Inc.
            </span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-black/[0.04] text-[#6E6E73] border border-black/[0.06]">
              Enterprise
            </span>
          </Link>
        </div>
      </div>

      {/* Center: Apple macOS-style Spotlight Search Bar */}
      <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-6">
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
            placeholder="Search tasks, roadmaps, members... (⌘K)"
            className="w-full pl-9 pr-12 py-1.5 bg-[#F5F5F7] hover:bg-black/[0.06] border border-black/[0.06] rounded-[10px] text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/25 transition-all cursor-pointer"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[#8E8E93] bg-white border border-black/[0.08] rounded shadow-xs">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Real-time Live Indicator & User Profile Capsule */}
      <div className="flex items-center space-x-3 shrink-0">
        {/* Real-time SSE Live Indicator */}
        <div
          title="Server-Sent Events: Connected to PostgreSQL & Redis Bus"
          className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-medium"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Sync</span>
        </div>

        {/* User Capsule with Avatar & Role */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-2 p-1 pr-2 rounded-full hover:bg-black/[0.04] transition-colors border border-transparent hover:border-black/[0.06]"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#007AFF] to-[#5856D6] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {getInitials(user?.fullName)}
            </div>
            <div className="text-left hidden sm:block leading-none">
              <div className="text-xs font-semibold text-[#1D1D1F] truncate max-w-[110px]">
                {user?.fullName || 'User'}
              </div>
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${roleBadge.badgeClass}`}>
              {roleBadge.label}
            </span>
          </button>

          {/* User Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-apple-sheet border border-black/[0.08] p-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-black/[0.04] space-y-0.5">
                <p className="text-xs font-semibold text-[#1D1D1F] truncate">{user?.fullName || 'User'}</p>
                <p className="text-[10px] text-[#86868B] truncate">{user?.email || 'user@acme.com'}</p>
                <div className="text-[10px] text-purple-700 font-mono font-medium pt-0.5">
                  Tenant: {user?.orgId || 'org-acme-101'}
                </div>
              </div>

              <div className="py-1 text-xs">
                <Link
                  href="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full flex items-center space-x-2 px-3 py-1.5 text-[#1D1D1F] hover:bg-black/[0.04] rounded-[8px] transition-colors"
                >
                  <span>⚙️</span>
                  <span>Tenant Settings</span>
                </Link>
                <Link
                  href="/audit"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full flex items-center space-x-2 px-3 py-1.5 text-[#1D1D1F] hover:bg-black/[0.04] rounded-[8px] transition-colors"
                >
                  <span>⏱</span>
                  <span>Audit Logs</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-black/[0.04]">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-[8px] transition-colors font-medium"
                >
                  <span>🚪</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
