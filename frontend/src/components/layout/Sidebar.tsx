'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { useSidebar } from '../../lib/sidebar-context';
import { UserRole } from '../../types';

const roleLabels: Record<UserRole, { label: string; badgeClass: string; dotColor: string }> = {
  platform_admin: { label: 'Platform Admin', badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30', dotColor: 'bg-rose-400' },
  org_owner: { label: 'Organization Owner', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30', dotColor: 'bg-purple-400' },
  project_manager: { label: 'Project Manager', badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30', dotColor: 'bg-blue-400' },
  team_member: { label: 'Team Member', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dotColor: 'bg-emerald-400' },
  auditor: { label: 'Auditor', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30', dotColor: 'bg-amber-400' },
};

interface NavSection {
  title: string;
  items: {
    label: string;
    href: string;
    roles: UserRole[];
    icon: React.ReactNode;
    badge?: string;
  }[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const currentRole: UserRole = user?.role || 'team_member';
  const roleInfo = roleLabels[currentRole] || roleLabels.team_member;

  const navSections: NavSection[] = [
    {
      title: 'Workspace',
      items: [
        {
          label: 'Overview',
          href: '/',
          roles: ['platform_admin', 'org_owner', 'project_manager', 'team_member', 'auditor'],
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
          ),
        },
        {
          label: 'Tasks & Kanban',
          href: '/tasks',
          roles: ['platform_admin', 'org_owner', 'project_manager', 'team_member'],
          badge: 'OCC',
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h10M4 18h14" />
              <rect x="2" y="3" width="20" height="18" rx="3" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Operations',
      items: [
        {
          label: 'Projects & Roadmaps',
          href: '/projects',
          roles: ['platform_admin', 'org_owner', 'project_manager'],
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          ),
        },
        {
          label: 'Team & Access',
          href: '/team',
          roles: ['platform_admin', 'org_owner', 'project_manager'],
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Intelligence & Audit',
      items: [
        {
          label: 'FastAPI Analytics',
          href: '/analytics',
          roles: ['platform_admin', 'org_owner', 'project_manager'],
          badge: 'Stream',
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          ),
        },
        {
          label: 'Audit Timeline',
          href: '/audit',
          roles: ['platform_admin', 'org_owner', 'auditor'],
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          ),
        },
        {
          label: 'Tenant Settings',
          href: '/settings',
          roles: ['platform_admin', 'org_owner'],
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          ),
        },
      ],
    },
  ];

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
    <aside
      className={`bg-[#1C1C1E] text-white/90 flex flex-col border-r border-white/10 shrink-0 select-none transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div
        className={`h-14 flex items-center border-b border-white/[0.08] transition-all duration-300 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        <Link href="/" className="flex items-center space-x-2.5 group overflow-hidden">
          <div className="w-7 h-7 rounded-[8px] bg-gradient-to-b from-[#007AFF] to-[#0062CC] flex items-center justify-center font-bold text-white text-xs shadow-sm shadow-blue-500/30 border border-white/20 shrink-0">
            WS
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-semibold text-sm tracking-tight text-white group-hover:text-blue-400 transition-colors truncate">
                WorkSphere
              </span>
              <span className="text-[10px] text-white/50 tracking-normal font-mono -mt-0.5 truncate">
                Enterprise
              </span>
            </div>
          )}
        </Link>

        {!isCollapsed && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-[5px] bg-white/10 text-white/70 font-mono font-medium border border-white/10">
            v2.0
          </span>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-2.5 py-4 space-y-4 overflow-y-auto overflow-x-hidden">
        {navSections.map((section, sIdx) => {
          const visibleItems = section.items.filter(
            (item) => currentRole === 'platform_admin' || item.roles.includes(currentRole)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-2.5 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                  {section.title}
                </div>
              ) : sIdx > 0 ? (
                <div className="w-6 h-px bg-white/10 my-2 mx-auto" />
              ) : null}

              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={`flex items-center rounded-[8px] transition-all duration-150 relative ${
                        isCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                      } ${
                        isActive
                          ? 'bg-[#007AFF] text-white shadow-sm'
                          : 'text-white/75 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className={isActive ? 'text-white' : 'text-white/60'}>
                          {item.icon}
                        </span>
                        {!isCollapsed && <span className="text-xs font-medium truncate">{item.label}</span>}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold uppercase ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-white/10 text-white/60'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {isCollapsed && item.badge && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] absolute top-1.5 right-1.5" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Authenticated User Profile Capsule */}
      <div className="p-2.5 border-t border-white/[0.08] bg-black/20">
        {!isCollapsed ? (
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2.5 px-1">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 text-[#30B0C7] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {getInitials(user?.fullName)}
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {user?.fullName || 'Authenticated User'}
                </div>
                <div className="text-[10px] text-white/50 truncate font-mono">
                  {user?.email || 'user@acme.com'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 pt-1">
              <div className="flex items-center space-x-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${roleInfo.dotColor}`}></span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-[4px] border font-medium ${roleInfo.badgeClass}`}>
                  {roleInfo.label}
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>

            <div className="text-[10px] text-white/40 flex items-center justify-between px-1 pt-1.5 border-t border-white/[0.06]">
              <span>Tenant Scope:</span>
              <span className="font-mono text-blue-400 font-semibold">{user?.orgId || 'org-acme-101'}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2 py-1">
            <div
              title={`${user?.fullName || 'User'} (${roleInfo.label})`}
              className="w-8 h-8 rounded-full bg-white/10 border border-white/20 text-[#30B0C7] flex items-center justify-center font-bold text-xs shadow-sm relative cursor-pointer"
            >
              {getInitials(user?.fullName)}
              <span className={`w-2 h-2 rounded-full ${roleInfo.dotColor} absolute -bottom-0.5 -right-0.5 border border-[#1C1C1E]`}></span>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="w-7 h-7 rounded-[6px] text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-colors text-xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
