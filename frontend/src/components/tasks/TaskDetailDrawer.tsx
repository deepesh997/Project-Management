'use client';

import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../lib/api';
import { Task, TaskStatus, TaskPriority, ActivityLog, OCCConflictError } from '../../types';

interface TaskDetailDrawerProps {
  task: Task | null;
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
  onConflict?: (conflict: OCCConflictError) => void;
  showToast?: (msg: string) => void;
}

const statusBadges: Record<TaskStatus, { label: string; class: string; dot: string }> = {
  TODO: { label: 'To Do', class: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  IN_PROGRESS: { label: 'In Progress', class: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  IN_REVIEW: { label: 'In Review', class: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  DONE: { label: 'Completed', class: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  BLOCKED: { label: 'Blocked', class: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

const actionBadges: Record<string, { label: string; class: string }> = {
  CREATED: { label: 'Initial Submission', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  UPDATED: { label: 'Task Revision', class: 'bg-blue-50 text-blue-700 border-blue-200' },
  WORK_SUBMITTED: { label: 'Work Log Submitted', class: 'bg-purple-50 text-purple-700 border-purple-200' },
  OCC_CONFLICT_DETECTED: { label: 'OCC Conflict Intercepted', class: 'bg-rose-50 text-rose-700 border-rose-200' },
  DELETED: { label: 'Archived', class: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export function TaskDetailDrawer({
  task,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  onConflict,
  showToast,
}: TaskDetailDrawerProps) {
  // Edit state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [estimatedHours, setEstimatedHours] = useState<number>(8);
  const [isSaving, setIsSaving] = useState(false);

  // Work log submission state
  const [workNote, setWorkNote] = useState('');
  const [workStatus, setWorkStatus] = useState<TaskStatus>('DONE');
  const [workHours, setWorkHours] = useState<number>(2);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'submissions'>('details');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setEstimatedHours(task.estimatedHours || 8);
      setWorkStatus(task.status === 'DONE' ? 'DONE' : 'IN_PROGRESS');
      loadActivity(task.id);
    }
  }, [task]);

  const loadActivity = async (taskId: string) => {
    setIsLoadingLogs(true);
    const logs = await ApiClient.getTaskActivity(taskId);
    setActivityLogs(logs);
    setIsLoadingLogs(false);
  };

  if (!task) return null;

  // Save changes via OCC update
  const handleSave = async () => {
    setIsSaving(true);
    const res = await ApiClient.updateTaskWithOCC(
      task.id,
      {
        title,
        description,
        status,
        priority,
        estimatedHours: Number(estimatedHours),
      },
      task.version
    );
    setIsSaving(false);

    if (res.conflict) {
      if (onConflict) onConflict(res.conflict);
      onClose();
    } else if (res.task) {
      if (showToast) showToast(`Task updated successfully to Version ${res.task.version}`);
      onTaskUpdated(res.task);
      loadActivity(task.id);
    }
  };

  // Submit Work Log & Progress
  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workNote.trim()) return;

    setIsSubmittingWork(true);
    const res = await ApiClient.submitTaskWorkLog(task.id, {
      note: workNote.trim(),
      status: workStatus,
      hoursSpent: Number(workHours) || 0,
    });
    setIsSubmittingWork(false);

    if (res.success) {
      setWorkNote('');
      if (res.log) {
        setActivityLogs((prev) => [res.log!, ...prev]);
      }
      if (res.task) {
        setStatus(res.task.status);
        onTaskUpdated(res.task);
      }
      if (showToast) showToast('Work submission logged and added to task audit history');
      setActiveTab('submissions');
    }
  };

  // Simulate Concurrency Conflict (409)
  const handleSimulateConflict = async () => {
    const staleVersion = Math.max(0, task.version - 1);
    const res = await ApiClient.updateTaskWithOCC(
      task.id,
      { title: `${title} (Concurrent User Collision)` },
      staleVersion
    );
    if (res.conflict && onConflict) {
      onConflict(res.conflict);
      onClose();
    }
  };

  // Format timestamp nicely
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-black/10 overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-5 border-b border-black/[0.08] flex items-center justify-between bg-[#FBFBFD] select-none">
          <div className="flex items-center space-x-2.5">
            <span className="text-[11px] font-mono font-bold text-[#007AFF] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/70">
              {task.id}
            </span>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-black/[0.05] text-[#1D1D1F] border border-black/[0.08]">
              OCC v{task.version}
            </span>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                statusBadges[task.status]?.class || 'bg-slate-100 text-slate-700'
              }`}
            >
              {statusBadges[task.status]?.label || task.status}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full text-[#8E8E93] hover:text-[#1D1D1F] hover:bg-black/[0.06] flex items-center justify-center transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Apple HIG Segmented Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-black/[0.06] bg-[#FBFBFD]">
          <div className="flex p-0.5 bg-black/[0.06] rounded-[8px] text-xs font-semibold max-w-xs mb-3">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-1 px-3 rounded-[6px] transition-all ${
                activeTab === 'details'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Task Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('submissions')}
              className={`flex-1 py-1 px-3 rounded-[6px] transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'submissions'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <span>Submissions & Logs</span>
              <span className="text-[10px] bg-black/[0.08] px-1.5 py-0.2 rounded-full">
                {activityLogs.length}
              </span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {activeTab === 'details' ? (
            <>
              {/* Title Field */}
              <div>
                <label className="font-semibold text-[#1D1D1F] block mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                />
              </div>

              {/* Status & Priority Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#1D1D1F] block mb-1">
                    Workflow Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none bg-white"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Completed</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#1D1D1F] block mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">P0 Critical</option>
                  </select>
                </div>
              </div>

              {/* Hours & Assignee Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#1D1D1F] block mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#1D1D1F] block mb-1">
                    Actual Hours Logged
                  </label>
                  <div className="px-3 py-2 bg-black/[0.03] border border-black/[0.08] rounded-[8px] text-xs font-mono text-[#1D1D1F]">
                    {task.actualHours || 0} hrs
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-[#1D1D1F] block mb-1">
                  Description & Deliverable Scope
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details of deliverables, test steps, or architecture specifications..."
                  className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                ></textarea>
              </div>

              {/* Work Submission Prompt Banner */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200/80 rounded-[12px] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-semibold text-[#007AFF]">
                    <span>📝</span>
                    <span>Submit Work & Activity Update</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('submissions')}
                    className="text-[11px] text-[#007AFF] hover:underline font-semibold"
                  >
                    View History ({activityLogs.length}) →
                  </button>
                </div>
                <p className="text-[11px] text-[#48484A] leading-relaxed">
                  Log your progress notes, deliverables, and transition this task into review or completed status.
                </p>
              </div>

              {/* Concurrency Collision Simulation */}
              <div className="bg-amber-50/70 p-3.5 rounded-[12px] border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="font-semibold flex items-center space-x-1.5">
                  <span>⚡</span>
                  <span>Optimistic Concurrency Control (OCC) Protection</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Every mutation carries <code>expectedVersion = {task.version}</code>. Click below to verify that stale edits from simultaneous users are caught with HTTP 409 and diff.
                </p>
                <button
                  type="button"
                  onClick={handleSimulateConflict}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-[6px] text-[11px] font-semibold transition-colors mt-1"
                >
                  Simulate Race Collision (409)
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Submit New Work Log Box */}
              <form
                onSubmit={handleSubmitWork}
                className="p-4 bg-[#FBFBFD] border border-black/[0.08] rounded-[14px] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-[#1D1D1F]">
                    Submit Work Progress / Delivery Log
                  </h4>
                  <span className="text-[10px] text-[#86868B] font-mono">
                    Logged to Audit Trail
                  </span>
                </div>

                <textarea
                  rows={2}
                  required
                  placeholder="Describe the deliverable completed, test status, or pull request link..."
                  value={workNote}
                  onChange={(e) => setWorkNote(e.target.value)}
                  className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                ></textarea>

                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold text-[#86868B] block mb-0.5">
                      New Status
                    </label>
                    <select
                      value={workStatus}
                      onChange={(e) => setWorkStatus(e.target.value as TaskStatus)}
                      className="w-full px-2 py-1.5 border border-black/[0.12] rounded-[6px] text-xs bg-white"
                    >
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="DONE">Completed</option>
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] font-semibold text-[#86868B] block mb-0.5">
                      Hours Spent
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      max="100"
                      value={workHours}
                      onChange={(e) => setWorkHours(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-black/[0.12] rounded-[6px] text-xs bg-white"
                    />
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSubmittingWork}
                      className="px-3.5 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[6px] shadow-sm transition-all"
                    >
                      {isSubmittingWork ? 'Submitting...' : 'Submit Log'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Submission & Activity Audit Log Timeline */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-[#1D1D1F] uppercase tracking-wider text-[10px] text-[#86868B]">
                    Task Audit & Submission History ({activityLogs.length})
                  </h4>
                  <button
                    onClick={() => loadActivity(task.id)}
                    className="text-[10px] text-[#007AFF] hover:underline font-semibold"
                  >
                    Refresh
                  </button>
                </div>

                {isLoadingLogs ? (
                  <div className="py-6 text-center text-[#86868B] text-xs">
                    Loading audit trail...
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="p-6 border border-dashed border-black/10 rounded-[12px] text-center text-[#86868B] space-y-1">
                    <p>No activity recorded yet for this task.</p>
                    <p className="text-[10px] text-[#AEAEB2]">
                      Submitting a work update will initialize the audit history.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activityLogs.map((log) => {
                      const badge = actionBadges[log.action] || {
                        label: log.action,
                        class: 'bg-slate-100 text-slate-700 border-slate-200',
                      };

                      return (
                        <div
                          key={log.id}
                          className="p-3 bg-white border border-black/[0.06] rounded-[10px] shadow-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.class}`}
                            >
                              {badge.label}
                            </span>
                            <span className="text-[10px] font-mono text-[#86868B]">
                              {formatDate(log.createdAt)}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#1D1D1F]">
                            {log.payload?.note ? (
                              <p className="font-medium text-[#1D1D1F] bg-black/[0.02] p-2 rounded border border-black/[0.04]">
                                &ldquo;{log.payload.note}&rdquo;
                              </p>
                            ) : log.payload?.title ? (
                              <p className="text-[#48484A]">
                                {log.payload.title}
                              </p>
                            ) : log.payload?.message ? (
                              <p className="text-[#48484A]">
                                {log.payload.message}
                              </p>
                            ) : (
                              <p className="text-[#6E6E73] font-mono text-[10px]">
                                {JSON.stringify(log.payload)}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-[#86868B] pt-1 border-t border-black/[0.04]">
                            <span>
                              By: <strong className="text-[#1D1D1F]">{log.performedBy}</strong>
                            </span>
                            {log.payload?.status && (
                              <span className="font-mono text-[#007AFF]">
                                Status: {log.payload.status}
                              </span>
                            )}
                            {log.payload?.version && (
                              <span className="font-mono text-purple-600">
                                v{log.payload.version}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-black/[0.08] bg-[#FBFBFD] flex items-center justify-between">
          <button
            type="button"
            onClick={() => onTaskDeleted(task.id)}
            className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1.5 rounded-[8px] transition-colors"
          >
            Delete Task
          </button>

          <div className="space-x-2 flex items-center">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-[8px] transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-4 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
            >
              {isSaving ? 'Saving...' : `Save Changes (v${task.version})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
