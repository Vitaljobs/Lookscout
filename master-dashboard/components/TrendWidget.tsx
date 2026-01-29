'use client';

import React from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

export default function TrendWidget() {
    const trends = [
        { label: 'Common Ground', growth: 12.5, color: 'text-green-400' },
        { label: 'VIBECHAIN', growth: 8.3, color: 'text-blue-400' },
        { label: 'VitalJobs', growth: 15.2, color: 'text-orange-400' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {trends.map((trend) => (
                <div key={trend.label} className="bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-xl flex items-center justify-between hover:border-[var(--electric-blue)] transition-colors group">
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">{trend.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xl font-bold ${trend.color}`}>{trend.growth}%</span>
                            <span className="text-xs text-gray-500">vs yesterday</span>
                        </div>
                    </div>
                    <div className={`p-2 rounded-full bg-[var(--sidebar-bg)] group-hover:shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all`}>
                        <ArrowUpRight className={`w-5 h-5 ${trend.color}`} />
                    </div>
                </div>
            ))}
        </div>
    );
}
