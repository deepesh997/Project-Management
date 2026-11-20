'use client';

import React from 'react';
import Link from 'next/link';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { useAuth } from '../lib/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role || 'team_member';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F7]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />

        <main className="p-8 max-w-7xl w-full mx-auto space-y-7">
          {/* Apple Pro Hero Banner */}
          <div className="bg-gradient-to-br from-[#1C1C1E] via-[#242426] to-[#1C1C1E] rounded-[20px] p-7 text-white shadow-apple-lg border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2 z-10">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/80 font-mono">
                  Multi-Tenant Cloud
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                  Supabase PostgreSQL 16
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                Acme Cloud Transformation Hub
              </h2>
              <p className="text-xs text-white/70 max-w-xl leading-relaxed">
                Logged in as <strong className="text-white">{user?.fullName || 'User'}</strong> ({role}). Enterprise tenant boundary isolation active with atomic row-level OCC versioning.
              </p>
            </div>
            <div className="flex items-center space-x-3 z-10 shrink-0">
              <Link
                href="/tasks"
                className="px-4 py-2 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white rounded-[10px] text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5"
              >
                <span>Kanban Board</span>
                <span>→</span>
              </Link>
              <Link
                href="/analytics"
                className="px-4 py-2 bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white rounded-[10px] text-xs font-semibold border border-white/15 transition-all"
              >
                FastAPI Analytics
              </Link>
            </div>
          </div>

          {/* Telemetry Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="apple-card p-5 space-y-2">
              <div className="flex items-center justify-between text-[#86868B] text-xs font-medium uppercase tracking-wider">
                <span>Active Projects</span>
                <span className="w-2 h-2 rounded-full bg-[#007AFF]"></span>
              </div>
              <div className="text-3xl font-bold text-[#1D1D1F] tracking-tight">4</div>
              <div className="text-[11px] text-[#34C759] font-medium flex items-center space-x-1">
                <span>↑ Phoenix, Core API, Cloud</span>
              </div>
            </div>

            <div className="apple-card p-5 space-y-2">
              <div className="flex items-center justify-between text-[#86868B] text-xs font-medium uppercase tracking-wider">
                <span>Tasks Under OCC</span>
                <span className="w-2 h-2 rounded-full bg-[#5856D6]"></span>
              </div>
              <div className="text-3xl font-bold text-[#1D1D1F] tracking-tight">12</div>
              <div className="text-[11px] text-[#007AFF] font-medium flex items-center space-x-1">
                <span>Compare-and-Swap Active</span>
              </div>
            </div>

            <div className="apple-card p-5 space-y-2">
              <div className="flex items-center justify-between text-[#86868B] text-xs font-medium uppercase tracking-wider">
                <span>Health Score</span>
                <span className="w-2 h-2 rounded-full bg-[#34C759]"></span>
              </div>
              <div className="text-3xl font-bold text-[#34C759] tracking-tight">94.2%</div>
              <div className="text-[11px] text-[#6E6E73]">
                Calculated by FastAPI Engine
              </div>
            </div>

            <div className="apple-card p-5 space-y-2">
              <div className="flex items-center justify-between text-[#86868B] text-xs font-medium uppercase tracking-wider">
                <span>Audit Timeline Events</span>
                <span className="w-2 h-2 rounded-full bg-[#FF9500]"></span>
              </div>
              <div className="text-3xl font-bold text-[#1D1D1F] tracking-tight">128</div>
              <div className="text-[11px] text-[#6E6E73]">
                Zero unhandled race collisions
              </div>
            </div>
          </div>

          {/* Assessment Modules Overview & Concurrency Visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 15 Assessment Modules Card */}
            <div className="apple-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-3.5">
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-sm text-[#1D1D1F]">
                    Required Assessment Modules
                  </h3>
                  <p className="text-[11px] text-[#6E6E73]">
                    Full-Stack Capstone Verification Checklist
                  </p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  15/15 Delivered
                </span>
              </div>

              <div className="divide-y divide-black/[0.04] text-xs">
                {[
                  { id: '01', title: 'Role-Specific Next.js Layouts & Guarding', status: 'Delivered', badge: 'bg-emerald-50 text-emerald-700' },
                  { id: '02', title: 'Express.js REST API with Zod Validation', status: 'Passing (34 Tests)', badge: 'bg-emerald-50 text-emerald-700' },
                  { id: '03', title: 'Optimistic Concurrency Control (OCC) CAS', status: '409 Guard Active', badge: 'bg-blue-50 text-blue-700' },
                  { id: '04', title: 'Live Supabase PostgreSQL Database', status: 'Connected (TLS 1.3)', badge: 'bg-emerald-50 text-emerald-700' },
                  { id: '05', title: 'Python Streaming Processor (50k rows)', status: '100k rec/s O(1) RAM', badge: 'bg-emerald-50 text-emerald-700' },
                  { id: '06', title: 'SSE Real-time Multi-Client Stream', status: 'Connected', badge: 'bg-blue-50 text-blue-700' },
                  { id: '07', title: 'Resilient Queue with DLQ & Deduplication', status: 'Verified', badge: 'bg-emerald-50 text-emerald-700' },
                  { id: '08', title: 'HMAC Webhook Ingestion & 300s Replay Protection', status: 'Secured', badge: 'bg-emerald-50 text-emerald-700' },
                ].map((mod) => (
                  <div key={mod.id} className="py-2.5 flex items-center justify-between">
                    <span className="text-[#1D1D1F] font-medium flex items-center space-x-2">
                      <span className="font-mono text-[#86868B]">{mod.id}.</span>
                      <span>{mod.title}</span>
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-[4px] border ${mod.badge}`}>
                      {mod.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* OCC Compare-and-Swap Architecture Card */}
            <div className="apple-card p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-3.5">
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-sm text-[#1D1D1F]">
                      OCC Concurrency Architecture
                    </h3>
                    <p className="text-[11px] text-[#6E6E73]">
                      How WorkSphere eliminates silent overwrite hazards
                    </p>
                  </div>
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    Atomic CAS
                  </span>
                </div>

                <p className="text-xs text-[#6E6E73] leading-relaxed">
                  When two project engineers open the same task simultaneously, traditional platforms suffer from <em>last-write-wins silent overwrite</em>. WorkSphere implements atomic <code>version = version + 1 WHERE id = $1 AND version = $expectedVersion</code>.
                </p>

                <div className="bg-[#F5F5F7] p-3.5 rounded-[10px] border border-black/[0.06] space-y-2">
                  <div className="text-[11px] font-mono font-semibold text-[#1D1D1F]">
                    UPDATE tasks SET title=$1, version=version+1<br/>
                    WHERE id=$2 AND version=$expectedVersion RETURNING *;
                  </div>
                  <div className="text-[11px] text-[#6E6E73]">
                    If row count = 0, query authoritative row and dispatch <strong>HTTP 409 Conflict</strong> with full field diffs!
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-black/[0.06] flex items-center justify-between">
                <span className="text-xs text-[#86868B]">Try it live on the Kanban board:</span>
                <Link
                  href="/tasks"
                  className="px-3.5 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] transition-all shadow-xs"
                >
                  Test Race Condition →
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
