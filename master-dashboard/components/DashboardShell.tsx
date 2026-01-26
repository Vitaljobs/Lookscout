'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-[#0f1419]">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#1e2329] border-b border-gray-800 flex items-center px-4 z-40">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 text-gray-400 hover:text-white"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <span className="ml-3 font-bold text-white text-lg">Control Tower</span>
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

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full pt-16 md:pt-0 bg-[#0f1419]">
                {children}
            </main>
        </div>
    );
}
