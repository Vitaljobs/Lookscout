'use client';

import React from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function TrendWidget() {
    const trends = [
        { label: 'Common Ground', growth: 12.5, color: 'text-green-400' },
        { label: 'VIBECHAIN', growth: 8.3, color: 'text-blue-400' },
        { label: 'VitalJobs', growth: 15.2, color: 'text-orange-400' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {trends.map((trend) => (
                <Card
                    key={trend.label}
                    className="flex items-center justify-between hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group cursor-pointer"
                >
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">{trend.label}</p>
                        <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold text-white`}>{trend.growth}%</span>
                            <span className={`text-xs ${trend.color} flex items-center`}>
                                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                                24h
                            </span>
                        </div>
                    </div>
                    <div className={`p-2.5 rounded-lg bg-[var(--sidebar-bg)] border border-[var(--card-border)] group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors`}>
                        <TrendingUp className={`w-5 h-5 text-gray-400 group-hover:text-blue-400`} />
                    </div>
                </Card>
            ))}
        </div>
    );
}
