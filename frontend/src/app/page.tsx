'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { UserRole } from '../types';

export default function DashboardPage() {
  const [role, setRole] = useState<UserRole>('project_manager');

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentRole={role} onRoleChange={setRole} />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar currentRole={role} />

        <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200">
                Multi-Tenant SaaS
              </span>
              <h2 className="text-2xl font-bold">Acme Cloud Transformation Hub</h2>
              <p className="text-sm text-indigo-200">
                Viewing workspace as <strong className="text-white">{role}</strong>. Strict isolation active.
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/tasks"
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                Go to Tasks & Kanban
              </Link>
              <Link
                href="/analytics"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition-colors border border-slate-700"
              >
                FastAPI Analytics
              </Link>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Active Projects</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">4</div>
              <span className="text-xs text-emerald-600 font-medium">Phoenix Cloud, Core API, Mobile</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Tasks In Progress</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">12</div>
              <span className="text-xs text-indigo-600 font-medium">OCC Version Control Active</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Project Health Score</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">94.2%</div>
              <span className="text-xs text-slate-500">Calculated by FastAPI Engine</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Audit Events</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">128</div>
              <span className="text-xs text-slate-500">Zero unhandled race conditions</span>
            </div>
          </div>

          {/* Core Modules Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Featured Assessment Modules</h3>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium border border-emerald-200">
                  15/15 Delivered
                </span>
              </div>
              <ul className="divide-y divide-slate-100 text-sm">
                <li className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-700 font-medium">01. Role-Specific Next.js Layouts</span>
                  <span className="text-xs text-emerald-600 font-semibold">Active</span>
                </li>
                <li className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-700 font-medium">02. Express REST API with Zod Validation</span>
                  <span className="text-xs text-emerald-600 font-semibold">Passing (26 Tests)</span>
                </li>
                <li className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-700 font-medium">05. Python Streaming Processor (50k rows)</span>
                  <span className="text-xs text-emerald-600 font-semibold">Passing (100k rec/s)</span>
                </li>
                <li className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-700 font-medium">07. Resilient Job Queue & DLQ</span>
                  <span className="text-xs text-emerald-600 font-semibold">Deduplicated</span>
                </li>
                <li className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Capstone: Optimistic Concurrency Control</span>
                  <span className="text-xs text-indigo-600 font-semibold">HTTP 409 + Diff Modal</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900">Architecture & Microservices Health</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-200">
                  <div>
                    <div className="font-semibold text-slate-800">Node.js Express Core API</div>
                    <div className="text-xs text-slate-500">Port 4000 • JWT + RBAC + Tenant Scoping</div>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-800">
                    ONLINE
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-200">
                  <div>
                    <div className="font-semibold text-slate-800">FastAPI Analytics Service</div>
                    <div className="text-xs text-slate-500">Port 8000 • Streaming O(1) Memory Engine</div>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-800">
                    ONLINE
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-200">
                  <div>
                    <div className="font-semibold text-slate-800">PostgreSQL 16 & Redis PubSub</div>
                    <div className="text-xs text-slate-500">Normalized DDL • Transaction Isolation</div>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-800">
                    ONLINE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
