'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';
import { ReputationDataPoint } from '@/types/support';
import { createClient } from '@/utils/supabase/client';
import { useProjects } from '@/context/ProjectContext';

// Mock data generator for 30 days of reputation history
const generateMockData = (): ReputationDataPoint[] => {
    // ... same mock data ...
    const data: ReputationDataPoint[] = [];
    const now = new Date();
    let score = 1250;

    for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Simulate organic growth with some variance
        const change = Math.floor(Math.random() * 50) + 10;
        score += change;

        data.push({
            timestamp: date,
            score,
            change,
            reason: i % 7 === 0 ? 'Milestone completed' : undefined,
        });
    }

    return data;
};

export default function ReputationTrendChart() {
    const { selectedProjectId } = useProjects();
    const [data, setData] = useState<ReputationDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLiveData, setIsLiveData] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        loadReputationData();
    }, [selectedProjectId]);

    const loadReputationData = async () => {
        try {
            let query = supabase
                .from('reputation_history')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(30);

            if (selectedProjectId) {
                query = query.eq('project_source', selectedProjectId);
            }

            const { data: historyData, error } = await query;

            if (error) throw error;

            if (historyData && historyData.length > 0) {
                const formattedData: ReputationDataPoint[] = historyData.map((item) => ({
                    timestamp: new Date(item.created_at),
                    score: item.score,
                    change: item.change || 0,
                    reason: item.reason,
                }));
                setData(formattedData);
                setIsLiveData(true);
            } else {
                setData(generateMockData());
                setIsLiveData(false);
            }
        } catch (error) {
            console.error('Error loading reputation data:', error);
            setData(generateMockData());
            setIsLiveData(false);
        } finally {
            setLoading(false);
        }
    };

    const chartData = useMemo(() => {
        return data.map(point => ({
            date: point.timestamp.toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' }),
            score: point.score,
        }));
    }, [data]);

    const currentScore = data[data.length - 1]?.score || 0;
    const previousScore = data[data.length - 8]?.score || 0;
    const weeklyGrowth = currentScore - previousScore;
    const growthPercentage = ((weeklyGrowth / previousScore) * 100).toFixed(1);

    if (loading) {
        return (
            <div className="card relative overflow-hidden flex items-center justify-center h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
        );
    }

    return (
        <div className="card relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-600 rounded-full blur-[60px] opacity-20" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-400" />
                            Reputation Trend
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">Echo Score groei over tijd</p>
                        {!isLiveData && (
                            <p className="text-xs text-yellow-500 mt-1">⚠️ Mock data (geen live sync)</p>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white">{currentScore.toLocaleString()}</div>
                        <div className="flex items-center gap-1 text-sm text-green-400">
                            <TrendingUp className="w-3 h-3" />
                            +{growthPercentage}% deze week
                        </div>
                    </div>
                </div>

                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                            <XAxis
                                dataKey="date"
                                stroke="#9ca3af"
                                style={{ fontSize: '12px' }}
                                tick={{ fill: '#9ca3af' }}
                            />
                            <YAxis
                                stroke="#9ca3af"
                                style={{ fontSize: '12px' }}
                                tick={{ fill: '#9ca3af' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    borderRadius: '8px',
                                    backdropFilter: 'blur(10px)',
                                }}
                                labelStyle={{ color: '#f3f4f6' }}
                                itemStyle={{ color: '#a5b4fc' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="score"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fill="url(#scoreGradient)"
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Stats footer */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-700/50">
                    <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">Hoogste Score</div>
                        <div className="text-sm font-semibold text-white">{Math.max(...data.map(d => d.score)).toLocaleString()}</div>
                    </div>
                    <div className="text-center border-x border-gray-700/50">
                        <div className="text-xs text-gray-400 mb-1">Gem. Groei/Dag</div>
                        <div className="text-sm font-semibold text-green-400">+{Math.floor(weeklyGrowth / 7)}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">Totale Groei</div>
                        <div className="text-sm font-semibold text-indigo-400">+{(currentScore - data[0].score).toLocaleString()}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
