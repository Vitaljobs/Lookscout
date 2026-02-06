'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';
import { ReputationDataPoint } from '@/types/support';
import { createClient } from '@/utils/supabase/client';
import { useProjects } from '@/context/ProjectContext';
import { Card } from '@/components/ui/Card';

export default function ReputationTrendChart() {
    const [data, setData] = useState<ReputationDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLiveData, setIsLiveData] = useState(false);
    const { selectedProjectId } = useProjects();
    const supabase = createClient();

    useEffect(() => {
        loadReputationData();

        // Subscribe to real-time updates
        const channel = supabase
            .channel('project-health-logs')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'project_health_logs',
                },
                () => {
                    loadReputationData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedProjectId]);

    const loadReputationData = async () => {
        try {
            let query = supabase
                .from('project_health_logs')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(30);

            if (selectedProjectId) {
                query = query.eq('project_id', selectedProjectId);
            }

            const { data: historyData, error } = await query;

            if (error) throw error;

            if (historyData && historyData.length > 0) {
                const formattedData: ReputationDataPoint[] = historyData.map((item) => ({
                    timestamp: new Date(item.created_at),
                    score: item.health_score,
                    change: item.sentiment_score ? item.sentiment_score - item.health_score : 0,
                    reason: `Health: ${item.health_score}% | Sentiment: ${item.sentiment_score || 'N/A'}%`,
                }));
                setData(formattedData);
                setIsLiveData(true);
            } else {
                // No data yet - show empty state
                setData([]);
                setIsLiveData(true);
            }
        } catch (error) {
            console.error('Error loading reputation data:', error);
            setData([]);
            setIsLiveData(false);
        } finally {
            setLoading(false);
        }
    };

    const currentScore = useMemo(() => {
        if (data.length === 0) return 0;
        return data[data.length - 1].score;
    }, [data]);

    const scoreChange = useMemo(() => {
        if (data.length < 2) return 0;
        return data[data.length - 1].score - data[data.length - 2].score;
    }, [data]);

    if (loading) {
        return (
            <Card className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-600 rounded-full blur-[60px] opacity-20" />

            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                            <h3 className="text-lg font-semibold text-white">
                                Project Health Trend
                            </h3>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">Live gezondheidscore over tijd</p>
                        {isLiveData && (
                            <p className="text-xs text-green-500 mt-1">✅ Live data (real-time sync)</p>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white">{currentScore.toLocaleString()}</div>
                        <div className={`flex items-center gap-1 text-sm ${scoreChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            <TrendingUp className="w-3 h-3" />
                            <span>{scoreChange > 0 ? '+' : ''}{scoreChange.toFixed(0)}%</span>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="flex-1 min-h-0">
                    {data.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Geen data beschikbaar</p>
                                <p className="text-xs mt-1">Wacht op eerste health log...</p>
                            </div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={(value) => {
                                        const date = new Date(value);
                                        return `${date.getDate()}/${date.getMonth() + 1}`;
                                    }}
                                    stroke="#9ca3af"
                                    style={{ fontSize: '11px' }}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    style={{ fontSize: '11px' }}
                                    domain={[0, 100]}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                    }}
                                    labelStyle={{ color: '#9ca3af' }}
                                    itemStyle={{ color: '#a855f7' }}
                                    labelFormatter={(value) => {
                                        const date = new Date(value);
                                        return date.toLocaleDateString('nl-NL', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        });
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#a855f7"
                                    strokeWidth={2}
                                    fill="url(#colorScore)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </Card>
    );
}
