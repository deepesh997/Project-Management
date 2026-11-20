'use client';

import React, { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { UserRole } from '../../types';

export default function ProjectsPage() {
  const demoProjects = [
    {
      id: 'proj-acme-alpha',
      name: 'Phoenix Multi-Cloud Architecture',
      description: 'Next-gen enterprise cloud transformation roadmap & database sharding.',
      status: 'ACTIVE',
      progress: 68,
      owner: 'Marcus Brody (PM)',
      milestones: [
        { title: 'Schema Architecture & DDL', done: true },
        { title: 'Supabase PostgreSQL Migration', done: true },
        { title: 'Optimistic Concurrency Control', done: true },
        { title: 'Production Load Verification', done: false },
      ],
    },
    {
      id: 'proj-acme-beta',
      name: 'Real-time Workflow Automation Engine',
      description: 'Distributed event bus and webhook ingestion pipelines.',
      status: 'PLANNING',
      progress: 25,
      owner: 'Elena Vance (Owner)',
      milestones: [
        { title: 'SSE Stream Infrastructure', done: true },
        { title: 'HMAC Webhook Verification', done: true },
        { title: 'Automated Dead-Letter Queue', done: false },
      ],
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />

        <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Projects & Milestones</h2>
              <p className="text-sm text-slate-500">
                Multi-Tenant Scoped to `org-acme-101` • Backed by Supabase PostgreSQL
              </p>
            </div>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm">
              + New Project
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demoProjects.map((project) => (
              <div key={project.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-indigo-600 font-semibold">{project.id}</span>
                    <h3 className="font-bold text-lg text-slate-900 mt-1">{project.name}</h3>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {project.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500">{project.description}</p>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Overall Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Milestones Checklist */}
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Milestones
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    {project.milestones.map((m, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <span className={m.done ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                          {m.done ? '✓' : '○'}
                        </span>
                        <span className={m.done ? 'line-through text-slate-400' : 'text-slate-700'}>
                          {m.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-100">
                  <span>Owner: <strong className="text-slate-600">{project.owner}</strong></span>
                  <span className="text-indigo-600 font-medium hover:underline cursor-pointer">View Tasks →</span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
