'use client';

import React from 'react';
import { Activity, Database, Share2, Zap } from 'lucide-react';

export default function AntigravityMonitor() {
    return (
        <div className="card relative overflow-hidden group border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl shrink-0">
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            <Database className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Antigravity Monitor</h3>
                            <p className="text-[10px] text-gray-400">Data Orchestration Layer</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-green-400">SYNCED</span>
                    </div>
                </div>

                {/* Core Visualization */}
                <div className="flex-1 flex items-center justify-center py-4">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        {/* Orbitals */}
                        <div className="absolute inset-0 border border-indigo-500/30 rounded-full animate-[spin_3s_linear_infinite]"></div>
                        <div className="absolute inset-2 border border-purple-500/30 rounded-full animate-[spin_5s_linear_infinite_reverse]"></div>
                        <div className="absolute inset-6 border border-blue-500/30 rounded-full animate-[ping_3s_linear_infinite]"></div>

                        {/* Core */}
                        <div className="absolute w-8 h-8 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center animate-pulse">
                            <Zap className="w-4 h-4 text-white fill-current" />
                        </div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2 rounded bg-black/20 border border-white/5">
                        <div className="text-[10px] text-gray-500 mb-0.5">Gravity Well</div>
                        <div className="text-xs font-mono text-purple-300">STABLE</div>
                    </div>
                    <div className="p-2 rounded bg-black/20 border border-white/5">
                        <div className="text-[10px] text-gray-500 mb-0.5">Node Harmony</div>
                        <div className="text-xs font-mono text-blue-300">100%</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
