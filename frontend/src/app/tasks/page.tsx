'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

const statusBadges: Record<TaskStatus, { label: string; class: string; dot: string }> = {
  TODO: { label: 'To Do', class: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  IN_PROGRESS: { label: 'In Progress', class: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-[#007AFF]' },
  IN_REVIEW: { label: 'In Review', class: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  DONE: { label: 'Completed', class: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-[#34C759]' },
  BLOCKED: { label: 'Blocked', class: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
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

  // View mode: Kanban vs List (PRD Feature)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Search & Filters (PRD Feature)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');

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
    if (projectList.length > 0 && !newProjectId) {
      setNewProjectId(projectList[0].id);
    }
  };

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification((prev) => (prev === message ? null : prev));
    }, 4500);
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        searchQuery === '' ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesProject = selectedProject === 'ALL' || t.projectId === selectedProject;
      const matchesPriority = selectedPriority === 'ALL' || t.priority === selectedPriority;

      return matchesSearch && matchesProject && matchesPriority;
    });
  }, [tasks, searchQuery, selectedProject, selectedPriority]);

  // Metrics summary calculated from active dataset
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'DONE').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const blocked = tasks.filter((t) => t.status === 'BLOCKED').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActual = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

    return { total, completed, inProgress, blocked, completionRate, totalEstimated, totalActual };
  }, [tasks]);

  // --- Move Status Directly (Quick Action) ---
  const handleMoveStatus = async (taskId: string, targetStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    const previousStatus = task.status;
    const previousVersion = task.version;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    const res = await ApiClient.updateTaskWithOCC(
      taskId,
      { status: targetStatus },
      previousVersion
    );

    if (res.conflict) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: previousStatus } : t))
      );
      setConflict(res.conflict);
    } else if (res.task) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? res.task! : t))
      );
      showToast(`Task moved to ${targetStatus.replace('_', ' ')} (v${res.task.version})`);
    }
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
    await handleMoveStatus(taskId, targetStatus);
  };

  const handleEditClick = (task: Task) => {
    router.push(`/tasks/${task.id}`);
  };

  // --- Export Data Utility (PRD Section 4 & Assessment 5) ---
  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Project', 'Status', 'Priority', 'EstimatedHours', 'ActualHours', 'OCCVersion', 'CreatedAt'];
    const rows = tasks.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.projectId,
      t.status,
      t.priority,
      t.estimatedHours || 0,
      t.actualHours || 0,
      t.version,
      t.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `worksphere_tasks_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Tasks successfully exported to CSV');
  };

  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(tasks, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `worksphere_tasks_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Tasks successfully exported to JSON');
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

        <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Top Bar: Title & Primary Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tracking-tight">
                Tasks & Workflow Management
              </h2>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                Organize deliverables, track project progress milestones, and collaborate in real-time.
              </p>
            </div>

            <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
              {/* View Mode Toggle Segment */}
              <div className="flex bg-[#EBEBED] p-0.5 rounded-[8px] text-xs font-medium">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1 rounded-[6px] transition-all flex items-center space-x-1.5 ${
                    viewMode === 'kanban'
                      ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  <span>📋</span>
                  <span>Kanban</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-[6px] transition-all flex items-center space-x-1.5 ${
                    viewMode === 'list'
                      ? 'bg-white text-[#1D1D1F] shadow-xs font-semibold'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  <span>☰</span>
                  <span>List View</span>
                </button>
              </div>

              {/* Data Export Button */}
              <div className="relative inline-block text-left group">
                <button
                  type="button"
                  className="px-3 py-1.5 bg-white hover:bg-black/[0.04] border border-black/[0.1] rounded-[8px] text-xs font-medium text-[#1D1D1F] transition-all shadow-xs flex items-center space-x-1.5"
                >
                  <span>📥</span>
                  <span>Export</span>
                </button>
                <div className="absolute right-0 mt-1 w-36 bg-white border border-black/[0.08] rounded-[10px] shadow-apple-sheet py-1 hidden group-hover:block z-20">
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#1D1D1F] hover:bg-black/[0.04] flex items-center space-x-2"
                  >
                    <span>📄</span>
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#1D1D1F] hover:bg-black/[0.04] flex items-center space-x-2"
                  >
                    <span>📦</span>
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              {/* New Task Button */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm shadow-blue-500/20 transition-all flex items-center space-x-1.5"
              >
                <span>+</span>
                <span>New Task</span>
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

          {/* Quick Metrics KPI Strip (PRD Feature) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-black/[0.06] shadow-apple-sm space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">Total Tasks</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl sm:text-2xl font-bold text-[#1D1D1F]">{metrics.total}</span>
                <span className="text-xs text-[#86868B]">records</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-black/[0.06] shadow-apple-sm space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">In Progress</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl sm:text-2xl font-bold text-[#007AFF]">{metrics.inProgress}</span>
                <span className="text-xs text-[#86868B]">active sprint</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-black/[0.06] shadow-apple-sm space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">Completion Rate</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl sm:text-2xl font-bold text-[#34C759]">{metrics.completionRate}%</span>
                <span className="text-xs text-[#86868B]">{metrics.completed} of {metrics.total}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-black/[0.06] shadow-apple-sm space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">Hours Logged</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl sm:text-2xl font-bold text-purple-700">{metrics.totalActual}h</span>
                <span className="text-xs text-[#86868B]">of {metrics.totalEstimated}h est</span>
              </div>
            </div>
          </div>

          {/* Search & Multi-Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-apple-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8E8E93]">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks by title, ID, or keywords..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#F5F5F7] border border-black/[0.06] rounded-[8px] text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/25"
              />
            </div>

            <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end flex-wrap gap-y-2">
              <div className="flex items-center space-x-1.5 text-xs text-[#6E6E73]">
                <span>Project:</span>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#F5F5F7] border border-black/[0.06] rounded-[8px] text-xs font-medium text-[#1D1D1F] outline-none"
                >
                  <option value="ALL">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1.5 text-xs text-[#6E6E73]">
                <span>Priority:</span>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#F5F5F7] border border-black/[0.06] rounded-[8px] text-xs font-medium text-[#1D1D1F] outline-none"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="URGENT">P0 Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {(searchQuery || selectedProject !== 'ALL' || selectedPriority !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedProject('ALL');
                    setSelectedPriority('ALL');
                  }}
                  className="text-xs text-[#007AFF] hover:underline px-1"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* ================= VIEW 1: KANBAN BOARD ================= */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {KANBAN_COLUMNS.map((col) => {
                const colTasks = filteredTasks.filter((t) => t.status === col.id);
                const isOver = dragOverCol === col.id;

                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDragLeave={(e) => handleDragLeave(e, col.id)}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className={`rounded-2xl p-4 flex flex-col space-y-3 min-h-[520px] transition-all duration-200 ${
                      isOver
                        ? 'bg-blue-50/70 border-2 border-dashed border-[#007AFF] shadow-apple-md'
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
                            className={`bg-white p-4 rounded-xl border border-black/[0.06] shadow-apple-sm hover:shadow-apple-md hover:border-[#007AFF]/40 cursor-grab active:cursor-grabbing transition-all duration-150 space-y-2.5 group ${
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
                              <h4 className="font-semibold text-xs text-[#1D1D1F] line-clamp-2 leading-snug group-hover:text-[#007AFF] transition-colors">
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-[11px] text-[#6E6E73] mt-1 line-clamp-2 leading-relaxed">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            {/* Card Footer: Priority, Hours & Quick Move Action */}
                            <div className="pt-1 flex items-center justify-between text-[11px] border-t border-black/[0.04]">
                              <span className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-medium ${priority.class}`}>
                                {priority.label}
                              </span>
                              
                              <div className="flex items-center space-x-2">
                                <span className="text-[#86868B] text-[10px] font-medium">
                                  {task.actualHours || 0}/{task.estimatedHours}h
                                </span>

                                {/* Quick Move Buttons (PRD Workflow Action) */}
                                {col.id === 'TODO' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveStatus(task.id, 'IN_PROGRESS');
                                    }}
                                    className="text-[10px] text-[#007AFF] hover:underline font-semibold"
                                    title="Start task"
                                  >
                                    Start →
                                  </button>
                                )}
                                {col.id === 'IN_PROGRESS' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveStatus(task.id, 'DONE');
                                    }}
                                    className="text-[10px] text-[#34C759] hover:underline font-semibold"
                                    title="Mark complete"
                                  >
                                    Done ✓
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {colTasks.length === 0 && (
                        <div className="h-32 rounded-xl border border-dashed border-black/10 flex flex-col items-center justify-center text-xs text-[#86868B] space-y-1">
                          <span>No tasks in this column</span>
                          <span className="text-[10px] text-[#AEAEB2]">Drag tasks here or create a new one</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ================= VIEW 2: COMPACT LIST TABLE VIEW ================= */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-2xl border border-black/[0.08] shadow-apple-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FBFBFD] border-b border-black/[0.06] text-[#86868B] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">ID</th>
                      <th className="py-3 px-4 font-semibold">Task Title</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Priority</th>
                      <th className="py-3 px-4 font-semibold">Hours</th>
                      <th className="py-3 px-4 font-semibold">OCC Version</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-[#86868B]">
                          No tasks match the active filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map((t) => {
                        const status = statusBadges[t.status] || statusBadges.TODO;
                        const priority = priorityBadges[t.priority] || priorityBadges.MEDIUM;

                        return (
                          <tr
                            key={t.id}
                            onClick={() => handleEditClick(t)}
                            className="hover:bg-black/[0.02] cursor-pointer transition-colors"
                          >
                            <td className="py-3.5 px-4 font-mono text-[11px] text-[#007AFF] font-bold">
                              {t.id}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-xs text-[#1D1D1F]">{t.title}</div>
                              {t.description && (
                                <div className="text-[11px] text-[#86868B] truncate max-w-md">{t.description}</div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-medium ${status.class}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                                <span>{status.label}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-medium ${priority.class}`}>
                                {priority.label}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-[#1D1D1F]">
                              {t.actualHours || 0} / {t.estimatedHours}h
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[10px] text-purple-700 font-semibold">
                              v{t.version}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(t);
                                }}
                                className="px-2.5 py-1 text-xs text-[#007AFF] hover:bg-blue-50 rounded-[6px] transition-colors font-medium"
                              >
                                View Details →
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                        className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none bg-white font-medium"
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
                        className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none bg-white font-medium"
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
                        className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none bg-white font-medium"
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
                      placeholder="Technical scope, idempotency constraints, or acceptance criteria..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                    ></textarea>
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-3.5 py-1.5 text-xs text-[#6E6E73] hover:text-[#1D1D1F] rounded-[8px] font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="px-4 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
                    >
                      {isCreating ? 'Creating Task...' : 'Create Task'}
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
            onReloadLatest={() => {
              setConflict(null);
              loadInitialData();
              showToast('Authoritative server state reloaded.');
            }}
          />
        </main>
      </div>
    </div>
  );
}
