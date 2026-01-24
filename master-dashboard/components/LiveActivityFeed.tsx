'use client';

import React, { useState, useEffect } from 'react';
import { PulseAPI } from '@/lib/api/pulse';
import { ActivityFeedItem } from '@/types';
import { Zap, User, Smile, CheckCircle, Rocket } from 'lucide-react';

export default function LiveActivityFeed({ projectId }: { projectId?: string }) {
    const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadActivity();
        const interval = setInterval(loadActivity, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, [projectId]);

    const loadActivity = async () => {
        try {
            const api = new PulseAPI(projectId || 'commonground'); // Default to commonground or generic
            const data = await api.getRecentActivity();
            setActivities(data);
        } catch (error) {
            console.error('Failed to load activity', error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (action: string) => {
        switch (action) {
            case 'Checked In': return <Smile className="w-4 h-4 text-green-400" />;
            case 'New Signup': return <User className="w-4 h-4 text-blue-400" />;
            case 'Deployment': return <Rocket className="w-4 h-4 text-purple-400" />;
            default: return <Zap className="w-4 h-4 text-yellow-400" />;
        }
    };

    const getTimeAgo = (date: Date) => {
        const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000);
        if (diff < 1) return 'Just now';
        return `${diff}m ago`;
    };

    return (
        <div className="card h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Live Activity
                </h3>
                <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-500 animate-pulse">
                    LIVE
                </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                {loading ? (
                    <div className="text-center text-gray-500 text-sm py-8">Connecting to stream...</div>
                ) : (
                    activities.map((item) => (
                        <div key={item.id} className="flex gap-3 items-start p-3 rounded-lg bg-[var(--sidebar-bg)] border border-[var(--card-border)] animate-in slide-in-from-right duration-300">
                            <div className="mt-1">
                                {getIcon(item.action)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-white truncate">{item.user}</p>
                                    <span className="text-xs text-gray-500">{getTimeAgo(item.timestamp)}</span>
                                </div>
                                <p className="text-xs text-gray-400">{item.action}</p>
                                {item.metadata?.note && (
                                    <p className="text-xs text-gray-300 mt-1 italic">"{item.metadata.note}"</p>
                                )}
                                {item.metadata?.mood && (
                                    <div className="mt-1 flex items-center gap-1">
                                        <div className="h-1.5 flex-1 bg-gray-700 rounded-full max-w-[60px] overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-red-500 to-green-500"
                                                style={{ width: `${(item.metadata.mood / 10) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-gray-400">{item.metadata.mood}/10</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {activities.length === 0 && !loading && (
                    <div className="text-center text-gray-500 text-sm py-4">No recent activity</div>
                )}
            </div>
        </div>
    );
}
