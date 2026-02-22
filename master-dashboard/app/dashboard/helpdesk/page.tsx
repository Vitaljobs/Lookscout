'use client';

import React, { useState, useEffect } from 'react';
import {
    getSupportMessages,
    updateMessageStatus,
    getHelpdeskStats,
    SupportMessage,
    HelpdeskStats
} from '@/app/actions/helpdesk';
import HelpdeskDetail from '@/components/HelpdeskDetail';
import {
    LifeBuoy,
    MessageSquare,
    Clock,
    CheckCircle2,
    AlertCircle,
    Filter,
    ChevronRight,
    Search,
    Loader2,
    RefreshCw,
    ExternalLink
} from 'lucide-react';

export default function HelpdeskPage() {
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [stats, setStats] = useState<HelpdeskStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'open' | 'pending' | 'closed'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [msgsData, statsData] = await Promise.all([
                getSupportMessages(),
                getHelpdeskStats()
            ]);
            setMessages(msgsData);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load helpdesk data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: 'open' | 'pending' | 'closed') => {
        try {
            await updateMessageStatus(id, newStatus);
            await loadData(); // Reload to refresh stats and list
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Error updating status.');
        }
    };

    const filteredMessages = messages.filter(msg => {
        const matchesFilter = filter === 'all' || msg.status === filter;
        const matchesSearch =
            msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.site_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <LifeBuoy className="w-8 h-8 text-blue-400" />
                        Central Helpdesk
                    </h1>
                    <p className="text-gray-400">
                        Unified support command center for all connected projects.
                    </p>
                </div>
                <button
                    onClick={loadData}
                    className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all"
                    title="Refresh Data"
                >
                    <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                    title="Open Tickets"
                    value={stats?.openTickets || 0}
                    icon={<AlertCircle className="w-5 h-5 text-red-400" />}
                    color="red"
                />
                <StatCard
                    title="Pending"
                    value={stats?.pendingTickets || 0}
                    icon={<Clock className="w-5 h-5 text-amber-400" />}
                    color="amber"
                />
                <StatCard
                    title="Resolved"
                    value={stats?.closedTickets || 0}
                    icon={<CheckCircle2 className="w-5 h-5 text-green-400" />}
                    color="green"
                />
                <StatCard
                    title="Avg Response Time"
                    value={stats ? `${stats.avgResponseTimeHours}h` : '0h'}
                    icon={<Clock className="w-5 h-5 text-blue-400" />}
                    color="blue"
                />
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search subjects, senders or sites..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-black/40 border border-white/10 rounded-lg p-1">
                    {(['all', 'open', 'pending', 'closed'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                        <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">Hydrating Message Store...</p>
                    </div>
                ) : filteredMessages.length === 0 ? (
                    <div className="card p-20 text-center border-dashed border-2 border-white/5 bg-transparent">
                        <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-1">No Messages Found</h3>
                        <p className="text-gray-500">Everything is quiet on the support front.</p>
                    </div>
                ) : (
                    filteredMessages.map((msg) => (
                        <div
                            key={msg.id}
                            onClick={() => setSelectedMessage(msg)}
                            className="group card bg-white/5 border-white/5 hover:border-blue-500/30 transition-all duration-300 cursor-pointer"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`w-2 h-2 rounded-full ${msg.status === 'open' ? 'bg-red-500 animate-pulse' :
                                            msg.status === 'pending' ? 'bg-amber-500' : 'bg-green-500'
                                            }`} />
                                        <h3 className="text-base font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                                            {msg.subject}
                                        </h3>
                                        <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 uppercase font-bold">
                                            {msg.site_name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span className="font-medium text-gray-400">{msg.sender_name}</span>
                                        <span>&bull;</span>
                                        <span>{new Date(msg.created_at).toLocaleDateString()} at {new Date(msg.created_at).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="mt-3 text-sm text-gray-400 line-clamp-2 leading-relaxed">
                                        {msg.body}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex bg-black/20 rounded-lg p-1">
                                        <button
                                            onClick={() => handleStatusUpdate(msg.id, 'open')}
                                            className={`p-1.5 rounded transition-all ${msg.status === 'open' ? 'bg-red-500/20 text-red-400' : 'text-gray-600 hover:text-gray-400'}`}
                                            title="Set as Open"
                                        >
                                            <AlertCircle className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(msg.id, 'pending')}
                                            className={`p-1.5 rounded transition-all ${msg.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-600 hover:text-gray-400'}`}
                                            title="Set as Pending"
                                        >
                                            <Clock className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(msg.id, 'closed')}
                                            className={`p-1.5 rounded transition-all ${msg.status === 'closed' ? 'bg-green-500/20 text-green-400' : 'text-gray-600 hover:text-gray-400'}`}
                                            title="Resolve Ticket"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all group-hover:translate-x-1">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Message Detail Slide-over */}
            <HelpdeskDetail
                message={selectedMessage}
                onClose={() => setSelectedMessage(null)}
                onReplySuccess={() => {
                    setSelectedMessage(null);
                    loadData();
                }}
            />
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string, value: number | string, icon: React.ReactNode, color: 'red' | 'amber' | 'green' | 'blue' }) {
    const colorClasses = {
        red: 'border-red-500/20 bg-red-500/5 hover:border-red-500/40',
        amber: 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40',
        green: 'border-green-500/20 bg-green-500/5 hover:border-green-500/40',
        blue: 'border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40'
    };

    return (
        <div className={`card ${colorClasses[color]} transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</span>
                {icon}
            </div>
            <div className="text-3xl font-bold text-white">
                {value}
            </div>
        </div>
    );
}
