'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useProjects } from '@/context/ProjectContext';
import React, { useState, useEffect } from 'react';
import { PulseAPI } from '@/lib/api/pulse';

const getThemeHex = (theme: string) => {
    const map: Record<string, string> = {
        green: '#10b981', blue: '#3b82f6', orange: '#f59e0b', purple: '#a855f7', pink: '#ec4899', red: '#ef4444'
    };
    return map[theme] || '#9ca3af';
};

export default function MasterBarChart() {
    const { projects } = useProjects();
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const dataPromises = projects.map(async (project) => {
                try {
                    const api = new PulseAPI(project.id);
                    const { data, isLive } = await api.getStats();

                    // Use real data if live, otherwise mock/fallback
                    // Note: If falling back to mock in PulseAPI, it returns MOCK_STATS
                    return {
                        name: project.name.split(' ')[0],
                        users: data.page_views_24h || 0,
                        color: getThemeHex(project.theme),
                        isLive
                    };
                } catch (e) {
                    return {
                        name: project.name.split(' ')[0],
                        users: 0,
                        color: getThemeHex(project.theme),
                        isLive: false
                    };
                }
            });

            const results = await Promise.all(dataPromises);
            setChartData(results);
        };

        fetchData();
        // Poll every 30 seconds for traffic updates
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [projects]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-3 rounded-lg shadow-xl">
                    <p className="font-bold text-white mb-1">{label}</p>
                    <p className="text-sm text-gray-400">
                        24h Traffic: <span className="text-white font-mono">{payload[0].value.toLocaleString()}</span>
                    </p>
                    {!payload[0].payload.isLive && (
                        <p className="text-xs text-orange-500 mt-1">Mock Data (Offline)</p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="users" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
