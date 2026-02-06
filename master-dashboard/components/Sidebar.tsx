'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
    Sidebar as FlowbiteSidebar,
    SidebarItems,
    SidebarItemGroup,
    SidebarItem,
    SidebarCollapse
} from 'flowbite-react';
import {
    LayoutDashboard,
    FolderKanban,
    Settings,
    ChevronDown,
    Activity,
    ExternalLink,
    X,
    LogOut,
    Github,
    Server,
    Cpu,
    Grid
} from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname();
    const { projects, selectedProjectId, selectProject } = useProjects();
    const [isProjectsOpen, setIsProjectsOpen] = useState(true);

    const handleNavClick = () => {
        if (onClose) onClose();
    };

    // Helper for status dots
    const getStatusColor = (status: string) => {
        if (status === 'operational') return 'bg-green-400';
        if (status === 'maintenance') return 'bg-red-400';
        return 'bg-amber-400'; // degraded
    };

    const customTheme = {
        root: {
            base: "h-full bg-gray-800 border-r border-gray-700 transition-all duration-300",
            inner: "h-full overflow-y-auto overflow-x-hidden rounded bg-gray-800 px-3 py-4 dark:bg-gray-800"
        },
        item: {
            base: "flex items-center justify-center rounded-lg p-2 text-base font-normal text-gray-400 hover:bg-gray-700 hover:text-white dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white",
            active: "bg-blue-600 text-white dark:bg-blue-600 dark:text-white",
            icon: {
                base: "h-6 w-6 flex-shrink-0 text-gray-400 transition duration-75 group-hover:text-white dark:text-gray-400 dark:group-hover:text-white",
                active: "text-white dark:text-white"
            }
        },
        collapse: {
            button: "group flex w-full items-center rounded-lg p-2 text-base font-normal text-gray-400 transition duration-75 hover:bg-gray-700 hover:text-white dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white",
            icon: {
                base: "h-6 w-6 text-gray-400 transition duration-75 group-hover:text-white dark:text-gray-400 dark:group-hover:text-white",
                open: {
                    off: "",
                    on: "text-white"
                }
            }
        }
    };

    return (
        <FlowbiteSidebar theme={customTheme} aria-label="Sidebar with multi-level dropdown">
            {/* Mobile Close */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 md:hidden text-gray-400 hover:text-white"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Logo Section */}
            <div className="flex items-center gap-3 pl-2.5 mb-6">
                <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/30">
                    <Activity className="w-6 h-6 text-white" />
                </div>
                <span className="self-center whitespace-nowrap text-xl font-bold text-white tracking-tight">
                    Control Tower
                </span>
            </div>

            <SidebarItems>
                <SidebarItemGroup>
                    {navigation.map((item) => (
                        <SidebarItem
                            key={item.name}
                            href={item.href}
                            icon={item.icon}
                            active={pathname === item.href}
                            onClick={() => {
                                handleNavClick();
                                if (item.href === '/dashboard') selectProject(null);
                            }}
                        >
                            {item.name}
                        </SidebarItem>
                    ))}
                </SidebarItemGroup>

                <SidebarItemGroup>
                    <SidebarCollapse
                        icon={Grid}
                        label="Projects"
                        open={isProjectsOpen}
                        onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                    >
                        {projects.map((project) => (
                            <SidebarItem
                                key={project.id}
                                as="button"
                                onClick={() => {
                                    selectProject(project.id);
                                    handleNavClick();
                                }}
                                className={`pl-8 transition-colors ${selectedProjectId === project.id
                                    ? 'text-blue-400 hover:text-blue-300'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)} ${selectedProjectId === project.id ? 'animate-pulse shadow-[0_0_8px_currentColor]' : ''}`} />
                                    <span className="truncate">{project.name}</span>
                                </div>
                            </SidebarItem>
                        ))}
                    </SidebarCollapse>
                </SidebarItemGroup>

                <SidebarItemGroup className="mt-auto">
                    <SidebarItem
                        href="#"
                        icon={LogOut}
                        onClick={async () => {
                            const { createClient } = await import('@/utils/supabase/client');
                            const supabase = createClient();
                            await supabase.auth.signOut();
                            window.location.href = '/login';
                        }}
                        className="hover:bg-red-500/10 hover:text-red-400 group-hover:text-red-400"
                    >
                        Sign Out
                    </SidebarItem>

                    <div className="px-2 py-4 mt-4">
                        <div className="bg-gray-700/50 rounded-lg p-3">
                            <h5 className="text-xs font-semibold text-gray-400 uppercase mb-2">System Status</h5>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Version</span>
                                <span className="text-blue-400">v3.4.7</span>
                            </div>
                        </div>
                    </div>
                </SidebarItemGroup>
            </SidebarItems>
        </FlowbiteSidebar>
    );
}
