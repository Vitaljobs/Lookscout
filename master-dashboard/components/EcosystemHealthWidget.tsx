'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, TrendingUp, Users } from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';

interface ProjectStats {
    timestamp: Date;
    commonground: number;
    vitaljobs: number;
    'echo-chamber': number;
    lookscout: number;
}

export default function EcosystemHealthWidget() {
    const [data, setData] = useState<ProjectStats[]>([]);
    const [totals, setTotals] = useState({ commonground: 0, vitaljobs: 0, 'echo-chamber': 0, lookscout: 0 });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadEcosystemData();

        // Refresh every 30 seconds
        const interval = setInterval(loadEcosystemData, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadEcosystemData = async () => {
        try {
            // Generate mock data for 24 hours (in production, fetch from analytics)
            const mockData: ProjectStats[] = [];
            const now = new Date();

            for (let i = 23; i >= 0; i--) {
                const timestamp = new Date(now.getTime() - i * 3600000);
                mockData.push({
                    timestamp,
                    commonground: Math.floor(Math.random() * 50) + 20,
                    vitaljobs: Math.floor(Math.random() * 80) + 30,
                    'echo-chamber': Math.floor(Math.random() * 40) + 15,
                    lookscout: Math.floor(Math.random() * 30) + 10,
                });
            }

            setData(mockData);

            // Calculate current totals (last data point)
            const latest = mockData[mockData.length - 1];
            setTotals({
                commonground: latest.commonground,
                vitaljobs: latest.vitaljobs,
                'echo-chamber': latest['echo-chamber'],
                lookscout: latest.lookscout,
            });
        } catch (error) {
            console.error('Error loading ecosystem data:', error);
        } finally {
            setLoading(false);
        }
    };

    const chartData = data.map((point) => ({
        time: point.timestamp.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
        'Common Ground': point.commonground,
        'VitalJobs': point.vitaljobs,
        'Echo Chamber': point['echo-chamber'],
        'Lookscout': point.lookscout,
    }));

    const totalVisitors = totals.commonground + totals.vitaljobs + totals['echo-chamber'] + totals.lookscout;

    const projectColors = {
        'Common Ground': '#10b981',
        'VitalJobs': '#3b82f6',
        'Echo Chamber': '#8b5cf6',
        'Lookscout': '#f59e0b',
    };

    const { selectedProjectId } = useProjects();
    // ... existing ...

    const getOpacity = (projectName: string) => {
        if (!selectedProjectId) return 1;
        // Map simplified IDs to Display Names in this widget
        const map: Record<string, string> = {
            'commonground': 'Common Ground',
            'vitaljobs': 'VitalJobs',
            'vibechain': 'Echo Chamber', // Assuming vibes = echo
            'lookscout': 'Lookscout'
        };
        const activeName = map[selectedProjectId];
        return activeName === projectName ? 1 : 0.1;
    };

    return (
        <div className="card relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-20" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-400" />
                            Ecosystem Health
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">Live bezoekers over alle projecten</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white">{totalVisitors}</div>
                        <div className="text-xs text-gray-400">Totaal online</div>
                    </div>
                </div>

                {/* Project Stats Grid */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    <div className={`bg-green-500/10 border border-green-500/30 rounded-lg p-3 transition-opacity duration-300`} style={{ opacity: getOpacity('Common Ground') }}>
                        <div className="text-xs text-green-400 mb-1">Common Ground</div>
                        <div className="text-xl font-bold text-white">{totals.commonground}</div>
                        <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>+12%</span>
                        </div>
                    </div>

                    <div className={`bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 transition-opacity duration-300`} style={{ opacity: getOpacity('VitalJobs') }}>
                        <div className="text-xs text-blue-400 mb-1">VitalJobs</div>
                        <div className="text-xl font-bold text-white">{totals.vitaljobs}</div>
                        <div className="flex items-center gap-1 text-xs text-blue-400 mt-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>+8%</span>
                        </div>
                    </div>

                    <div className={`bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 transition-opacity duration-300`} style={{ opacity: getOpacity('Echo Chamber') }}>
                        <div className="text-xs text-purple-400 mb-1">Echo Chamber</div>
                        <div className="text-xl font-bold text-white">{totals['echo-chamber']}</div>
                        <div className="flex items-center gap-1 text-xs text-purple-400 mt-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>+15%</span>
                        </div>
                    </div>

                    <div className={`bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 transition-opacity duration-300`} style={{ opacity: getOpacity('Lookscout') }}>
                        <div className="text-xs text-orange-400 mb-1">Lookscout</div>
                        <div className="text-xl font-bold text-white">{totals.lookscout}</div>
                        <div className="flex items-center gap-1 text-xs text-orange-400 mt-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>+5%</span>
                        </div>
                    </div>
                </div>

                {/* Combined Chart */}
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                {Object.entries(projectColors).map(([name, color]) => (
                                    <linearGradient key={name} id={`gradient-${name}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                            <XAxis
                                dataKey="time"
                                stroke="#9ca3af"
                                style={{ fontSize: '11px' }}
                                tick={{ fill: '#9ca3af' }}
                            />
                            <YAxis
                                stroke="#9ca3af"
                                style={{ fontSize: '11px' }}
                                tick={{ fill: '#9ca3af' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: '8px',
                                    backdropFilter: 'blur(10px)',
                                }}
                                labelStyle={{ color: '#f3f4f6' }}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '12px' }}
                                iconType="circle"
                            />
                            <Area
                                type="monotone"
                                dataKey="Common Ground"
                                stroke="#10b981"
                                strokeWidth={2}
                                strokeOpacity={getOpacity('Common Ground')}
                                fillOpacity={getOpacity('Common Ground')}
                                fill="url(#gradient-Common Ground)"
                                animationDuration={1000}
                            />
                            <Area
                                type="monotone"
                                dataKey="VitalJobs"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                strokeOpacity={getOpacity('VitalJobs')}
                                fillOpacity={getOpacity('VitalJobs')}
                                fill="url(#gradient-VitalJobs)"
                                animationDuration={1000}
                            />
                            <Area
                                type="monotone"
                                dataKey="Echo Chamber"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                strokeOpacity={getOpacity('Echo Chamber')}
                                fillOpacity={getOpacity('Echo Chamber')}
                                fill="url(#gradient-Echo Chamber)"
                                animationDuration={1000}
                            />
                            <Area
                                type="monotone"
                                dataKey="Lookscout"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                strokeOpacity={getOpacity('Lookscout')}
                                fillOpacity={getOpacity('Lookscout')}
                                fill="url(#gradient-Lookscout)"
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Status footer */}
                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-blue-400">
                            <Users className="w-4 h-4" />
                            <span>All Systems Operational</span>
                        </div>
                        <span className="text-gray-500">Last updated: {new Date().toLocaleTimeString('nl-NL')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
