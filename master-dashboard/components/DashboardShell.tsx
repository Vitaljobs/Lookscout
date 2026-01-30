'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import CommandMenu from './CommandMenu';
import { Menu, Bell } from 'lucide-react';
import { useAlerts } from '@/context/AlertContext';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#0f1419]">
            <CommandMenu />
            {/* Mobile Header (Relative, taking up space) */}
            <div className="md:hidden flex-none h-16 bg-[#1e2329] border-b border-gray-800 flex items-center justify-between px-4 z-40 shadow-lg relative">
                <div className="flex items-center">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-400 hover:text-white"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="ml-2 font-bold text-white text-lg">Control Tower <span className="text-xs text-gray-400 font-normal ml-1">v1.2.0</span></span>
                </div>
            </div>

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

            {/* Desktop Notification Bell */}
            <div className="hidden md:block absolute top-6 right-8 z-30">
                <NotificationBell />
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full bg-[#0f1419] relative">
                {children}
            </main>
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
