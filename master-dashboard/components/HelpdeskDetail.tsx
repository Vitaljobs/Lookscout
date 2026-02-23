'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Mail, Globe, Clock, CheckCircle, Reply, MessageSquare, Loader2, RefreshCw } from 'lucide-react';
import { SupportMessage, sendHelpdeskReply } from '@/app/actions/helpdesk';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface FollowUpMessage {
    id: string;
    content: string;
    role: string;
    created_at: string;
}

interface HelpdeskDetailProps {
    message: SupportMessage | null;
    onClose: () => void;
    onReplySuccess: () => void;
}

export default function HelpdeskDetail({ message, onClose, onReplySuccess }: HelpdeskDetailProps) {
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [followUpMessages, setFollowUpMessages] = useState<FollowUpMessage[]>([]);

    // Fetch follow-up messages from SERVLY database when a message is selected
    useEffect(() => {
        if (!message) { setFollowUpMessages([]); return; }
        const threadIdMatch = message.sender_email?.match(/\+id_([^@]+)@/);
        if (!threadIdMatch) return;
        const threadId = threadIdMatch[1];
        supabase
            .from('messages')
            .select('id, content, role, created_at')
            .eq('thread_id', threadId)
            .order('created_at', { ascending: true })
            .then(({ data }) => setFollowUpMessages(data || []));
    }, [message?.id]);

    const handleReply = async () => {
        if (!message || !replyText.trim()) return;

        setIsSending(true);
        setError(null);

        try {
            await sendHelpdeskReply(
                message.id,
                replyText.trim(),
                message.sender_email,
                `RE: ${message.subject}`
            );
            setReplyText('');
            onReplySuccess();
        } catch (err: any) {
            console.error('Failed to send reply:', err);
            setError(err.message || 'Kon antwoord niet verzenden. Probeer het later opnieuw.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <AnimatePresence>
            {message && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Slide-over Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-lg bg-[var(--card-bg)] border-l border-[var(--card-border)] z-[70] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--sidebar-bg)]/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                                    <MessageSquare className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Bericht Details</h3>
                                    <p className="text-xs text-gray-400">Beheer bericht van {message.site_name}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
                            {/* Meta Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 mb-1 text-gray-400">
                                        <User className="w-3.5 h-3.5" />
                                        <span className="text-xs uppercase tracking-wider font-semibold">Afzender</span>
                                    </div>
                                    <div className="text-sm text-white font-medium">{message.sender_name}</div>
                                    <div className="text-xs text-gray-500 truncate">{message.sender_email}</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 mb-1 text-gray-400">
                                        <Globe className="w-3.5 h-3.5" />
                                        <span className="text-xs uppercase tracking-wider font-semibold">Bron</span>
                                    </div>
                                    <div className="text-sm text-white font-medium">{message.site_name}</div>
                                    <div className="text-xs text-gray-500">Website ID: {message.site_id.slice(0, 8)}...</div>
                                </div>
                            </div>

                            {/* Message Body */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Inhoud
                                    </h4>
                                    <span className="text-[10px] text-gray-500">
                                        Ontvangen: {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: nl })}
                                    </span>
                                </div>
                                <div className="p-5 bg-[var(--sidebar-bg)] rounded-2xl border border-[var(--card-border)] relative">
                                    <div className="absolute -left-[1px] top-6 w-1 h-8 bg-blue-500 rounded-r shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                    <h5 className="text-lg font-bold text-white mb-3">{message.subject}</h5>
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
                                        {message.body}
                                    </p>
                                </div>
                            </div>

                            {/* Existing Reply (if any) */}
                            {message.reply_message && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        Jouw Antwoord
                                    </h4>
                                    <div className="p-5 bg-green-500/5 rounded-2xl border border-green-500/20 relative">
                                        <div className="absolute -left-[1px] top-6 w-1 h-8 bg-green-500 rounded-r shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm italic">
                                            {message.reply_message}
                                        </p>
                                        {message.responded_at && (
                                            <div className="mt-3 text-[10px] text-green-500/60 font-medium">
                                                Verzonden op: {new Date(message.responded_at).toLocaleString('nl-NL')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Follow-up messages from SERVLY */}
                            {followUpMessages.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        Volledig Gesprek ({followUpMessages.length})
                                    </h4>
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                        {followUpMessages.map((msg) => (
                                            <div key={msg.id} className={`p-4 rounded-xl border text-sm whitespace-pre-wrap leading-relaxed ${msg.role === 'pro'
                                                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-100'
                                                    : 'bg-white/5 border-white/10 text-gray-300'
                                                }`}>
                                                <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60">
                                                    {msg.role === 'pro' ? '🔵 Vakman / Support' : '👤 Klant'}
                                                    {' · '}{new Date(msg.created_at).toLocaleString('nl-NL')}
                                                </div>
                                                {msg.content}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reply Input – always visible so admin can follow up */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                    <Reply className="w-4 h-4" />
                                    {message.status === 'closed' ? 'Reageer opnieuw' : 'Stuur Antwoord'}
                                </h4>
                                {message.status === 'closed' && (
                                    <p className="text-[10px] text-yellow-400/70 italic flex items-center gap-1">
                                        <RefreshCw className="w-3 h-3" /> Dit ticket is gesloten – een nieuw antwoord opent het automatisch opnieuw.
                                    </p>
                                )}
                                <div className="relative group">
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Typ hier je vervolgreactie..."
                                        className="w-full h-40 p-4 bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all resize-none ring-0 group-hover:border-[var(--card-border-hover)]"
                                    />
                                    <div className="absolute right-3 bottom-3">
                                        <button
                                            onClick={handleReply}
                                            disabled={isSending || !replyText.trim()}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                                        >
                                            {isSending ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                            <span>Verstuur</span>
                                        </button>
                                    </div>
                                </div>
                                {error && (
                                    <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                                        <X className="w-3 h-3" /> {error}
                                    </p>
                                )}
                                <p className="text-[10px] text-gray-500 italic">
                                    Bericht wordt direct gesynchroniseerd naar SERVLY.
                                </p>
                            </div>
                        </div>

                        {/* Footer / Status Label */}
                        <div className="p-4 border-t border-[var(--card-border)] bg-[var(--sidebar-bg)]/20 flex items-center justify-center">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${message.status === 'open'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : message.status === 'pending'
                                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                    : 'bg-green-500/10 text-green-400 border-green-500/20'
                                }`}>
                                Status: {message.status === 'open' ? 'Open' : message.status === 'pending' ? 'In Behandeling' : 'Afgehandeld'}
                            </span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
