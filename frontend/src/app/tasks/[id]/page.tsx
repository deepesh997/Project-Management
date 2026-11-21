'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Topbar } from '../../../components/layout/Topbar';
import { ConflictResolutionModal } from '../../../components/tasks/ConflictResolutionModal';
import { ApiClient } from '../../../lib/api';
import { Task, Project, TaskStatus, TaskPriority, ActivityLog, OCCConflictError, Subtask, Comment } from '../../../types';

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
  URGENT: { label: 'P0 Critical', class: 'bg-red-100 text-red-800 border-red-300 font-bold' },
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

  // Segmented Tab State to reduce screen repetition (PRD UI Requirement)
  const [activeTab, setActiveTab] = useState<'overview' | 'subtasks' | 'discussion' | 'worklog' | 'audit'>('overview');

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

  // Subtasks state
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  useEffect(() => {
    if (taskId) {
      loadTaskAndActivity(taskId);
    }
  }, [taskId]);

  const loadTaskAndActivity = async (id: string) => {
    setIsLoading(true);
    const [fetchedTask, logs, projects, fetchedSubtasks, fetchedComments] = await Promise.all([
      ApiClient.getTaskById(id),
      ApiClient.getTaskActivity(id),
      ApiClient.getProjects(),
      ApiClient.getSubtasks(id),
      ApiClient.getComments(id),
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
    setSubtasks(fetchedSubtasks);
    setComments(fetchedComments);
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
      showToast(`Saved as Version ${res.task.version}`);
      const updatedLogs = await ApiClient.getTaskActivity(task.id);
      setActivityLogs(updatedLogs);
    }
  };

  // Subtask handlers
  const handleToggleSubtask = async (subtaskId: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s))
    );
    await ApiClient.toggleSubtask(taskId, subtaskId);
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setIsAddingSubtask(true);
    const res = await ApiClient.createSubtask(taskId, newSubtaskTitle.trim());
    setIsAddingSubtask(false);
    if (res.success && res.subtask) {
      setSubtasks((prev) => [...prev, res.subtask!]);
      setNewSubtaskTitle('');
      showToast('Subtask created');
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    await ApiClient.deleteSubtask(taskId, subtaskId);
    showToast('Subtask deleted');
  };

  // Comment handlers
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentContent.trim()) return;
    setIsPostingComment(true);
    const res = await ApiClient.createComment(taskId, newCommentContent.trim());
    setIsPostingComment(false);
    if (res.success && res.comment) {
      setComments((prev) => [...prev, res.comment!]);
      setNewCommentContent('');
      showToast('Comment posted');
      const updatedLogs = await ApiClient.getTaskActivity(taskId);
      setActivityLogs(updatedLogs);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    await ApiClient.deleteComment(taskId, commentId);
    showToast('Comment deleted');
  };

  // Work log submission
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
      showToast('Work submission logged in audit trail');
    }
  };

  // Simulate OCC conflict
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

        <main className="p-6 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Breadcrumb Navigation & Top Action Controls */}
          <div className="flex items-center justify-between flex-wrap gap-4 pb-1">
            <div className="flex items-center space-x-2.5">
              <Link
                href={returnTo}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-black/[0.08] text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.04] transition-all shadow-xs"
              >
                <span>←</span>
                <span>{returnTo === '/projects' ? 'Projects' : 'Tasks'}</span>
              </Link>
              <span className="text-[#86868B] text-xs">/</span>
              <span className="text-xs font-mono font-semibold text-[#1D1D1F]">{taskId}</span>
              {project && (
                <>
                  <span className="text-[#86868B] text-xs">•</span>
                  <span className="text-xs text-[#6E6E73]">{project.name}</span>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSimulateConflict}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-[8px] text-xs font-semibold transition-colors active:scale-[0.98] shadow-xs flex items-center space-x-1"
                title="Test Optimistic Concurrency Control"
              >
                <span>⚡</span>
                <span>Test Race (409)</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteTask}
                className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-[8px] transition-colors font-medium border border-transparent hover:border-rose-200"
              >
                Delete
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
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[10px] text-xs text-emerald-900 flex justify-between items-center shadow-xs animate-in fade-in">
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
              <p className="text-xs">Loading task details...</p>
            </div>
          ) : !task ? (
            <div className="bg-white rounded-2xl p-12 border border-black/[0.08] text-center space-y-3">
              <h3 className="text-base font-semibold text-[#1D1D1F]">Task Not Found</h3>
              <p className="text-xs text-[#6E6E73]">Task {taskId} does not exist in current workspace.</p>
              <Link href={returnTo} className="inline-block px-4 py-2 bg-[#007AFF] text-white rounded-[8px] text-xs font-semibold">
                Return to Tasks
              </Link>
            </div>
          ) : (
            <>
              {/* Task Title & Status Banner */}
              <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2.5">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-xs font-mono font-bold text-[#007AFF] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {task.id}
                    </span>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      OCC v{task.version}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusBadges[task.status]?.class}`}>
                      {statusBadges[task.status]?.label || task.status}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-[6px] border ${priorityBadges[task.priority]?.class}`}>
                      {priorityBadges[task.priority]?.label || task.priority}
                    </span>
                  </div>

                  <div className="text-xs text-[#86868B]">
                    Created by <strong>{task.creatorId || 'usr-pm-1'}</strong> • {formatDate(task.createdAt)}
                  </div>
                </div>

                {/* Editable Task Title Input */}
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task Title"
                  className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tracking-tight w-full bg-transparent border-b border-black/[0.08] focus:border-[#007AFF] pb-1 outline-none transition-colors"
                />

                {/* Sleek Segmented Tab Switcher (Reduces clutter & repetition) */}
                <div className="flex bg-[#F5F5F7] p-1 rounded-[10px] border border-black/[0.06] text-xs font-medium max-w-2xl">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 py-1.5 rounded-[7px] transition-all flex items-center justify-center space-x-1.5 ${
                      activeTab === 'overview'
                        ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                        : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <span>📋</span>
                    <span>Overview &amp; Subtasks ({subtasks.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('discussion')}
                    className={`flex-1 py-1.5 rounded-[7px] transition-all flex items-center justify-center space-x-1.5 ${
                      activeTab === 'discussion'
                        ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                        : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <span>💬</span>
                    <span>Discussion ({comments.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('worklog')}
                    className={`flex-1 py-1.5 rounded-[7px] transition-all flex items-center justify-center space-x-1.5 ${
                      activeTab === 'worklog'
                        ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                        : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <span>📝</span>
                    <span>Submit Work</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className={`flex-1 py-1.5 rounded-[7px] transition-all flex items-center justify-center space-x-1.5 ${
                      activeTab === 'audit'
                        ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                        : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <span>⏱</span>
                    <span>Audit ({activityLogs.length})</span>
                  </button>
                </div>
              </div>

              {/* ================= TAB 1: OVERVIEW & SUBTASKS ================= */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Task Scope & Attributes Card */}
                  <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-4">
                    <h3 className="font-semibold text-sm text-[#1D1D1F] border-b border-black/[0.06] pb-3">
                      Task Scope &amp; Attributes
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="font-semibold text-xs text-[#1D1D1F] block mb-1.5">Workflow Status</label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as TaskStatus)}
                          className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs bg-white font-medium outline-none"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="IN_REVIEW">In Review</option>
                          <option value="DONE">Completed</option>
                          <option value="BLOCKED">Blocked</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-xs text-[#1D1D1F] block mb-1.5">Priority Level</label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as TaskPriority)}
                          className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs bg-white font-medium outline-none"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">P0 Critical</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-xs text-[#1D1D1F] block mb-1.5">Hours (Logged / Est)</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={estimatedHours}
                            onChange={(e) => setEstimatedHours(Number(e.target.value))}
                            className="w-1/2 px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs font-medium outline-none"
                            title="Estimated Hours"
                          />
                          <span className="text-xs text-[#86868B] font-mono">{task.actualHours || 0}h logged</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-xs text-[#1D1D1F] block mb-1.5">Description &amp; Acceptance Criteria</label>
                      <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detail technical requirements, API contracts, or testing criteria..."
                        className="w-full px-3.5 py-2.5 border border-black/[0.12] rounded-[8px] text-xs outline-none leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Subtasks Checklist Card */}
                  <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                      <div>
                        <h3 className="font-semibold text-sm text-[#1D1D1F] flex items-center space-x-1.5">
                          <span>☑️</span>
                          <span>Subtasks &amp; Deliverables</span>
                        </h3>
                        <p className="text-[11px] text-[#6E6E73] mt-0.5">
                          Actionable team milestones for this task
                        </p>
                      </div>
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-[#007AFF] border border-blue-200 font-semibold">
                        {subtasks.filter((s) => s.isCompleted).length} of {subtasks.length} done
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {subtasks.length > 0 && (
                      <div className="w-full bg-black/[0.04] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#007AFF] h-full transition-all duration-300 rounded-full"
                          style={{
                            width: `${Math.round(
                              (subtasks.filter((s) => s.isCompleted).length / (subtasks.length || 1)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    )}

                    {/* Subtasks List */}
                    <div className="space-y-2">
                      {subtasks.length === 0 ? (
                        <p className="text-xs text-[#86868B] py-2 text-center">No subtasks added yet.</p>
                      ) : (
                        subtasks.map((sub) => (
                          <div
                            key={sub.id}
                            className={`flex items-center justify-between p-2.5 rounded-[10px] border transition-all ${
                              sub.isCompleted
                                ? 'bg-black/[0.02] border-black/[0.04] text-[#86868B]'
                                : 'bg-[#FBFBFD] border-black/[0.06] text-[#1D1D1F] hover:border-black/[0.12]'
                            }`}
                          >
                            <label className="flex items-center space-x-3 cursor-pointer flex-1 select-none">
                              <input
                                type="checkbox"
                                checked={sub.isCompleted}
                                onChange={() => handleToggleSubtask(sub.id)}
                                className="w-4 h-4 rounded text-[#007AFF] border-black/[0.2] focus:ring-[#007AFF]/25 cursor-pointer"
                              />
                              <span className={`text-xs font-medium leading-relaxed ${sub.isCompleted ? 'line-through text-[#86868B]' : 'text-[#1D1D1F]'}`}>
                                {sub.title}
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubtask(sub.id)}
                              className="text-xs text-[#86868B] hover:text-rose-600 p-1 transition-colors"
                              title="Delete subtask"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Subtask Form */}
                    <form onSubmit={handleAddSubtask} className="flex items-center space-x-2 pt-2">
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="Add a new subtask..."
                        className="flex-1 px-3 py-1.5 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isAddingSubtask || !newSubtaskTitle.trim()}
                        className="px-3 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] disabled:opacity-50 text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
                      >
                        {isAddingSubtask ? 'Adding...' : '+ Add'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* ================= TAB 2: TEAM DISCUSSION ================= */}
              {activeTab === 'discussion' && (
                <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                    <div>
                      <h3 className="font-semibold text-sm text-[#1D1D1F] flex items-center space-x-1.5">
                        <span>💬</span>
                        <span>Team Discussion &amp; Code Review</span>
                      </h3>
                      <p className="text-[11px] text-[#6E6E73] mt-0.5">
                        Real-time commentary with audit logging
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                      {comments.length} comments
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <p className="text-xs text-[#86868B] py-6 text-center">No discussion yet. Start the conversation below.</p>
                    ) : (
                      comments.map((c) => {
                        const initials = (c.authorName || 'TM')
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase();

                        return (
                          <div key={c.id} className="p-3.5 bg-[#FBFBFD] border border-black/[0.06] rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full bg-[#007AFF] text-white flex items-center justify-center font-bold text-[10px]">
                                  {initials}
                                </div>
                                <span className="font-semibold text-xs text-[#1D1D1F]">{c.authorName}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-[10px] text-[#86868B]">
                                <span>{formatDate(c.createdAt)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="hover:text-rose-600 transition-colors"
                                  title="Delete comment"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-[#2C2C2E] leading-relaxed pl-8">
                              {c.content}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={handlePostComment} className="space-y-2 pt-2 border-t border-black/[0.04]">
                    <textarea
                      rows={3}
                      value={newCommentContent}
                      onChange={(e) => setNewCommentContent(e.target.value)}
                      placeholder="Add feedback, update notes, or architectural decisions..."
                      className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 outline-none leading-relaxed"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isPostingComment || !newCommentContent.trim()}
                        className="px-4 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] disabled:opacity-50 text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
                      >
                        {isPostingComment ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ================= TAB 3: WORK DELIVERY ================= */}
              {activeTab === 'worklog' && (
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
                    <span className="text-[10px] font-mono text-[#007AFF] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                      Live Audit Log
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-xs text-[#1D1D1F] block mb-1.5">
                      Work Summary / Delivery Notes *
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="e.g. Implemented unit tests with 100% pass rate, deployed migration to Supabase, ready for review..."
                      value={workNote}
                      onChange={(e) => setWorkNote(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 outline-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-xs text-[#1D1D1F] block mb-1.5">Update Workflow Status</label>
                      <select
                        value={workStatus}
                        onChange={(e) => setWorkStatus(e.target.value as TaskStatus)}
                        className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs bg-white font-medium outline-none"
                      >
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="DONE">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-xs text-[#1D1D1F] block mb-1.5">Hours Spent on this Submission</label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        max="100"
                        value={workHours}
                        onChange={(e) => setWorkHours(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs font-medium outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingWork}
                      className="px-4 py-2 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
                    >
                      {isSubmittingWork ? 'Submitting...' : 'Submit Work Update →'}
                    </button>
                  </div>
                </form>
              )}

              {/* ================= TAB 4: AUDIT TRAIL ================= */}
              {activeTab === 'audit' && (
                <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-apple-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                    <div>
                      <h3 className="font-semibold text-sm text-[#1D1D1F] flex items-center space-x-1.5">
                        <span>⏱</span>
                        <span>Immutable Audit Trail &amp; Concurrency History</span>
                      </h3>
                      <p className="text-[11px] text-[#6E6E73] mt-0.5">
                        Chronological record of updates, submissions, and OCC events
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/[0.06] text-[#1D1D1F] font-semibold">
                      {activityLogs.length} events
                    </span>
                  </div>

                  {activityLogs.length === 0 ? (
                    <div className="p-8 border border-dashed border-black/10 rounded-xl text-center text-[#86868B] space-y-1">
                      <p className="text-xs font-medium">No activity logged yet.</p>
                      <p className="text-[11px] text-[#AEAEB2]">Submitting work or editing the task will record events here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {activityLogs.map((log) => {
                        const badge = actionBadges[log.action] || {
                          label: log.action,
                          class: 'bg-slate-100 text-slate-700 border-slate-200',
                          icon: '📌',
                        };

                        return (
                          <div
                            key={log.id}
                            className="p-3.5 bg-[#FBFBFD] border border-black/[0.06] rounded-xl shadow-xs space-y-2 hover:border-black/[0.12] transition-colors"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${badge.class}`}>
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
                                <p className="text-[11px] text-[#48484A]">{log.payload.title}</p>
                              ) : (
                                <p className="text-[#6E6E73] font-mono text-[10px]">{JSON.stringify(log.payload)}</p>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-[#86868B] pt-1.5 border-t border-black/[0.04]">
                              <span>By: <strong className="text-[#1D1D1F]">{log.performedBy}</strong></span>
                              {log.payload?.version && (
                                <span className="font-mono text-purple-600 font-semibold">
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
              )}
            </>
          )}

          {/* OCC Conflict Resolution Modal */}
          <ConflictResolutionModal
            conflict={conflict}
            onClose={() => setConflict(null)}
            onReloadLatest={() => {
              setConflict(null);
              if (taskId) loadTaskAndActivity(taskId);
              showToast('Authoritative server state reloaded.');
            }}
          />
        </main>
      </div>
    </div>
  );
}
