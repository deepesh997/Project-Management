'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth, TokenValidationResult } from '../../lib/auth-context';
import { UserRole } from '../../types';

export default function LoginPage() {
  const { login, register, validateToken, token: currentToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'validator'>('signin');

  // Sign In Form State (Defaults prefilled for convenient access)
  const [email, setEmail] = useState('owner@acme.com');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('team_member');

  // Validator Tool State
  const [testToken, setTestToken] = useState('');
  const [validationResult, setValidationResult] = useState<TokenValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentToken && !testToken) {
      setTestToken(currentToken);
    }
  }, [currentToken, testToken]);

  const handleLogin = async (targetEmail?: string) => {
    const emailToUse = targetEmail || email;
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const res = await login(emailToUse, password);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const res = await register(regEmail, regPassword, regFullName, regRole);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || 'Registration failed.');
    } else {
      setSuccessMsg('Account registered and authentic JWT session issued!');
    }
  };

  const handleRunValidation = async () => {
    setIsValidating(true);
    setValidationResult(null);
    const result = await validateToken(testToken);
    setIsValidating(false);
    setValidationResult(result);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F5F5F7] flex flex-col lg:flex-row select-none">
      {/* ================= LEFT SIDE: IMAGE & VISUAL HERO (50%) ================= */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[52%] h-full bg-[#0B0F19] text-white p-6 xl:p-10 flex-col justify-between relative overflow-hidden">
        {/* Subtle Ambient Glowing Gradients */}
        <div className="absolute top-[-100px] left-[-100px] w-80 h-80 bg-[#007AFF]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-100px] right-[-100px] w-80 h-80 bg-[#5856D6]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header / Branding */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/25 border border-white/20">
            WS
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-white">WorkSphere</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-[#38BDF8] border border-blue-500/30 font-semibold">
                Enterprise v2.0
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8]">Multi-Tenant Workflow Automation Platform</p>
          </div>
        </div>

        {/* Center: Hero Graphic & Value Proposition */}
        <div className="relative z-10 my-auto py-4 space-y-4">
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Mission-critical concurrency. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC]">
                Guaranteed zero overwrites.
              </span>
            </h1>
            <p className="text-xs text-[#94A3B8] leading-relaxed max-w-lg">
              Designed according to Apple HIG standards. Backed by PostgreSQL 16 row-level tenant isolation, Python streaming analytics, and atomic Optimistic Concurrency Control.
            </p>
          </div>

          {/* Interactive SVG Hero Showcase Image */}
          <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 backdrop-blur-md max-h-[280px] xl:max-h-[320px] flex items-center justify-center">
            <Image
              src="/auth-hero.svg"
              alt="WorkSphere Enterprise Platform Architecture"
              width={750}
              height={450}
              priority
              className="w-full h-auto max-h-[280px] xl:max-h-[320px] object-contain"
            />
          </div>

          {/* Live Feature Highlights Row */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm space-y-0.5">
              <div className="flex items-center space-x-1.5 text-xs text-[#38BDF8] font-semibold">
                <span>🛡️</span>
                <span>OCC Engine</span>
              </div>
              <p className="text-[10px] text-[#94A3B8]">Atomic 409 conflict detection</p>
            </div>

            <div className="p-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm space-y-0.5">
              <div className="flex items-center space-x-1.5 text-xs text-[#34D399] font-semibold">
                <span>⚡</span>
                <span>Real-Time SSE</span>
              </div>
              <p className="text-[10px] text-[#94A3B8]">Live stream with idempotency</p>
            </div>

            <div className="p-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm space-y-0.5">
              <div className="flex items-center space-x-1.5 text-xs text-[#C084FC] font-semibold">
                <span>📊</span>
                <span>FastAPI 8000</span>
              </div>
              <p className="text-[10px] text-[#94A3B8]">Python $O(1)$ streaming metrics</p>
            </div>
          </div>
        </div>

        {/* Bottom Security / Architecture Badges */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-[#64748B] pt-3 border-t border-white/10">
          <span>Tenant Context: <strong className="text-[#E2E8F0]">org-acme-101</strong></span>
          <span>Database: <strong className="text-[#10B981]">Supabase PostgreSQL 16</strong></span>
          <span>Security: <strong className="text-[#38BDF8]">HMAC-SHA256</strong></span>
        </div>
      </div>

      {/* ================= RIGHT SIDE: AUTHENTICATION FORM (50%) ================= */}
      <div className="w-full lg:w-[50%] xl:w-[48%] h-full flex items-center justify-center p-6 sm:p-8 xl:p-12 overflow-y-auto">
        <div className="w-full max-w-sm space-y-5">
          {/* Header */}
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#007AFF] border border-blue-200/80 text-[11px] font-semibold mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]"></span>
              <span>Acme Technologies Inc.</span>
            </div>
            <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
              Sign In to WorkSphere
            </h2>
            <p className="text-xs text-[#6E6E73]">
              Enter your corporate credentials to access the workspace.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-[#EBEBED] p-1 rounded-[10px] text-xs font-medium">
            <button
              onClick={() => { setActiveTab('signin'); setError(null); }}
              className={`flex-1 py-1.5 rounded-[7px] transition-all ${activeTab === 'signin'
                ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(null); }}
              className={`flex-1 py-1.5 rounded-[7px] transition-all ${activeTab === 'register'
                ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
            >
              Register
            </button>
            <button
              onClick={() => { setActiveTab('validator'); setError(null); }}
              className={`flex-1 py-1.5 rounded-[7px] transition-all ${activeTab === 'validator'
                ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
            >
              JWT Tool
            </button>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="p-3 bg-rose-50 text-rose-900 text-xs rounded-[10px] border border-rose-200 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center space-x-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="font-bold text-xs ml-2 text-rose-700">✕</button>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-[10px] border border-emerald-200 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center space-x-2">
                <span>✓</span>
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="font-bold text-xs ml-2 text-emerald-700">✕</button>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-semibold text-[#1D1D1F] block mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8E8E93]">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-black/[0.12] rounded-[10px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-[#1D1D1F]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-[#007AFF] hover:underline"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8E8E93]">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-10 py-2.5 bg-white border border-black/[0.12] rounded-[10px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#007AFF] border-black/[0.2] focus:ring-[#007AFF]/25 cursor-pointer"
                  />
                  <span className="text-[11px] text-[#6E6E73]">Remember session</span>
                </label>
                <span className="text-[11px] text-[#86868B] font-mono">Scope: org-acme-101</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white font-semibold rounded-[10px] text-xs shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <span>{isLoading ? 'Authenticating & Issuing Token...' : 'Sign In to Workspace →'}</span>
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-[#1D1D1F] block mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] block mb-1">Corporate Email *</label>
                <input
                  type="email"
                  placeholder="alex.morgan@acme.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] block mb-1">Password *</label>
                <input
                  type="password"
                  placeholder="Min 8 chars, 1 uppercase, 1 digit"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] block mb-1">Organization Role *</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-white border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none font-medium"
                >
                  <option value="team_member">Team Member (Developer / Contributor)</option>
                  <option value="project_manager">Project Manager (Task &amp; Roadmap Owner)</option>
                  <option value="org_owner">Organization Owner (Full Administrative Rights)</option>
                  <option value="auditor">Compliance Auditor (Read-Only Activity Trail)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white font-semibold rounded-[10px] text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {isLoading ? 'Creating Account & Signing In...' : 'Register & Join Acme Workspace'}
              </button>
            </form>
          )}

          {/* TAB 3: TOKEN DIAGNOSTICS */}
          {activeTab === 'validator' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#1D1D1F] block">
                  RFC 7519 JWT Token Validator
                </label>
                <textarea
                  rows={3}
                  value={testToken}
                  onChange={(e) => setTestToken(e.target.value)}
                  placeholder="Paste Bearer JWT token here..."
                  className="w-full px-3 py-2 bg-white border border-black/[0.12] rounded-[8px] text-[11px] font-mono focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleRunValidation}
                disabled={isValidating || !testToken}
                className="w-full py-2 bg-[#5856D6] hover:bg-[#4745B8] active:scale-[0.98] text-white font-semibold rounded-[8px] text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {isValidating ? 'Validating Token...' : 'Verify Signature & Decode Claims'}
              </button>

              {validationResult && (
                <div
                  className={`p-3 rounded-[10px] border text-xs space-y-1.5 animate-in fade-in ${
                    validationResult.valid
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{validationResult.valid ? '✓ Token Verified' : '✕ Token Invalid'}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/[0.06]">
                      {validationResult.valid ? 'Valid Signature' : 'Check Failed'}
                    </span>
                  </div>

                  {validationResult.user && (
                    <div className="space-y-1 pt-1 font-mono text-[10px] bg-white/70 p-2 rounded-[6px] border border-black/[0.04]">
                      <div>Subject: <strong>{validationResult.user.id}</strong></div>
                      <div>Role: <strong className="text-purple-700">{validationResult.user.role}</strong></div>
                      <div>Tenant: <strong className="text-blue-700">{validationResult.user.orgId}</strong></div>
                      <div>Email: <strong>{validationResult.user.email}</strong></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
