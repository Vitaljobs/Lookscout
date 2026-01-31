import React from 'react';
import { useProjects } from '@/context/ProjectContext';
import { usePathname } from 'next/navigation';
import { ChevronRight, LayoutGrid, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTitanVoice } from '@/hooks/useTitanVoice';

export default function DashboardHeader() {
    const { selectedProjectId, projects, selectProject } = useProjects();
    const pathname = usePathname();
    const { isListening, toggleListening, transcript, lastCommand } = useTitanVoice();

    // Find current project name
    const currentProject = projects.find(p => p.id === selectedProjectId);

    return (
        <div className="flex items-center justify-between mb-8 p-4 bg-black/40 border-b border-white/5 backdrop-blur-md rounded-xl sticky top-0 z-40">
            {/* Left: Breadcrumbs & Indicator */}
            <div className="flex items-center gap-4">
                <div
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
                    onClick={() => selectProject(null)}
                >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="font-mono tracking-widest uppercase">Control Tower</span>
                </div>

                {selectedProjectId && (
                    <>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2"
                        >
                            <span className="text-white font-bold tracking-wide">{currentProject?.name}</span>
                            <span className="px-2 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded uppercase tracking-wider">
                                Focus Mode
                            </span>
                        </motion.div>
                    </>
                )}
            </div>

            {/* Right: Voice Command & Context Actions */}
            <div className="flex items-center gap-6">

                {/* Voice Feedback */}
                <AnimatePresence>
                    {(isListening || lastCommand) && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="overflow-hidden whitespace-nowrap"
                        >
                            <span className="text-xs font-mono text-blue-400">
                                {lastCommand ? `> ${lastCommand}` : transcript || "Listening..."}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mic Toggle */}
                <button
                    onClick={toggleListening}
                    className={`relative p-2 rounded-full transition-all ${isListening
                            ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                >
                    <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
                    {isListening && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                    )}
                </button>

                <div className="h-6 w-[1px] bg-white/10"></div>

                <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                    <div className={`w-2 h-2 rounded-full ${selectedProjectId ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                    {selectedProjectId ? 'CONTEXT_ACTIVE' : 'GLOBAL_VIEW'}
                </div>
            </div>
        </div>
    );
}
