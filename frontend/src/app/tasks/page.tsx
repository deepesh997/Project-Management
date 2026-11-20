'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { ConflictResolutionModal } from '../../components/tasks/ConflictResolutionModal';
import { ApiClient } from '../../lib/api';
import { Task, UserRole, OCCConflictError } from '../../types';

export default function TasksPage() {
  const [role, setRole] = useState<UserRole>('project_manager');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [conflict, setConflict] = useState<OCCConflictError | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState<any>('TODO');
  const [notification, setNotification] = useState<string | null>(null);

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
    const res = await ApiClient.updateTaskWithOCC(
      editingTask.id,
      { title: editTitle, status: editStatus },
      editingTask.version
    );

    if (res.conflict) {
      setConflict(res.conflict);
    } else if (res.task) {
      setNotification(`Task updated successfully to Version ${res.task.version}`);
      setEditingTask(null);
      loadTasks();
    }
  };

  // Simulates Capstone Concurrency Race: Another user updated the record in the background!
  const handleSimulateRaceCondition = async () => {
    if (!editingTask) return;
    // We intentionally pass a stale expectedVersion (e.g. version - 1 or force conflict)
    const staleVersion = Math.max(0, editingTask.version - 1);
    const res = await ApiClient.updateTaskWithOCC(
      editingTask.id,
      { title: `${editTitle} (Conflicting User B Edit)`, status: 'DONE' },
      staleVersion // STALE! Trigger 409 Conflict
    );

    if (res.conflict) {
      setConflict(res.conflict);
    }
  };

  const handleReloadLatest = () => {
    setConflict(null);
    setEditingTask(null);
    loadTasks();
    setNotification('Reloaded latest server version. No silent overwrite occurred.');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentRole={role} onRoleChange={setRole} />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar currentRole={role} />

        <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Tasks & Kanban Board</h2>
              <p className="text-sm text-slate-500">
                Guaranteed by Optimistic Concurrency Control (OCC) • Prevents Silent Overwrites
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
                SSE Real-time Connected
              </span>
            </div>
          </div>

          {notification && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex justify-between items-center">
              <span>{notification}</span>
              <button onClick={() => setNotification(null)} className="text-emerald-600 hover:underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['TODO', 'IN_PROGRESS', 'DONE'].map((colStatus) => {
              const colTasks = tasks.filter((t) => t.status === colStatus);
              return (
                <div key={colStatus} className="bg-slate-100/70 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-sm text-slate-700 uppercase tracking-wide">
                      {colStatus.replace('_', ' ')}
                    </span>
                    <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleEditClick(task)}
                        className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-indigo-400 cursor-pointer transition-all hover:shadow"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span className="font-mono text-[11px] text-slate-500">{task.id}</span>
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px] border border-indigo-100">
                            v{task.version}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm text-slate-800">{task.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            {task.priority}
                          </span>
                          <span className="text-slate-400">Est: {task.estimatedHours}h</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Edit Drawer / Modal */}
          {editingTask && (
            <div className="fixed inset-0 z-40 bg-slate-900/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-lg text-slate-900">
                    Edit Task <span className="text-indigo-600 font-mono">(v{editingTask.version})</span>
                  </h3>
                  <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="TODO">TODO</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="IN_REVIEW">IN_REVIEW</option>
                      <option value="DONE">DONE</option>
                    </select>
                  </div>
                </div>

                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800">
                  <strong>Concurrency Simulation:</strong> Click "Simulate Race Collision" to test how the system halts a simultaneous conflicting edit from another user!
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleSimulateRaceCondition}
                    className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
                  >
                    Simulate Race Collision (409)
                  </button>

                  <div className="space-x-2">
                    <button
                      onClick={() => setEditingTask(null)}
                      className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNormalSave}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm"
                    >
                      Save Task (v{editingTask.version})
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
