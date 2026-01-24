'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import StatCard from '@/components/StatCard';
import LiveUsersTable from '@/components/LiveUsersTable';
import { StatCardData } from '@/types';
import { commonGroundAPI } from '@/lib/api/commonground';
import { Activity, Globe, Server, Users, AlertCircle } from 'lucide-react';
import { getApiKey } from '@/lib/storage';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
    // Unwrap params using React.use() or await in async component
    // Since this is a client component, we handle promise unwrapping carefully
    const [slug, setSlug] = useState<string>('');

    useEffect(() => {
        params.then(p => setSlug(p.slug));
    }, [params]);

    const [stats, setStats] = useState<StatCardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasKey, setHasKey] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [errorData, setErrorData] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (slug) {
            checkKeyAndLoadStats();
        }
    }, [slug]);

    const checkKeyAndLoadStats = async () => {
        const key = getApiKey('commonground') || process.env.NEXT_PUBLIC_PULSE_API_KEY;
        setHasKey(!!key);

        // Always load stats, mocking if no key provided in dev mode
        loadStats();
    };

    const loadStats = async () => {
        try {
            console.log('API Debug:', commonGroundAPI.getDebugInfo());
            setLoading(true);
            const { data, isLive, error } = await commonGroundAPI.getStats();
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

    if (!slug) return null;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
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
                        Real-time monitoring and analytics
                    </p>
                </div>

                <div className="flex gap-3">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Main Chart Area Placeholder */}
                <div className="card lg:col-span-2 min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Traffic Overview</h3>
                        <select className="bg-[var(--sidebar-bg)] text-gray-400 text-sm border border-[var(--card-border)] rounded-md px-2 py-1 outline-none">
                            <option>Last 24 Hours</option>
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-[var(--card-border)] rounded-lg">
                        <p className="text-gray-500">Traffic Chart Visualization (Ready for Recharts)</p>
                    </div>
                </div>

                {/* Infrastructure Stats */}
                <div className="space-y-6">
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
            </div>

            {/* Live Users Table */}
            <LiveUsersTable />
        </div>
    );
}
