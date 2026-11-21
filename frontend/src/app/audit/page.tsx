'use client';

import React, { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';

export default function AuditTimelinePage() {
  const [filter, setFilter] = useState<'ALL' | 'TASK' | 'SECURITY' | 'PROJECT' | 'ORGANIZATION'>('ALL');

  const demoLogs = [
    {
      id: 'act-901',
      action: 'OCC_CONFLICT_DETECTED',
      entityType: 'TASK',
      entityId: 'task-102',
      performedBy: 'sarah.connor@acme.com (Dev)',
      details: 'Concurrent write collision intercepted by Compare-and-Swap. Stale version 1 was rejected against server version 3. Zero data overwrite.',
      time: '2 mins ago',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      payload: { attemptedVersion: 1, currentVersion: 3, strategy: 'REJECT_AND_DIFF' },
    },
    {
      id: 'act-900',
      action: 'UPDATED',
      entityType: 'TASK',
      entityId: 'task-102',
      performedBy: 'marcus.brody@acme.com (PM)',
      details: 'Task advanced to Version 3. Status transitioned to IN_PROGRESS with revised acceptance scope.',
      time: '5 mins ago',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
      payload: { previousVersion: 2, newVersion: 3, status: 'IN_PROGRESS' },
    },
    {
      id: 'act-899',
      action: 'CROSS_TENANT_ACCESS_DENIED',
      entityType: 'SECURITY',
      entityId: 'infiltrator@globex.internal',
      performedBy: 'enforceTenantIsolation (Middleware)',
      details: 'Blocked attempted cross-tenant boundary breach from foreign org-globex-202 token context. HTTP 403 Forbidden returned.',
      time: '18 mins ago',
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      payload: { attemptedOrg: 'org-acme-101', callerOrg: 'org-globex-202', blockedBy: 'RLS_GUARD' },
    },
    {
      id: 'act-898',
      action: 'HMAC_WEBHOOK_INGESTED',
      entityType: 'SECURITY',
      entityId: 'wh-ingest-44',
      performedBy: 'WebhookReceiver (SHA256)',
      details: 'Ingested external GitHub/Stripe event with valid SHA-256 HMAC signature. Timestamp tolerance validated (< 300s).',
      time: '45 mins ago',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500',
      payload: { signatureValid: true, timestampSkewSec: 2, idempotencyCached: true },
    },
    {
      id: 'act-897',
      action: 'CREATED',
      entityType: 'PROJECT',
      entityId: 'proj-acme-alpha',
      performedBy: 'elena.vance@acme.com (Owner)',
      details: 'New strategic roadmap initiative "Phoenix Multi-Cloud Architecture" provisioned on Supabase PostgreSQL.',
      time: '2 hours ago',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      payload: { orgId: 'org-acme-101', status: 'ACTIVE', milestonesCount: 4 },
    },
    {
      id: 'act-896',
      action: 'MEMBER_INVITED',
      entityType: 'ORGANIZATION',
      entityId: 'org-acme-101',
      performedBy: 'elena.vance@acme.com (Owner)',
      details: 'Invitation token dispatched to dev.lead@acme.com. Asynchronous worker queue job dispatched.',
      time: '4 hours ago',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
      payload: { invitedRole: 'project_manager', expiresInDays: 7 },
    },
  ];

  const filteredLogs = demoLogs.filter(
    (log) => filter === 'ALL' || log.entityType === filter
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F7]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />

        <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tracking-tight">
                  Compliance &amp; Immutable Audit Timeline
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1">
                  <span>🛡️</span>
                  <span>Tamper-Evident</span>
                </span>
              </div>
              <p className="text-xs text-[#6E6E73]">
                Append-only event ledger capturing OCC conflict events, access attempts, and state transitions for `org-acme-101`.
              </p>
            </div>

            {/* Event Filter Pills */}
            <div className="flex bg-[#EBEBED] p-1 rounded-[10px] text-xs font-semibold overflow-x-auto gap-1">
              {(['ALL', 'TASK', 'SECURITY', 'PROJECT', 'ORGANIZATION'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-3 py-1.5 rounded-[8px] transition-all whitespace-nowrap ${
                    filter === t
                      ? 'bg-white text-[#1D1D1F] shadow-xs'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  {t === 'ALL' ? 'All Events' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Stream Card */}
          <div className="apple-card overflow-hidden">
            <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-[#1D1D1F]">
                  Security, Concurrency &amp; Mutation Ledger
                </h2>
                <p className="text-[11px] text-[#6E6E73]">
                  Showing {filteredLogs.length} events • Real-time recording on PostgreSQL 16
                </p>
              </div>
              <span className="text-[11px] font-mono bg-black/[0.04] text-[#6E6E73] px-2.5 py-1 rounded-[6px] border border-black/[0.06]">
                Append-Only
              </span>
            </div>

            <div className="divide-y divide-black/[0.04]">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-5 flex items-start justify-between hover:bg-black/[0.015] transition-colors gap-4"
                >
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                    {/* Node Dot */}
                    <div className="mt-1.5 shrink-0 flex items-center justify-center">
                      <span className={`w-2.5 h-2.5 rounded-full ${log.dot} ring-4 ring-black/[0.03]`} />
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-[5px] border ${log.badge}`}>
                          {log.action}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-[#1D1D1F]">
                          {log.entityType}: {log.entityId}
                        </span>
                      </div>

                      <p className="font-normal text-[#1D1D1F] text-xs leading-relaxed">
                        {log.details}
                      </p>

                      <div className="text-[11px] text-[#86868B] flex items-center space-x-2 flex-wrap gap-y-1">
                        <span>
                          Actor: <strong className="text-[#1D1D1F] font-medium">{log.performedBy}</strong>
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[10px] text-[#86868B]">{log.id}</span>
                      </div>

                      {/* Expandable JSON detail snippet */}
                      <div className="mt-2 p-2 bg-[#F5F5F7] rounded-[8px] border border-black/[0.04] font-mono text-[10px] text-[#6E6E73] overflow-x-auto">
                        <span className="font-bold text-[#1D1D1F]">Payload: </span>
                        {JSON.stringify(log.payload)}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-medium text-[#86868B] whitespace-nowrap shrink-0 pl-2">
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
