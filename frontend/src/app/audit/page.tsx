'use client';

import React, { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { UserRole } from '../../types';

export default function AuditTimelinePage() {
  const [role, setRole] = useState<UserRole>('auditor');

  const demoLogs = [
    {
      id: 'act-901',
      action: 'OCC_CONFLICT_DETECTED',
      entityType: 'TASK',
      entityId: 'task-concurrency-target',
      performedBy: 'member@acme.com',
      details: 'Concurrent race condition halted. Attempted v1 on current v2.',
      time: '2 mins ago',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      id: 'act-900',
      action: 'UPDATED',
      entityType: 'TASK',
      entityId: 'task-concurrency-target',
      performedBy: 'pm@acme.com',
      details: 'Task advanced to Version 2. Status changed to IN_REVIEW.',
      time: '3 mins ago',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
    {
      id: 'act-899',
      action: 'CROSS_TENANT_ACCESS_DENIED',
      entityType: 'SECURITY',
      entityId: 'hacker@globex.com',
      details: 'Blocked attempted tenant boundary crossing from org-globex-202.',
      time: '15 mins ago',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'act-898',
      action: 'CREATED',
      entityType: 'PROJECT',
      entityId: 'proj-acme-alpha',
      performedBy: 'owner@acme.com',
      details: 'New project "Phoenix Multi-Cloud Architecture" provisioned.',
      time: '1 hour ago',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentRole={role} onRoleChange={setRole} />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar currentRole={role} />

        <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Compliance & Audit Timeline</h2>
              <p className="text-sm text-slate-500">
                Append-Only Immutable Event Trail • Scoped to Tenant `org-acme-101`
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
              Auditor Role Active
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
            {demoLogs.map((log) => (
              <div key={log.id} className="p-5 flex items-start justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="mt-1">
                    <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md border ${log.badge}`}>
                      {log.action}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{log.details}</div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                      <span>Entity: <strong className="text-slate-600">{log.entityType} ({log.entityId})</strong></span>
                      <span>•</span>
                      <span>User: <strong className="text-slate-600">{log.performedBy}</strong></span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{log.time}</span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
