'use client';

import React, { useEffect, useState } from 'react';
import StatCard from '@/components/StatCard';
import LiveUsersTable from '@/components/LiveUsersTable';
import { StatCardData } from '@/types';
import { PulseAPI } from '@/lib/api/pulse';
import ProjectAreaChart from '@/components/charts/ProjectAreaChart';
import SecurityChart from '@/components/charts/SecurityChart';
import HoloGlobe from '@/components/HoloGlobe';
import ReputationCounter from '@/components/ReputationCounter';
import { Activity, Globe, Server, AlertCircle, ShieldAlert } from 'lucide-react';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
    const [slug, setSlug] = useState<string>('');
    const [stats, setStats] = useState<StatCardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasKey, setHasKey] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [errorData, setErrorData] = useState<string | undefined>(undefined);

    useEffect(() => {
        params.then(p => setSlug(p.slug));
    }, [params]);

    useEffect(() => {
        if (slug) {
            checkKeyAndLoadStats();
        }
    }, [slug]);

    const checkKeyAndLoadStats = async () => {
        // Initialize dynamic API for this project
        const api = new PulseAPI(slug);

        // Check if we have a key (generic check, specific logic inside API)
        // Accessing private property logic via debug info or similar if needed, 
        // but here we just blindly load as the API handles fallbacks.
        const debug = api.getDebugInfo();
        setHasKey(debug.hasKey);

        loadStats(api);
    };

    const loadStats = async (api: PulseAPI) => {
        try {
            console.log('API Debug:', api.getDebugInfo());
            setLoading(true);
            const { data, isLive, error } = await api.getStats();
            setIsLive(isLive);
            setErrorData(error);

            const statCards: StatCardData[] = [
                {
                    title: 'Total Users',
                    value: data.total_users,
                    change: 12.5,
                    trend: 'up',
                    badge: { text: 'Growth', color: 'green' }
                },
                {
                    title: 'Live Visitors',
                    value: data.active_now,
                    badge: { text: 'Live', color: 'red' }
                },
                {
                    title: 'Page Views (24h)',
                    value: data.page_views_24h,
                    change: 8.2,
                    trend: 'up',
                    badge: { text: 'Native', color: 'blue' }
                },
                {
                    title: 'System Status',
                    value: 'Optimal',
                    badge: { text: '99.9%', color: 'green' }
                }
            ];

            setStats(statCards);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    // Theme Logic
    const themeColor = slug === 'commonground' ? '#10b981' :
        slug === 'vibechain' ? '#3b82f6' :
            slug === 'vitaljobs' ? '#f59e0b' : '#ffffff';

    const themeClass = slug === 'commonground' ? 'text-green-500 bg-green-500/10 border-green-500/20' :
        slug === 'vibechain' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20' :
            slug === 'vitaljobs' ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' : '';

    if (!slug) return null;

    return (
        <div key={slug} className="p-8 animate-flicker">
            {/* Header */}
            <div className={`mb-8 flex items-center justify-between border-b pb-6 transition-colors ${slug === 'commonground' ? 'border-green-500/20' :
                slug === 'vibechain' ? 'border-blue-500/20' :
                    slug === 'vitaljobs' ? 'border-orange-500/20' : 'border-[var(--card-border)]'
                }`}>
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-white capitalize">
                            {slug.replace('-', ' ')}
                        </h1>
                        <div
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold cursor-help transition-colors ${isLive ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-orange-500/20 text-orange-500 border border-orange-500/30'}`}
                            title={errorData || (isLive ? "Connection Established" : "Using Mock Data")}
                        >
                            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`} />
                            {isLive ? 'Live Connection' : 'Mock Data'}
                            {!isLive && errorData && <AlertCircle className="w-3 h-3 ml-1" />}
                        </div>
                    </div>
                    <p className="text-gray-400">
                        Real-time monitoring and analytics for <span style={{ color: themeColor }}>{slug}</span>
                    </p>
                </div>

                <div className="flex gap-3">
                    {loading && (
                        <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 text-sm animate-pulse ${themeClass}`}>
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColor }} />
                            Processing...
                        </div>
                    )}
                    <div className="px-4 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center gap-2 text-sm text-gray-400">
                        <div className={`w-2 h-2 rounded-full ${hasKey ? 'bg-green-500' : 'bg-red-500'}`} />
                        {hasKey ? 'API Key Active' : 'No API Key'}
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="card h-32 animate-pulse">
                            <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
                            <div className="h-8 bg-gray-700 rounded w-3/4"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <StatCard key={index} data={stat} />
                    ))}
                </div>
            )}

            {/* v2.0 Features Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {/* Main Chart Area */}
                <div className="card lg:col-span-3 min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Traffic Overview</h3>
                        <div className="flex items-center gap-2">
                            <div className="text-xs text-[var(--electric-blue)] bg-[var(--electric-blue)]/10 px-2 py-1 rounded border border-[var(--electric-blue)]/20 animate-pulse">
                                AI Forecast Active
                            </div>
                            <select className="bg-[var(--sidebar-bg)] text-gray-400 text-sm border border-[var(--card-border)] rounded-md px-2 py-1 outline-none">
                                <option>Last 24 Hours</option>
                                <option>Last 7 Days</option>
                            </select>
                        </div>
                    </div>
                    {/* Using MasterAreaChart style for project but keeping project data logic if possible, 
                        or we can reuse MasterAreaChart if it supports single project mode or just sticking to ProjectAreaChart for now 
                        but wrapping it in better UI 
                    */}
                    <div className="h-[320px] w-full">
                        <ProjectAreaChart slug={slug} theme={slug === 'commonground' ? 'green' : slug === 'vibechain' ? 'blue' : 'orange'} />
                    </div>
                </div>

                {/* Security Watch (New) */}
                <div className="card border-red-500/20 bg-gradient-to-b from-[var(--element-bg)] to-red-950/10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
                            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">Security</h3>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    </div>
                    <div className="h-[200px] w-full">
                        <SecurityChart />
                    </div>
                </div>
            </div>

            {/* Live Global Pulse Map (Replaces static table) */}
            <div className="mb-8">
                <HoloGlobe projectId={slug} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Reputation & Infrastructure */}
                <div className="space-y-6">
                    <ReputationCounter />
                    <div className="card">
                        <h3 className="text-lg font-semibold text-white mb-4">Infrastructure</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--sidebar-bg)]">
                                <div className="flex items-center gap-3">
                                    <Server className="w-5 h-5 text-blue-500" />
                                    <div>
                                        <div className="text-sm font-medium text-white">API Server</div>
                                        <div className="text-xs text-green-500">Operational</div>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-gray-300">42ms</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--sidebar-bg)]">
                                <div className="flex items-center gap-3">
                                    <Globe className="w-5 h-5 text-purple-500" />
                                    <div>
                                        <div className="text-sm font-medium text-white">CDN Status</div>
                                        <div className="text-xs text-green-500">Operational</div>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-gray-300">100%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Users Table (Keep as secondary data view below map) */}
                <div className="lg:col-span-2">
                    <LiveUsersTable />
                </div>
            </div>
        </div>
    );
}
