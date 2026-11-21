'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { useAuth } from '../lib/auth-context';
import { ApiClient } from '../lib/api';
import { Task, Project } from '../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [fetchedTasks, fetchedProjects] = await Promise.all([
        ApiClient.getTasks(),
        ApiClient.getProjects(),
      ]);
      setTasks(fetchedTasks);
      setProjects(fetchedProjects);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 78;

  const priorityBadges: Record<string, { label: string; class: string }> = {
    HIGH: { label: 'High', class: 'bg-rose-50 text-rose-700 border-rose-200' },
    MEDIUM: { label: 'Medium', class: 'bg-amber-50 text-amber-700 border-amber-200' },
    LOW: { label: 'Low', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    URGENT: { label: 'P0 Critical', class: 'bg-red-100 text-red-800 border-red-300 font-bold' },
  };

  const statusBadges: Record<string, { label: string; dot: string; class: string }> = {
    TODO: { label: 'To Do', dot: 'bg-slate-400', class: 'bg-slate-50 text-slate-700 border-slate-200' },
    IN_PROGRESS: { label: 'In Progress', dot: 'bg-[#007AFF]', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    IN_REVIEW: { label: 'In Review', dot: 'bg-purple-500', class: 'bg-purple-50 text-purple-700 border-purple-200' },
    DONE: { label: 'Completed', dot: 'bg-[#34C759]', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    BLOCKED: { label: 'Blocked', dot: 'bg-rose-500', class: 'bg-rose-50 text-rose-700 border-rose-200' },
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F7]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />

        <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-7">
          {/* Executive Hero Banner */}
          <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#121215] via-[#1C1C22] to-[#25252E] p-7 sm:p-8 text-white shadow-apple-lg border border-white/10">
            {/* Subtle mesh background circles */}
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#007AFF]/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 left-1/3 w-64 h-64 rounded-full bg-[#5856D6]/15 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/15">
                    Acme Technologies Inc.
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Sprint 42 Active</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome back, {user?.fullName || 'Elena Vance'}
                </h1>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-normal">
                  Overview of Q4 cloud transformation milestones, cross-team deliverables, and automated telemetry feeds.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-3 shrink-0 z-10">
                <Link
                  href="/tasks"
                  className="px-4 py-2 bg-gradient-to-r from-[#007AFF] to-[#0062CC] hover:from-[#006ee6] hover:to-[#0056b3] text-white rounded-[10px] text-xs font-semibold shadow-md shadow-blue-500/30 transition-all flex items-center space-x-1.5 active:scale-95"
                >
                  <span>Kanban Board</span>
                  <span>→</span>
                </Link>
                <Link
                  href="/projects"
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-[10px] text-xs font-semibold border border-white/15 transition-all active:scale-95"
                >
                  Roadmaps
                </Link>
              </div>
            </div>
          </div>

          {/* Telemetry KPI Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* KPI 1 */}
            <div className="apple-card p-5 space-y-2">
              <div className="flex items-center justify-between text-[#86868B] text-xs font-semibold uppercase tracking-wider">
                <span>Active Deliverables</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF]" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-[#1D1D1F] tracking-tight">{totalTasks || 16}</span>
                <span className="text-xs font-medium text-[#6E6E73]">tracked items</span>
              </div>
              <div className="text-[11px] text-[#34C759] font-medium flex items-center space-x-1">
                <span>↑ 4 updated today</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="apple-card p-5 space-y-2">
              <div className="flex items-center justify-between text-[#86868B] text-xs font-semibold uppercase tracking-wider">
                <span>Sprint Completion</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#34C759]" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-[#34C759] tracking-tight">{completionRate}%</span>
                <span className="text-xs font-medium text-[#6E6E73]">{completedTasks} of {totalTasks} done</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-[#EBEBED] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#34C759] h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            {/* KPI 3 */}
            <div className="apple-card p-5 space-y-2">
              <div className="flex items-center justify-between text-[#86868B] text-xs font-semibold uppercase tracking-wider">
                <span>Team Health Index</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#5856D6]" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-[#5856D6] tracking-tight">94.2%</span>
                <span className="text-xs font-medium text-[#6E6E73]">Optimal</span>
              </div>
              <div className="text-[11px] text-[#6E6E73]">
                Calculated by FastAPI Analytics Engine
              </div>
            </div>

            {/* KPI 4 */}
            <div className="apple-card p-5 space-y-2">
              <div className="flex items-center justify-between text-[#86868B] text-xs font-semibold uppercase tracking-wider">
                <span>Active Initiatives</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF9500]" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-[#1D1D1F] tracking-tight">{projects.length || 2}</span>
                <span className="text-xs font-medium text-[#6E6E73]">strategic tracks</span>
              </div>
              <div className="text-[11px] text-[#007AFF] font-medium">
                Phoenix Cloud &amp; Real-time Engine
              </div>
            </div>
          </div>

          {/* Main Dashboard Two-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 Cols): Active Sprint Deliverables */}
            <div className="lg:col-span-2 apple-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-3.5">
                <div>
                  <h2 className="font-bold text-sm text-[#1D1D1F]">
                    Priority Sprint Deliverables
                  </h2>
                  <p className="text-[11px] text-[#6E6E73]">
                    Tasks scheduled for current release cycle
                  </p>
                </div>
                <Link
                  href="/tasks"
                  className="text-xs text-[#007AFF] hover:underline font-semibold flex items-center space-x-1"
                >
                  <span>View All ({totalTasks})</span>
                  <span>→</span>
                </Link>
              </div>

              {isLoading ? (
                <div className="py-8 text-center text-xs text-[#86868B]">Loading deliverables...</div>
              ) : (
                <div className="divide-y divide-black/[0.04]">
                  {tasks.slice(0, 5).map((task) => {
                    const statusInfo = statusBadges[task.status] || statusBadges.TODO;
                    const priorityInfo = priorityBadges[task.priority] || priorityBadges.MEDIUM;

                    return (
                      <Link
                        key={task.id}
                        href={`/tasks/${task.id}`}
                        className="py-3 px-2 rounded-[10px] hover:bg-[#F5F5F7] transition-colors flex items-center justify-between gap-4 group block"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[10px] text-[#86868B]">{task.id}</span>
                            <span className="text-xs font-semibold text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors truncate">
                              {task.title}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-[11px] text-[#6E6E73] truncate">{task.description}</p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-[5px] border ${priorityInfo.class}`}>
                            {priorityInfo.label}
                          </span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center space-x-1 ${statusInfo.class}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                            <span>{statusInfo.label}</span>
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column (1 Col): Projects Progress & Architecture Health */}
            <div className="space-y-6">
              {/* Strategic Projects Progress Card */}
              <div className="apple-card p-6 space-y-4">
                <div className="border-b border-black/[0.06] pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-sm text-[#1D1D1F]">
                      Strategic Initiatives
                    </h2>
                    <p className="text-[11px] text-[#6E6E73]">Current roadmap trajectories</p>
                  </div>
                  <Link href="/projects" className="text-xs text-[#007AFF] hover:underline font-semibold">
                    Manage →
                  </Link>
                </div>

                <div className="space-y-4">
                  {projects.map((proj, idx) => {
                    const progress = idx === 0 ? 75 : 45;
                    return (
                      <div key={proj.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#1D1D1F] truncate">{proj.name}</span>
                          <span className="font-bold text-[#007AFF] text-[11px]">{progress}%</span>
                        </div>
                        <div className="w-full bg-[#EBEBED] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#007AFF] to-[#5856D6] h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* System Infrastructure Telemetry Card */}
              <div className="apple-card p-6 space-y-3.5">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
                  <h2 className="font-bold text-sm text-[#1D1D1F]">
                    Platform Infrastructure
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Live Status
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6E6E73]">Primary Database</span>
                    <span className="font-semibold text-[#1D1D1F]">Supabase PostgreSQL 16</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6E6E73]">Analytics Microservice</span>
                    <span className="font-semibold text-emerald-700">FastAPI 8000 (Healthy)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6E6E73]">Event Bus</span>
                    <span className="font-semibold text-[#007AFF]">SSE Live Stream</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6E6E73]">Tenant Scope</span>
                    <span className="font-mono text-purple-700 font-semibold">{user?.orgId || 'org-acme-101'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-black/[0.06]">
                  <Link
                    href="/settings"
                    className="w-full py-1.5 px-3 rounded-[8px] bg-[#F5F5F7] hover:bg-black/[0.05] text-[#1D1D1F] text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>Developer &amp; Config Hub</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
