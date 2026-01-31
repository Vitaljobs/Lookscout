'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ContactMessage } from '@/types/support';
import { Inbox, Mail, Send, Archive, Check, Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function SupportHub() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const [filter, setFilter] = useState<'all' | 'new' | 'replied'>('all');
    const supabase = createClient();

    useEffect(() => {
        loadMessages();

        // Subscribe to real-time updates
        const channel = supabase
            .channel('contact-messages')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'contact_messages',
                },
                () => {
                    loadMessages();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [filter]);

    const loadMessages = async () => {
        try {
            let query = supabase
                .from('contact_messages')
                .select('*')
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async () => {
        if (!selectedMessage || !replyText.trim()) return;

        setSending(true);
        try {
            // Call API to send email via Resend
            const response = await fetch('/api/support/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messageId: selectedMessage.id,
                    to: selectedMessage.email,
                    replyText: replyText.trim(),
                    originalSubject: selectedMessage.subject,
                }),
            });

            if (!response.ok) throw new Error('Failed to send reply');

            // Update message status
            const { error } = await supabase
                .from('contact_messages')
                .update({
                    status: 'replied',
                    replied_at: new Date().toISOString(),
                    reply_message: replyText.trim(),
                })
                .eq('id', selectedMessage.id);

            if (error) throw error;

            setReplyText('');
            setSelectedMessage(null);
            loadMessages();
        } catch (error) {
            console.error('Error sending reply:', error);
            alert('Fout bij verzenden. Controleer of RESEND_API_KEY is ingesteld.');
        } finally {
            setSending(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'new':
                return <Mail className="w-4 h-4 text-blue-400" />;
            case 'replied':
                return <Check className="w-4 h-4 text-green-400" />;
            case 'archived':
                return <Archive className="w-4 h-4 text-gray-400" />;
            default:
                return <Clock className="w-4 h-4 text-yellow-400" />;
        }
    };

    const getProjectBadgeColor = (project: string) => {
        const colors: Record<string, string> = {
            'echo-chamber': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            'commonground': 'bg-green-500/20 text-green-400 border-green-500/30',
            'vitaljobs': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        };
        return colors[project] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    const newCount = messages.filter(m => m.status === 'new').length;

    return (
        <div className="card h-full flex flex-col relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute -left-10 -top-10 w-32 h-32 bg-blue-600 rounded-full blur-[60px] opacity-20" />

            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                            <Inbox className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Unified Support Hub</h3>
                            <p className="text-xs text-gray-400">Centraal berichtenbeheer</p>
                        </div>
                    </div>
                    {newCount > 0 && (
                        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30 animate-pulse">
                            {newCount} nieuw
                        </span>
                    )}
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-4">
                    {(['all', 'new', 'replied'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filter === f
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'bg-[var(--sidebar-bg)] text-gray-400 hover:text-white border border-[var(--card-border)]'
                                }`}
                        >
                            {f === 'all' ? 'Alle' : f === 'new' ? 'Nieuw' : 'Beantwoord'}
                        </button>
                    ))}
                </div>

                {/* Messages list */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Geen berichten</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                onClick={() => setSelectedMessage(msg)}
                                className={`p-3 rounded-lg cursor-pointer transition-all ${selectedMessage?.id === msg.id
                                        ? 'bg-blue-500/10 border border-blue-500/30'
                                        : 'bg-[var(--sidebar-bg)] border border-[var(--card-border)] hover:bg-[var(--hover-bg)]'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(msg.status)}
                                        <span className="text-sm font-medium text-white">{msg.name}</span>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getProjectBadgeColor(msg.project_source)}`}>
                                        {msg.project_source}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mb-1">{msg.subject}</p>
                                <p className="text-xs text-gray-500 line-clamp-2">{msg.message}</p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] text-gray-500">
                                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: nl })}
                                    </span>
                                    {msg.status === 'new' && (
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Reply panel */}
                {selectedMessage && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                        <div className="mb-2">
                            <div className="text-xs text-gray-400 mb-1">Antwoord naar: {selectedMessage.email}</div>
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type je antwoord..."
                                className="w-full h-20 px-3 py-2 bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleReply}
                                disabled={sending || !replyText.trim()}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/30"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Verzenden...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Verstuur
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="px-4 py-2 bg-[var(--sidebar-bg)] hover:bg-[var(--hover-bg)] text-gray-400 rounded-lg text-sm font-medium transition-colors border border-[var(--card-border)]"
                            >
                                Annuleer
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
