'use client';

import React from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';

export default function AuditTimelinePage() {
  const demoLogs = [
    {
      id: 'act-901',
      action: 'OCC_CONFLICT_DETECTED',
      entityType: 'TASK',
      entityId: 'task-concurrency-target',
      performedBy: 'member@acme.com',
      details: 'Concurrent race condition halted by Compare-and-Swap. Attempted stale v1 against server authoritative v2.',
      time: '2 mins ago',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      id: 'act-900',
      action: 'UPDATED',
      entityType: 'TASK',
      entityId: 'task-concurrency-target',
      performedBy: 'pm@acme.com',
      details: 'Task advanced to Version 2. Status transitioned to IN_PROGRESS.',
      time: '3 mins ago',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'act-899',
      action: 'CROSS_TENANT_ACCESS_DENIED',
      entityType: 'SECURITY',
      entityId: 'hacker@globex.com',
      performedBy: 'enforceTenantIsolation',
      details: 'Blocked attempted tenant boundary violation from foreign org-globex-202 token.',
      time: '15 mins ago',
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      id: 'act-898',
      action: 'CREATED',
      entityType: 'PROJECT',
      entityId: 'proj-acme-alpha',
      performedBy: 'owner@acme.com',
      details: 'New roadmap "Phoenix Multi-Cloud Architecture" provisioned on Supabase PostgreSQL.',
      time: '1 hour ago',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'act-897',
      action: 'MEMBER_INVITED',
      entityType: 'ORGANIZATION',
      entityId: 'org-acme-101',
      performedBy: 'owner@acme.com',
      details: 'Invitation dispatched to engineer@acme.com. Asynchronous worker queue job created.',
      time: '2 hours ago',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

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
                Compliance & Immutable Audit Timeline
              </h2>
              <p className="text-xs text-[#6E6E73]">
                Append-Only Tamper-Evident Event Trail • Scoped to Tenant `org-acme-101`
              </p>
            </div>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-[6px] border border-amber-200 flex items-center space-x-1.5">
              <span>🛡️</span>
              <span>Auditor Active</span>
            </span>
          </div>

          {/* Audit Event Stream Card */}
          <div className="apple-card overflow-hidden">
            <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-[#1D1D1F]">
                  Security & Concurrency Event Log
                </h3>
                <p className="text-[11px] text-[#6E6E73]">
                  Real-time recording of OCC conflict events, access checks, and state transitions
                </p>
              </div>
              <span className="text-[11px] font-mono bg-black/[0.04] text-[#6E6E73] px-2 py-0.5 rounded-[5px]">
                Immutable Ledger
              </span>
            </div>

            <div className="divide-y divide-black/[0.04]">
              {demoLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-5 flex items-start justify-between hover:bg-black/[0.015] transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    <div className="mt-0.5 shrink-0">
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded-[4px] border ${log.badge}`}>
                        {log.action}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-[#1D1D1F] text-xs leading-relaxed">
                        {log.details}
                      </div>
                      <div className="text-[11px] text-[#86868B] flex items-center space-x-3">
                        <span>
                          Entity: <strong className="text-[#1D1D1F] font-mono">{log.entityType} ({log.entityId})</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Actor: <strong className="text-[#1D1D1F]">{log.performedBy}</strong>
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[10px] text-[#86868B]">{log.id}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#86868B] whitespace-nowrap pl-4">
                    {log.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
