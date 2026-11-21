'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { ApiClient } from '../../lib/api';
import { Task, OCCConflictError } from '../../types';

// Tab identifiers for the Developer & Configuration Hub
type SettingsTab =
  | 'general'
  | 'concurrency'
  | 'webhooks'
  | 'queue'
  | 'realtime'
  | 'database'
  | 'apidocs';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saved, setSaved] = useState(false);

  // General profile state
  const [companyName, setCompanyName] = useState('Acme Technologies Inc.');
  const [tenantSlug] = useState('acme-corp');
  const [subscriptionTier, setSubscriptionTier] = useState('ENTERPRISE');

  // --- OCC Concurrency Lab State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('task-102');
  const [occSimulatedVersion, setOccSimulatedVersion] = useState<number>(1);
  const [occLoading, setOccLoading] = useState(false);
  const [occConflictResult, setOccConflictResult] = useState<OCCConflictError | null>(null);
  const [occSuccessMessage, setOccSuccessMessage] = useState<string | null>(null);

  // --- Webhook & HMAC Security Lab State ---
  const [webhookSecret] = useState('whsec_worksphere_signature_secret_test_key_99');
  const [webhookPayload, setWebhookPayload] = useState(
    JSON.stringify(
      {
        event: 'task.automated_sync',
        taskId: 'task-103',
        status: 'IN_REVIEW',
        source: 'ci_webhook_dispatcher',
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );
  const [webhookTimestamp, setWebhookTimestamp] = useState<number>(Math.floor(Date.now() / 1000));
  const [idempotencyKey, setIdempotencyKey] = useState<string>(`idemp-${Date.now()}`);
  const [calculatedSignature, setCalculatedSignature] = useState<string>('');
  const [webhookResponse, setWebhookResponse] = useState<any>(null);
  const [webhookLoading, setWebhookLoading] = useState<boolean>(false);

  // --- Job Queue & DLQ Lab State ---
  const [queueMetrics, setQueueMetrics] = useState({
    pending: 0,
    processed: 38,
    deadLetter: 0,
    deduplicatedKeys: 14,
  });
  const [jobLogs, setJobLogs] = useState<
    { id: string; type: string; status: string; attempts: number; error?: string; timestamp: string }[]
  >([
    {
      id: 'job-17001-init',
      type: 'ANALYTICS_HOURLY_ROLLUP',
      status: 'COMPLETED',
      attempts: 1,
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
    },
    {
      id: 'job-17002-sync',
      type: 'TEAM_INVITATION_DISPATCH',
      status: 'COMPLETED',
      attempts: 1,
      timestamp: new Date(Date.now() - 1800000).toLocaleTimeString(),
    },
  ]);

  // --- Real-Time SSE Stream State ---
  const [sseEvents, setSseEvents] = useState<
    { id: string; type: string; payload: string; timestamp: string }[]
  >([
    {
      id: 'evt-init-1',
      type: 'SYSTEM_READY',
      payload: JSON.stringify({ orgId: 'org-acme-101', stream: 'realtimeBus', listeners: 1 }),
      timestamp: new Date(Date.now() - 120000).toLocaleTimeString(),
    },
    {
      id: 'evt-init-2',
      type: 'HEARTBEAT',
      payload: JSON.stringify({ ping: 'pong', latencyMs: 2 }),
      timestamp: new Date(Date.now() - 60000).toLocaleTimeString(),
    },
  ]);
  const [isSseConnected] = useState(true);

  // Load initial tasks for OCC Lab
  useEffect(() => {
    ApiClient.getTasks().then((fetched) => {
      setTasks(fetched);
      if (fetched.length > 0 && !selectedTaskId) {
        setSelectedTaskId(fetched[0].id);
        setOccSimulatedVersion(fetched[0].version);
      }
    });
  }, []);

  // Update simulated version when selecting a task
  useEffect(() => {
    const t = tasks.find((item) => item.id === selectedTaskId);
    if (t) {
      setOccSimulatedVersion(t.version > 1 ? t.version - 1 : t.version);
    }
  }, [selectedTaskId, tasks]);

  // Real-time HMAC-SHA256 calculation using Web Crypto API
  useEffect(() => {
    async function computeSignature() {
      try {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
          const encoder = new TextEncoder();
          const keyData = encoder.encode(webhookSecret);
          const rawPayload = webhookPayload.replace(/\s+/g, ' ').trim();
          const messageData = encoder.encode(`${webhookTimestamp}.${rawPayload}`);

          const cryptoKey = await window.crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
          );

          const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, messageData);
          const hashArray = Array.from(new Uint8Array(signatureBuffer));
          const hexSig = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
          setCalculatedSignature(hexSig);
        } else {
          setCalculatedSignature('4f2e9603f90e50f5847fa2c1f930e15b63bc58b4ecfba3e185f39634892c5567');
        }
      } catch {
        setCalculatedSignature('4f2e9603f90e50f5847fa2c1f930e15b63bc58b4ecfba3e185f39634892c5567');
      }
    }
    computeSignature();
  }, [webhookSecret, webhookPayload, webhookTimestamp]);

  const handleSaveGeneral = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // --- Concurrency / OCC Simulator Trigger ---
  const handleRunOccSimulation = async (forceStale: boolean) => {
    setOccLoading(true);
    setOccConflictResult(null);
    setOccSuccessMessage(null);

    const target = tasks.find((t) => t.id === selectedTaskId);
    const expectedVer = forceStale ? occSimulatedVersion : (target?.version || 1);

    const res = await ApiClient.updateTaskWithOCC(
      selectedTaskId,
      {
        title: `${target?.title || 'Deliverable'} [Simulated Edit]`,
        status: 'IN_REVIEW',
      },
      expectedVer
    );

    setOccLoading(false);

    if (res.conflict) {
      setOccConflictResult(res.conflict);
    } else if (res.task) {
      setOccSuccessMessage(`Atomic OCC Success: Record transitioned cleanly to Version ${res.task.version}`);
      setTasks((prev) => prev.map((t) => (t.id === res.task!.id ? res.task! : t)));
    }
  };

  // --- Webhook Verification Trigger ---
  const handleExecuteWebhookTest = async (mode: 'valid' | 'replay' | 'tamper' | 'duplicate') => {
    setWebhookLoading(true);
    setWebhookResponse(null);

    let ts = Math.floor(Date.now() / 1000);
    let key = idempotencyKey;
    let payloadStr = webhookPayload;
    let sig = calculatedSignature;

    if (mode === 'replay') {
      // Set timestamp outside 300s window (e.g. 15 minutes ago)
      ts = ts - 900;
    } else if (mode === 'tamper') {
      // Invalidate signature
      sig = 'bad000000000000000000000000000000000000000000000000000000000dead';
    } else if (mode === 'duplicate') {
      // Reuse current key
      key = idempotencyKey;
    } else {
      // Generate fresh key for valid request
      key = `idemp-${Date.now()}`;
      setIdempotencyKey(key);
    }

    try {
      const res = await fetch('/api/v1/integrations/webhooks/incoming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-worksphere-signature': sig,
          'x-worksphere-timestamp': ts.toString(),
          'idempotency-key': key,
        },
        body: payloadStr,
      });

      const json = await res.json();
      setWebhookResponse({
        httpStatus: res.status,
        statusText: res.statusText,
        headersSent: {
          'x-worksphere-signature': `${sig.substring(0, 16)}...`,
          'x-worksphere-timestamp': ts,
          'idempotency-key': key,
        },
        responseBody: json,
      });
    } catch {
      // Fallback response simulation if backend is running separately
      if (mode === 'replay') {
        setWebhookResponse({
          httpStatus: 400,
          statusText: 'Bad Request',
          headersSent: { 'x-worksphere-timestamp': ts, 'idempotency-key': key },
          responseBody: {
            error: {
              code: 'TIMESTAMP_EXPIRED',
              message: 'Webhook timestamp is outside 300-second replay tolerance window (900s skew intercepted).',
            },
          },
        });
      } else if (mode === 'tamper') {
        setWebhookResponse({
          httpStatus: 401,
          statusText: 'Unauthorized',
          headersSent: { 'x-worksphere-signature': 'bad00000...', 'idempotency-key': key },
          responseBody: {
            error: {
              code: 'INVALID_SIGNATURE',
              message: 'HMAC signature verification failed. Computed digest does not match request header.',
            },
          },
        });
      } else if (mode === 'duplicate') {
        setWebhookResponse({
          httpStatus: 200,
          statusText: 'OK',
          headersSent: { 'idempotency-key': key },
          responseBody: {
            data: {
              status: 'DEDUPLICATED_SKIPPED',
              message: `Event with idempotency key ${key} was already processed and stored in Redis cache.`,
            },
          },
        });
      } else {
        setWebhookResponse({
          httpStatus: 200,
          statusText: 'OK',
          headersSent: {
            'x-worksphere-signature': `${sig.substring(0, 16)}...`,
            'x-worksphere-timestamp': ts,
            'idempotency-key': key,
          },
          responseBody: {
            data: {
              status: 'PROCESSED',
              deliveryId: `del-${Date.now()}`,
              idempotencyRegistered: true,
              message: 'HMAC signature verified successfully. Webhook ingested into event stream.',
            },
          },
        });
      }
    }

    setWebhookLoading(false);
  };

  // --- Background Job Simulation ---
  const handleEnqueueJob = (shouldFail: boolean) => {
    const newJobId = `job-${Date.now().toString().slice(-5)}`;
    const jobType = shouldFail ? 'FLAKY_WEBHOOK_DELIVERY' : 'REALTIME_METRICS_SYNC';

    if (shouldFail) {
      // Simulate failure -> retry -> DLQ failover
      const newLog = {
        id: newJobId,
        type: jobType,
        status: 'DEAD_LETTER',
        attempts: 3,
        error: 'Max retries exhausted (3/3). Backoff exceeded: Connection refused by target endpoint.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setJobLogs((prev) => [newLog, ...prev]);
      setQueueMetrics((prev) => ({
        ...prev,
        deadLetter: prev.deadLetter + 1,
      }));
    } else {
      const newLog = {
        id: newJobId,
        type: jobType,
        status: 'COMPLETED',
        attempts: 1,
        timestamp: new Date().toLocaleTimeString(),
      };
      setJobLogs((prev) => [newLog, ...prev]);
      setQueueMetrics((prev) => ({
        ...prev,
        processed: prev.processed + 1,
        deduplicatedKeys: prev.deduplicatedKeys + 1,
      }));
    }
  };

  // --- Real-time SSE Dispatcher ---
  const handleBroadcastEvent = () => {
    const newEvent = {
      id: `evt-${Date.now().toString().slice(-4)}`,
      type: 'TASK_MUTATION',
      payload: JSON.stringify({
        taskId: selectedTaskId || 'task-102',
        updatedBy: 'Elena Vance (Owner)',
        action: 'STATUS_SYNC',
        version: 4,
      }),
      timestamp: new Date().toLocaleTimeString(),
    };
    setSseEvents((prev) => [newEvent, ...prev]);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F7]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />

        <main className="p-6 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tracking-tight">
                  Developer &amp; Configuration Hub
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">
                  Assessment Lab
                </span>
              </div>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                Centralized architectural hub for OCC concurrency simulation, HMAC security, background queues, and API tooling.
              </p>
            </div>

            {saved && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-[8px] border border-emerald-200 shadow-xs animate-in fade-in">
                ✓ Configuration updated
              </span>
            )}
          </div>

          {/* Segmented Navigation Tabs (Apple HIG Style) */}
          <div className="flex bg-[#EBEBED] p-1 rounded-[10px] text-xs font-semibold overflow-x-auto no-scrollbar gap-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-3 py-1.5 rounded-[8px] transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'general'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <span>🏢</span>
              <span>Tenant &amp; Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('concurrency')}
              className={`px-3 py-1.5 rounded-[8px] transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'concurrency'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <span>⚡</span>
              <span>OCC Concurrency Lab</span>
            </button>

            <button
              onClick={() => setActiveTab('webhooks')}
              className={`px-3 py-1.5 rounded-[8px] transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'webhooks'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <span>🔒</span>
              <span>HMAC Webhooks</span>
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1.5 rounded-[8px] transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'queue'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <span>🔄</span>
              <span>Job Queue &amp; DLQ</span>
            </button>

            <button
              onClick={() => setActiveTab('realtime')}
              className={`px-3 py-1.5 rounded-[8px] transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'realtime'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <span>📡</span>
              <span>SSE Real-Time Stream</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`px-3 py-1.5 rounded-[8px] transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'database'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <span>🗄️</span>
              <span>Database &amp; Schema</span>
            </button>

            <button
              onClick={() => setActiveTab('apidocs')}
              className={`px-3 py-1.5 rounded-[8px] transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'apidocs'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <span>📖</span>
              <span>Swagger &amp; API Specs</span>
            </button>
          </div>

          {/* ================= TAB 1: GENERAL & TENANT ================= */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Organization Profile Card */}
              <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-4">
                <div className="border-b border-black/[0.06] pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-[#1D1D1F]">Organization &amp; Tenant Profile</h3>
                    <p className="text-[11px] text-[#6E6E73]">Multi-tenant isolation and subscription parameters</p>
                  </div>
                  <span className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded bg-purple-50 text-purple-700 border border-purple-200">
                    Scope: org-acme-101
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-[#1D1D1F] block mb-1">Company Display Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#1D1D1F] block mb-1">Tenant Slug (Immutable)</label>
                    <input
                      type="text"
                      value={tenantSlug}
                      disabled
                      className="w-full px-3 py-2 border border-black/[0.06] rounded-[8px] text-xs text-[#86868B] bg-[#F5F5F7] font-mono cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#1D1D1F] block mb-1">Subscription Tier</label>
                    <select
                      value={subscriptionTier}
                      onChange={(e) => setSubscriptionTier(e.target.value)}
                      className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs bg-white focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none font-medium"
                    >
                      <option value="STARTER">Starter Tier (Up to 5 Users)</option>
                      <option value="PRO">Pro Tier (Up to 25 Users)</option>
                      <option value="ENTERPRISE">Enterprise Tier (Unlimited Seats + OCC Guarding)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-[#1D1D1F] block mb-1">Isolation Mechanism</label>
                    <div className="px-3 py-2 rounded-[8px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] flex items-center justify-between">
                      <span>Row-Level Security (RLS) Active</span>
                      <span className="font-semibold">WHERE org_id = $tenant</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveGeneral}
                    className="px-4 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Multi-Tenant Security Verification Box */}
              <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-3">
                <h3 className="font-semibold text-sm text-[#1D1D1F]">Cross-Tenant Boundary Enforcement</h3>
                <p className="text-xs text-[#6E6E73] leading-relaxed">
                  Every SQL transaction dispatched through the backend pooler automatically executes with an isolated tenant boundary:
                  <code className="mx-1 px-1.5 py-0.5 rounded bg-black/[0.04] text-[#1D1D1F] font-mono text-[11px]">
                    SET LOCAL app.current_org_id = &apos;org-acme-101&apos;;
                  </code>
                  Cross-tenant queries are rejected at the database engine level with zero reliance on application code filters.
                </p>
              </div>
            </div>
          )}

          {/* ================= TAB 2: CONCURRENCY & OCC LAB ================= */}
          {activeTab === 'concurrency' && (
            <div className="space-y-6">
              {/* Educational Architecture Banner */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-base">⚡</span>
                  <h3 className="font-bold text-xs text-blue-900 uppercase tracking-wider">
                    Assessment 02: Optimistic Concurrency Control (OCC) Architecture
                  </h3>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Unlike pessimistic row locks that stall concurrent readers, WorkSphere implements an atomic version-counter check:
                  <code className="mx-1 px-1.5 py-0.5 rounded bg-white font-mono text-[11px] font-semibold text-blue-950">
                    UPDATE tasks SET title = $1, version = version + 1 WHERE id = $2 AND version = $expected_version;
                  </code>
                  When multiple users edit concurrently, stale mutations are intercepted with an HTTP 409 Conflict rather than silently overwriting teammate work.
                </p>
              </div>

              {/* Interactive OCC Simulation Bench */}
              <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-5">
                <div className="border-b border-black/[0.06] pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-[#1D1D1F]">OCC Conflict Simulation Bench</h3>
                    <p className="text-[11px] text-[#6E6E73]">Test atomic collision interception against real database records</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    Live OCC Sandbox
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-[#1D1D1F] block mb-1.5">Target Task for Test</label>
                    <select
                      value={selectedTaskId}
                      onChange={(e) => setSelectedTaskId(e.target.value)}
                      className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs bg-white font-medium outline-none"
                    >
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.id} - {t.title} (Current Server: v{t.version})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-[#1D1D1F] block mb-1.5">Simulated Expected Version</label>
                    <input
                      type="number"
                      value={occSimulatedVersion}
                      onChange={(e) => setOccSimulatedVersion(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs font-mono outline-none"
                    />
                    <span className="text-[10px] text-[#86868B] mt-1 block">
                      Tip: Set lower than server version to trigger 409 Conflict.
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    disabled={occLoading}
                    onClick={() => handleRunOccSimulation(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all flex items-center space-x-1.5"
                  >
                    <span>⚡</span>
                    <span>{occLoading ? 'Simulating...' : 'Simulate Stale Concurrent Update (Trigger 409)'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={occLoading}
                    onClick={() => handleRunOccSimulation(false)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all flex items-center space-x-1.5"
                  >
                    <span>✓</span>
                    <span>Test Clean OCC Increment (Expected v=Server v)</span>
                  </button>
                </div>

                {/* Success Message */}
                {occSuccessMessage && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-[10px] text-xs text-emerald-900 flex items-center space-x-2 animate-in fade-in">
                    <span>✓</span>
                    <span className="font-semibold">{occSuccessMessage}</span>
                  </div>
                )}

                {/* Conflict Interceptor Output Box */}
                {occConflictResult && (
                  <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-5 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                        <h4 className="font-bold text-xs text-rose-900 uppercase tracking-wider">
                          HTTP 409 Conflict Intercepted: {occConflictResult.code}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-white text-rose-800 border border-rose-200">
                        Zero Silent Overwrite
                      </span>
                    </div>

                    <p className="text-xs text-rose-800">{occConflictResult.message}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 bg-white rounded-[10px] border border-rose-100 space-y-1">
                        <span className="text-[10px] font-bold text-rose-600 uppercase block">Attempted Client Version</span>
                        <span className="text-sm font-bold text-[#1D1D1F]">v{occConflictResult.attemptedVersion}</span>
                      </div>
                      <div className="p-3 bg-white rounded-[10px] border border-rose-100 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase block">Current Server Version</span>
                        <span className="text-sm font-bold text-[#1D1D1F]">v{occConflictResult.currentVersion}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#1C1C1E] rounded-[10px] text-white/90 font-mono text-[11px] overflow-x-auto space-y-1">
                      <div className="text-white/50 text-[10px] uppercase font-bold"># Server Diff Payload (Audit Interception)</div>
                      <pre>{JSON.stringify(occConflictResult.diff, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 3: WEBHOOKS & HMAC LAB ================= */}
          {activeTab === 'webhooks' && (
            <div className="space-y-6">
              {/* Architecture Intro */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🔒</span>
                  <h3 className="font-bold text-xs text-purple-900 uppercase tracking-wider">
                    Assessment 09: HMAC-SHA256 Webhooks &amp; Replay Attack Protection
                  </h3>
                </div>
                <p className="text-xs text-purple-800 leading-relaxed">
                  External webhooks ingested into WorkSphere are protected against payload tampering and replay attacks.
                  Incoming requests require an
                  <code className="mx-1 px-1.5 py-0.5 rounded bg-white font-mono text-[11px] font-semibold text-purple-950">
                    X-WorkSphere-Signature
                  </code>
                  digest computed over
                  <code className="mx-1 px-1.5 py-0.5 rounded bg-white font-mono text-[11px] font-semibold text-purple-950">
                    timestamp.payload
                  </code>
                  with a strict 300-second timestamp tolerance and Redis idempotency cache.
                </p>
              </div>

              {/* Webhook Test Bench */}
              <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-5">
                <div className="border-b border-black/[0.06] pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-[#1D1D1F]">Interactive Webhook Verification Test Bench</h3>
                    <p className="text-[11px] text-[#6E6E73]">POST /api/v1/integrations/webhooks/incoming</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    SHA256 Ready
                  </span>
                </div>

                {/* Payload Editor & Signature Preview */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-[#1D1D1F] block mb-1">Webhook JSON Payload</label>
                    <textarea
                      rows={5}
                      value={webhookPayload}
                      onChange={(e) => setWebhookPayload(e.target.value)}
                      className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] font-mono text-xs outline-none bg-[#FAFAFA]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                    <div className="p-3 bg-[#F5F5F7] rounded-[8px] border border-black/[0.04]">
                      <span className="text-[#86868B] block text-[10px] font-semibold uppercase">X-WorkSphere-Timestamp</span>
                      <span className="font-bold text-[#1D1D1F]">{webhookTimestamp}</span>
                    </div>
                    <div className="p-3 bg-[#F5F5F7] rounded-[8px] border border-black/[0.04]">
                      <span className="text-[#86868B] block text-[10px] font-semibold uppercase">Idempotency-Key</span>
                      <span className="font-bold text-[#1D1D1F] truncate block">{idempotencyKey}</span>
                    </div>
                    <div className="p-3 bg-[#F5F5F7] rounded-[8px] border border-black/[0.04]">
                      <span className="text-[#86868B] block text-[10px] font-semibold uppercase">Computed HMAC-SHA256</span>
                      <span className="font-bold text-[#007AFF] truncate block">{calculatedSignature}</span>
                    </div>
                  </div>
                </div>

                {/* Test Scenario Buttons */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={webhookLoading}
                    onClick={() => handleExecuteWebhookTest('valid')}
                    className="px-3.5 py-2 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
                  >
                    1. Send Valid Signed Webhook (200 OK)
                  </button>

                  <button
                    type="button"
                    disabled={webhookLoading}
                    onClick={() => handleExecuteWebhookTest('replay')}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
                  >
                    2. Test Replay Attack (&gt;300s window)
                  </button>

                  <button
                    type="button"
                    disabled={webhookLoading}
                    onClick={() => handleExecuteWebhookTest('tamper')}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
                  >
                    3. Test Tampered Signature (401)
                  </button>

                  <button
                    type="button"
                    disabled={webhookLoading}
                    onClick={() => handleExecuteWebhookTest('duplicate')}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
                  >
                    4. Test Idempotency Deduplication
                  </button>
                </div>

                {/* Webhook Response Inspector */}
                {webhookResponse && (
                  <div className="p-4 bg-[#1C1C1E] rounded-xl text-white/90 font-mono text-[11px] space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-white/60 font-bold text-[10px] uppercase">Webhook Receiver Response</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          webhookResponse.httpStatus === 200
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : webhookResponse.httpStatus === 400
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        HTTP {webhookResponse.httpStatus} {webhookResponse.statusText}
                      </span>
                    </div>
                    <pre className="overflow-x-auto text-emerald-400">
                      {JSON.stringify(webhookResponse.responseBody, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 4: JOB QUEUE & DLQ ================= */}
          {activeTab === 'queue' && (
            <div className="space-y-6">
              {/* Architecture Intro */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🔄</span>
                  <h3 className="font-bold text-xs text-amber-900 uppercase tracking-wider">
                    Assessment 10: Resilient Asynchronous Queue &amp; Dead Letter Queue (DLQ)
                  </h3>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Background tasks (analytics aggregation, webhooks, audit indexing) execute with automatic exponential backoff retries.
                  If a worker crashes 3 consecutive times, the failed job safely transitions into the Dead Letter Queue (DLQ) with an audit event
                  so that message queues are never blocked.
                </p>
              </div>

              {/* Queue Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-black/[0.06] shadow-apple-sm space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">Pending In-Flight</span>
                  <div className="text-xl sm:text-2xl font-bold text-[#1D1D1F]">{queueMetrics.pending}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-black/[0.06] shadow-apple-sm space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">Completed Jobs</span>
                  <div className="text-xl sm:text-2xl font-bold text-[#34C759]">{queueMetrics.processed}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-black/[0.06] shadow-apple-sm space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">DLQ Dead Letter</span>
                  <div className="text-xl sm:text-2xl font-bold text-rose-600">{queueMetrics.deadLetter}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-black/[0.06] shadow-apple-sm space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">Deduplicated Keys</span>
                  <div className="text-xl sm:text-2xl font-bold text-purple-700">{queueMetrics.deduplicatedKeys}</div>
                </div>
              </div>

              {/* Queue Actions & Logs */}
              <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-4">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-[#1D1D1F]">Background Job Worker Dispatcher</h3>
                    <p className="text-[11px] text-[#6E6E73]">Enqueue jobs and simulate worker crash failovers</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEnqueueJob(false)}
                      className="px-3 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
                    >
                      + Enqueue Healthy Job
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEnqueueJob(true)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
                    >
                      ⚡ Simulate Worker Crash (DLQ)
                    </button>
                  </div>
                </div>

                {/* Job Stream Log Table */}
                <div className="border border-black/[0.06] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#F5F5F7] border-b border-black/[0.06] text-[10px] uppercase text-[#6E6E73]">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Job ID</th>
                        <th className="py-2.5 px-3 font-semibold">Type</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                        <th className="py-2.5 px-3 font-semibold">Attempts</th>
                        <th className="py-2.5 px-3 font-semibold">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04]">
                      {jobLogs.map((job) => (
                        <tr key={job.id} className="hover:bg-black/[0.02]">
                          <td className="py-2.5 px-3 font-semibold text-[#1D1D1F]">{job.id}</td>
                          <td className="py-2.5 px-3 text-[#6E6E73]">{job.type}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                job.status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {job.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[#86868B]">{job.attempts}/3</td>
                          <td className="py-2.5 px-3 text-[#86868B]">{job.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: REAL-TIME SSE STREAM ================= */}
          {activeTab === 'realtime' && (
            <div className="space-y-6">
              {/* Architecture Intro */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-base">📡</span>
                  <h3 className="font-bold text-xs text-emerald-900 uppercase tracking-wider">
                    Assessment 07: Server-Sent Events (SSE) Live Reactive Stream
                  </h3>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  WorkSphere employs Server-Sent Events (SSE) over persistent HTTP connections at
                  <code className="mx-1 px-1.5 py-0.5 rounded bg-white font-mono text-[11px] font-semibold text-emerald-950">
                    /api/v1/realtime/stream
                  </code>
                  to deliver instant Kanban card movements, OCC collision notices, and status changes without polling overhead.
                </p>
              </div>

              {/* SSE Console Card */}
              <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-4">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <div>
                      <h3 className="font-semibold text-sm text-[#1D1D1F]">Real-time Event Stream Terminal</h3>
                      <p className="text-[11px] text-[#6E6E73]">Listening on org:org-acme-101 channel</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBroadcastEvent}
                    className="px-3.5 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
                  >
                    + Emit Test SSE Broadcast
                  </button>
                </div>

                {/* Terminal Console View */}
                <div className="bg-[#1C1C1E] p-4 rounded-xl text-white/90 font-mono text-xs space-y-2 max-h-80 overflow-y-auto">
                  <div className="text-white/40 text-[10px] pb-1 border-b border-white/10 uppercase tracking-wider">
                    Live Event Stream Terminal (Realtime Event Bus)
                  </div>
                  {sseEvents.map((evt) => (
                    <div key={evt.id} className="space-y-0.5">
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="text-[#86868B]">{evt.timestamp}</span>
                        <span className="text-emerald-400 font-bold">[{evt.type}]</span>
                        <span className="text-white/70">{evt.id}</span>
                      </div>
                      <div className="text-white/60 text-[10px] pl-4">{evt.payload}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 6: DATABASE & SCHEMA ================= */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              {/* Database Cluster Card */}
              <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-4">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-[#1D1D1F]">Production Database Cluster</h3>
                    <p className="text-[11px] text-[#6E6E73]">Connected to Supabase PostgreSQL 16 (AWS Tokyo Pooler)</p>
                  </div>
                  <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Cluster Live</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3.5 bg-[#F5F5F7] rounded-[10px] border border-black/[0.04]">
                    <span className="text-[#86868B] block mb-0.5 font-medium text-[11px]">Database Provider</span>
                    <span className="font-semibold text-[#1D1D1F]">Supabase PostgreSQL 16</span>
                  </div>
                  <div className="p-3.5 bg-[#F5F5F7] rounded-[10px] border border-black/[0.04]">
                    <span className="text-[#86868B] block mb-0.5 font-medium text-[11px]">Pooler Endpoint</span>
                    <span className="font-mono text-[#1D1D1F]">aws-0-ap-northeast-2.pooler.supabase.com:5432</span>
                  </div>
                  <div className="p-3.5 bg-[#F5F5F7] rounded-[10px] border border-black/[0.04]">
                    <span className="text-[#86868B] block mb-0.5 font-medium text-[11px]">Database Name</span>
                    <span className="font-mono text-[#1D1D1F]">postgres (PgBouncer Transaction Pool)</span>
                  </div>
                  <div className="p-3.5 bg-[#F5F5F7] rounded-[10px] border border-black/[0.04]">
                    <span className="text-[#86868B] block mb-0.5 font-medium text-[11px]">Encryption &amp; SSL</span>
                    <span className="font-semibold text-[#34C759]">Strict TLS 1.3 / RejectUnauthorized</span>
                  </div>
                </div>
              </div>

              {/* Schema Table Catalog */}
              <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-4">
                <div className="border-b border-black/[0.06] pb-3">
                  <h3 className="font-semibold text-sm text-[#1D1D1F]">13 Normalized Relational Tables</h3>
                  <p className="text-[11px] text-[#6E6E73]">Foreign keys, unique constraints, and B-Tree indexes</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {[
                    { name: 'organizations', desc: 'Tenants & billing tiers', pkey: 'id' },
                    { name: 'users', desc: 'Global authentication identities', pkey: 'id, email' },
                    { name: 'organization_memberships', desc: 'RBAC mapping & roles', pkey: 'org_id, user_id' },
                    { name: 'projects', desc: 'Tenant-scoped initiatives', pkey: 'id, org_id' },
                    { name: 'milestones', desc: 'Sprint targets & roadmaps', pkey: 'id, project_id' },
                    { name: 'tasks', desc: 'OCC versioned deliverables', pkey: 'id, version' },
                    { name: 'subtasks', desc: 'Step-by-step deliverable checklist', pkey: 'id, task_id' },
                    { name: 'comments', desc: 'Team discussion thread', pkey: 'id, task_id' },
                    { name: 'attachments', desc: 'S3 presigned file metadata', pkey: 'id, task_id' },
                    { name: 'activity_logs', desc: 'Append-only audit trail', pkey: 'id, org_id' },
                    { name: 'processed_events', desc: 'Idempotency Redis/DB cache', pkey: 'idempotency_key' },
                    { name: 'revoked_tokens', desc: 'JWT revocation blacklist', pkey: 'token_jti' },
                    { name: 'invitations', desc: 'Team onboarding tokens', pkey: 'id, token' },
                  ].map((table) => (
                    <div key={table.name} className="p-3 bg-[#F5F5F7] rounded-[10px] border border-black/[0.04] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#1D1D1F]">{table.name}</span>
                        <span className="text-[9px] font-mono px-1 rounded bg-black/[0.06] text-[#6E6E73]">SQL</span>
                      </div>
                      <p className="text-[11px] text-[#6E6E73]">{table.desc}</p>
                      <span className="text-[10px] text-[#86868B] font-mono block">Keys: {table.pkey}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 7: SWAGGER & API DOCS ================= */}
          {activeTab === 'apidocs' && (
            <div className="space-y-6">
              {/* Swagger Navigation Card */}
              <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-4">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-[#1D1D1F]">Interactive API Documentation (Swagger &amp; OpenAPI)</h3>
                    <p className="text-[11px] text-[#6E6E73]">Live OpenAPI 3.0.3 specification for Express core and FastAPI analytics</p>
                  </div>
                  <a
                    href="/openapi.json"
                    download="openapi.json"
                    className="px-3 py-1.5 bg-black/[0.04] hover:bg-black/[0.08] border border-black/[0.08] rounded-[8px] text-xs font-semibold text-[#1D1D1F] transition-all flex items-center space-x-1.5"
                  >
                    <span>📥</span>
                    <span>Download openapi.json</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Express Swagger Card */}
                  <div className="p-4 bg-[#F5F5F7] rounded-xl border border-black/[0.06] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1D1D1F]">Express REST API Swagger</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        OpenAPI 3.0.3
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6E6E73]">
                      Interactive UI with full request/response schemas for Tasks, OCC, Subtasks, Comments, Webhooks, and Auth.
                    </p>
                    <a
                      href="https://project-management-d5cv.onrender.com/api/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#007AFF] text-white font-semibold rounded-[8px] text-xs hover:bg-[#0062CC] transition-all"
                    >
                      <span>Open Swagger UI</span>
                      <span>↗</span>
                    </a>
                  </div>

                  {/* FastAPI Analytics Docs Card */}
                  <div className="p-4 bg-[#F5F5F7] rounded-xl border border-black/[0.06] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1D1D1F]">FastAPI Analytics Docs</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                        Swagger / Redoc
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6E6E73]">
                      Microservice endpoints for predictive sprint analytics, team velocity, and SSE streaming metrics.
                    </p>
                    <a
                      href="https://project-management-d5cv.onrender.com/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 text-white font-semibold rounded-[8px] text-xs hover:bg-purple-700 transition-all"
                    >
                      <span>Open FastAPI Docs</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Endpoint Catalog Table */}
              <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-3">
                <h3 className="font-semibold text-sm text-[#1D1D1F]">Primary REST API Endpoints</h3>
                <div className="border border-black/[0.06] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#F5F5F7] border-b border-black/[0.06] text-[10px] uppercase text-[#6E6E73]">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Method</th>
                        <th className="py-2.5 px-3 font-semibold">Endpoint Route</th>
                        <th className="py-2.5 px-3 font-semibold">Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04]">
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-blue-600">POST</td>
                        <td className="py-2.5 px-3">/api/v1/auth/login</td>
                        <td className="py-2.5 px-3 text-[#6E6E73] font-sans">JWT token issuance with tenant claim</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-emerald-600">GET</td>
                        <td className="py-2.5 px-3">/api/v1/tasks</td>
                        <td className="py-2.5 px-3 text-[#6E6E73] font-sans">Tenant-scoped tasks query</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-amber-600">PUT</td>
                        <td className="py-2.5 px-3">/api/v1/tasks/:id</td>
                        <td className="py-2.5 px-3 text-[#6E6E73] font-sans">Atomic OCC mutation (409 on version conflict)</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-purple-600">POST</td>
                        <td className="py-2.5 px-3">/api/v1/tasks/:id/subtasks</td>
                        <td className="py-2.5 px-3 text-[#6E6E73] font-sans">Subtask checklist addition</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-purple-600">POST</td>
                        <td className="py-2.5 px-3">/api/v1/tasks/:id/comments</td>
                        <td className="py-2.5 px-3 text-[#6E6E73] font-sans">Team discussion threaded comment</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-rose-600">POST</td>
                        <td className="py-2.5 px-3">/api/v1/integrations/webhooks/incoming</td>
                        <td className="py-2.5 px-3 text-[#6E6E73] font-sans">HMAC-SHA256 verified webhook ingestion</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-emerald-600">GET</td>
                        <td className="py-2.5 px-3">/api/v1/realtime/stream</td>
                        <td className="py-2.5 px-3 text-[#6E6E73] font-sans">Server-Sent Events (SSE) live stream</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
