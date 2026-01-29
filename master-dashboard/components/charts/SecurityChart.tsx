'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import React, { useState, useEffect } from 'react';

export default function SecurityChart() {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        // Mock security data - mostly low, with random spikes
        const generateData = () => {
            const now = new Date();
            const points = [];
            for (let i = 24; i >= 0; i--) {
                const time = new Date(now.getTime() - i * 3600000); // Hourly
                const isSpike = Math.random() > 0.9;
                const value = isSpike ? Math.floor(Math.random() * 50) + 20 : Math.floor(Math.random() * 5); // mostly quiet

                points.push({
                    time: `${time.getHours()}:00`,
                    value: value
                });
            }
            setData(points);
        };

        generateData();
        const interval = setInterval(generateData, 30000);
        return () => clearInterval(interval);
    }, []);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[var(--card-bg)] border border-red-500/50 p-3 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                    <p className="font-bold text-red-500 mb-2">{label}</p>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Threats Blocked:</span>
                        <span className="text-white font-mono">{payload[0].value}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-full min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#ef4444', fontSize: 10, opacity: 0.7 }}
                        interval={4}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ef4444', strokeWidth: 1 }} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#ef4444"
                        fill="url(#colorThreats)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
