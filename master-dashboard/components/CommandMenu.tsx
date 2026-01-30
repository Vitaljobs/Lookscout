'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    LayoutDashboard,
    Settings,
    FolderKanban,
    ShieldAlert,
    Globe,
    Command
} from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';

export default function CommandMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const { projects } = useProjects();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen((open) => !open);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        }
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const baseItems = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', type: 'Pages' },
        { name: 'Settings', icon: Settings, href: '/dashboard/settings', type: 'Pages' },
        { name: 'Projects', icon: FolderKanban, href: '/dashboard/projects', type: 'Pages' },
    ];

    const projectItems = projects.map(p => ({
        name: p.name,
        icon: Globe,
        href: `/dashboard/projects/${p.slug}`,
        type: 'Projects'
    }));

    const filteredItems = [...baseItems, ...projectItems].filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase())
    );

    const handleSelect = (item: any) => {
        router.push(item.href);
        setIsOpen(false);
        setQuery('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

            <div className="card w-full max-w-lg relative bg-[#151a21] border border-[var(--card-border)] shadow-2xl overflow-hidden p-0 animate-fade-in">
                <div className="flex items-center border-b border-[var(--card-border)] px-4 py-3">
                    <Search className="w-5 h-5 text-gray-400 mr-2" />
                    <input
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 font-medium"
                        placeholder="Type a command or search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    <div className="flex items-center gap-1">
                        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-gray-700 bg-gray-800 px-1.5 font-mono text-[10px] font-medium text-gray-400">
                            ESC
                        </kbd>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto py-2">
                    {filteredItems.length === 0 ? (
                        <div className="py-6 text-center text-sm text-gray-500">No results found.</div>
                    ) : (
                        ['Pages', 'Projects'].filter(type => filteredItems.some(i => i.type === type)).map((type) => (
                            <div key={type} className="mb-2">
                                <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase">{type}</div>
                                {filteredItems.filter(i => i.type === type).map((item, index) => (
                                    <button
                                        key={item.href}
                                        onClick={() => handleSelect(item)}
                                        className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors text-left"
                                    >
                                        <item.icon className="w-4 h-4 mr-3 opacity-70" />
                                        {item.name}
                                    </button>
                                ))}
                            </div>
                        ))
                    )}
                </div>

                <div className="border-t border-[var(--card-border)] px-4 py-2 bg-[var(--card-bg)] flex justify-between items-center text-[10px] text-gray-500">
                    <div className="flex gap-2">
                        <span>Navigate</span>
                        <span className="font-mono">↑↓</span>
                    </div>
                    <div className="flex gap-2">
                        <span>Select</span>
                        <span className="font-mono">↵</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
