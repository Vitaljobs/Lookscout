'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import React, { useState, useEffect } from 'react';
import { PulseAPI } from '@/lib/api/pulse';

interface ProjectAreaChartProps {
    slug: string;
    theme: string;
}

const getThemeHex = (theme: string) => {
    const map: Record<string, string> = {
        green: '#10b981', blue: '#3b82f6', orange: '#f59e0b', purple: '#a855f7', pink: '#ec4899', red: '#ef4444'
    };
    return map[theme] || '#9ca3af';
};

export default function ProjectAreaChart({ slug, theme }: ProjectAreaChartProps) {
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const api = new PulseAPI(slug);
            let totalViews = 0;
            try {
                const { data } = await api.getStats();
                totalViews = data.page_views_24h || 0;
            } catch (e) {
                console.error(e);
            }

            // Generate 24 hourly data points for this specific project
            const hours = Array.from({ length: 24 }, (_, i) => {
                const hour = new Date();
                hour.setHours(hour.getHours() - (23 - i));

                const timeStr = hour.getHours() + ':00';

                // Distribute total views across 24h with a random curve
                const base = totalViews / 24;
                const noise = (Math.random() - 0.5) * base * 0.8; // +/- 40% noise for variation
                const value = Math.max(0, Math.floor(base + noise));

                return {
                    time: timeStr,
                    value: value
                };
            });

            setChartData(hours);
        };

        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [slug]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-3 rounded-lg shadow-xl">
                    <p className="font-bold text-white mb-2">{label}</p>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Views:</span>
                        <span className="text-white font-mono">{payload[0].value}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    const color = getThemeHex(theme);

    return (
        <div className="w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`gradient-${slug}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        dy={10}
                        interval={3}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        fill={`url(#gradient-${slug})`}
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
