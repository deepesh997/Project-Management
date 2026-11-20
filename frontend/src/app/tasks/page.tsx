'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { ConflictResolutionModal } from '../../components/tasks/ConflictResolutionModal';
import { ApiClient } from '../../lib/api';
import { Task, OCCConflictError } from '../../types';

const priorityBadges: Record<string, { label: string; class: string }> = {
  HIGH: { label: 'High Priority', class: 'bg-rose-50 text-rose-700 border-rose-200' },
  MEDIUM: { label: 'Medium', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  LOW: { label: 'Low', class: 'bg-blue-50 text-blue-700 border-blue-200' },
  URGENT: { label: 'P0 Critical', class: 'bg-red-100 text-red-800 border-red-300 font-bold' },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [conflict, setConflict] = useState<OCCConflictError | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState<any>('TODO');
  const [notification, setNotification] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const list = await ApiClient.getTasks();
    setTasks(list);
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditStatus(task.status);
  };

  const handleNormalSave = async () => {
    if (!editingTask) return;
    setIsSaving(true);
    const res = await ApiClient.updateTaskWithOCC(
      editingTask.id,
      { title: editTitle, status: editStatus },
      editingTask.version
    );
    setIsSaving(false);

    if (res.conflict) {
      setConflict(res.conflict);
    } else if (res.task) {
      setNotification(`Task updated successfully to Version ${res.task.version}`);
      setEditingTask(null);
      loadTasks();
    }
  };

  // Simulates Concurrency Race Condition: Another collaborator updated the record in the background
  const handleSimulateRaceCondition = async () => {
    if (!editingTask) return;
    // We intentionally pass a stale expectedVersion to trigger a 409 Conflict
    const staleVersion = Math.max(0, editingTask.version - 1);
    const res = await ApiClient.updateTaskWithOCC(
      editingTask.id,
      { title: `${editTitle} (Conflicting User B Update)`, status: 'DONE' },
      staleVersion
    );

    if (res.conflict) {
      setConflict(res.conflict);
    }
  };

  const handleReloadLatest = () => {
    setConflict(null);
    setEditingTask(null);
    loadTasks();
    setNotification('Reloaded authoritative server version. Silent overwrite avoided.');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F7]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />

        <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
                Tasks & Kanban Board
              </h2>
              <p className="text-xs text-[#6E6E73]">
                Guaranteed by Optimistic Concurrency Control (OCC) • Compare-and-Swap Versioning
              </p>
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="inline-flex items-center px-2.5 py-1 rounded-[6px] text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                SSE Real-time Active
              </span>
            </div>
          </div>

          {notification && (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-[10px] text-xs text-emerald-900 flex justify-between items-center shadow-xs animate-in fade-in">
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

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { id: 'TODO', label: 'To Do', color: 'bg-slate-400' },
              { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-[#007AFF]' },
              { id: 'DONE', label: 'Completed', color: 'bg-[#34C759]' },
            ].map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.id);
              return (
                <div
                  key={col.id}
                  className="bg-[#EBEBED]/70 rounded-[16px] p-4 border border-black/[0.04] flex flex-col space-y-3 min-h-[500px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${col.color}`}></span>
                      <span className="font-semibold text-xs text-[#1D1D1F] uppercase tracking-wider">
                        {col.label}
                      </span>
                    </div>
                    <span className="bg-black/[0.06] text-[#6E6E73] px-2 py-0.5 rounded-full text-[11px] font-semibold">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Task Card List */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto">
                    {colTasks.map((task) => {
                      const priority = priorityBadges[task.priority] || priorityBadges.MEDIUM;
                      return (
                        <div
                          key={task.id}
                          onClick={() => handleEditClick(task)}
                          className="bg-white p-4 rounded-[12px] border border-black/[0.06] shadow-apple-sm hover:shadow-apple-md hover:border-[#007AFF]/40 cursor-pointer transition-all duration-150 active:scale-[0.99] space-y-2.5"
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
                      <div className="h-28 rounded-[12px] border border-dashed border-black/10 flex items-center justify-center text-xs text-[#86868B]">
                        No tasks in this lane
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Edit Task Sheet / Modal */}
          {editingTask && (
            <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-apple-sheet max-w-lg w-full p-6 space-y-5 border border-black/10 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center border-b border-black/[0.08] pb-3.5">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-base text-[#1D1D1F]">
                      Edit Task Details
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 font-mono font-semibold rounded border border-blue-200">
                      v{editingTask.version}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingTask(null)}
                    className="text-[#8E8E93] hover:text-[#1D1D1F] w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/[0.05] transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                      Task Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                      Workflow Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-black/[0.12] rounded-[8px] text-xs focus:ring-2 focus:ring-[#007AFF]/25 focus:border-[#007AFF] outline-none transition-all"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Educational Simulation Box */}
                <div className="bg-amber-50/60 p-3 rounded-[10px] border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="font-semibold flex items-center space-x-1.5">
                    <span>⚡</span>
                    <span>Test Concurrency Protection:</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Click <strong>Simulate Race Collision</strong> to trigger a 409 conflict. The server will detect that another collaborator modified the record simultaneously and present the Apple HIG Conflict Resolution Sheet!
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-black/[0.08]">
                  <button
                    type="button"
                    onClick={handleSimulateRaceCondition}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-[8px] text-xs font-semibold transition-colors active:scale-[0.98]"
                  >
                    Simulate Race Collision (409)
                  </button>

                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingTask(null)}
                      className="px-3.5 py-1.5 text-xs text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-[8px] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleNormalSave}
                      className="px-4 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-all"
                    >
                      {isSaving ? 'Saving...' : `Save Changes (v${editingTask.version})`}
                    </button>
                  </div>
                </div>
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
