'use client';

import React from 'react';
import { useProjects } from '@/context/ProjectContext';
import { ChevronRight, LayoutDashboard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardHeader() {
    const { selectedProjectId, projects, selectProject } = useProjects();
    const selectedProject = projects.find(p => p.id === selectedProjectId);

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <div
                    className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors"
                    onClick={() => selectProject(null)}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Control Tower</span>
                </div>
                {selectedProjectId && (
                    <>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2"
                        >
                            <span className="text-white font-medium">{selectedProject?.name || 'Unknown Project'}</span>
                            <button
                                onClick={() => selectProject(null)}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </motion.div>
                    </>
                )}
            </div>

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">
                        {selectedProjectId ? selectedProject?.name : 'Titan Overview'}
                    </h1>
                    <p className="text-gray-400">
                        {selectedProjectId
                            ? selectedProject?.description
                            : 'Monitoring active neural networks and system health'}
                    </p>
                </div>
                {selectedProjectId && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedProject?.theme === 'green' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                selectedProject?.theme === 'blue' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    selectedProject?.theme === 'purple' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                        'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            }`}
                    >
                        FOCUS MODE ACTIVE
                    </motion.div>
                )}
            </div>
        </div>
    );
}
