'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { ConflictResolutionModal } from '../../components/tasks/ConflictResolutionModal';
import { ApiClient } from '../../lib/api';
import { Project, Task, TaskStatus, TaskPriority, OCCConflictError } from '../../types';

interface ProjectWithMilestones extends Project {
  progress?: number;
  milestones?: { title: string; done: boolean }[];
}

const priorityBadges: Record<string, { label: string; class: string }> = {
  HIGH: { label: 'High', class: 'bg-rose-50 text-rose-700 border-rose-200' },
  MEDIUM: { label: 'Medium', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  LOW: { label: 'Low', class: 'bg-blue-50 text-blue-700 border-blue-200' },
  URGENT: { label: 'P0 Critical', class: 'bg-red-100 text-red-800 border-red-300 font-bold' },
};

const statusPills: Record<TaskStatus, { label: string; class: string }> = {
  TODO: { label: 'To Do', class: 'bg-slate-100 text-slate-700 border-slate-200' },
  IN_PROGRESS: { label: 'In Progress', class: 'bg-blue-50 text-blue-700 border-blue-200' },
  IN_REVIEW: { label: 'In Review', class: 'bg-purple-50 text-purple-700 border-purple-200' },
  DONE: { label: 'Completed', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  BLOCKED: { label: 'Blocked', class: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const KANBAN_COLUMNS: { id: TaskStatus; label: string; dotColor: string }[] = [
  { id: 'TODO', label: 'To Do', dotColor: 'bg-slate-400' },
  { id: 'IN_PROGRESS', label: 'In Progress', dotColor: 'bg-[#007AFF]' },
  { id: 'DONE', label: 'Completed', dotColor: 'bg-[#34C759]' },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithMilestones[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectWithMilestones | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // OCC conflict resolution state
  const [conflict, setConflict] = useState<OCCConflictError | null>(null);

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  // Filter & Search inside project
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Project Creation Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetEndDate, setTargetEndDate] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Task Creation in Project state
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('TODO');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('MEDIUM');
  const [newTaskHours, setNewTaskHours] = useState(8);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const [projectList, taskList] = await Promise.all([
      ApiClient.getProjects(),
      ApiClient.getTasks(),
    ]);

    const withDefaults: ProjectWithMilestones[] = projectList.map((p, idx) => ({
      ...p,
      progress: idx === 0 ? 75 : 40,
      milestones:
        idx === 0
          ? [
              { title: 'Schema Architecture & DDL Migration', done: true },
              { title: 'Supabase PostgreSQL 16 Deployment', done: true },
              { title: 'Optimistic Concurrency Control (OCC)', done: true },
              { title: 'Production Load Verification & Chaos Test', done: false },
            ]
          : [
              { title: 'Server-Sent Events (SSE) Infrastructure', done: true },
              { title: 'HMAC Webhook Verification (300s window)', done: true },
              { title: 'Automated Dead-Letter Queue (DLQ)', done: false },
            ],
    }));
    setProjects(withDefaults);
    setTasks(taskList);
  };

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification((prev) => (prev === message ? null : prev));
    }, 4500);
  };

  // --- Project Management ---
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const res = await ApiClient.createProject({
      name: name.trim(),
      description: description.trim(),
      status,
    });
    setIsSubmitting(false);

    if (res.success && res.project) {
      const newProj: ProjectWithMilestones = {
        ...res.project,
        progress: 0,
        milestones: [
          { title: 'Initiative Kickoff & Stakeholder Alignment', done: true },
          { title: 'Technical Architecture & API Contracts', done: false },
          { title: 'Deployment & Quality Verification', done: false },
        ],
      };
      setProjects((prev) => [newProj, ...prev]);
      setIsCreateModalOpen(false);
      setName('');
      setDescription('');
      showToast(`Project "${res.project.name}" provisioned in Supabase PostgreSQL`);
    } else {
      alert(res.error || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete project "${projectName}"?`)) return;

    const ok = await ApiClient.deleteProject(projectId);
    if (ok) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
      showToast(`Project "${projectName}" deleted`);
    }
  };

  const handleToggleMilestone = (projectId: string, milestoneIndex: number) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId || !proj.milestones) return proj;
        const updatedMilestones = proj.milestones.map((m, idx) =>
          idx === milestoneIndex ? { ...m, done: !m.done } : m
        );
        const completedCount = updatedMilestones.filter((m) => m.done).length;
        const newProgress = Math.round((completedCount / updatedMilestones.length) * 100);
        const updatedProj = {
          ...proj,
          milestones: updatedMilestones,
          progress: newProgress,
        };
        if (selectedProject?.id === projectId) {
          setSelectedProject(updatedProj);
        }
        return updatedProj;
      })
    );
  };

  // --- Drag & Drop Kanban Handlers ---
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

    const previousStatus = task.status;
    const previousVersion = task.version;

    // Optimistic update
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
      showToast(`Task moved to ${targetStatus} (v${res.task.version})`);
    }
  };

  // --- Create Task inside Selected Project ---
  const handleCreateTaskInProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newTaskTitle.trim()) return;

    setIsCreatingTask(true);
    const res = await ApiClient.createTask({
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      projectId: selectedProject.id,
      status: newTaskStatus,
      priority: newTaskPriority,
      estimatedHours: Number(newTaskHours) || 8,
    });
    setIsCreatingTask(false);

    if (res.success && res.task) {
      setTasks((prev) => [res.task!, ...prev]);
      setIsCreateTaskModalOpen(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      showToast(`Task "${res.task.title}" added to project`);
    } else {
      alert(res.error || 'Failed to create task');
    }
  };

  // Filter tasks for selected project
  const projectTasks = selectedProject
    ? tasks.filter((t) => {
        const matchesProject = t.projectId === selectedProject.id;
        const matchesSearch =
          !searchQuery ||
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
        return matchesProject && matchesSearch && matchesStatus;
      })
    : [];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F7]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />

        <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Breadcrumb Navigation when viewing project details */}
          {selectedProject ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setSelectedProject(null);
                      setSearchQuery('');
                      setStatusFilter('ALL');
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-black/[0.08] text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.04] transition-colors shadow-xs"
                  >
                    <span>←</span>
                    <span>All Projects</span>
                  </button>
                  <span className="text-[#86868B] text-xs">/</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#007AFF] border border-blue-200/70">
                      {selectedProject.id}
                    </span>
                    <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
                      {selectedProject.name}
                    </h2>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {selectedProject.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* View Mode Toggle: Kanban vs List */}
                  <div className="flex p-0.5 bg-black/[0.06] rounded-[8px] text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setViewMode('kanban')}
                      className={`px-3 py-1 rounded-[6px] transition-all flex items-center space-x-1.5 ${
                        viewMode === 'kanban'
                          ? 'bg-white text-[#1D1D1F] shadow-xs'
                          : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                      }`}
                    >
                      <span>☷</span>
                      <span>Kanban Board</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1 rounded-[6px] transition-all flex items-center space-x-1.5 ${
                        viewMode === 'list'
                          ? 'bg-white text-[#1D1D1F] shadow-xs'
                          : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                      }`}
                    >
                      <span>☰</span>
                      <span>List View</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setIsCreateTaskModalOpen(true)}
                    className="px-3.5 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all flex items-center space-x-1.5"
                  >
                    <span>+</span>
                    <span>New Task in Project</span>
                  </button>
                </div>
              </div>

              {/* Project Overview Card with Milestones & Progress */}
              <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-apple-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-[#6E6E73] max-w-2xl leading-relaxed">
                      {selectedProject.description || 'Enterprise project initiatives and roadmaps.'}
                    </p>
                    <div className="flex items-center space-x-4 text-[11px] text-[#86868B] pt-1">
                      <span>Owner: <strong className="text-[#1D1D1F]">{selectedProject.ownerId || 'pm@acme.com'}</strong></span>
                      <span>•</span>
                      <span>Tasks: <strong className="text-[#007AFF]">{projectTasks.length} total</strong></span>
                      <span>•</span>
                      <span>Target: <strong className="text-[#1D1D1F]">{selectedProject.createdAt?.split('T')[0] || '2026-11-01'}</strong></span>
                    </div>
                  </div>

                  {/* Progress Bar Widget */}
                  <div className="w-full md:w-64 space-y-1.5 shrink-0">
                    <div className="flex justify-between text-xs font-semibold text-[#1D1D1F]">
                      <span className="text-[#6E6E73]">Milestones Progress</span>
                      <span className="font-mono text-[#007AFF]">{selectedProject.progress || 60}%</span>
                    </div>
                    <div className="w-full bg-black/[0.06] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#007AFF] h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${selectedProject.progress || 60}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Milestone Checklist */}
                {selectedProject.milestones && selectedProject.milestones.length > 0 && (
                  <div className="border-t border-black/[0.06] pt-3.5 space-y-2">
                    <span className="text-[10px] font-semibold text-[#86868B] uppercase tracking-wider block">
                      Project Milestones (Click to Toggle)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {selectedProject.milestones.map((m, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleToggleMilestone(selectedProject.id, idx)}
                          className="flex items-center space-x-2 cursor-pointer p-1.5 rounded-[6px] hover:bg-black/[0.03] transition-colors"
                        >
                          <span
                            className={`w-4 h-4 rounded-[4px] flex items-center justify-center text-[10px] font-bold shrink-0 transition-all ${
                              m.done
                                ? 'bg-[#34C759] text-white shadow-xs'
                                : 'border border-black/[0.2] hover:border-[#007AFF]'
                            }`}
                          >
                            {m.done ? '✓' : ''}
                          </span>
                          <span
                            className={`truncate ${
                              m.done ? 'line-through text-[#86868B]' : 'text-[#1D1D1F] font-medium'
                            }`}
                          >
                            {m.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center space-x-2.5 flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Filter tasks by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-black/[0.1] rounded-[8px] text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:ring-1 focus:ring-[#007AFF] outline-none shadow-xs"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-black/[0.1] rounded-[8px] text-xs text-[#1D1D1F] outline-none shadow-xs"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Completed</option>
                  </select>
                </div>

                <div className="text-xs text-[#86868B]">
                  Showing <strong className="text-[#1D1D1F]">{projectTasks.length}</strong> tasks in {selectedProject.name}
                </div>
              </div>

              {/* View 1: KANBAN BOARD */}
              {viewMode === 'kanban' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {KANBAN_COLUMNS.map((col) => {
                    const colTasks = projectTasks.filter((t) => t.status === col.id);
                    const isOver = dragOverCol === col.id;

                    return (
                      <div
                        key={col.id}
                        onDragOver={(e) => handleDragOver(e, col.id)}
                        onDragLeave={(e) => handleDragLeave(e, col.id)}
                        onDrop={(e) => handleDrop(e, col.id)}
                        className={`rounded-[16px] p-4 flex flex-col space-y-3 min-h-[460px] transition-all duration-200 ${
                          isOver
                            ? 'bg-blue-50/70 border-2 border-dashed border-[#007AFF] ring-2 ring-blue-500/20'
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

                        {/* Cards */}
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
                                onClick={() => router.push(`/tasks/${task.id}?returnTo=/projects`)}
                                className={`bg-white p-4 rounded-[12px] border border-black/[0.06] shadow-apple-sm hover:shadow-apple-md hover:border-[#007AFF]/40 cursor-pointer transition-all duration-150 space-y-2.5 ${
                                  isBeingDragged ? 'opacity-40 scale-95 border-blue-400' : 'active:scale-[0.99]'
                                }`}
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-mono text-[10px] text-[#86868B] font-medium">
                                    {task.id}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded-[4px] bg-[#007AFF]/10 text-[#007AFF] font-mono font-semibold text-[10px] border border-[#007AFF]/20">
                                    v{task.version}
                                  </span>
                                </div>

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

                                <div className="pt-1 flex items-center justify-between text-[11px] border-t border-black/[0.04]">
                                  <span className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-medium ${priority.class}`}>
                                    {priority.label}
                                  </span>
                                  <span className="text-[#86868B] flex items-center space-x-1">
                                    <span>⏱</span>
                                    <span>{task.estimatedHours}h</span>
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          {colTasks.length === 0 && (
                            <div className="h-28 rounded-[12px] border border-dashed border-black/10 flex flex-col items-center justify-center text-xs text-[#86868B] space-y-1">
                              <span>No tasks in {col.label}</span>
                              <span className="text-[10px] text-[#AEAEB2]">Drag tasks here</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* View 2: LIST VIEW */
                <div className="bg-white rounded-2xl border border-black/[0.08] shadow-apple-sm overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#FBFBFD] border-b border-black/[0.08] text-[#86868B] font-semibold text-[11px] uppercase tracking-wider select-none">
                        <th className="py-3 px-4">Task ID</th>
                        <th className="py-3 px-4">Title & Scope</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Hours</th>
                        <th className="py-3 px-4">OCC Version</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.06]">
                      {projectTasks.map((task) => {
                        const statusBadge = statusPills[task.status] || statusPills.TODO;
                        const priorityBadge = priorityBadges[task.priority] || priorityBadges.MEDIUM;

                        return (
                          <tr
                            key={task.id}
                            onClick={() => router.push(`/tasks/${task.id}?returnTo=/projects`)}
                            className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                          >
                            <td className="py-3 px-4 font-mono text-[11px] text-[#007AFF] font-medium whitespace-nowrap">
                              {task.id}
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-semibold text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors truncate">
                                {task.title}
                              </div>
                              {task.description && (
                                <div className="text-[11px] text-[#6E6E73] truncate">
                                  {task.description}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${statusBadge.class}`}>
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-medium ${priorityBadge.class}`}>
                                {priorityBadge.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-[#1D1D1F] whitespace-nowrap">
                              {task.estimatedHours}h est
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#007AFF]/10 text-[#007AFF] font-semibold border border-[#007AFF]/20">
                                v{task.version}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/tasks/${task.id}?returnTo=/projects`);
                                }}
                                className="px-2.5 py-1 text-xs text-[#007AFF] hover:bg-blue-50 rounded-[6px] font-medium transition-colors"
                              >
                                View Log →
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {projectTasks.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-[#86868B] space-y-1">
                            <p className="font-medium">No tasks found matching criteria.</p>
                            <p className="text-[11px] text-[#AEAEB2]">
                              Click &ldquo;+ New Task in Project&rdquo; to add deliverables.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* PROJECT GRID OVERVIEW (When no project is selected) */
            <>
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
                    Projects & Enterprise Roadmaps
                  </h2>
                  <p className="text-xs text-[#6E6E73]">
                    Click on any project to open its tasks in Kanban or List view with submission history
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <span>+</span>
                  <span>New Project</span>
                </button>
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

              {/* Project Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project) => {
                  const currentProgress = project.progress ?? 50;
                  const projectTaskCount = tasks.filter((t) => t.projectId === project.id).length;

                  return (
                    <div
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className="apple-card p-6 space-y-5 flex flex-col justify-between cursor-pointer hover:border-[#007AFF]/40 hover:shadow-apple-md transition-all group"
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-[#007AFF] font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                              {project.id}
                            </span>
                            <h3 className="font-semibold text-base text-[#1D1D1F] mt-1.5 tracking-tight group-hover:text-[#007AFF] transition-colors">
                              {project.name}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {project.status}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project.id, project.name);
                              }}
                              className="text-[#8E8E93] hover:text-rose-600 text-xs p-1 rounded hover:bg-black/[0.04] transition-colors"
                              title="Delete Project"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-[#6E6E73] leading-relaxed">
                          {project.description || 'No project description supplied.'}
                        </p>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-xs font-medium text-[#1D1D1F]">
                            <span className="text-[#6E6E73]">Milestones Progress</span>
                            <span className="font-mono font-semibold">{currentProgress}%</span>
                          </div>
                          <div className="w-full bg-black/[0.06] rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#007AFF] h-2 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${currentProgress}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Milestones Preview */}
                        {project.milestones && project.milestones.length > 0 && (
                          <div className="border-t border-black/[0.06] pt-3 space-y-1.5">
                            <span className="text-[10px] font-semibold text-[#86868B] uppercase tracking-wider block">
                              Key Milestones
                            </span>
                            <div className="space-y-1 text-xs">
                              {project.milestones.slice(0, 3).map((m, idx) => (
                                <div key={idx} className="flex items-center space-x-2 text-[#48484A]">
                                  <span className={`w-3.5 h-3.5 rounded text-[9px] flex items-center justify-center font-bold ${m.done ? 'bg-emerald-500 text-white' : 'border border-black/20'}`}>
                                    {m.done ? '✓' : ''}
                                  </span>
                                  <span className={`truncate text-[11px] ${m.done ? 'line-through text-[#86868B]' : ''}`}>{m.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer with Click to View Prompt */}
                      <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] text-[#86868B]">
                        <span className="font-medium text-[#007AFF] flex items-center space-x-1 group-hover:underline">
                          <span>View Tasks & Kanban ({projectTaskCount})</span>
                          <span>→</span>
                        </span>
                        <span className="text-[10px] font-mono text-[#AEAEB2]">
                          Created {project.createdAt?.split('T')[0] || '2026-11-01'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Create Project Modal Sheet */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-apple-sheet max-w-lg w-full p-6 space-y-5 border border-black/10 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center border-b border-black/[0.08] pb-3">
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-base text-[#1D1D1F]">
                      Create New Project Roadmap
                    </h3>
                    <p className="text-[11px] text-[#6E6E73]">
                      Initiative scoped to tenant `org-acme-101` in Supabase
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-[#8E8E93] hover:text-[#1D1D1F] w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/[0.05] transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-[#1D1D1F] block mb-1">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Real-Time Analytics Pipeline"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#1D1D1F] block mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="PLANNING">Planning</option>
                      <option value="PAUSED">Paused</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-[#1D1D1F] block mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-[#1D1D1F] block mb-1">
                        Target Completion
                      </label>
                      <input
                        type="date"
                        value={targetEndDate}
                        onChange={(e) => setTargetEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-[#1D1D1F] block mb-1">
                      Description & Deliverables
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Scope, requirements, and key architecture targets..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
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
                      disabled={isSubmitting}
                      className="px-4 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
                    >
                      {isSubmitting ? 'Creating Project...' : 'Create Project'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Quick Create Task inside Selected Project Modal */}
          {isCreateTaskModalOpen && selectedProject && (
            <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-apple-sheet max-w-lg w-full p-6 space-y-5 border border-black/10 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center border-b border-black/[0.08] pb-3">
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-base text-[#1D1D1F]">
                      Add Task to {selectedProject.name}
                    </h3>
                    <p className="text-[11px] text-[#6E6E73]">
                      Record will initialize with OCC Version 1
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreateTaskModalOpen(false)}
                    className="text-[#8E8E93] hover:text-[#1D1D1F] w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/[0.05] transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateTaskInProject} className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-[#1D1D1F] block mb-1">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Implement Circuit Breaker for Redis"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-[#1D1D1F] block mb-1">
                        Initial Status
                      </label>
                      <select
                        value={newTaskStatus}
                        onChange={(e) => setNewTaskStatus(e.target.value as TaskStatus)}
                        className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none bg-white"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-[#1D1D1F] block mb-1">
                        Priority Level
                      </label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                        className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none bg-white"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">P0 Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-[#1D1D1F] block mb-1">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={newTaskHours}
                      onChange={(e) => setNewTaskHours(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#1D1D1F] block mb-1">
                      Description & Scope
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Acceptance criteria and scope..."
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none"
                    ></textarea>
                  </div>

                  <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-black/[0.08]">
                    <button
                      type="button"
                      onClick={() => setIsCreateTaskModalOpen(false)}
                      className="px-3.5 py-1.5 text-xs text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-[8px] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingTask}
                      className="px-4 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
                    >
                      {isCreatingTask ? 'Creating...' : 'Create Task'}
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
              loadAllData();
              showToast('Reloaded authoritative server version.');
            }}
          />
        </main>
      </div>
    </div>
  );
}
