'use client';

import React, { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F7]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />

        <main className="p-8 max-w-4xl w-full mx-auto space-y-6">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
                Tenant & Infrastructure Settings
              </h2>
              <p className="text-xs text-[#6E6E73]">
                Organization Scope: `org-acme-101` • Access Restricted to Org Owners & Platform Admins
              </p>
            </div>
            {saved && (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-[6px] border border-emerald-200 animate-in fade-in">
                ✓ Settings saved
              </span>
            )}
          </div>

          {/* Database & Supabase Live Cluster Card */}
          <div className="apple-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div>
                <h3 className="font-semibold text-sm text-[#1D1D1F]">Live Database Cluster</h3>
                <p className="text-[11px] text-[#6E6E73]">Connected to Supabase PostgreSQL 16</p>
              </div>
              <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Cluster Live</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3.5 bg-[#F5F5F7] rounded-[10px] border border-black/[0.04]">
                <span className="text-[#86868B] block mb-0.5 font-medium text-[11px]">Database Provider</span>
                <span className="font-semibold text-[#1D1D1F]">Supabase PostgreSQL 16 (AWS Tokyo Pooler)</span>
              </div>
              <div className="p-3.5 bg-[#F5F5F7] rounded-[10px] border border-black/[0.04]">
                <span className="text-[#86868B] block mb-0.5 font-medium text-[11px]">Pooler Endpoint</span>
                <span className="font-mono text-[#1D1D1F]">aws-0-ap-northeast-2.pooler.supabase.com:5432</span>
              </div>
              <div className="p-3.5 bg-[#F5F5F7] rounded-[10px] border border-black/[0.04]">
                <span className="text-[#86868B] block mb-0.5 font-medium text-[11px]">Database Name</span>
                <span className="font-mono text-[#1D1D1F]">postgres (PgBouncer Transaction Mode)</span>
              </div>
              <div className="p-3.5 bg-[#F5F5F7] rounded-[10px] border border-black/[0.04]">
                <span className="text-[#86868B] block mb-0.5 font-medium text-[11px]">Encryption & SSL</span>
                <span className="font-semibold text-[#34C759]">Strict TLS 1.3 / RejectUnauthorized</span>
              </div>
            </div>
          </div>

          {/* Organization Details Card */}
          <div className="apple-card p-6 space-y-4">
            <div className="border-b border-black/[0.06] pb-3">
              <h3 className="font-semibold text-sm text-[#1D1D1F]">Organization Profile</h3>
              <p className="text-[11px] text-[#6E6E73]">Tenant configuration and tier quota parameters</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#1D1D1F] block mb-1">Company Display Name</label>
                <input
                  type="text"
                  defaultValue="Acme Technologies Inc."
                  className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] block mb-1">Tenant Slug (Identifier)</label>
                <input
                  type="text"
                  defaultValue="acme-corp"
                  disabled
                  className="w-full px-3 py-2 border border-black/[0.06] rounded-[8px] text-xs text-[#86868B] bg-[#F5F5F7] font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] block mb-1">Subscription Tier</label>
                <select
                  defaultValue="ENTERPRISE"
                  className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                >
                  <option value="STARTER">Starter Tier (Up to 5 Users)</option>
                  <option value="PRO">Pro Tier (Up to 25 Users)</option>
                  <option value="ENTERPRISE">Enterprise Tier (Unlimited Seats + OCC Guarding)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
              >
                Save Settings
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
