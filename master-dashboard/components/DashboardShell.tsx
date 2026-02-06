'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import CommandMenu from './CommandMenu';
import DashboardHeader from './DashboardHeader';
import { Menu, Bell } from 'lucide-react';
import { useAlerts } from '@/context/AlertContext';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[var(--background)]">
            <CommandMenu />

            {/* Sidebar with Mobile State */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--background)] relative">
                {/* Header is now part of the shell layout */}
                <DashboardHeader onMobileMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 overflow-y-auto w-full p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

function NotificationBell() {
    const { alerts } = useAlerts();
    // Count warnings and errors
    const alertCount = alerts.filter(a => a.type === 'error' || a.type === 'warning').length;

    return (
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors group">
            <div className="absolute inset-0 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <Bell className="w-6 h-6" />
            {alertCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold border border-[#0f1419] animate-pulse">
                    {alertCount}
                </span>
            )}
        </button>
    )
}
