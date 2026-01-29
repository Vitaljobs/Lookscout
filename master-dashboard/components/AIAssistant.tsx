'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useProjects } from '@/context/ProjectContext';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { PulseAPI } from '@/lib/api/pulse';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    type?: 'text' | 'alert' | 'prediction';
};

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hallo! Ik ben Titan AI. Ik heb toegang tot al je projecten. Waarmee kan ik helpen?', timestamp: new Date() }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { projects } = useProjects();
    const hasCheckedAlerts = useRef(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Smart Alerts Component
    useEffect(() => {
        if (!hasCheckedAlerts.current && projects.length > 0) {
            hasCheckedAlerts.current = true;
            setTimeout(() => {
                // Simulate a smart alert discovery (Mock)
                const randomIssue = Math.random() > 0.7;
                if (randomIssue) {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: "⚠️ **Smart Alert**: Ik detecteer een ongewone piek in API latency op **VitalJobs** (124ms). Zal ik de cache optimaliseren?",
                        timestamp: new Date(),
                        type: "alert"
                    }]);
                }
            }, 3000);
        }
    }, [projects]);

    const generateSystemContext = async () => {
        // Build a snapshot of the current system state
        let context = "Huidige Systeem Status:\n";

        for (const p of projects) {
            // We fetch fresh stats for the context to be accurate
            try {
                const api = new PulseAPI(p.id);
                const { data, isLive } = await api.getStats();
                context += `- ${p.name}: ${p.status.toUpperCase()} (${isLive ? 'Live' : 'Mock'}). Gebruikers: ${data.total_users}, Actief: ${data.active_now}.\n`;
            } catch (e) {
                context += `- ${p.name}: Verbindingsfout.\n`;
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
                let responseText = "Ik begrijp dat commando nog niet helemaal.";
                const lowerInput = userMsg.content.toLowerCase();
                // const updatedMessages = [...messages, userMsg]; // Current state for context

                // DUTCH COMMANDS

                // COMMAND: BLOCK USER (Blokkeer)
                if (lowerInput.includes('block') || lowerInput.includes('blok') || lowerInput.includes('ban')) {
                    const projectSearch = projects.find(p => lowerInput.includes(p.name.toLowerCase()) || lowerInput.includes(p.id));
                    const userMatch = lowerInput.match(/user\s+(\w+)/i) || lowerInput.match(/gebruiker\s+(\w+)/i) || lowerInput.match(/@(\w+)/i) || lowerInput.match(/blokkeer\s+(\w+)/i);
                    const userName = userMatch ? userMatch[1] : 'Unknown';

                    if (userName !== 'Unknown') {
                        // Simulate Block Action
                        if (projectSearch) {
                            const api = new PulseAPI(projectSearch.id);
                            const result = await api.blockUser(userName);
                            responseText = `✅ **Actie Bevestigd**: ${userName} is geblokkeerd op ${projectSearch.name}.`;
                        } else {
                            // Global Block Simulation
                            // responseText = `⚠️ **Confirm Global Action**: Are you sure you want to block user '${userName}' across ALL projects? (Type 'yes' to proceed)`;
                            // Note: In a real implementation, we'd manage conversation state for confirmation flow. 
                            // For v1.1.0 demo, we'll assume immediate execution on all if no specific project named.
                            responseText = `✅ **Global Action Confirmed**: Gebruiker '${userName}' is preventief geblokkeerd op Common Ground, VIBECHAIN en VitalJobs.`;
                        }
                    } else {
                        responseText = "Welke gebruiker moet ik blokkeren? (bijv. 'Blokkeer gebruiker Kelly')";
                    }
                }
                // COMMAND: STATUS REPORT (Status / Gezondheid)
                else if (lowerInput.includes('status') || lowerInput.includes('report') || lowerInput.includes('gezond') || lowerInput.includes('health')) {
                    responseText = `**Systeem Status Rapport** 🟢\n\n${systemContext}\n\nAlle systemen zijn operationeel. API Latency is stabiel rond de ~45ms.`;
                }
                // COMMAND: SECURITY INSIGHT (Security / Veiligheid / Rood)
                else if (lowerInput.includes('security') || lowerInput.includes('rood') || lowerInput.includes('alert') || lowerInput.includes('veilig')) {
                    // Fetch real events from PulseAPI simulation we just added
                    let totalThreats = 0;
                    let recentMsg = "";
                    for (const p of projects) {
                        const api = new PulseAPI(p.id);
                        const events = await api.getSecurityEvents();
                        totalThreats += events.length;
                        if (events.length > 0) recentMsg = events[0].message;
                    }

                    responseText = `🛡️ **Security Insight**\n\nIk zie verhoogde activiteit. De rode pieken geven aan dat er **${totalThreats} dreigingen** zijn geblokkeerd in het afgelopen uur.\n\nMeest recente incident: *"${recentMsg || 'Brute Force poging vanaf IP 192.168.x.x'}"*.\n\nJe verdediging houdt stand. Geen actie vereist.`;
                }
                // COMMAND: PREDICTIVE GROWTH (Voorspel / Trend / Groei)
                else if (lowerInput.includes('voorspel') || lowerInput.includes('trend') || lowerInput.includes('toekomst') || lowerInput.includes('groei') || lowerInput.includes('analyst')) {
                    const totalUsers = projects.reduce((acc, p) => acc + (p.name === 'Common Ground Pulse' ? 12847 : 5000), 0);
                    const predicted = Math.floor(totalUsers * 1.15); // +15% mock growth

                    responseText = `🔮 **De Analyst: Toekomstprognose**\n\nOp basis van de huidige groeicurve (+12.5% avg):\n\n- **Vandaag:** ${totalUsers.toLocaleString()} gebruikers\n- **Prognose Vrijdag:** ~${predicted.toLocaleString()} gebruikers\n\nIk detecteer een sterke organische instroom op *Common Ground*. Advies: Schaal database-resources bij voor het weekend.`;
                }
                // COMMAND: DB QUERIES (Hoeveel / Aantal)
                else if (lowerInput.includes('hoeveel') || lowerInput.includes('aantal') || lowerInput.includes('count')) {
                    let total = 0;
                    let growthDetails = "";
                    for (const p of projects) {
                        const api = new PulseAPI(p.id);
                        const { data } = await api.getStats();
                        total += data.total_users;
                        growthDetails += `- **${p.name}**: ${data.total_users.toLocaleString()} gebruikers\n`;
                    }
                    responseText = `📊 **Database Query Resultaat**\n\nTotal Users in ecosysteem: **${total.toLocaleString()}**\n\nDetails:\n${growthDetails}`;
                }
                // COMMAND: AFFIRMATIVE / HEALING (Ok, Ja, Doe maar, Cache optimaliseren, Fix)
                else if (lowerInput === 'ok' || lowerInput === 'ja' || lowerInput === 'doe maar' || lowerInput === 'yes' || lowerInput.includes('graag') || lowerInput.includes('cache') || lowerInput.includes('optimaliseer') || lowerInput.includes('fix') || lowerInput.includes('repareer')) {
                    // Check if previous message was an alert (Mock context awareness)
                    const lastMsg = messages[messages.length - 1];
                    if (lastMsg && lastMsg.type === 'alert') {
                        responseText = "✅ **Actie Uitgevoerd**: Cache is geflusht en load-balancers zijn opnieuw gekalibreerd. De latency zakt nu terug naar normaal (42ms).";
                    } else {
                        responseText = "Top! Heb je nog andere vragen of commando's?";
                    }
                }
                // GENERAL CHAT
                else if (lowerInput.includes('hallo') || lowerInput.includes('hoi') || lowerInput.includes('hi')) {
                    responseText = "Hallo, Control Tower. Ik sta klaar. Probeer commando's als 'Status Rapport', 'Voorspel groei' of 'Blokkeer gebruiker'.";
                }
                else {
                    responseText = "Ik begreep dat niet helemaal. Ik spreek nu Nederlands! Probeer:\n- 'Blokkeer gebruiker X'\n- 'Status rapport'\n- 'Voorspel groei'\n- 'Security uitleg'";
                }

                setMessages(prev => [...prev, { role: 'assistant', content: responseText, timestamp: new Date() }]);
                setIsTyping(false);
            }, 1000);

        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Mijn neurale kern maakt geen verbinding.", timestamp: new Date() }]);
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
                            <h3 className="font-bold text-white">Titan AI v1.2</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs text-gray-400">NL Module Actief</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : msg.type === 'alert'
                                    ? 'bg-red-500/10 border border-red-500/50 text-red-200 rounded-bl-none'
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
                            placeholder="Vraag iets aan Titan..."
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
