import React from 'react';
import { useProjects } from '@/context/ProjectContext';
import { usePathname } from 'next/navigation';
import { ChevronRight, LayoutGrid, Mic, Bell, Search, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTitanVoice } from '@/hooks/useTitanVoice';

export default function DashboardHeader({ onMobileMenuClick }: { onMobileMenuClick?: () => void }) {
    const { selectedProjectId, projects, selectProject } = useProjects();
    const pathname = usePathname();
    const { isListening, toggleListening, transcript, lastCommand } = useTitanVoice();

    // Find current project name
    const currentProject = projects.find(p => p.id === selectedProjectId);

    return (
        <header className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700 sticky top-0 z-40 shadow-sm">
            {/* Left: Breadcrumbs & Indicator */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMobileMenuClick}
                    className="md:hidden text-gray-400 hover:text-white"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
                    onClick={() => selectProject(null)}
                >
                    <LayoutGrid className="w-5 h-5" />
                    <span className="font-medium hidden sm:inline-block">Control Tower</span>
                </div>

                {selectedProjectId && (
                    <>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3"
                        >
                            <span className="text-white font-semibold tracking-wide">{currentProject?.name}</span>
                            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full uppercase tracking-wider">
                                Focus
                            </span>
                        </motion.div>
                    </>
                )}
            </div>

            {/* Right: Voice Command & Context Actions */}
            <div className="flex items-center gap-4">

                {/* Search Bar (Visual Only for now, matches MaterialM) */}
                <div className="hidden md:flex items-center relative">
                    <Search className="w-4 h-4 absolute left-3 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-64 pl-10 p-2.5"
                    />
                </div>

                {/* Voice Feedback */}
                <AnimatePresence>
                    {(isListening || lastCommand) && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="overflow-hidden whitespace-nowrap hidden sm:block"
                        >
                            <span className="text-xs font-mono text-blue-400 px-2">
                                {lastCommand ? `> ${lastCommand}` : transcript || "Listening..."}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mic Toggle */}
                <button
                    onClick={toggleListening}
                    className={`relative p-2 rounded-lg transition-all ${isListening
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                >
                    <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
                </button>

                {/* Notifications */}
                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-gray-800"></span>
                </button>

                <div className="h-8 w-[1px] bg-gray-700 mx-2"></div>

                {/* User Profile (Simple Avatar) */}
                <button className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border border-gray-600"></div>
                </button>
            </div>
        </header>
    );
}
