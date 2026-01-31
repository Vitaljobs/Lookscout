'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FolderKanban,
    Settings,
    ChevronDown,
    Activity,
    ExternalLink,
    X
} from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';

// const projects = ... REMOVE THIS hardcoded array if present, or just let it interpret via context
// We should remove the hardcoded 'projects' array since we use context now


const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname();
    const [projectsOpen, setProjectsOpen] = useState(true);
    const { projects, selectedProjectId, selectProject } = useProjects();

    const handleNavClick = () => {
        if (onClose) onClose();
    };

    // Helper for status dots
    const getStatusColor = (status: string) => {
        if (status === 'operational') return 'bg-green-500';
        if (status === 'maintenance') return 'bg-red-500';
        return 'bg-orange-500'; // degraded
    };

    return (
        <div className="w-64 h-full bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border-r border-[var(--glass-border)] flex flex-col relative transition-all duration-300">
            {/* Close Button (Mobile Only) */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 md:hidden text-gray-400 hover:text-white"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Logo */}
            <div className="p-6 border-b border-[var(--card-border)]">
                <div className="flex items-center gap-2">
                    <Activity className="w-8 h-8 text-blue-500" />
                    <h1 className="text-xl font-bold text-white">Control Tower</h1>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => {
                                handleNavClick();
                                if (item.href === '/dashboard') selectProject(null);
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive && !selectedProjectId
                                ? 'bg-[var(--hover-bg)] text-white'
                                : 'text-gray-400 hover:bg-[var(--hover-bg)] hover:text-white'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}

                {/* Projects Section */}
                <div className="pt-6">
                    <button
                        onClick={() => setProjectsOpen(!projectsOpen)}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                    >
                        <span>PROJECTS</span>
                        <ChevronDown
                            className={`w-4 h-4 transition-transform ${projectsOpen ? 'rotate-180' : ''
                                }`}
                        />
                    </button>

                    {projectsOpen && (
                        <div className="mt-2 space-y-1">
                            {projects.map((project) => {
                                const isActive = pathname.includes(project.slug);
                                const isGreen = project.theme === 'green';
                                const isBlue = project.theme === 'blue';
                                const isOrange = project.theme === 'orange';
                                const isPurple = project.theme === 'purple';
                                const isPink = project.theme === 'pink';
                                const isRed = project.theme === 'red';

                                let activeClass = '';
                                if (isActive) {
                                    // Fallback defaults if theme logic gets complex, using hex for precision matching globals
                                    if (isGreen) activeClass = 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20';
                                    else if (isBlue) activeClass = 'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20';
                                    else if (isOrange) activeClass = 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20';
                                    else if (isPurple) activeClass = 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
                                    else if (isPink) activeClass = 'bg-pink-500/10 text-pink-500 border border-pink-500/20';
                                    else if (isRed) activeClass = 'bg-red-500/10 text-red-500 border border-red-500/20';
                                    else activeClass = 'bg-gray-500/10 text-white border border-gray-500/20';
                                }

                                return (
                                    <div key={project.id} className={`flex items-center justify-between w-full group`}>
                                        <button
                                            onClick={() => {
                                                selectProject(project.id);
                                                handleNavClick();
                                                // If we are not on dashboard, go there
                                                if (pathname !== '/dashboard') {
                                                    // router.push('/dashboard') - need to import useRouter
                                                }
                                            }}
                                            className={`flex-1 flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all text-left ${selectedProjectId === project.id
                                                ? activeClass
                                                : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            <div className={`w-3 h-3 rounded-full animate-pulse ${getStatusColor(project.status)} shadow-[0_0_12px_currentColor]`} />
                                            <span className={selectedProjectId === project.id ? 'text-electric-blue font-semibold shadow-neon-text' : ''}>{project.name}</span>
                                        </button>
                                        {project.publicUrl && (
                                            <a
                                                href={project.publicUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hidden group-hover:flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white transition-colors"
                                                title={`Visit ${project.name}`}
                                            >
                                                <ExternalLink className="w-3 h-3 hover:text-electric-blue hover:shadow-neon" />
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--card-border)]">
                <div className="text-xs text-gray-500 text-center font-mono">
                    Titan OS v3.3.0 (Mobile)
                </div>
            </div>
        </div>
    );
}
