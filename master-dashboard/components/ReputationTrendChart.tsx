'use client';

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { ReputationDataPoint } from '@/types/support';

// Mock data generator for 30 days of reputation history
const generateMockData = (): ReputationDataPoint[] => {
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
    const data = useMemo(() => generateMockData(), []);

    const chartData = data.map(point => ({
        date: point.timestamp.toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' }),
        score: point.score,
    }));

    const currentScore = data[data.length - 1]?.score || 0;
    const previousScore = data[data.length - 8]?.score || 0;
    const weeklyGrowth = currentScore - previousScore;
    const growthPercentage = ((weeklyGrowth / previousScore) * 100).toFixed(1);

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
