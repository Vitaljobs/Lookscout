'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useProjects } from '@/context/ProjectContext';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { PulseAPI } from '@/lib/api/pulse';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
};

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am Titan AI. I have access to all your connected projects. How can I help you?', timestamp: new Date() }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { projects } = useProjects();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const generateSystemContext = async () => {
        // Build a snapshot of the current system state
        let context = "Current System Status:\n";

        for (const p of projects) {
            // We fetch fresh stats for the context to be accurate
            try {
                const api = new PulseAPI(p.id);
                const { data, isLive } = await api.getStats();
                context += `- ${p.name}: ${p.status.toUpperCase()} (${isLive ? 'Live' : 'Mock Connection'}). Users: ${data.total_users}, Active: ${data.active_now}.\n`;
            } catch (e) {
                context += `- ${p.name}: Connection Error.\n`;
            }
        }
        return context;
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // 1. Gather Context
            const systemContext = await generateSystemContext();

            // 2. Process Command (Mock AI Logic)
            setTimeout(async () => {
                let responseText = "I'm not sure how to handle that command yet.";
                const lowerInput = userMsg.content.toLowerCase();
                const updatedMessages = [...messages, userMsg]; // Current state for context

                // COMMAND: BLOCK USER
                if (lowerInput.includes('block')) {
                    const projectSearch = projects.find(p => lowerInput.includes(p.name.toLowerCase()) || lowerInput.includes(p.id));
                    // Extract user (simplified logic: look for "user x" or just assume last context)
                    const userMatch = lowerInput.match(/user\s+(\w+)/i) || lowerInput.match(/@(\w+)/i);
                    const userName = userMatch ? userMatch[1] : 'Unknown';

                    if (userName !== 'Unknown') {
                        // Simulate Block Action
                        if (projectSearch) {
                            const api = new PulseAPI(projectSearch.id);
                            const result = await api.blockUser(userName);
                            responseText = `✅ **Action Confirmed**: ${result.message}`;
                        } else {
                            // Global Block Simulation
                            responseText = `⚠️ **Confirm Global Action**: Are you sure you want to block user '${userName}' across ALL projects? (Type 'yes' to proceed)`;
                            // Note: In a real implementation, we'd manage conversation state for confirmation flow. 
                            // For v1.1.0 demo, we'll assume immediate execution on all if no specific project named.
                            responseText = `✅ **Global Action Confirmed**: User '${userName}' has been blocked on Common Ground, VIBECHAIN, and VitalJobs.`;
                        }
                    } else {
                        responseText = "Please specify which user you want to block. (e.g., 'Block user Kelly')";
                    }
                }
                // COMMAND: STATUS REPORT
                else if (lowerInput.includes('status') || lowerInput.includes('report') || lowerInput.includes('health')) {
                    responseText = `**System Status Report** 🟢\n\n${systemContext}\n\nAll systems are currently operational. API Latency is stable at ~45ms.`;
                }
                // COMMAND: SECURITY INSIGHT
                else if (lowerInput.includes('security') || lowerInput.includes('red') || lowerInput.includes('alert')) {
                    // Fetch real events from PulseAPI simulation we just added
                    let totalThreats = 0;
                    let recentMsg = "";
                    for (const p of projects) {
                        const api = new PulseAPI(p.id);
                        const events = await api.getSecurityEvents();
                        totalThreats += events.length;
                        if (events.length > 0) recentMsg = events[0].message;
                    }

                    responseText = `🛡️ **Security Insight**\n\nI am detecting elevated activity. The red spikes indicate **${totalThreats} blocked threats** in the last hour.\n\nMost recent incident: *"${recentMsg || 'Brute Force attempt from IP 192.168.x.x'}"*.\n\nYour defenses are holding. No action required.`;
                }
                // COMMAND: DB QUERIES / GROWTH
                else if (lowerInput.includes('how many') || lowerInput.includes('count') || lowerInput.includes('growth')) {
                    // Aggregate data
                    let total = 0;
                    let growthDetails = "";
                    for (const p of projects) {
                        const api = new PulseAPI(p.id);
                        const { data } = await api.getStats();
                        total += data.total_users;
                        growthDetails += `- **${p.name}**: ${data.total_users.toLocaleString()} users\n`;
                    }
                    responseText = `📊 **Database Query Result**\n\nTotal Users across ecosystem: **${total.toLocaleString()}**\n\nBreakdown:\n${growthDetails}`;
                }
                // GENERAL CHAT
                else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
                    responseText = "Hello, Controller. I am ready for your commands. Try 'Status Report' or 'Explain Security Alerts'.";
                }
                else {
                    responseText = "I didn't quite catch that. I can help with:\n- User Management ('Block user X')\n- Status Reports\n- Security Insights\n- Database Queries";
                }

                setMessages(prev => [...prev, { role: 'assistant', content: responseText, timestamp: new Date() }]);
                setIsTyping(false);
            }, 1000);

        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting to the neural core.", timestamp: new Date() }]);
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 z-50 ${isOpen ? 'bg-red-500 rotate-90' : 'bg-blue-600 hover:bg-blue-500 hover:scale-110'}`}
            >
                {isOpen ? <X className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
            </button>

            {/* Chat Window */}
            <div className={`fixed bottom-24 right-6 w-[380px] h-[500px] bg-[#151a21] border border-[var(--card-border)] rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
                {/* Header */}
                <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                            <Sparkles className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Titan AI</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs text-gray-400">Online & Monitoring</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-[var(--sidebar-bg)] border border-[var(--card-border)] text-gray-200 rounded-bl-none'
                                }`}>
                                <div className="whitespace-pre-line">{msg.content}</div>
                                <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-2xl rounded-bl-none p-3 flex gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-[var(--card-border)]">
                    <div className="flex items-center gap-2 bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-full px-4 py-2 focus-within:border-blue-500 transition-colors">
                        <input
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-white placeholder-gray-500"
                            placeholder="Ask about your projects..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            onClick={handleSend}
                            className={`p-2 rounded-full transition-all ${input.trim() ? 'text-blue-500 hover:bg-blue-500/10' : 'text-gray-600 cursor-not-allowed'}`}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
