'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BrainCircuit, RefreshCw, MessageSquareQuote } from 'lucide-react';

export default function NeuralInsights() {
    const [insight, setInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Chat State
    const [messages, setMessages] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isThinking, setIsThinking] = useState(false);

    // Initial Proactive Insight
    const fetchInsight = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/neural/link', { method: 'POST', body: JSON.stringify({}) });
            const data = await res.json();

            if (data.success) {
                setInsight(data.insight);
                // Add initial insight to history context if needed, or just display it
            } else {
                setError(data.error || "Neural Link connection unstable.");
            }
        } catch (err) {
            setError("Neural Link offline.");
        } finally {
            setLoading(false);
        }
    };

    // Chat Message Handler
    const sendMessage = async () => {
        if (!inputValue.trim()) return;

        const newUserMsg = { role: 'user' as const, parts: [{ text: inputValue }] };
        const newHistory = [...messages, newUserMsg];

        setMessages(newHistory);
        setInputValue("");
        setIsThinking(true);

        try {
            const res = await fetch('/api/neural/link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: inputValue,
                    history: messages // Send previous history
                })
            });
            const data = await res.json();

            if (data.success) {
                const newModelMsg = { role: 'model' as const, parts: [{ text: data.insight }] };
                setMessages([...newHistory, newModelMsg]);
            } else {
                // Handle error in chat
                const errorMsg = { role: 'model' as const, parts: [{ text: "⚠️ Connectivity Error: " + data.error }] };
                setMessages([...newHistory, errorMsg]);
            }
        } catch (err) {
            const errorMsg = { role: 'model' as const, parts: [{ text: "⚠️ Neural Link Lost." }] };
            setMessages([...newHistory, errorMsg]);
        } finally {
            setIsThinking(false);
        }
    };

    useEffect(() => {
        fetchInsight();
    }, []);

    return (
        <motion.div
            layout
            className={`relative overflow-hidden rounded-2xl bg-[#0f1419]/90 border border-purple-500/20 backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.1)] transition-all duration-500 ease-in-out ${isExpanded ? 'p-6 h-[500px]' : 'p-6 h-auto'}`}
        >

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="relative flex items-center justify-center w-10 h-10">
                        {/* Core Animation - Speeds up when thinking */}
                        <div className={`absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-20 ${isThinking ? 'duration-500' : 'duration-1000'}`}></div>
                        <div className="relative z-10 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-full p-2 shadow-lg shadow-purple-500/30">
                            <BrainCircuit className={`w-5 h-5 text-white ${isThinking ? 'animate-pulse' : ''}`} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-wide">TITAN NEURAL LINK</h3>
                        <p className="text-[10px] text-purple-300/60 uppercase tracking-widest flex items-center gap-2">
                            {/* Status Indicator */}
                            <span className={`w-2 h-2 rounded-full shadow-[0_0_8px] transition-colors duration-500
                                ${error ? 'bg-red-500 shadow-red-500/50' :
                                    loading || isThinking ? 'bg-yellow-400 shadow-yellow-400/50 animate-pulse' :
                                        'bg-green-500 shadow-green-500/50'}`}
                            />
                            {isThinking ? 'Processing Query...' : error ? 'Offline' : 'Live Context Active'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-purple-300 hover:text-white transition-all"
                        title={isExpanded ? "Collapse" : "Expand Chat"}
                    >
                        <MessageSquareQuote className="w-4 h-4" />
                    </button>
                    {!isExpanded && (
                        <button
                            onClick={fetchInsight}
                            disabled={loading}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-50"
                            title="Regenerate Insight"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className={`relative ${isExpanded ? 'h-[calc(100%-60px)] flex flex-col' : 'min-h-[60px]'}`}>
                <AnimatePresence mode="wait">
                    {!isExpanded ? (
                        /* COLLAPSED VIEW: Standard Insight */
                        loading ? (
                            <motion.div
                                key="loader"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-2 space-y-3"
                            >
                                <span className="text-xs text-purple-300/50 animate-pulse">Analysing System Context...</span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="content"
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                className="text-gray-300 text-sm leading-relaxed border-l-2 border-purple-500/50 pl-4 py-1"
                            >
                                <div className="flex gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-1" />
                                    <span>{insight || "System online. Waiting for telemetry..."}</span>
                                </div>
                            </motion.div>
                        )
                    ) : (
                        /* EXPANDED VIEW: Chat Interface */
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex flex-col h-full"
                        >
                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin scrollbar-thumb-purple-900/50 scrollbar-track-transparent">
                                {/* Show initial insight as the first AI message if it exists */}
                                {insight && messages.length === 0 && (
                                    <div className="flex justify-start">
                                        <div className="bg-[#1c2333] border border-purple-500/20 text-gray-200 rounded-2xl rounded-tl-none p-3 max-w-[85%] text-sm shadow-sm">
                                            {insight}
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`
                                            p-3 rounded-2xl max-w-[85%] text-sm shadow-sm
                                            ${msg.role === 'user'
                                                ? 'bg-purple-600 text-white rounded-tr-none'
                                                : 'bg-[#1c2333] border border-purple-500/20 text-gray-200 rounded-tl-none'}
                                        `}>
                                            {msg.parts[0].text}
                                        </div>
                                    </div>
                                ))}
                                {isThinking && (
                                    <div className="flex justify-start animate-pulse">
                                        <div className="bg-[#1c2333]/50 p-3 rounded-2xl rounded-tl-none">
                                            <div className="flex gap-1">
                                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></span>
                                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="flex gap-2 pt-2 border-t border-white/5">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Ask TITAN command..."
                                    className="flex-1 bg-[#161b22] border-none rounded-xl px-4 py-2 text-sm text-gray-200 focus:ring-1 focus:ring-purple-500/50 outline-none placeholder:text-gray-600"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!inputValue.trim() || isThinking}
                                    className="p-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <MessageSquareQuote className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 blur-[40px] pointer-events-none"></div>
        </motion.div>
    );
}
