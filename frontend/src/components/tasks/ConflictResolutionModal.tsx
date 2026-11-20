'use client';

import React from 'react';
import { OCCConflictError } from '../../types';

interface ConflictModalProps {
  conflict: OCCConflictError | null;
  onClose: () => void;
  onReloadLatest: () => void;
  onForceOverwrite?: () => void;
}

export function ConflictResolutionModal({ conflict, onClose, onReloadLatest, onForceOverwrite }: ConflictModalProps) {
  if (!conflict) return null;

  const attempted = conflict.diff.attemptedUpdates;
  const server = conflict.diff.serverState;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start space-x-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold shrink-0 text-lg">
            !
          </div>
          <div>
            <h3 className="text-lg font-bold text-rose-900">Concurrent Edit Conflict Detected</h3>
            <p className="text-sm text-rose-700 mt-1">
              Another team member has committed changes to this task (Version{' '}
              <span className="font-mono font-semibold">{conflict.currentVersion}</span>) while you were working on Version{' '}
              <span className="font-mono font-semibold">{conflict.attemptedVersion}</span>. Silent overwrites are blocked.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Field-by-Field Collision Comparison
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* User Attempted Version */}
            <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-200">
              <div className="text-xs font-bold text-amber-800 uppercase mb-2 flex items-center justify-between">
                <span>Your Changes (v{conflict.attemptedVersion})</span>
                <span className="bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">Stale</span>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Title:</span>
                  <span className="font-medium text-slate-800">{attempted.title || '(No change)'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Status:</span>
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                    {attempted.status || '(No change)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Server Authoritative Version */}
            <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200">
              <div className="text-xs font-bold text-emerald-800 uppercase mb-2 flex items-center justify-between">
                <span>Server Current (v{conflict.currentVersion})</span>
                <span className="bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">Live State</span>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Title:</span>
                  <span className="font-medium text-slate-800">{server.title || '(Unmodified)'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Status:</span>
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                    {server.status || '(Unmodified)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200">
            <strong>Audit Guarantee:</strong> This conflict event was registered in the tenant activity timeline (`OCC_CONFLICT_DETECTED`). No notification spam was dispatched.
          </div>
        </div>

        <div className="bg-slate-100 px-6 py-4 flex items-center justify-end space-x-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onReloadLatest}
            className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            Reload Latest Server State (v{conflict.currentVersion})
          </button>
        </div>
      </div>
    </div>
  );
}
