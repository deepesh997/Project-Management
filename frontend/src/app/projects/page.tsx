'use client';

import React from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';

export default function ProjectsPage() {
  const demoProjects = [
    {
      id: 'proj-acme-alpha',
      name: 'Phoenix Multi-Cloud Architecture',
      description: 'Next-gen enterprise cloud transformation roadmap, database sharding, and real-time OCC synchronization.',
      status: 'Active',
      progress: 75,
      owner: 'Marcus Brody (PM)',
      milestones: [
        { title: 'Schema Architecture & DDL Migration', done: true },
        { title: 'Supabase PostgreSQL 16 Deployment', done: true },
        { title: 'Optimistic Concurrency Control (OCC)', done: true },
        { title: 'Production Load Verification & Chaos Test', done: false },
      ],
    },
    {
      id: 'proj-acme-beta',
      name: 'Real-time Workflow Automation Engine',
      description: 'Distributed event bus, SSE live streams, and HMAC signed webhook ingestion pipelines.',
      status: 'In Progress',
      progress: 40,
      owner: 'Elena Vance (Owner)',
      milestones: [
        { title: 'Server-Sent Events (SSE) Infrastructure', done: true },
        { title: 'HMAC Webhook Verification (300s window)', done: true },
        { title: 'Automated Dead-Letter Queue (DLQ)', done: false },
      ],
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
                Projects & Milestones
              </h2>
              <p className="text-xs text-[#6E6E73]">
                Tenant Scoped to `org-acme-101` • Backed by Supabase PostgreSQL 16
              </p>
            </div>
            <button className="px-3.5 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all flex items-center space-x-1.5">
              <span>+</span>
              <span>New Project</span>
            </button>
          </div>

          {/* Project Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demoProjects.map((project) => (
              <div
                key={project.id}
                className="apple-card p-6 space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#007AFF] font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                        {project.id}
                      </span>
                      <h3 className="font-semibold text-base text-[#1D1D1F] mt-1.5 tracking-tight">
                        {project.name}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {project.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#6E6E73] leading-relaxed">
                    {project.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-medium text-[#1D1D1F]">
                      <span className="text-[#6E6E73]">Roadmap Completion</span>
                      <span className="font-mono font-semibold">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-black/[0.06] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#007AFF] h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Milestones Checklist */}
                  <div className="border-t border-black/[0.06] pt-3.5 space-y-2">
                    <span className="text-[10px] font-semibold text-[#86868B] uppercase tracking-wider block">
                      Target Milestones
                    </span>
                    <div className="space-y-2 text-xs">
                      {project.milestones.map((m, idx) => (
                        <div key={idx} className="flex items-center space-x-2.5">
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              m.done
                                ? 'bg-emerald-500 text-white'
                                : 'border border-black/[0.2] text-transparent'
                            }`}
                          >
                            ✓
                          </span>
                          <span
                            className={
                              m.done
                                ? 'line-through text-[#86868B]'
                                : 'text-[#1D1D1F] font-medium'
                            }
                          >
                            {m.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] text-[#86868B]">
                  <span>Lead: <strong className="text-[#1D1D1F] font-medium">{project.owner}</strong></span>
                  <span className="text-[#007AFF] font-medium hover:underline cursor-pointer">
                    Manage Roadmaps →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
