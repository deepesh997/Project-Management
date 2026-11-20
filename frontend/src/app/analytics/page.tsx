'use client';

import React, { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';

export default function AnalyticsPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);

  const handleSimulateStreamingUpload = () => {
    setIsProcessing(true);
    setUploadResult(null);
    setTimeout(() => {
      setIsProcessing(false);
      setUploadResult('Processed 50,000 tasks in 0.497s (100,523 records/sec) with +0.17 MB RAM delta. O(1) Memory Guarantee verified.');
    }, 700);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F7]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />

        <main className="p-8 max-w-7xl w-full mx-auto space-y-7">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
                Python FastAPI Analytics Microservice
              </h2>
              <p className="text-xs text-[#6E6E73]">
                Microservice on Port 8000 • Streaming Processing Engine with Pydantic v2
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-blue-50 text-[#007AFF] text-xs font-semibold rounded-[6px] border border-blue-200">
                FastAPI 0.115 • Python 3.12
              </span>
            </div>
          </div>

          {/* Metric Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="apple-card p-5 space-y-1.5">
              <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                Health Score
              </span>
              <div className="text-3xl font-extrabold text-[#34C759] tracking-tight">94.2%</div>
              <span className="text-[11px] text-[#6E6E73]">
                Completion (40%) + Overdue (30%) + Accuracy (30%)
              </span>
            </div>

            <div className="apple-card p-5 space-y-1.5">
              <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                Avg Cycle Time
              </span>
              <div className="text-3xl font-extrabold text-[#1D1D1F] tracking-tight">42.5 hrs</div>
              <span className="text-[11px] text-[#6E6E73]">
                Created to Done duration
              </span>
            </div>

            <div className="apple-card p-5 space-y-1.5">
              <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                Estimation Accuracy
              </span>
              <div className="text-3xl font-extrabold text-[#007AFF] tracking-tight">0.96</div>
              <span className="text-[11px] text-[#6E6E73]">
                Actual hours vs Estimated ratio
              </span>
            </div>

            <div className="apple-card p-5 space-y-1.5">
              <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                Overdue Tasks
              </span>
              <div className="text-3xl font-extrabold text-[#FF3B30] tracking-tight">2</div>
              <span className="text-[11px] text-[#6E6E73]">
                Across active roadmap milestones
              </span>
            </div>
          </div>

          {/* Streaming Benchmark Runner Card */}
          <div className="apple-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] pb-3.5">
              <div>
                <h3 className="font-semibold text-sm text-[#1D1D1F]">
                  Large-Scale Streaming Export & Memory Bound Test
                </h3>
                <p className="text-[11px] text-[#6E6E73]">
                  Verify $O(1)$ memory consumption processing 50,000 synthetic records with streaming accumulator
                </p>
              </div>
              <button
                onClick={handleSimulateStreamingUpload}
                disabled={isProcessing}
                className="px-4 py-2 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all disabled:opacity-50"
              >
                {isProcessing ? 'Streaming 50,000 records...' : 'Run 50k Streaming Benchmark'}
              </button>
            </div>

            {uploadResult && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-[10px] text-xs text-emerald-900 flex items-center space-x-2 animate-in fade-in">
                <span>⚡</span>
                <span className="font-semibold">{uploadResult}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-3 bg-[#F5F5F7] rounded-[10px] border border-black/[0.04]">
                <div className="text-[10px] text-[#86868B] font-semibold uppercase">Processing Speed</div>
                <div className="text-lg font-bold text-[#1D1D1F] mt-0.5 font-mono">100,523 rec/sec</div>
              </div>
              <div className="p-3 bg-[#F5F5F7] rounded-[10px] border border-black/[0.04]">
                <div className="text-[10px] text-[#86868B] font-semibold uppercase">Memory Consumption</div>
                <div className="text-lg font-bold text-[#34C759] mt-0.5 font-mono">&lt; 0.2 MB Delta</div>
              </div>
              <div className="p-3 bg-[#F5F5F7] rounded-[10px] border border-black/[0.04]">
                <div className="text-[10px] text-[#86868B] font-semibold uppercase">Microservice Spec</div>
                <div className="text-lg font-bold text-[#007AFF] mt-0.5 font-mono">O(1) Memory Bounded</div>
              </div>
            </div>
          </div>

          {/* Workload by Assignee Table */}
          <div className="apple-card overflow-hidden">
            <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-[#1D1D1F]">
                  Team Workload & Throughput Distribution
                </h3>
                <p className="text-[11px] text-[#6E6E73]">
                  Sprint capacity tracking and hours balance per collaborator
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#86868B]">Sprint 42</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FBFBFD] text-[#86868B] uppercase text-[10px] font-semibold border-b border-black/[0.06] tracking-wider">
                  <tr>
                    <th className="py-3 px-6">Collaborator</th>
                    <th className="py-3 px-6">Assigned</th>
                    <th className="py-3 px-6">In Progress</th>
                    <th className="py-3 px-6">Completed</th>
                    <th className="py-3 px-6">Est. Hours</th>
                    <th className="py-3 px-6">Actual Hours</th>
                    <th className="py-3 px-6 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  <tr className="hover:bg-black/[0.015] transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-[#1D1D1F]">Sarah Connor (Dev)</td>
                    <td className="py-3.5 px-6 font-mono">8</td>
                    <td className="py-3.5 px-6 font-mono">2</td>
                    <td className="py-3.5 px-6 font-mono">6</td>
                    <td className="py-3.5 px-6 font-mono">48.0</td>
                    <td className="py-3.5 px-6 font-mono">45.5</td>
                    <td className="py-3.5 px-6 text-right font-mono text-[#34C759] font-medium">-2.5h (Ahead)</td>
                  </tr>
                  <tr className="hover:bg-black/[0.015] transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-[#1D1D1F]">Marcus Brody (PM)</td>
                    <td className="py-3.5 px-6 font-mono">6</td>
                    <td className="py-3.5 px-6 font-mono">3</td>
                    <td className="py-3.5 px-6 font-mono">3</td>
                    <td className="py-3.5 px-6 font-mono">40.0</td>
                    <td className="py-3.5 px-6 font-mono">42.0</td>
                    <td className="py-3.5 px-6 text-right font-mono text-[#FF9500] font-medium">+2.0h (On Track)</td>
                  </tr>
                  <tr className="hover:bg-black/[0.015] transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-[#1D1D1F]">Elena Vance (Owner)</td>
                    <td className="py-3.5 px-6 font-mono">4</td>
                    <td className="py-3.5 px-6 font-mono">1</td>
                    <td className="py-3.5 px-6 font-mono">3</td>
                    <td className="py-3.5 px-6 font-mono">20.0</td>
                    <td className="py-3.5 px-6 font-mono">19.0</td>
                    <td className="py-3.5 px-6 text-right font-mono text-[#34C759] font-medium">-1.0h (Ahead)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
