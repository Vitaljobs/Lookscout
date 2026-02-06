'use client';

import React, { useEffect, useState } from 'react';
import { useProjects } from '@/context/ProjectContext';
import { PulseAPI } from '@/lib/api/pulse';
import { Card } from '@/components/ui/Card';
import { Activity, Users, Globe, Clock, ArrowUpRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CommonGroundStats } from '@/types';

interface ProjectPulse {
    projectId: string;
    name: string;
    theme: string;
    status: 'operational' | 'degraded' | 'maintenance';
    latency: number; // ms
    stats: CommonGroundStats | null;
    error?: string;
}

export default function ProjectPulseGrid() {
    const { projects } = useProjects();
    const [pulses, setPulses] = useState<ProjectPulse[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPulse = async () => {
        const results = await Promise.all(projects.map(async (p) => {
            const start = performance.now();
            const api = new PulseAPI(p.id);
            try {
                const { data, error } = await api.getStats();
                const end = performance.now();
                return {
                    projectId: p.id,
                    name: p.name,
                    theme: p.theme,
                    status: p.status, // Use context status as source of truth for "maintenance" overrides
                    latency: Math.round(end - start),
                    stats: data,
                    error
                };
            } catch (err) {
                return {
                    projectId: p.id,
                    name: p.name,
                    theme: p.theme,
                    status: 'degraded',
                    latency: 0,
                    stats: null,
                    error: 'Unreachable'
                } as ProjectPulse;
            }
        }));
        setPulses(results);
        setLoading(false);
    };

    useEffect(() => {
        fetchPulse();
        const interval = setInterval(fetchPulse, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [projects]);

    const getThemeColor = (theme: string) => {
        const map: Record<string, string> = {
            green: 'text-green-400',
            blue: 'text-blue-400',
            orange: 'text-orange-400',
            purple: 'text-purple-400',
            pink: 'text-pink-400',
            red: 'text-red-400',
        };
        return map[theme] || 'text-gray-400';
    };

    const getThemeBg = (theme: string) => {
        const map: Record<string, string> = {
            green: 'bg-green-500/10 border-green-500/20',
            blue: 'bg-blue-500/10 border-blue-500/20',
            orange: 'bg-orange-500/10 border-orange-500/20',
            purple: 'bg-purple-500/10 border-purple-500/20',
            pink: 'bg-pink-500/10 border-pink-500/20',
            red: 'bg-red-500/10 border-red-500/20',
        };
        return map[theme] || 'bg-gray-800 border-gray-700';
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="h-40 animate-pulse flex items-center justify-center">
                        <Activity className="w-6 h-6 text-gray-600 animate-spin" />
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    Live Project Pulse
                </h3>
                <span className="text-xs text-gray-500 font-mono">Real-time Latency Check</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {pulses.map((pulse) => (
                    <Card
                        key={pulse.projectId}
                        className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${pulse.status === 'degraded' ? 'border-red-500/40' : ''}`}
                    >
                        {/* Status Light */}
                        <div className={`absolute top-4 right-4 w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${pulse.status === 'operational' ? 'bg-green-500 text-green-500' : 'bg-red-500 text-red-500 animate-pulse'}`} />

                        <div className="mb-4">
                            <div className={`inline-flex p-2 rounded-lg mb-3 ${getThemeBg(pulse.theme)}`}>
                                <Globe className={`w-5 h-5 ${getThemeColor(pulse.theme)}`} />
                            </div>
                            <h4 className="font-bold text-white text-lg">{pulse.name}</h4>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                {pulse.status === 'operational' ? (
                                    <span className="text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Operational</span>
                                ) : (
                                    <span className="text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Issues Detected</span>
                                )}
                                <span className="text-gray-600">|</span>
                                <Clock className="w-3 h-3" /> {pulse.latency}ms
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--card-border)]">
                            <div>
                                <span className="text-xs text-gray-500 block mb-1">Active Users</span>
                                <span className="text-xl font-mono text-white flex items-center gap-2">
                                    {pulse.stats?.active_now || 0}
                                    <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full">LIVE</span>
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block mb-1">Today's Views</span>
                                <span className="text-lg font-mono text-gray-300">
                                    {(pulse.stats?.page_views_24h || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
