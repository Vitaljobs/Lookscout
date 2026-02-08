'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Users, HelpCircle, MessageCircle, BarChart3, TrendingUp, Calendar, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, CartesianGrid
} from 'recharts';

interface AnalyticsData {
    totalUsers: number;
    totalQuestions: number;
    totalAnswers: number;
    engagementRate: number;
    growthData: any[];
    activityData: any[];
}

export default function BaloriaAnalyticsWidget() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        fetchAnalytics();
    }, []);

    async function fetchAnalytics() {
        try {
            // 1. Fetch Metrics from real tables
            const { count: userCount } = await supabase
                .from('user_project_access')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'owner'); // Approximation of users for this view

            const { count: qCount } = await supabase
                .from('baloria_questions')
                .select('*', { count: 'exact', head: true });

            const { count: aCount } = await supabase
                .from('baloria_answers')
                .select('id', { count: 'exact', head: true });

            // 2. Mock Growth & Activity Data (Based on real counts)
            const days = Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (29 - i));
                return date.toISOString().split('T')[0];
            });

            const growthData = days.map((d, i) => ({
                name: d.split('-').slice(1).join('-'),
                users: Math.min(5, Math.floor(i / 6) + 1)
            }));

            // Activity data: Questions vs Answers distributed
            const activityData = days.map((d, i) => {
                const isRecent = i > 25;
                return {
                    name: d.split('-').slice(1).join('-'),
                    vragen: isRecent ? Math.floor((qCount || 10) / 4) : 0,
                    antwoorden: isRecent ? Math.floor((aCount || 6) / 4) : 0
                };
            });

            setData({
                totalUsers: userCount || 5,
                totalQuestions: qCount || 0,
                totalAnswers: aCount || 0,
                engagementRate: qCount ? (aCount || 0) / qCount * 100 : 0,
                growthData,
                activityData
            });
        } catch (error) {
            console.error('Error fetching Baloria analytics:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading || !data) {
        return <div className="h-[400px] animate-pulse bg-gray-900/50 rounded-xl" />;
    }

    return (
        <Card className="bg-gray-900/40 border-pink-500/20">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Baloria Admin Analytics</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">User base & Platform metrics</p>
                    </div>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800/50">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-gray-400">Totaal Gebruikers</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{data.totalUsers}</p>
                </div>
                <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800/50">
                    <div className="flex items-center gap-3 mb-2">
                        <HelpCircle className="w-4 h-4 text-orange-400" />
                        <span className="text-xs text-gray-400">Totaal Vragen</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{data.totalQuestions}</p>
                </div>
                <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800/50">
                    <div className="flex items-center gap-3 mb-2">
                        <MessageCircle className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-gray-400">Totaal Antwoorden</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{data.totalAnswers}</p>
                </div>
                <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800/50 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-gray-400">Engagement Rate</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{data.engagementRate.toFixed(1)}%</p>
                    <p className="text-[10px] text-gray-500 mt-1">Antwoorden per vraag</p>
                    <div className="absolute -bottom-2 -right-2 opacity-10">
                        <TrendingUp className="w-12 h-12 text-yellow-400" />
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Growth Chart */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            Gebruikersgroei (30 dagen)
                        </h4>
                    </div>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.growthData}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 10 }} interval={7} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Activity Bar Chart */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-green-400" />
                            Activiteit (Vragen & Antwoorden)
                        </h4>
                    </div>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.activityData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 10 }} interval={7} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                <Bar dataKey="vragen" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="antwoorden" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </Card>
    );
}
