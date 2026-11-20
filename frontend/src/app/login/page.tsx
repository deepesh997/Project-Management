'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, TokenValidationResult } from '../../lib/auth-context';
import { UserRole } from '../../types';

export default function LoginPage() {
  const { login, register, validateToken, token: currentToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'validator'>('signin');

  // Sign In Form State
  const [email, setEmail] = useState('owner@acme.com');
  const [password, setPassword] = useState('Password123!');

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
  }, [currentToken]);

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
    <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-apple-sheet max-w-lg w-full p-8 border border-white/20 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 bg-gradient-to-b from-[#007AFF] to-[#0062CC] rounded-[10px] mx-auto flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-500/30 border border-white/20">
            WS
          </div>
          <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
            WorkSphere Identity & Authentication
          </h2>
          <p className="text-xs text-[#6E6E73]">
            Cryptographic JWT Token Creation, Lifecycle & Verification
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#F5F5F7] p-1 rounded-[10px] border border-black/[0.06] text-xs font-medium">
          <button
            onClick={() => { setActiveTab('signin'); setError(null); }}
            className={`flex-1 py-1.5 rounded-[7px] transition-all ${
              activeTab === 'signin'
                ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(null); }}
            className={`flex-1 py-1.5 rounded-[7px] transition-all ${
              activeTab === 'register'
                ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Create Account & Token
          </button>
          <button
            onClick={() => { setActiveTab('validator'); setError(null); }}
            className={`flex-1 py-1.5 rounded-[7px] transition-all ${
              activeTab === 'validator'
                ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Token Validator
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-[8px] border border-rose-200 flex items-center justify-between animate-in fade-in">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold text-xs ml-2">✕</button>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-[8px] border border-emerald-200 flex items-center justify-between animate-in fade-in">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="font-bold text-xs ml-2">✕</button>
          </div>
        )}

        {/* TAB 1: SIGN IN */}
        {activeTab === 'signin' && (
          <div className="space-y-5">
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
                {isLoading ? 'Authenticating with Backend...' : 'Sign In & Issue JWT Access Token'}
              </button>
            </form>

            {/* One-Click Personas */}
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
        )}

        {/* TAB 2: CREATE ACCOUNT & GENERATE TOKEN */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-[#1D1D1F] block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-[#1D1D1F] block mb-1">
                Corporate Email Address *
              </label>
              <input
                type="email"
                placeholder="john.doe@acme.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-[#1D1D1F] block mb-1">
                Password (min 6 characters) *
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-[#1D1D1F] block mb-1">
                Assigned Role
              </label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
              >
                <option value="org_owner">Organization Owner</option>
                <option value="project_manager">Project Manager</option>
                <option value="team_member">Team Member (Developer)</option>
                <option value="auditor">Compliance Auditor</option>
              </select>
            </div>

            <div className="bg-[#F5F5F7] p-3 rounded-[8px] text-[11px] text-[#6E6E73] border border-black/[0.06]">
              Submitting registers the user into Supabase PostgreSQL and cryptographically signs a pair of JWT access and refresh tokens.
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white font-semibold rounded-[8px] text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {isLoading ? 'Provisioning User & Token...' : 'Create Account & Generate JWT Token'}
            </button>
          </form>
        )}

        {/* TAB 3: TOKEN VALIDATOR & DIAGNOSTICS */}
        {activeTab === 'validator' && (
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-[#1D1D1F]">
                  JWT Token to Validate
                </label>
                {currentToken && (
                  <button
                    type="button"
                    onClick={() => setTestToken(currentToken)}
                    className="text-[11px] text-[#007AFF] hover:underline"
                  >
                    Paste Active Session Token
                  </button>
                )}
              </div>
              <textarea
                rows={3}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={testToken}
                onChange={(e) => setTestToken(e.target.value)}
                className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-[11px] font-mono focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
              ></textarea>
            </div>

            <button
              type="button"
              disabled={isValidating || !testToken}
              onClick={handleRunValidation}
              className="w-full py-2 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white font-semibold rounded-[8px] text-xs shadow-sm transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
            >
              <span>{isValidating ? 'Validating against backend...' : 'Verify Token via /api/v1/auth/validate'}</span>
            </button>

            {validationResult && (
              <div
                className={`p-4 rounded-[12px] border space-y-2.5 animate-in fade-in ${
                  validationResult.valid
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50/60 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        validationResult.valid ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    ></span>
                    <span className="font-bold text-xs uppercase tracking-wider">
                      {validationResult.valid ? 'Valid & Cryptographically Verified' : 'Invalid Token'}
                    </span>
                  </div>
                  {validationResult.expiresInSeconds !== undefined && (
                    <span className="text-[10px] font-mono bg-white/80 px-2 py-0.5 rounded border">
                      {validationResult.expiresInSeconds}s remaining
                    </span>
                  )}
                </div>

                {validationResult.valid && validationResult.user ? (
                  <div className="space-y-1.5 text-[11px] bg-white/70 p-3 rounded-[8px] border border-emerald-100 font-mono">
                    <div>User ID: <strong>{validationResult.user.id}</strong></div>
                    <div>Email: <strong>{validationResult.user.email}</strong></div>
                    <div>Name: <strong>{validationResult.user.fullName}</strong></div>
                    <div>Role: <strong>{validationResult.user.role}</strong></div>
                    <div>Tenant: <strong>{validationResult.user.orgId}</strong></div>
                    <div>Expires: {validationResult.expiresAt}</div>
                  </div>
                ) : (
                  <div className="text-xs text-rose-800">
                    <strong>Error:</strong> {validationResult.error?.message} ({validationResult.error?.code})
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
