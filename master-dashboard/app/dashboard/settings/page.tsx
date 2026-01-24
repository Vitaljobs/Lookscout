'use client';

import React, { useState, useEffect } from 'react';
import { PulseAPI } from '@/lib/api/pulse';
import { Activity, Save, Server, ShieldCheck, AlertCircle } from 'lucide-react';

const PROJECTS = [
    { id: 'commonground', name: 'Common Ground Pulse', color: 'green' },
    { id: 'vibechain', name: 'VIBECHAIN', color: 'blue' },
    { id: 'vitaljobs', name: 'VitalJobs', color: 'orange' }
];

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [testResults, setTestResults] = useState<Record<string, { status: 'success' | 'error' | null, msg: string }>>({});

    // Form State
    const [configs, setConfigs] = useState<Record<string, { url: string, key: string }>>({});

    useEffect(() => {
        // Load config from LocalStorage on mount
        const initialConfigs: Record<string, { url: string, key: string }> = {};
        PROJECTS.forEach(p => {
            initialConfigs[p.id] = {
                url: localStorage.getItem(`titan_config_${p.id}_url`) || '',
                key: localStorage.getItem(`titan_config_${p.id}_key`) || '',
            };
        });
        setConfigs(initialConfigs);
    }, []);

    const handleChange = (projectId: string, field: 'url' | 'key', value: string) => {
        setConfigs(prev => ({
            ...prev,
            [projectId]: {
                ...prev[projectId],
                [field]: value
            }
        }));
    };

    const handleSave = (projectId: string) => {
        const config = configs[projectId];
        localStorage.setItem(`titan_config_${projectId}_url`, config.url);
        localStorage.setItem(`titan_config_${projectId}_key`, config.key);

        // Visual feedback
        const btn = document.getElementById(`save-btn-${projectId}`);
        if (btn) {
            const originalText = btn.innerText;
            btn.innerText = 'Saved!';
            btn.classList.add('bg-green-600');
            setTimeout(() => {
                btn.innerText = originalText;
                btn.classList.remove('bg-green-600');
            }, 2000);
        }
    };

    const testConnection = async (projectId: string) => {
        setTestResults(prev => ({ ...prev, [projectId]: { status: null, msg: 'Testing...' } }));

        // Ensure values are saved first so PulseAPI picks them up
        handleSave(projectId);

        try {
            const api = new PulseAPI(projectId);
            const { data, isLive, error } = await api.getStats();

            if (isLive) {
                setTestResults(prev => ({ ...prev, [projectId]: { status: 'success', msg: 'Operational (Live)' } }));
            } else {
                setTestResults(prev => ({
                    ...prev,
                    [projectId]: {
                        status: 'error',
                        msg: error ? `Failed: ${error}` : 'Connected but using Mock Data (Check URL)'
                    }
                }));
            }
        } catch (e) {
            setTestResults(prev => ({ ...prev, [projectId]: { status: 'error', msg: 'Connection Failed' } }));
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <SettingsIcon className="w-8 h-8 text-gray-400" />
                    System Configuration
                </h1>
                <p className="text-gray-400">
                    Manage API connections for Titan Control Tower. Configurations are stored locally in your browser.
                </p>
            </div>

            <div className="space-y-8">
                {PROJECTS.map((project) => (
                    <div key={project.id} className="card border-l-4" style={{ borderLeftColor: project.color === 'green' ? '#10b981' : project.color === 'blue' ? '#3b82f6' : '#f59e0b' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {project.name}
                                <span className="text-xs font-normal px-2 py-1 rounded bg-[var(--sidebar-bg)] text-gray-400 border border-[var(--card-border)]">
                                    ID: {project.id}
                                </span>
                            </h2>
                            <div className="flex items-center gap-2">
                                {testResults[project.id]?.status === 'success' && (
                                    <span className="flex items-center gap-1 text-green-500 text-sm font-medium animate-pulse">
                                        <ShieldCheck className="w-4 h-4" /> Operational
                                    </span>
                                )}
                                {testResults[project.id]?.status === 'error' && (
                                    <span className="flex items-center gap-1 text-red-500 text-sm font-medium">
                                        <AlertCircle className="w-4 h-4" /> {testResults[project.id]?.msg}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">API Endpoint URL</label>
                                <div className="relative">
                                    <Server className="absolute left-3 top-3 w-4 h-4 text-gray-600" />
                                    <input
                                        type="text"
                                        placeholder="https://api.example.com/v1"
                                        className="w-full bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        value={configs[project.id]?.url || ''}
                                        onChange={(e) => handleChange(project.id, 'url', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Service API Key</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-3 w-4 h-4 text-gray-600" />
                                    <input
                                        type="password"
                                        placeholder="sk_live_..."
                                        className="w-full bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                                        value={configs[project.id]?.key || ''}
                                        onChange={(e) => handleChange(project.id, 'key', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
                            <button
                                onClick={() => testConnection(project.id)}
                                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                            >
                                Test Connection
                            </button>
                            <button
                                id={`save-btn-${project.id}`}
                                onClick={() => handleSave(project.id)}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Logic
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SettingsIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    )
}
