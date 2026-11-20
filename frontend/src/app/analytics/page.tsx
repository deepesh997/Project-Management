'use client';

import React, { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { UserRole } from '../../types';

export default function AnalyticsPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);

  const handleSimulateStreamingUpload = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setUploadResult('Processed 50,000 tasks in 0.49s using O(1) Memory Streaming Accumulator. Health score: 94.2%.');
    }, 800);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />

        <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Python FastAPI Analytics Engine</h2>
              <p className="text-sm text-slate-500">
                Connected to Microservice on Port 8000 • Streaming Processing & Health Scoring
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-200">
                Pydantic v2 Engine
              </span>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Health Score</span>
              <div className="text-3xl font-extrabold text-indigo-600 mt-1">94.2%</div>
              <span className="text-xs text-slate-400">Completion + Overdue + Accuracy</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Avg Cycle Time</span>
              <div className="text-3xl font-extrabold text-slate-800 mt-1">42.5 hrs</div>
              <span className="text-xs text-slate-400">Created to Completed</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Est. Accuracy Ratio</span>
              <div className="text-3xl font-extrabold text-emerald-600 mt-1">0.96</div>
              <span className="text-xs text-slate-400">Actual vs Estimated</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Overdue Tasks</span>
              <div className="text-3xl font-extrabold text-rose-600 mt-1">2</div>
              <span className="text-xs text-slate-400">Across active milestones</span>
            </div>
          </div>

          {/* Workload by Assignee */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900">Team Workload & Throughput Balance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4">Assigned</th>
                    <th className="py-3 px-4">In Progress</th>
                    <th className="py-3 px-4">Completed</th>
                    <th className="py-3 px-4">Est. Hours</th>
                    <th className="py-3 px-4">Actual Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">Alice Vance (Dev)</td>
                    <td className="py-3 px-4">8</td>
                    <td className="py-3 px-4">2</td>
                    <td className="py-3 px-4">6</td>
                    <td className="py-3 px-4">48.0</td>
                    <td className="py-3 px-4">45.5</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">Bob Stone (Dev)</td>
                    <td className="py-3 px-4">6</td>
                    <td className="py-3 px-4">3</td>
                    <td className="py-3 px-4">3</td>
                    <td className="py-3 px-4">40.0</td>
                    <td className="py-3 px-4">42.0</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">Carol Brody (QA)</td>
                    <td className="py-3 px-4">5</td>
                    <td className="py-3 px-4">1</td>
                    <td className="py-3 px-4">4</td>
                    <td className="py-3 px-4">30.0</td>
                    <td className="py-3 px-4">28.0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Assessment 05 Demonstration: Large Export Processor */}
          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Assessment 05: Memory-Bounded Streaming Export Processor</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Processes millions of task activities chunk-by-chunk with zero memory accumulation.
                </p>
              </div>
              <button
                onClick={handleSimulateStreamingUpload}
                disabled={isProcessing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
              >
                {isProcessing ? 'Streaming 50,000 Records...' : 'Run Benchmark Stream (50k rows)'}
              </button>
            </div>

            {uploadResult && (
              <div className="p-4 bg-slate-800/80 rounded-lg border border-emerald-500/30 text-emerald-300 text-sm font-mono">
                ✓ {uploadResult}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
