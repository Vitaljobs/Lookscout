'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Shield, Users, MessageSquare, TrendingUp, Heart, MessageCircle, Handshake, Sparkles } from 'lucide-react';

interface BaztionMetric {
    metric_type: string;
    value: number;
    percentage: number | null;
    trend: 'up' | 'down' | 'stable' | null;
}

interface MetricCardProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    percentage?: number;
    trend?: 'up' | 'down' | 'stable' | null;
    color: string;
}

function MetricCard({ icon, label, value, percentage, trend, color }: MetricCardProps) {
    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend === 'up') return <TrendingUp className="w-3 h-3 text-green-400" />;
        if (trend === 'down') return <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />;
        return <div className="w-3 h-3 rounded-full bg-gray-400" />;
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 hover:border-gray-600/50 transition-all">
            <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${color}`}>
                    {icon}
                </div>
                {getTrendIcon()}
            </div>
            <div className="space-y-1">
                <p className="text-2xl font-bold text-white">
                    {percentage !== undefined ? `${percentage}%` : value}
                </p>
                <p className="text-xs text-gray-400">{label}</p>
            </div>
        </div>
    );
}

export default function BaztionHealthWidget() {
    const [metrics, setMetrics] = useState<BaztionMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        fetchMetrics();
    }, []);

    async function fetchMetrics() {
        try {
            // Get Baztion project ID
            const { data: project } = await supabase
                .from('projects')
                .select('id')
                .eq('slug', 'baztion')
                .single();

            if (!project) {
                console.error('Baztion project not found');
                setLoading(false);
                return;
            }

            // Get latest metrics
            const { data, error } = await supabase
                .from('baztion_metrics')
                .select('*')
                .eq('project_id', project.id)
                .order('recorded_at', { ascending: false })
                .limit(8);

            if (error) throw error;

            setMetrics(data || []);
        } catch (error) {
            console.error('Error fetching Baztion metrics:', error);
        } finally {
            setLoading(false);
        }
    }

    const getMetric = (type: string) => {
        return metrics.find(m => m.metric_type === type);
    };

    const cultureScore = getMetric('culture_score');
    const activeUsers = getMetric('active_users');
    const feedbackItems = getMetric('feedback_items');
    const engagement = getMetric('engagement');
    const psychSafety = getMetric('psychological_safety');
    const openComm = getMetric('open_communication');
    const teamTrust = getMetric('team_trust');
    const inclusivity = getMetric('inclusivity');

    if (loading) {
        return (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Shield className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Baztion Health</h3>
                        <p className="text-sm text-gray-400">Psychological Safety Platform</p>
                    </div>
                </div>
                <div className="animate-pulse space-y-4">
                    <div className="h-20 bg-gray-800/50 rounded-lg"></div>
                    <div className="h-20 bg-gray-800/50 rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Shield className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Baztion Health</h3>
                        <p className="text-sm text-gray-400">Psychological Safety Platform</p>
                    </div>
                </div>
                <a
                    href="https://baztion.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                    Open Platform →
                </a>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {cultureScore && (
                    <MetricCard
                        icon={<Heart className="w-4 h-4 text-pink-400" />}
                        label="Culture Score"
                        value={cultureScore.value}
                        trend={cultureScore.trend}
                        color="bg-pink-500/20"
                    />
                )}
                {activeUsers && (
                    <MetricCard
                        icon={<Users className="w-4 h-4 text-blue-400" />}
                        label="Active Users"
                        value={activeUsers.value}
                        trend={activeUsers.trend}
                        color="bg-blue-500/20"
                    />
                )}
                {feedbackItems && (
                    <MetricCard
                        icon={<MessageSquare className="w-4 h-4 text-green-400" />}
                        label="Feedback Items"
                        value={feedbackItems.value}
                        trend={feedbackItems.trend}
                        color="bg-green-500/20"
                    />
                )}
                {engagement && (
                    <MetricCard
                        icon={<Sparkles className="w-4 h-4 text-purple-400" />}
                        label="Engagement"
                        value={engagement.value}
                        percentage={engagement.percentage || undefined}
                        trend={engagement.trend}
                        color="bg-purple-500/20"
                    />
                )}
            </div>

            {/* Culture Metrics */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Culture Metrics</h4>

                {psychSafety && (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Psychological Safety</span>
                            <span className="text-white font-medium">{psychSafety.percentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all duration-500"
                                style={{ width: `${psychSafety.percentage}%` }}
                            />
                        </div>
                    </div>
                )}

                {openComm && (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Open Communication</span>
                            <span className="text-white font-medium">{openComm.percentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                                style={{ width: `${openComm.percentage}%` }}
                            />
                        </div>
                    </div>
                )}

                {teamTrust && (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Team Trust</span>
                            <span className="text-white font-medium">{teamTrust.percentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                                style={{ width: `${teamTrust.percentage}%` }}
                            />
                        </div>
                    </div>
                )}

                {inclusivity && (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Inclusivity</span>
                            <span className="text-white font-medium">{inclusivity.percentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                style={{ width: `${inclusivity.percentage}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Status */}
            <div className="mt-6 pt-4 border-t border-gray-800/50">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Platform Status</span>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-green-400 font-medium">Live</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
