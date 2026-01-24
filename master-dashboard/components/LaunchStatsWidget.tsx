'use client';

import React from 'react';
import { Rocket, TrendingUp, Users } from 'lucide-react';

export default function LaunchStatsWidget() {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                    <Rocket className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-purple-200 uppercase">Launch Velocity</span>
                </div>
                <div className="text-2xl font-bold text-white">
                    +48<span className="text-sm font-normal text-purple-300">/hr</span>
                </div>
                <div className="mt-1 text-xs text-gray-400">
                    Signups trend is <span className="text-green-400">explosive</span>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-bold text-green-200 uppercase">Total Access</span>
                </div>
                <div className="text-2xl font-bold text-white">
                    1,284
                </div>
                <div className="mt-1 text-xs text-gray-400">
                    Since launch (24h)
                </div>
            </div>
        </div>
    );
}
