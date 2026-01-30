'use client';

import React, { useEffect, useState } from 'react';
import { useProjects } from '@/context/ProjectContext';
import { Trophy, TrendingUp } from 'lucide-react';

export default function ReputationCounter() {
    const { projects } = useProjects();
    const [count, setCount] = useState(0);

    // Calculate total Echo Score from all projects
    // Use active_now if available (from CommonGroundStats), otherwise default to 0
    const targetScore = projects.reduce((acc, p) => acc + (p.stats?.active_now || 0) * 10 + 1250, 0);
    // Base 1250 per project + 10x per user for dynamic effect

    useEffect(() => {
        // Animate the counter
        let start = 0;
        const duration = 2000;
        const stepTime = 20;
        const steps = duration / stepTime;
        const increment = targetScore / steps;

        const timer = setInterval(() => {
            start += increment;
            if (start >= targetScore) {
                setCount(targetScore);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [targetScore]);

    return (
        <div className="card bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-500/30 flex items-center justify-between p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-4 z-10">
                <div className="p-3 bg-indigo-500/20 rounded-full text-indigo-400 ring-1 ring-indigo-500/50">
                    <Trophy className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Cumulative Reputation</h3>
                    <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-1">
                        {count.toLocaleString()}
                        <span className="text-sm font-normal text-indigo-300">XP</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end z-10">
                <div className="flex items-center text-green-400 text-sm font-bold bg-green-500/10 px-2 py-1 rounded">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +2.4%
                </div>
                <div className="text-xs text-gray-500 mt-1">Last 24h</div>
            </div>

            {/* Background Glow */}
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-600 rounded-full blur-[60px] opacity-30" />
        </div>
    );
}
