'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@acme.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (demoEmail?: string) => {
    const targetEmail = demoEmail || email;
    setError(null);
    // Set demo token for immediate dashboard demo
    ApiClient.setAuth('mock-jwt-token-demo', 'org-acme-101');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-200 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-xl shadow-lg">
            WS
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">WorkSphere Portal</h2>
          <p className="text-sm text-slate-500">Sign in to your organization tenant workspace</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Corporate Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm shadow transition-colors"
          >
            Sign In with Tenant Verification
          </button>
        </form>

        <div className="border-t border-slate-100 pt-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 text-center">
            One-Click Demo Personas
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleLogin('owner@acme.com')}
              className="p-2 border rounded-lg hover:bg-slate-50 text-left font-medium text-purple-700 border-purple-200"
            >
              👑 Org Owner
            </button>
            <button
              onClick={() => handleLogin('pm@acme.com')}
              className="p-2 border rounded-lg hover:bg-slate-50 text-left font-medium text-blue-700 border-blue-200"
            >
              📊 Project Manager
            </button>
            <button
              onClick={() => handleLogin('member@acme.com')}
              className="p-2 border rounded-lg hover:bg-slate-50 text-left font-medium text-emerald-700 border-emerald-200"
            >
              💻 Team Member
            </button>
            <button
              onClick={() => handleLogin('auditor@acme.com')}
              className="p-2 border rounded-lg hover:bg-slate-50 text-left font-medium text-amber-700 border-amber-200"
            >
              🔍 Auditor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
