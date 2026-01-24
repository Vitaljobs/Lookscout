'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useProjects } from '@/context/ProjectContext';

const getThemeHex = (theme: string) => {
    const map: Record<string, string> = {
        green: '#10b981', blue: '#3b82f6', orange: '#f59e0b', purple: '#a855f7', pink: '#ec4899', red: '#ef4444'
    };
    return map[theme] || '#9ca3af';
};

export default function MasterBarChart() {
    const { projects } = useProjects();

    const data = projects.map(p => ({
        name: p.name.split(' ')[0], // Short name
        users: Math.floor(Math.random() * 5000) + 2000, // Mock dynamic data for now
        color: getThemeHex(p.theme)
    }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-3 rounded-lg shadow-xl">
                    <p className="font-bold text-white mb-1">{label}</p>
                    <p className="text-sm text-gray-400">
                        Users: <span className="text-white font-mono">{payload[0].value.toLocaleString()}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
