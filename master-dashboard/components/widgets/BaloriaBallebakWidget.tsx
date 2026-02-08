'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Circle, Target, HelpCircle, Trophy, TrendingUp, Sparkles, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface BaloriaStats {
    total_balls: number;
    active_balls: number;
    total_catches: number;
    top_theme: string;
    questions_count: number;
}

interface StatMiniCardProps {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    color: string;
    bgColor: string;
}

function StatMiniCard({ icon, label, value, color, bgColor }: StatMiniCardProps) {
    return (
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bgColor}`}>
                {icon}
            </div>
            <div>
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">{label}</p>
            </div>
        </div>
    );
}

export default function BaloriaBallebakWidget() {
    const [stats, setStats] = useState<BaloriaStats | null>(null);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        fetchBaloriaData();
        const interval = setInterval(fetchBaloriaData, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    async function fetchBaloriaData() {
        try {
            // 1. Get Project ID
            const { data: project } = await supabase
                .from('projects')
                .select('id')
                .eq('slug', 'baloria')
                .single();

            if (!project) return;

            // 2. Fetch Active Balls
            const { count: activeCount } = await supabase
                .from('baloria_balls')
                .select('*', { count: 'exact', head: true })
                .eq('project_id', project.id)
                .eq('status', 'active');

            // 3. Fetch Total Catches
            const { count: catchCount } = await supabase
                .from('baloria_catches')
                .select('id', { count: 'exact', head: true });

            // 4. Fetch Questions
            const { count: questionsCount } = await supabase
                .from('baloria_balls')
                .select('*', { count: 'exact', head: true })
                .eq('project_id', project.id)
                .eq('ball_type', 'question');

            // 5. Get Top Theme (simplified logic, usually a group-by query)
            const { data: themes } = await supabase
                .from('baloria_balls')
                .select('theme')
                .eq('project_id', project.id)
                .limit(10);

            const topTheme = themes && themes.length > 0 ? themes[0].theme : 'Relaties';

            setStats({
                total_balls: (activeCount || 0) + (catchCount || 0),
                active_balls: activeCount || 0,
                total_catches: catchCount || 0,
                top_theme: topTheme,
                questions_count: questionsCount || 0
            });
        } catch (error) {
            console.error('Error fetching Baloria data:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 h-[200px] animate-pulse flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-pink-500/20" />
            </div>
        );
    }

    return (
        <Card className="relative overflow-hidden group border-pink-500/20 bg-gradient-to-br from-gray-900 via-gray-900 to-pink-950/20">
            {/* Background Decorative Elements */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all duration-700"></div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/20 rounded-lg shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                            <Circle className="w-5 h-5 text-pink-400 fill-pink-400/20" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">Baloria Ballebak</h3>
                            <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Live Pulse</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Top Thema</p>
                        <p className="text-sm font-semibold text-pink-400">{stats?.top_theme}</p>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatMiniCard
                        icon={<Target className="w-4 h-4 text-orange-400" />}
                        label="Actieve Ballen"
                        value={stats?.active_balls || 0}
                        color="text-orange-400"
                        bgColor="bg-orange-500/10"
                    />
                    <StatMiniCard
                        icon={<HelpCircle className="w-4 h-4 text-blue-400" />}
                        label="Vragen Gesteld"
                        value={stats?.questions_count || 0}
                        color="text-blue-400"
                        bgColor="bg-blue-500/10"
                    />
                    <StatMiniCard
                        icon={<Trophy className="w-4 h-4 text-yellow-400" />}
                        label="Ballen Gevangen"
                        value={stats?.total_catches || 0}
                        color="text-yellow-400"
                        bgColor="bg-yellow-500/10"
                    />
                    <StatMiniCard
                        icon={<TrendingUp className="w-4 h-4 text-green-400" />}
                        label="Vangst Ratio"
                        value={stats?.active_balls ? `${Math.round(((stats.total_catches) / (stats.total_balls || 1)) * 100)}%` : '0%'}
                        color="text-green-400"
                        bgColor="bg-green-500/10"
                    />
                </div>

                {/* Bottom Action / Quick Info */}
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-800/50">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Real-time Sync</span>
                        <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Gecentraliseerd</span>
                    </div>
                    <a
                        href="https://baloria.nl"
                        target="_blank"
                        className="text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1 group/link"
                    >
                        Beheer Ballebak
                        <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                    </a>
                </div>
            </div>
        </Card>
    );
}
