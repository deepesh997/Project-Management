'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { ApiClient } from '../../lib/api';
import { Project } from '../../types';

interface ProjectWithMilestones extends Project {
  progress?: number;
  milestones?: { title: string; done: boolean }[];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithMilestones[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetEndDate, setTargetEndDate] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const list = await ApiClient.getProjects();
    const withDefaults: ProjectWithMilestones[] = list.map((p, idx) => ({
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
  };

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification((prev) => (prev === message ? null : prev));
    }, 4500);
  };

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
        return {
          ...proj,
          milestones: updatedMilestones,
          progress: newProgress,
        };
      })
    );
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
                Projects & Enterprise Milestones
              </h2>
              <p className="text-xs text-[#6E6E73]">
                Tenant Scoped to `org-acme-101` • Backed by Supabase PostgreSQL 16
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

              return (
                <div
                  key={project.id}
                  className="apple-card p-6 space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-[#007AFF] font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                          {project.id}
                        </span>
                        <h3 className="font-semibold text-base text-[#1D1D1F] mt-1.5 tracking-tight">
                          {project.name}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {project.status}
                        </span>
                        <button
                          onClick={() => handleDeleteProject(project.id, project.name)}
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

                    {/* Dynamic Progress Bar */}
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

                    {/* Interactive Milestones Checklist */}
                    {project.milestones && project.milestones.length > 0 && (
                      <div className="border-t border-black/[0.06] pt-3.5 space-y-2">
                        <span className="text-[10px] font-semibold text-[#86868B] uppercase tracking-wider block">
                          Milestones (Click to Toggle Completion)
                        </span>
                        <div className="space-y-2 text-xs">
                          {project.milestones.map((m, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleToggleMilestone(project.id, idx)}
                              className="flex items-center space-x-2.5 cursor-pointer select-none group"
                            >
                              <span
                                className={`w-4 h-4 rounded-[4px] flex items-center justify-center text-[10px] font-bold transition-all ${
                                  m.done
                                    ? 'bg-[#34C759] text-white shadow-xs'
                                    : 'border border-black/[0.2] group-hover:border-[#007AFF]'
                                }`}
                              >
                                {m.done ? '✓' : ''}
                              </span>
                              <span
                                className={`transition-colors ${
                                  m.done
                                    ? 'line-through text-[#86868B]'
                                    : 'text-[#1D1D1F] font-medium group-hover:text-[#007AFF]'
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

                  <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] text-[#86868B]">
                    <span>
                      Owner: <strong className="text-[#1D1D1F] font-medium">{project.ownerId || 'pm@acme.com'}</strong>
                    </span>
                    <span className="text-[10px] font-mono text-[#AEAEB2]">
                      Created {project.createdAt?.split('T')[0] || '2026-11-01'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

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
                      placeholder="e.g. Next-Gen Mobile App Overhaul"
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
                      Description & Goals
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Outline target business outcomes, architecture scope, and deliverables..."
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
        </main>
      </div>
    </div>
  );
}
