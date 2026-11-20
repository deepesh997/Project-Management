'use client';

import React, { useEffect } from 'react';
import { OCCConflictError } from '../../types';

interface ConflictModalProps {
  conflict: OCCConflictError | null;
  onClose: () => void;
  onReloadLatest: () => void;
}

export function ConflictResolutionModal({ conflict, onClose, onReloadLatest }: ConflictModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!conflict) return null;

  const attempted = conflict.diff.attemptedUpdates;
  const server = conflict.diff.serverState;

  return (
    <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-apple-sheet max-w-2xl w-full border border-black/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Sheet Header */}
        <div className="px-6 py-5 border-b border-black/[0.08] bg-[#FBFBFD] flex items-start space-x-3.5">
          <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-bold shrink-0 text-base">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#1D1D1F] tracking-tight">
              Concurrent Edit Conflict Detected (OCC)
            </h3>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              Another collaborator committed changes to this record (Authoritative Version{' '}
              <span className="font-mono font-semibold text-[#1D1D1F]">v{conflict.currentVersion}</span>) while you were editing stale Version{' '}
              <span className="font-mono font-semibold text-[#1D1D1F]">v{conflict.attemptedVersion}</span>. WorkSphere blocked a silent data overwrite.
            </p>
          </div>
        </div>

        {/* Content Layer: Field Comparison */}
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
              Field-by-Field Collision Diagnostics
            </span>
            <span className="text-[10px] font-mono bg-black/[0.04] text-[#6E6E73] px-2 py-0.5 rounded-[5px] border border-black/[0.06]">
              HTTP 409 Conflict
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Local Attempted State */}
            <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-900">
                  Your Changes (v{conflict.attemptedVersion})
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-800 text-[10px] font-mono font-medium border border-amber-200">
                  Stale
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[11px] text-[#6E6E73] block mb-0.5 font-medium">Title:</span>
                  <span className="font-medium text-[#1D1D1F] block p-1.5 bg-white/80 rounded border border-amber-100">
                    {attempted.title || '(No change)'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#6E6E73] block mb-0.5 font-medium">Status:</span>
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-200">
                    {attempted.status || '(No change)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Server Authoritative State */}
            <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-900">
                  Server Authoritative (v{conflict.currentVersion})
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-800 text-[10px] font-mono font-medium border border-emerald-200">
                  Live
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[11px] text-[#6E6E73] block mb-0.5 font-medium">Title:</span>
                  <span className="font-medium text-[#1D1D1F] block p-1.5 bg-white/80 rounded border border-emerald-100">
                    {server.title || '(Unmodified)'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#6E6E73] block mb-0.5 font-medium">Status:</span>
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-900 border border-emerald-200">
                    {server.status || '(Unmodified)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Trail Note */}
          <div className="p-3 bg-[#F5F5F7] rounded-xl border border-black/[0.06] flex items-start space-x-2.5 text-xs text-[#6E6E73]">
            <svg className="w-4 h-4 text-[#007AFF] mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <strong className="text-[#1D1D1F]">Audit Guarantee:</strong> This conflict event was registered immutably in the tenant activity timeline (<code className="font-mono text-[#007AFF]">OCC_CONFLICT_DETECTED</code>).
            </div>
          </div>
        </div>

        {/* Sheet Footer Toolbar */}
        <div className="bg-[#FBFBFD] px-6 py-3.5 flex items-center justify-between border-t border-black/[0.08]">
          <span className="text-[11px] text-[#86868B]">Press Esc to dismiss</span>
          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-[#1D1D1F] hover:bg-black/[0.05] rounded-[8px] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onReloadLatest}
              className="px-4 py-1.5 text-xs font-semibold bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white rounded-[8px] shadow-sm transition-all"
            >
              Reload Latest Server State (v{conflict.currentVersion})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
