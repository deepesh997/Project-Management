'use client';

import React, { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { UserRole } from '../../types';

export default function SettingsPage() {
  const [role, setRole] = useState<UserRole>('org_owner');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentRole={role} onRoleChange={setRole} />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar currentRole={role} />

        <main className="p-8 max-w-4xl w-full mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Tenant & Infrastructure Settings</h2>
              <p className="text-sm text-slate-500">
                Organization Scope: `org-acme-101` • Access Restricted to Org Owners & Admins
              </p>
            </div>
            {saved && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md border border-emerald-200">
                ✓ Settings saved
              </span>
            )}
          </div>

          {/* Database & Supabase Status Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Live Database Cluster</h3>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Connected
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5 font-medium">Provider</span>
                <span className="font-semibold text-slate-800">Supabase PostgreSQL 16</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5 font-medium">Pooler Host</span>
                <span className="font-mono text-slate-800">aws-0-ap-northeast-2.pooler.supabase.com</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5 font-medium">Database</span>
                <span className="font-mono text-slate-800">postgres (Port 5432)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5 font-medium">SSL Mode</span>
                <span className="font-semibold text-emerald-600">Strict TLS / RejectUnauthorized</span>
              </div>
            </div>
          </div>

          {/* Organization Details */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900">Organization Profile</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Company Name</label>
                <input
                  type="text"
                  defaultValue="Acme Technologies Inc."
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Tenant Slug (Identifier)</label>
                <input
                  type="text"
                  defaultValue="acme-corp"
                  disabled
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-500 bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Subscription Plan</label>
                <select defaultValue="ENTERPRISE" className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800">
                  <option value="STARTER">Starter Plan (Up to 5 Users)</option>
                  <option value="PRO">Pro Plan (Up to 25 Users)</option>
                  <option value="ENTERPRISE">Enterprise Plan (Unlimited Seats + OCC Support)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Webhook Configuration */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900">Webhook Endpoints & Security</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Incoming Webhook Ingestion URL</label>
                <input
                  type="text"
                  defaultValue="http://localhost:4000/api/v1/integrations/webhooks/incoming"
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono text-slate-600 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">HMAC-SHA256 Signing Secret</label>
                <input
                  type="password"
                  defaultValue="whsec_worksphere_signature_secret_test_key_99"
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono text-slate-600 bg-slate-50"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm"
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
