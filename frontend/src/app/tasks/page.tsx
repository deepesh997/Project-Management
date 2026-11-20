'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { ConflictResolutionModal } from '../../components/tasks/ConflictResolutionModal';
import { ApiClient } from '../../lib/api';
import { Task, Project, OCCConflictError, TaskStatus, TaskPriority } from '../../types';

const priorityBadges: Record<string, { label: string; class: string }> = {
  HIGH: { label: 'High', class: 'bg-rose-50 text-rose-700 border-rose-200' },
  MEDIUM: { label: 'Medium', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  LOW: { label: 'Low', class: 'bg-blue-50 text-blue-700 border-blue-200' },
  URGENT: { label: 'P0 Critical', class: 'bg-red-100 text-red-800 border-red-300 font-bold' },
};

const KANBAN_COLUMNS: { id: TaskStatus; label: string; dotColor: string }[] = [
  { id: 'TODO', label: 'To Do', dotColor: 'bg-slate-400' },
  { id: 'IN_PROGRESS', label: 'In Progress', dotColor: 'bg-[#007AFF]' },
  { id: 'DONE', label: 'Completed', dotColor: 'bg-[#34C759]' },
];

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [conflict, setConflict] = useState<OCCConflictError | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  // Create Task Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [newStatus, setNewStatus] = useState<TaskStatus>('TODO');
  const [newPriority, setNewPriority] = useState<TaskPriority>('MEDIUM');
  const [newEstimatedHours, setNewEstimatedHours] = useState(8);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const [taskList, projectList] = await Promise.all([
      ApiClient.getTasks(),
      ApiClient.getProjects(),
    ]);
    setTasks(taskList);
    setProjects(projectList);
    if (projectList.length > 0) {
      setNewProjectId(projectList[0].id);
    }
  };

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification((prev) => (prev === message ? null : prev));
    }, 4500);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colId: TaskStatus) => {
    if (dragOverCol === colId) {
      setDragOverCol(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    // Optimistic UI update
    const previousStatus = task.status;
    const previousVersion = task.version;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    // Call backend API with OCC Version validation
    const res = await ApiClient.updateTaskWithOCC(
      taskId,
      { status: targetStatus },
      previousVersion
    );

    if (res.conflict) {
      // Revert optimistic UI on conflict
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: previousStatus } : t))
      );
      setConflict(res.conflict);
    } else if (res.task) {
      // Confirmed server update with incremented version
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? res.task! : t))
      );
      showToast(`Task moved to ${targetStatus.replace('_', ' ')} • Saved as v${res.task.version}`);
    }
  };

  // --- Navigate to Full-Screen Task Detail View ---
  const handleEditClick = (task: Task) => {
    router.push(`/tasks/${task.id}`);
  };

  const handleReloadLatest = () => {
    setConflict(null);
    loadInitialData();
    showToast('Reloaded authoritative server version. Silent overwrite avoided.');
  };

  // --- Create Task Handlers ---
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    const res = await ApiClient.createTask({
      title: newTitle.trim(),
      description: newDescription.trim(),
      projectId: newProjectId || 'proj-acme-alpha',
      status: newStatus,
      priority: newPriority,
      estimatedHours: Number(newEstimatedHours) || 8,
    });
    setIsCreating(false);

    if (res.success && res.task) {
      setTasks((prev) => [res.task!, ...prev]);
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      showToast(`Task "${res.task.title}" created with OCC Version 1`);
    } else {
      alert(res.error || 'Failed to create task');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F7]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />

        <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight flex items-center space-x-2">
                <span>Tasks & Interactive Kanban Board</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                  Drag & Drop Active
                </span>
              </h2>
              <p className="text-xs text-[#6E6E73]">
                Drag cards across columns • Protected by Optimistic Concurrency Control (OCC) • Versioned in PostgreSQL
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-[6px] text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                SSE Connected
              </span>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all flex items-center space-x-1.5"
              >
                <span>+</span>
                <span>New Task</span>
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

          {/* Interactive Drag & Drop Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {KANBAN_COLUMNS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.id);
              const isOver = dragOverCol === col.id;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={(e) => handleDragLeave(e, col.id)}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`rounded-[16px] p-4 flex flex-col space-y-3 min-h-[540px] transition-all duration-200 ${
                    isOver
                      ? 'bg-blue-50/70 border-2 border-dashed border-[#007AFF] shadow-apple-md ring-2 ring-blue-500/20'
                      : 'bg-[#EBEBED]/70 border border-black/[0.04]'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${col.dotColor}`}></span>
                      <span className="font-semibold text-xs text-[#1D1D1F] uppercase tracking-wider">
                        {col.label}
                      </span>
                    </div>
                    <span className="bg-black/[0.06] text-[#6E6E73] px-2 py-0.5 rounded-full text-[11px] font-semibold">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Task Cards List */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto">
                    {colTasks.map((task) => {
                      const priority = priorityBadges[task.priority] || priorityBadges.MEDIUM;
                      const isBeingDragged = draggedTaskId === task.id;

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => handleEditClick(task)}
                          className={`bg-white p-4 rounded-[12px] border border-black/[0.06] shadow-apple-sm hover:shadow-apple-md hover:border-[#007AFF]/40 cursor-grab active:cursor-grabbing transition-all duration-150 space-y-2.5 ${
                            isBeingDragged ? 'opacity-40 scale-95 border-blue-400' : 'active:scale-[0.99]'
                          }`}
                        >
                          {/* Card Header */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-[10px] text-[#86868B] font-medium">
                              {task.id}
                            </span>
                            <span className="px-1.5 py-0.2 rounded-[4px] bg-[#007AFF]/10 text-[#007AFF] font-mono font-semibold text-[10px] border border-[#007AFF]/20">
                              v{task.version}
                            </span>
                          </div>

                          {/* Title & Desc */}
                          <div>
                            <h4 className="font-semibold text-xs text-[#1D1D1F] line-clamp-2 leading-snug">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-[11px] text-[#6E6E73] mt-1 line-clamp-2 leading-relaxed">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Card Footer */}
                          <div className="pt-1 flex items-center justify-between text-[11px] border-t border-black/[0.04]">
                            <span className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-medium ${priority.class}`}>
                              {priority.label}
                            </span>
                            <span className="text-[#86868B] flex items-center space-x-1">
                              <span>⏱</span>
                              <span>{task.estimatedHours}h est</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {colTasks.length === 0 && (
                      <div className="h-32 rounded-[12px] border border-dashed border-black/10 flex flex-col items-center justify-center text-xs text-[#86868B] space-y-1">
                        <span>Drop tasks here</span>
                        <span className="text-[10px] text-[#AEAEB2]">OCC Version checks will apply</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Create Task Modal Sheet */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-apple-sheet max-w-lg w-full p-6 space-y-5 border border-black/10 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center border-b border-black/[0.08] pb-3">
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-base text-[#1D1D1F]">
                      Create New Workspace Task
                    </h3>
                    <p className="text-[11px] text-[#6E6E73]">
                      New record initialized with Optimistic Concurrency Version 1
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-[#8E8E93] hover:text-[#1D1D1F] w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/[0.05] transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-[#1D1D1F] block mb-1">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Implement Webhook Deduplication"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-[#1D1D1F] block mb-1">
                        Associated Project
                      </label>
                      <select
                        value={newProjectId}
                        onChange={(e) => setNewProjectId(e.target.value)}
                        className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                      >
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-[#1D1D1F] block mb-1">
                        Initial Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
                        className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-[#1D1D1F] block mb-1">
                        Priority Level
                      </label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                        className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">P0 Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-[#1D1D1F] block mb-1">
                        Estimated Hours
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={newEstimatedHours}
                        onChange={(e) => setNewEstimatedHours(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-[#1D1D1F] block mb-1">
                      Description & Scope
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Brief details of acceptance criteria..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                    ></textarea>
                  </div>

                  <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-black/[0.08]">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-3.5 py-1.5 text-xs text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-[8px] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="px-4 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
                    >
                      {isCreating ? 'Creating Task...' : 'Create Task (v1)'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* OCC Conflict Resolution Modal */}
          <ConflictResolutionModal
            conflict={conflict}
            onClose={() => setConflict(null)}
            onReloadLatest={handleReloadLatest}
          />
        </main>
      </div>
    </div>
  );
}
