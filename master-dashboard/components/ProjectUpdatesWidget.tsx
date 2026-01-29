'use client';

import { useProjects } from '@/context/ProjectContext';
import { RefreshCw, CheckCircle2, Zap } from 'lucide-react';

export default function ProjectUpdatesWidget() {
    const { projects } = useProjects();

    const getUpdateStatus = (name: string) => {
        if (name.includes('Common')) return "v1.2.0 Live • Growth +12%";
        if (name.includes('VIBE')) return "API Optimized • Latency <40ms";
        if (name.includes('Vital')) return "Matching Algo v2.1 Active";
        return "System Operational";
    };

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-tr-3xl p-6 relative overflow-hidden group hover:border-[var(--electric-blue)] transition-all duration-300">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-all" />

            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-[var(--electric-blue)]" />
                    Live Updates
                </h3>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                    Real-time
                </span>
            </div>

            <div className="space-y-4">
                {projects.map((p) => (
                    <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--sidebar-bg)] border border-[var(--card-border)] hover:border-blue-500/30 transition-colors">
                        <div className={`mt-1 w-2 h-2 rounded-full ${p.status === 'operational' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-500'}`} />
                        <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                                {p.name}
                                {p.name.includes('Common') && <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                            </div>
                            <div className="text-xs text-blue-200/80 mt-1 font-mono">
                                {getUpdateStatus(p.name)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
