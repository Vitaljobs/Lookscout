'use client';

import React, { useState, useEffect } from 'react';
import { useProjects, Project, ProjectStatus, ProjectTheme } from '@/context/ProjectContext';
import { PulseAPI } from '@/lib/api/pulse';
import { Activity, Save, Server, ShieldCheck, AlertCircle, Plus, Trash2, X, Edit3 } from 'lucide-react';

export default function SettingsPage() {
    const { projects, addProject, updateProject, deleteProject } = useProjects();
    const [testResults, setTestResults] = useState<Record<string, { status: 'success' | 'error' | null, msg: string }>>({});

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Project>>({
        name: '',
        description: '',
        slug: '',
        status: 'operational',
        url: '',
        publicUrl: '',
        key: '',
        theme: 'blue'
    });

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            slug: '',
            status: 'operational',
            url: '',
            publicUrl: '',
            key: '',
            theme: 'blue'
        });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleEdit = (project: Project) => {
        setFormData(project);
        setEditingId(project.id);
        setIsEditing(true);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.slug) {
            alert('Name and Slug are required');
            return;
        }

        if (editingId) {
            updateProject(editingId, formData);
        } else {
            addProject(formData as Project); // Slug is used as ID internally in context
        }

        resetForm();
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this project? This cannot be undone.')) {
            deleteProject(id);
        }
    };

    const testConnection = async (projectId: string) => {
        setTestResults(prev => ({ ...prev, [projectId]: { status: null, msg: 'Testing...' } }));

        try {
            const api = new PulseAPI(projectId);
            const { isLive, error } = await api.getStats();

            if (isLive) {
                setTestResults(prev => ({ ...prev, [projectId]: { status: 'success', msg: 'Operational (Live)' } }));
            } else {
                setTestResults(prev => ({
                    ...prev,
                    [projectId]: {
                        status: 'error',
                        msg: error ? `Failed: ${error}` : 'Connected but using Mock Data'
                    }
                }));
            }
        } catch (e) {
            setTestResults(prev => ({ ...prev, [projectId]: { status: 'error', msg: 'Connection Failed' } }));
        }
    };



    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <SettingsIcon className="w-8 h-8 text-gray-400" />
                        System Implementation
                    </h1>
                    <p className="text-gray-400">
                        Manage Titan Control Tower projects, connections, and status.
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsEditing(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Project
                </button>
            </div>

            {/* Editor Form */}
            {isEditing && (
                <div className="card mb-8 border-l-4 border-blue-500 animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">
                            {editingId ? 'Edit Project' : 'New Project'}
                        </h2>
                        <button onClick={resetForm}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
                    </div>

                    <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Project Name</label>
                            <input
                                className="w-full bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-lg p-2 text-white"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Omega Protocol"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Public Live URL</label>
                            <input
                                className="w-full bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-lg p-2 text-white font-mono"
                                value={formData.publicUrl || ''}
                                onChange={e => setFormData({ ...formData, publicUrl: e.target.value })}
                                placeholder="e.g. https://joshua.qzz.io"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Slug (URL ID)</label>
                            <input
                                className="w-full bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-lg p-2 text-white font-mono"
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                placeholder="e.g. omega-protocol"
                                required
                                disabled={!!editingId}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Description</label>
                            <input
                                className="w-full bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-lg p-2 text-white"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Status</label>
                            <select
                                className="w-full bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-lg p-2 text-white"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                            >
                                <option value="operational">Operational</option>
                                <option value="degraded">Degraded</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">API URL</label>
                            <input
                                className="w-full bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-lg p-2 text-white font-mono"
                                value={formData.url || ''}
                                onChange={e => setFormData({ ...formData, url: e.target.value })}
                                placeholder="https://api.example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">API Key</label>
                            <input
                                type="password"
                                className="w-full bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-lg p-2 text-white font-mono"
                                value={formData.key || ''}
                                onChange={e => setFormData({ ...formData, key: e.target.value })}
                                placeholder="Secret Key"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-400">Theme Color</label>
                            <div className="flex gap-4">
                                {['green', 'blue', 'orange', 'purple', 'pink', 'red'].map(color => (
                                    <button
                                        type="button"
                                        key={color}
                                        onClick={() => setFormData({ ...formData, theme: color as ProjectTheme })}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform ${formData.theme === color ? 'scale-125 border-white' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                        style={{ backgroundColor: getThemeHex(color) }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
                            <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold">
                                {editingId ? 'Update Project' : 'Create Project'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-6">
                {projects.map((project) => (
                    <div key={project.id} className="card border-l-4" style={{ borderLeftColor: getThemeHex(project.theme) }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-bold text-white">{project.name}</h2>
                                <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold text-white ${project.status === 'operational' ? 'bg-green-500/20 text-green-500' : project.status === 'maintenance' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>
                                    {project.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => testConnection(project.id)} className="p-2 text-gray-400 hover:text-white" title="Test Connection">
                                    <Server className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleEdit(project)} className="p-2 text-gray-400 hover:text-blue-400" title="Edit">
                                    <Edit3 className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(project.id)} className="p-2 text-gray-400 hover:text-red-500" title="Delete">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-400 font-mono pl-1 flex flex-col gap-1">
                            <div>API: {project.url ? project.url : 'No API URL Configured'}</div>
                            <div>Public: {project.publicUrl ? <a href={project.publicUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{project.publicUrl}</a> : 'No Public URL'}</div>
                            {testResults[project.id] && (
                                <span className={`ml-4 ${testResults[project.id].status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                    [{testResults[project.id].msg}]
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-8 border-t border-[var(--card-border)] text-center">
                <p className="text-xs text-gray-500 font-mono">
                    Master Dashboard v1.0.3
                </p>
            </div>
        </div>
    );
}

function getThemeHex(theme: string) {
    const map: Record<string, string> = {
        green: '#10b981', blue: '#3b82f6', orange: '#f59e0b', purple: '#a855f7', pink: '#ec4899', red: '#ef4444'
    };
    return map[theme] || '#9ca3af';
}

function SettingsIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    )
}
