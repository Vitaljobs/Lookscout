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
            // Fetch last 24 hours of health logs for all projects
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            const { data: healthLogs, error } = await supabase
                .from('project_health_logs')
                .select('*')
                .gte('created_at', twentyFourHoursAgo)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (healthLogs && healthLogs.length > 0) {
                // Group by hour and project
                const hourlyData: Map<string, ProjectStats> = new Map();

                healthLogs.forEach((log) => {
                    const hour = new Date(log.created_at);
                    hour.setMinutes(0, 0, 0);
                    const hourKey = hour.toISOString();

                    if (!hourlyData.has(hourKey)) {
                        hourlyData.set(hourKey, {
                            timestamp: hour,
                            commonground: 0,
                            vitaljobs: 0,
                            'echo-chamber': 0,
                            lookscout: 0,
                        });
                    }

                    const stats = hourlyData.get(hourKey)!;
                    if (log.project_id === 'commonground') stats.commonground = log.active_users || 0;
                    if (log.project_id === 'vitaljobs') stats.vitaljobs = log.active_users || 0;
                    if (log.project_id === 'echo-chamber') stats['echo-chamber'] = log.active_users || 0;
                    if (log.project_id === 'lookscout') stats.lookscout = log.active_users || 0;
                });

                const chartData = Array.from(hourlyData.values()).sort(
                    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
                );

                setData(chartData);

                // Calculate current totals (last data point)
                if (chartData.length > 0) {
                    const latest = chartData[chartData.length - 1];
                    setTotals({
                        commonground: latest.commonground,
                        vitaljobs: latest.vitaljobs,
                        'echo-chamber': latest['echo-chamber'],
                        lookscout: latest.lookscout,
                    });
                }
            } else {
                // No data - empty state
                setData([]);
                setTotals({ commonground: 0, vitaljobs: 0, 'echo-chamber': 0, lookscout: 0 });
            }
        } catch (error) {
            console.error('Error loading ecosystem data:', error);
            setData([]);
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

    const totalTraffic = totals.commonground + totals.vitaljobs + totals['echo-chamber'] + totals.lookscout;

    return (
        <div className="card col-span-2 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-20" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-400" />
                            <h3 className="text-lg font-semibold text-white">Combined Traffic Volume (24h)</h3>
                        </div>
                        <div className="flex gap-4 mt-2">
                            <div>
                                <span className="text-xs text-gray-400">COMMON GROUND</span>
                                <p className="text-sm font-bold text-green-400">{totals.commonground}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400">VIBECHAIN</span>
                                <p className="text-sm font-bold text-yellow-400">{totals['echo-chamber']}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400">VITAL JOBS</span>
                                <p className="text-sm font-bold text-blue-400">{totals.vitaljobs}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-400">Live Update</div>
                        <div className="text-sm text-green-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Active
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-[200px]">
                    {data.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Geen data beschikbaar</p>
                                <p className="text-xs mt-1">Wacht op eerste logs...</p>
                            </div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCommon" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorVital" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorEcho" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                                <XAxis dataKey="time" stroke="#9ca3af" style={{ fontSize: '11px' }} />
                                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Common Ground"
                                    stackId="1"
                                    stroke="#10b981"
                                    fill="url(#colorCommon)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="VitalJobs"
                                    stackId="1"
                                    stroke="#3b82f6"
                                    fill="url(#colorVital)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Echo Chamber"
                                    stackId="1"
                                    stroke="#eab308"
                                    fill="url(#colorEcho)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}
