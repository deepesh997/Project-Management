'use client';

import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('owner@acme.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (targetEmail?: string) => {
    const emailToUse = targetEmail || email;
    setError(null);
    setIsLoading(true);

    const res = await login(emailToUse, password);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-apple-sheet max-w-md w-full p-8 border border-white/20 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 bg-gradient-to-b from-[#007AFF] to-[#0062CC] rounded-[10px] mx-auto flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-500/30 border border-white/20">
            WS
          </div>
          <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
            WorkSphere Portal
          </h2>
          <p className="text-xs text-[#6E6E73]">
            Sign in to your organization tenant workspace
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-[8px] border border-rose-200 flex items-center justify-between animate-in fade-in">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold text-xs ml-2">✕</button>
          </div>
        )}

        {/* Credentials Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="font-semibold text-[#1D1D1F] block mb-1">
              Corporate Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-[#1D1D1F] block mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white font-semibold rounded-[8px] text-xs shadow-sm transition-all disabled:opacity-50"
          >
            {isLoading ? 'Authenticating with Backend...' : 'Sign In with JWT'}
          </button>
        </form>

        {/* 1-Click Persona Switcher for Evaluation */}
        <div className="border-t border-black/[0.06] pt-4 space-y-2">
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block text-center">
            One-Click Authenticated Personas
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleLogin('owner@acme.com')}
              disabled={isLoading}
              className="p-2 border border-purple-200 bg-purple-50/50 hover:bg-purple-100/50 rounded-[8px] text-left text-purple-900 transition-colors"
            >
              <div className="font-semibold">Elena Vance</div>
              <div className="text-[10px] text-purple-700">Organization Owner</div>
            </button>
            <button
              onClick={() => handleLogin('pm@acme.com')}
              disabled={isLoading}
              className="p-2 border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 rounded-[8px] text-left text-blue-900 transition-colors"
            >
              <div className="font-semibold">Marcus Brody</div>
              <div className="text-[10px] text-blue-700">Project Manager</div>
            </button>
            <button
              onClick={() => handleLogin('member@acme.com')}
              disabled={isLoading}
              className="p-2 border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 rounded-[8px] text-left text-emerald-900 transition-colors"
            >
              <div className="font-semibold">Sarah Connor</div>
              <div className="text-[10px] text-emerald-700">Team Member (Dev)</div>
            </button>
            <button
              onClick={() => handleLogin('auditor@acme.com')}
              disabled={isLoading}
              className="p-2 border border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 rounded-[8px] text-left text-amber-900 transition-colors"
            >
              <div className="font-semibold">Arthur Pendelton</div>
              <div className="text-[10px] text-amber-700">Compliance Auditor</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
