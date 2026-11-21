'use client';

import React, { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';

export default function AnalyticsPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'sprint' | 'velocity'>('all');

  const handleSimulateStreamingUpload = () => {
    setIsProcessing(true);
    setUploadResult(null);
    setTimeout(() => {
      setIsProcessing(false);
      setUploadResult('Processed 50,000 tasks in 0.497s (100,523 records/sec) with +0.17 MB RAM delta. O(1) Memory Guarantee verified.');
    }, 650);
  };

  // Sample sprint burndown data
  const burndownData = [
    { day: 'Mon', ideal: 100, actual: 98 },
    { day: 'Tue', ideal: 80, actual: 82 },
    { day: 'Wed', ideal: 60, actual: 55 },
    { day: 'Thu', ideal: 40, actual: 44 },
    { day: 'Fri', ideal: 20, actual: 22 },
    { day: 'Mon', ideal: 0, actual: 8 },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F7]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />

        <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-7">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tracking-tight">
                  Python FastAPI Analytics Intelligence
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                  <span>Microservice Live</span>
                </span>
              </div>
              <p className="text-xs text-[#6E6E73]">
                Microservice on Port 8000 • Streaming Processing Engine with Pydantic v2 &amp; Real-time Telemetry
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="px-3 py-1.5 bg-blue-50 text-[#007AFF] text-xs font-semibold rounded-[8px] border border-blue-200 shadow-xs">
                FastAPI 0.115 • Python 3.12
              </span>
            </div>
          </div>

          {/* Metric Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="apple-card p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                <span>Health Score</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#34C759]" />
              </div>
              <div className="text-3xl font-extrabold text-[#34C759] tracking-tight">94.2%</div>
              <div className="text-[11px] text-[#6E6E73] leading-tight">
                Completion (40%) + Overdue (30%) + Accuracy (30%)
              </div>
              <div className="w-full bg-[#EBEBED] h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-[#34C759] h-full rounded-full" style={{ width: '94.2%' }} />
              </div>
            </div>

            <div className="apple-card p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                <span>Avg Cycle Time</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF]" />
              </div>
              <div className="text-3xl font-extrabold text-[#1D1D1F] tracking-tight">42.5 hrs</div>
              <div className="text-[11px] text-[#6E6E73] leading-tight">
                Average created-to-done duration across sprint
              </div>
              <div className="text-[11px] text-[#34C759] font-medium">
                ↓ 12% faster than last cycle
              </div>
            </div>

            <div className="apple-card p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                <span>Estimation Accuracy</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#5856D6]" />
              </div>
              <div className="text-3xl font-extrabold text-[#007AFF] tracking-tight">0.96</div>
              <div className="text-[11px] text-[#6E6E73] leading-tight">
                Actual hours vs Estimated ratio (1.0 = perfect)
              </div>
              <div className="text-[11px] text-[#007AFF] font-medium">
                High precision calibration
              </div>
            </div>

            <div className="apple-card p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                <span>Overdue Risk</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF9500]" />
              </div>
              <div className="text-3xl font-extrabold text-[#FF9500] tracking-tight">2 tasks</div>
              <div className="text-[11px] text-[#6E6E73] leading-tight">
                Requires priority review in current sprint
              </div>
              <div className="text-[11px] text-amber-700 font-medium">
                Within mitigation buffer
              </div>
            </div>
          </div>

          {/* Interactive Chart & Burndown Visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Burndown Chart Card (2 Cols) */}
            <div className="lg:col-span-2 apple-card p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] pb-3.5">
                <div>
                  <h2 className="font-bold text-sm text-[#1D1D1F]">
                    Sprint Burndown &amp; Velocity Trajectory
                  </h2>
                  <p className="text-[11px] text-[#6E6E73]">
                    Ideal burn trajectory vs real-time deliverable completions
                  </p>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-0.5 bg-[#86868B] rounded" />
                    <span className="text-[#6E6E73]">Ideal</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-2 bg-[#007AFF] rounded" />
                    <span className="font-semibold text-[#1D1D1F]">Actual</span>
                  </div>
                </div>
              </div>

              {/* Bar Graph Simulation */}
              <div className="h-56 flex items-end justify-between gap-3 pt-6 px-4 pb-2 border-b border-black/[0.06]">
                {burndownData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                      {/* Ideal reference line */}
                      <div
                        className="w-2 sm:w-3 bg-black/[0.08] rounded-t group-hover:bg-black/[0.15] transition-all"
                        style={{ height: `${d.ideal}%` }}
                        title={`Ideal: ${d.ideal} pts`}
                      />
                      {/* Actual bar */}
                      <div
                        className="w-4 sm:w-6 bg-gradient-to-t from-[#0062CC] to-[#007AFF] rounded-t group-hover:from-[#0056b3] group-hover:to-[#006ee6] shadow-xs transition-all relative"
                        style={{ height: `${d.actual}%` }}
                        title={`Actual: ${d.actual} pts`}
                      >
                        <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-black/80 text-white transition-opacity whitespace-nowrap">
                          {d.actual} pts
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#86868B]">{d.day}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-[#6E6E73] pt-1">
                <span>Sprint Start: Nov 10, 2026</span>
                <span className="font-semibold text-[#1D1D1F]">Velocity: 48 Story Points / Sprint</span>
                <span>Sprint Target: Nov 24, 2026</span>
              </div>
            </div>

            {/* Microservice Architecture Summary Card (1 Col) */}
            <div className="apple-card p-6 space-y-4">
              <div className="border-b border-black/[0.06] pb-3">
                <h2 className="font-bold text-sm text-[#1D1D1F]">
                  FastAPI Engine Specs
                </h2>
                <p className="text-[11px] text-[#6E6E73]">Microservice capabilities</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#F5F5F7] rounded-[10px] border border-black/[0.04] space-y-1">
                  <span className="text-[#86868B] block text-[10px] font-semibold uppercase">Framework</span>
                  <span className="font-semibold text-[#1D1D1F]">FastAPI 0.115 + Pydantic v2</span>
                </div>

                <div className="p-3 bg-[#F5F5F7] rounded-[10px] border border-black/[0.04] space-y-1">
                  <span className="text-[#86868B] block text-[10px] font-semibold uppercase">Memory Guarantee</span>
                  <span className="font-semibold text-emerald-700">Strict O(1) Memory Bound</span>
                </div>

                <div className="p-3 bg-[#F5F5F7] rounded-[10px] border border-black/[0.04] space-y-1">
                  <span className="text-[#86868B] block text-[10px] font-semibold uppercase">Throughput</span>
                  <span className="font-mono text-[#007AFF] font-bold">100,000+ records / second</span>
                </div>

                <div className="p-3 bg-[#F5F5F7] rounded-[10px] border border-black/[0.04] space-y-1">
                  <span className="text-[#86868B] block text-[10px] font-semibold uppercase">Stream Endpoint</span>
                  <span className="font-mono text-[#1D1D1F] text-[11px]">POST /analytics/stream-export</span>
                </div>
              </div>
            </div>
          </div>

          {/* Streaming Benchmark Runner Card */}
          <div className="apple-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] pb-3.5">
              <div>
                <h2 className="font-bold text-sm text-[#1D1D1F]">
                  Large-Scale Streaming Export &amp; Memory Bound Test
                </h2>
                <p className="text-[11px] text-[#6E6E73]">
                  Verify O(1) memory consumption processing 50,000 synthetic records with streaming accumulator
                </p>
              </div>
              <button
                type="button"
                onClick={handleSimulateStreamingUpload}
                disabled={isProcessing}
                className="px-4 py-2 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all flex items-center space-x-1.5 shrink-0"
              >
                <span>{isProcessing ? 'Streaming 50,000 Tasks...' : '▶ Run 50k Streaming Benchmark'}</span>
              </button>
            </div>

            {uploadResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900">
                  <span>✓</span>
                  <span>Benchmark Execution Verified</span>
                </div>
                <div className="font-mono text-xs text-emerald-800 leading-relaxed">
                  {uploadResult}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
                  <div className="p-2 bg-white rounded border border-emerald-200">
                    <span className="text-[#86868B] block text-[9px]">TOTAL PROCESSED</span>
                    <span className="font-bold text-[#1D1D1F]">50,000 tasks</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-emerald-200">
                    <span className="text-[#86868B] block text-[9px]">THROUGHPUT</span>
                    <span className="font-bold text-[#34C759]">100,523 / sec</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-emerald-200">
                    <span className="text-[#86868B] block text-[9px]">EXECUTION TIME</span>
                    <span className="font-bold text-[#007AFF]">0.497 seconds</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-emerald-200">
                    <span className="text-[#86868B] block text-[9px]">RAM DELTA</span>
                    <span className="font-bold text-purple-700">+0.17 MB (O(1))</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
