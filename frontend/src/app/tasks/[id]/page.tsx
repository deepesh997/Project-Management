'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Topbar } from '../../../components/layout/Topbar';
import { ConflictResolutionModal } from '../../../components/tasks/ConflictResolutionModal';
import { ApiClient } from '../../../lib/api';
import { Task, Project, TaskStatus, TaskPriority, ActivityLog, OCCConflictError } from '../../../types';

const statusBadges: Record<TaskStatus, { label: string; class: string; dot: string }> = {
  TODO: { label: 'To Do', class: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  IN_PROGRESS: { label: 'In Progress', class: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  IN_REVIEW: { label: 'In Review', class: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  DONE: { label: 'Completed', class: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  BLOCKED: { label: 'Blocked', class: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

const priorityBadges: Record<TaskPriority, { label: string; class: string }> = {
  LOW: { label: 'Low Priority', class: 'bg-blue-50 text-blue-700 border-blue-200' },
  MEDIUM: { label: 'Medium Priority', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  HIGH: { label: 'High Priority', class: 'bg-rose-50 text-rose-700 border-rose-200' },
  URGENT: { label: 'P0 Critical Priority', class: 'bg-red-100 text-red-800 border-red-300 font-bold' },
};

const actionBadges: Record<string, { label: string; class: string; icon: string }> = {
  CREATED: { label: 'Initial Submission', class: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '✨' },
  UPDATED: { label: 'Task Revision', class: 'bg-blue-50 text-blue-700 border-blue-200', icon: '✏️' },
  WORK_SUBMITTED: { label: 'Work Log Submitted', class: 'bg-purple-50 text-purple-700 border-purple-200', icon: '📝' },
  OCC_CONFLICT_DETECTED: { label: 'OCC Conflict Intercepted', class: 'bg-rose-50 text-rose-700 border-rose-200', icon: '⚡' },
  DELETED: { label: 'Archived', class: 'bg-slate-100 text-slate-700 border-slate-200', icon: '🗑️' },
};

export default function TaskDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const taskId = params?.id as string;
  const returnTo = searchParams.get('returnTo') || '/tasks';

  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [conflict, setConflict] = useState<OCCConflictError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Editable task form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [estimatedHours, setEstimatedHours] = useState<number>(8);

  // Work log submission state
  const [workNote, setWorkNote] = useState('');
  const [workStatus, setWorkStatus] = useState<TaskStatus>('DONE');
  const [workHours, setWorkHours] = useState<number>(2);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  useEffect(() => {
    if (taskId) {
      loadTaskAndActivity(taskId);
    }
  }, [taskId]);

  const loadTaskAndActivity = async (id: string) => {
    setIsLoading(true);
    const [fetchedTask, logs, projects] = await Promise.all([
      ApiClient.getTaskById(id),
      ApiClient.getTaskActivity(id),
      ApiClient.getProjects(),
    ]);

    if (fetchedTask) {
      setTask(fetchedTask);
      setTitle(fetchedTask.title);
      setDescription(fetchedTask.description || '');
      setStatus(fetchedTask.status);
      setPriority(fetchedTask.priority);
      setEstimatedHours(fetchedTask.estimatedHours || 8);
      setWorkStatus(fetchedTask.status === 'DONE' ? 'DONE' : 'IN_PROGRESS');

      const matchedProj = projects.find((p) => p.id === fetchedTask.projectId);
      if (matchedProj) setProject(matchedProj);
    }

    setActivityLogs(logs);
    setIsLoading(false);
  };

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification((prev) => (prev === message ? null : prev));
    }, 4500);
  };

  // Save changes with OCC expectedVersion
  const handleSaveChanges = async () => {
    if (!task) return;
    setIsSaving(true);
    const res = await ApiClient.updateTaskWithOCC(
      task.id,
      {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        estimatedHours: Number(estimatedHours),
      },
      task.version
    );
    setIsSaving(false);

    if (res.conflict) {
      setConflict(res.conflict);
    } else if (res.task) {
      setTask(res.task);
      showToast(`Task saved successfully as Version ${res.task.version}`);
      // Refresh audit logs
      const updatedLogs = await ApiClient.getTaskActivity(task.id);
      setActivityLogs(updatedLogs);
    }
  };

  // Submit Work Log & Progress
  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !workNote.trim()) return;

    setIsSubmittingWork(true);
    const res = await ApiClient.submitTaskWorkLog(task.id, {
      note: workNote.trim(),
      status: workStatus,
      hoursSpent: Number(workHours) || 0,
    });
    setIsSubmittingWork(false);

    if (res.success) {
      setWorkNote('');
      if (res.task) {
        setTask(res.task);
        setStatus(res.task.status);
      }
      if (res.log) {
        setActivityLogs((prev) => [res.log!, ...prev]);
      }
      showToast('Work submission logged and added to task audit history');
    }
  };

  // Simulate OCC race condition (409)
  const handleSimulateConflict = async () => {
    if (!task) return;
    const staleVersion = Math.max(0, task.version - 1);
    const res = await ApiClient.updateTaskWithOCC(
      task.id,
      { title: `${title} (Concurrent Collision Test)` },
      staleVersion
    );
    if (res.conflict) {
      setConflict(res.conflict);
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    if (!confirm(`Are you sure you want to delete task "${task.title}"?`)) return;

    const ok = await ApiClient.deleteTask(task.id);
    if (ok) {
      router.push(returnTo);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F7]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />

        <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Top Breadcrumb & Action Row */}
          <div className="flex items-center justify-between flex-wrap gap-4 pb-1">
            <div className="flex items-center space-x-3">
              <Link
                href={returnTo}
                className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-[8px] bg-white border border-black/[0.08] text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.04] transition-all shadow-xs"
              >
                <span>←</span>
                <span>Back to {returnTo === '/projects' ? 'Projects' : 'Tasks Board'}</span>
              </Link>
              <span className="text-[#86868B] text-xs">/</span>
              <span className="text-xs font-medium text-[#86868B]">Workspace</span>
              <span className="text-[#86868B] text-xs">/</span>
              <span className="text-xs font-semibold text-[#1D1D1F] font-mono">{taskId}</span>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={handleSimulateConflict}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-[8px] text-xs font-semibold transition-colors active:scale-[0.98] shadow-xs flex items-center space-x-1.5"
                title="Test Concurrency Protection: Trigger a 409 Conflict"
              >
                <span>⚡</span>
                <span>Simulate Race (409)</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteTask}
                className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-[8px] transition-colors font-medium border border-transparent hover:border-rose-200"
              >
                Delete Task
              </button>

              <button
                type="button"
                disabled={isSaving || !task}
                onClick={handleSaveChanges}
                className="px-4 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all flex items-center space-x-1.5"
              >
                <span>{isSaving ? 'Saving...' : `Save Changes (v${task?.version || 1})`}</span>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {notification && (
            <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-[10px] text-xs text-emerald-900 flex justify-between items-center shadow-xs animate-in fade-in">
              <div className="flex items-center space-x-2">
                <span>✓</span>
                <span className="font-medium">{notification}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="bg-white rounded-2xl p-12 border border-black/[0.08] text-center text-[#86868B] space-y-2">
              <div className="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs">Loading task details and audit trail...</p>
            </div>
          ) : !task ? (
            <div className="bg-white rounded-2xl p-12 border border-black/[0.08] text-center space-y-3">
              <h3 className="text-base font-semibold text-[#1D1D1F]">Task Not Found</h3>
              <p className="text-xs text-[#6E6E73]">
                Task {taskId} does not exist or has been deleted from this organization.
              </p>
              <Link
                href={returnTo}
                className="inline-block px-4 py-2 bg-[#007AFF] text-white rounded-[8px] text-xs font-semibold"
              >
                Return to Tasks
              </Link>
            </div>
          ) : (
            <>
              {/* Task Hero Header Banner */}
              <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-4">
                {/* Meta Badges Row */}
                <div className="flex items-center justify-between flex-wrap gap-2.5">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                    <span className="text-xs font-mono font-bold text-[#007AFF] bg-blue-50 px-2.5 py-1 rounded border border-blue-200/70">
                      {task.id}
                    </span>
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200/80">
                      OCC Version {task.version}
                    </span>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                        statusBadges[task.status]?.class || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {statusBadges[task.status]?.label || task.status}
                    </span>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-[6px] border ${
                        priorityBadges[task.priority]?.class || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {priorityBadges[task.priority]?.label || task.priority}
                    </span>
                    {project && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded bg-black/[0.04] text-[#1D1D1F] border border-black/[0.08]">
                        Project: {project.name}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-[#86868B] font-mono">
                    Tenant: <strong className="text-[#007AFF]">{task.orgId}</strong>
                  </div>
                </div>

                {/* Main Editable Title */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[#86868B]">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-2xl font-bold text-[#1D1D1F] tracking-tight w-full bg-transparent border-b border-black/[0.08] focus:border-[#007AFF] pb-1 outline-none transition-colors"
                  />
                </div>

                {/* Meta Subtitle Details */}
                <div className="flex items-center space-x-4 text-xs text-[#6E6E73] pt-1 border-t border-black/[0.04] flex-wrap gap-y-1">
                  <span>Created: <strong className="text-[#1D1D1F]">{formatDate(task.createdAt)}</strong></span>
                  <span>•</span>
                  <span>Last Modified: <strong className="text-[#1D1D1F]">{formatDate(task.updatedAt)}</strong></span>
                  <span>•</span>
                  <span>Author / Creator: <strong className="text-[#1D1D1F]">{task.creatorId || 'usr-pm-1'}</strong></span>
                </div>
              </div>

              {/* Two-Column Full-Screen Content Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (Details & Work Submission) - 7 cols */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Task Configuration Card */}
                  <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-5">
                    <h3 className="font-semibold text-sm text-[#1D1D1F] border-b border-black/[0.06] pb-3">
                      Task Scope & Attributes
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-semibold text-xs text-[#1D1D1F] block mb-1.5">
                          Workflow Status
                        </label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as TaskStatus)}
                          className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none bg-white font-medium"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="IN_REVIEW">In Review</option>
                          <option value="DONE">Completed</option>
                          <option value="BLOCKED">Blocked</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-xs text-[#1D1D1F] block mb-1.5">
                          Priority Level
                        </label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as TaskPriority)}
                          className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none bg-white font-medium"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">P0 Critical</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-semibold text-xs text-[#1D1D1F] block mb-1.5">
                          Estimated Hours
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={estimatedHours}
                          onChange={(e) => setEstimatedHours(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none font-medium"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-xs text-[#1D1D1F] block mb-1.5">
                          Actual Hours Logged
                        </label>
                        <div className="px-3 py-2 bg-black/[0.03] border border-black/[0.08] rounded-[8px] text-xs font-mono font-semibold text-[#1D1D1F] flex items-center justify-between">
                          <span>{task.actualHours || 0} hrs</span>
                          <span className="text-[11px] text-[#86868B]">
                            {Math.round(((task.actualHours || 0) / (task.estimatedHours || 1)) * 100)}% of est
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-xs text-[#1D1D1F] block mb-1.5">
                        Description & Acceptance Criteria
                      </label>
                      <textarea
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detail the technical specifications, acceptance criteria, or architectural requirements..."
                        className="w-full px-3.5 py-2.5 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none leading-relaxed"
                      ></textarea>
                    </div>
                  </div>

                  {/* Work Submission & Delivery Form Card */}
                  <form
                    onSubmit={handleSubmitWork}
                    className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                      <div>
                        <h3 className="font-semibold text-sm text-[#1D1D1F] flex items-center space-x-1.5">
                          <span>📝</span>
                          <span>Submit Work Progress / Delivery Log</span>
                        </h3>
                        <p className="text-[11px] text-[#6E6E73] mt-0.5">
                          Appends an immutable audit entry and updates task execution status
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-[#007AFF] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 font-semibold">
                        Live Audit Trail
                      </span>
                    </div>

                    <div>
                      <label className="font-semibold text-xs text-[#1D1D1F] block mb-1.5">
                        Work Summary / Delivery Notes *
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="e.g. Completed unit tests with 100% pass rate, deployed migration to Supabase, ready for review..."
                        value={workNote}
                        onChange={(e) => setWorkNote(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none leading-relaxed"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-semibold text-xs text-[#1D1D1F] block mb-1.5">
                          Update Workflow Status
                        </label>
                        <select
                          value={workStatus}
                          onChange={(e) => setWorkStatus(e.target.value as TaskStatus)}
                          className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs bg-white font-medium"
                        >
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="IN_REVIEW">In Review</option>
                          <option value="DONE">Completed</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-xs text-[#1D1D1F] block mb-1.5">
                          Hours Spent on this Submission
                        </label>
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          max="100"
                          value={workHours}
                          onChange={(e) => setWorkHours(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingWork}
                        className="px-4 py-2 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all flex items-center space-x-1.5"
                      >
                        <span>{isSubmittingWork ? 'Submitting Work...' : 'Submit Work Update →'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Column (Activity History & Submission Timeline) - 5 cols */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Submission & Activity Audit Log Timeline Card */}
                  <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                      <div>
                        <h3 className="font-semibold text-sm text-[#1D1D1F] flex items-center space-x-1.5">
                          <span>⏱</span>
                          <span>Submission & Activity Audit Log</span>
                        </h3>
                        <p className="text-[11px] text-[#6E6E73] mt-0.5">
                          Immutable event log for task revisions & submissions
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/[0.06] text-[#1D1D1F] font-semibold">
                        {activityLogs.length} events
                      </span>
                    </div>

                    {activityLogs.length === 0 ? (
                      <div className="p-8 border border-dashed border-black/10 rounded-[12px] text-center text-[#86868B] space-y-1">
                        <p className="text-xs font-medium">No activity logged yet.</p>
                        <p className="text-[11px] text-[#AEAEB2]">
                          Submitting work or editing the task will record events here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                        {activityLogs.map((log) => {
                          const badge = actionBadges[log.action] || {
                            label: log.action,
                            class: 'bg-slate-100 text-slate-700 border-slate-200',
                            icon: '📌',
                          };

                          return (
                            <div
                              key={log.id}
                              className="p-3.5 bg-[#FBFBFD] border border-black/[0.06] rounded-[12px] shadow-xs space-y-2 hover:border-black/[0.12] transition-colors"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${badge.class}`}
                                >
                                  <span>{badge.icon}</span>
                                  <span>{badge.label}</span>
                                </span>
                                <span className="text-[10px] font-mono text-[#86868B]">
                                  {formatDate(log.createdAt)}
                                </span>
                              </div>

                              <div className="text-xs text-[#1D1D1F]">
                                {log.payload?.note ? (
                                  <div className="p-2.5 bg-white rounded-[8px] border border-black/[0.06] text-[11px] font-medium text-[#1D1D1F] leading-relaxed">
                                    &ldquo;{log.payload.note}&rdquo;
                                  </div>
                                ) : log.payload?.title ? (
                                  <p className="text-[11px] text-[#48484A]">
                                    {log.payload.title}
                                  </p>
                                ) : log.payload?.message ? (
                                  <p className="text-[11px] text-[#48484A]">
                                    {log.payload.message}
                                  </p>
                                ) : (
                                  <p className="text-[#6E6E73] font-mono text-[10px]">
                                    {JSON.stringify(log.payload)}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-[#86868B] pt-1.5 border-t border-black/[0.04]">
                                <span>
                                  By: <strong className="text-[#1D1D1F]">{log.performedBy}</strong>
                                </span>
                                <div className="flex items-center space-x-2">
                                  {log.payload?.status && (
                                    <span className="font-mono text-[#007AFF] font-medium">
                                      Status: {log.payload.status}
                                    </span>
                                  )}
                                  {log.payload?.version && (
                                    <span className="font-mono text-purple-600 font-semibold">
                                      v{log.payload.version}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Architecture & Multi-Tenant Isolation Info Card */}
                  <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-apple-sm space-y-3 text-xs">
                    <h4 className="font-semibold text-xs text-[#1D1D1F] uppercase tracking-wider text-[10px] text-[#86868B]">
                      Enterprise Tenant & Security Context
                    </h4>
                    <div className="space-y-1.5 text-[#48484A]">
                      <div className="flex justify-between py-1 border-b border-black/[0.04]">
                        <span className="text-[#86868B]">Tenant Isolation</span>
                        <span className="font-mono text-[#007AFF] font-semibold">{task.orgId}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-black/[0.04]">
                        <span className="text-[#86868B]">Database Cluster</span>
                        <span className="text-emerald-700 font-medium">Supabase PostgreSQL 16</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-black/[0.04]">
                        <span className="text-[#86868B]">Concurrency Model</span>
                        <span className="font-mono text-purple-700 font-semibold">Optimistic Concurrency (OCC)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#86868B]">Real-Time Sync</span>
                        <span className="text-blue-700 font-medium">Server-Sent Events (SSE)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* OCC Conflict Resolution Modal */}
          <ConflictResolutionModal
            conflict={conflict}
            onClose={() => setConflict(null)}
            onReloadLatest={() => {
              setConflict(null);
              if (taskId) loadTaskAndActivity(taskId);
              showToast('Authoritative server state reloaded. Silent overwrite prevented.');
            }}
          />
        </main>
      </div>
    </div>
  );
}
