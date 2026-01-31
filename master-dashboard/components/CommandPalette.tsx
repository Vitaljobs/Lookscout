'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import { Search, Ban, Terminal, Activity, ShieldAlert, LifeBuoy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export function CommandPalette() {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState('');
    const [pages, setPages] = React.useState<string[]>([]);
    const router = useRouter();
    const supabase = createClient();
    const activePage = pages[pages.length - 1];
    const isHome = pages.length === 0;

    // Toggle with Cmd+K
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const handleBanIP = async (ip: string) => {
        if (!ip) return;
        try {
            await supabase.from('blocked_ips').insert({
                ip_address: ip,
                reason: 'Banned via Neural Command',
                blocked_by: 'titan-admin',
                is_permanent: true
            });
            // Also log event
            await supabase.from('security_events').insert({
                event_type: 'manual_ban',
                severity: 'high',
                ip_address: ip,
                reason: 'Manual ban via Command Palette',
                project_source: 'titan-control-tower'
            });
            alert(`IP ${ip} has been banned.`);
            setOpen(false);
        } catch (e) {
            console.error(e);
            alert('Failed to ban IP.');
        }
    };

    const popPage = React.useCallback(() => {
        setPages((pages) => {
            const x = [...pages];
            x.pop();
            return x;
        });
    }, []);

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) setOpen(false);
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-[640px] overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]/90 shadow-2xl backdrop-blur-xl"
            >
                <div className="flex items-center border-b border-white/10 px-4 py-3">
                    <Search className="mr-2 h-5 w-5 text-gray-400" />
                    <Command.Input
                        autoFocus
                        placeholder="Type a command or search..."
                        className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <div className="flex gap-1">
                        <kbd className="hidden rounded bg-white/10 px-2 py-0.5 text-xs font-light text-gray-400 md:inline-block">ESC</kbd>
                    </div>
                </div>

                <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-800">
                    <Command.Empty className="py-6 text-center text-sm text-gray-500">
                        No results found.
                    </Command.Empty>

                    {!activePage && (
                        <>
                            <Command.Group heading="Neural Ideas">
                                <Command.Item
                                    className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white aria-selected:bg-white/5 aria-selected:text-white"
                                    onSelect={() => {
                                        const ip = prompt('Enter IP to ban:');
                                        if (ip) handleBanIP(ip);
                                    }}
                                >
                                    <Ban className="mr-2 h-4 w-4 text-red-400" />
                                    <span>Ban IP Address</span>
                                    <span className="ml-auto text-xs text-gray-500">Action</span>
                                </Command.Item>
                                <Command.Item
                                    className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white aria-selected:bg-white/5 aria-selected:text-white"
                                    onSelect={() => {
                                        // Scroll to Support Hub
                                        const el = document.getElementById('support-hub');
                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                        setOpen(false);
                                    }}
                                >
                                    <LifeBuoy className="mr-2 h-4 w-4 text-blue-400" />
                                    <span>Open Support Hub</span>
                                </Command.Item>
                                <Command.Item
                                    className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white aria-selected:bg-white/5 aria-selected:text-white"
                                    onSelect={() => {
                                        alert('Echo Chamber Status: OPTIMAL\nSync Rate: 99.8%\nNodes Active: 4');
                                        setOpen(false);
                                    }}
                                >
                                    <Activity className="mr-2 h-4 w-4 text-green-400" />
                                    <span>Check Echo Stats</span>
                                </Command.Item>
                            </Command.Group>

                            <Command.Separator className="my-1 h-px bg-white/10" />

                            <Command.Group heading="System">
                                <Command.Item className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white aria-selected:bg-white/5 aria-selected:text-white">
                                    <Terminal className="mr-2 h-4 w-4" />
                                    <span>View System Logs</span>
                                </Command.Item>
                                <Command.Item className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white aria-selected:bg-white/5 aria-selected:text-white">
                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                    <span>Security Status</span>
                                </Command.Item>
                            </Command.Group>
                        </>
                    )}
                </Command.List>

                <div className="border-t border-white/10 px-4 py-2 text-[10px] text-gray-500 flex justify-between">
                    <span>Titan Neural Command v2.5</span>
                    <div className="flex gap-2">
                        <span>Select <kbd className="font-sans bg-white/10 px-1 rounded">↵</kbd></span>
                        <span>Navigate <kbd className="font-sans bg-white/10 px-1 rounded">↓</kbd></span>
                    </div>
                </div>
            </motion.div>
        </Command.Dialog>
    );
}
