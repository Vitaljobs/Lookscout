'use client';

import React, { useState, useEffect } from 'react';
import { LiveUser } from '@/types';
import { PulseAPI } from '@/lib/api/pulse';
import { useProjects } from '@/context/ProjectContext';
import { ArrowUpDown, ChevronLeft, ChevronRight, Settings } from 'lucide-react';

interface GlobalUser extends LiveUser {
    source: string;
    sourceTheme: string;
    projectId: string;
}

export default function GlobalUserTable() {
    const { projects } = useProjects();
    const [users, setUsers] = useState<GlobalUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 5;

    const loadUsers = async () => {
        try {
            // Only set loading on first load
            if (users.length === 0) setLoading(true);

            const allUsers: GlobalUser[] = [];

            await Promise.all(projects.map(async (p) => {
                try {
                    const api = new PulseAPI(p.id);
                    const { data } = await api.getLiveUsers();
                    const projectUsers = data.map(u => ({
                        ...u,
                        source: p.name,
                        sourceTheme: p.theme,
                        projectId: p.id
                    }));
                    allUsers.push(...projectUsers);
                } catch (e) {
                    console.error(`Failed to load users for ${p.name}`, e);
                }
            }));

            // Sort by most recent
            const sorted = allUsers.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
            setUsers(sorted);
        } catch (error) {
            console.error('Failed to load global users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
        const interval = setInterval(loadUsers, 5000);
        return () => clearInterval(interval);
    }, [projects]);

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(users.length / usersPerPage);

    const getStatusBadge = (status: string) => {
        const badges = {
            online: 'badge-green',
            idle: 'badge-orange',
            offline: 'badge-red',
        };
        return badges[status as keyof typeof badges] || 'badge-blue';
    };

    const getSourceBadgeColor = (theme: string) => {
        const map: Record<string, string> = {
            green: 'bg-green-500/10 text-green-500 border-green-500/20',
            blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
            purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            red: 'bg-red-500/10 text-red-500 border-red-500/20',
        };
        return map[theme] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    };

    const formatLastSeen = (date: Date | string) => {
        if (!date) return 'Unknown';
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return 'Unknown';

        const now = new Date();
        const diff = Math.floor((now.getTime() - dateObj.getTime()) / 60000);

        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        const hours = Math.floor(diff / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    const handleManage = async (user: GlobalUser) => {
        // Simple confirmation for now
        const shouldBlock = window.confirm(`ACTIE: Wil je gebruiker ${user.name} blokkeren van ${user.source}?\n\nDit zal de toegang direct intrekken.`);

        if (shouldBlock) {
            try {
                const api = new PulseAPI(user.projectId);
                const result = await api.blockUser(user.id);
                alert(result.message || `Gebruiker ${user.name} is succesvol geblokkeerd.`);
                // Refresh list to potentially show status change (if API supported it)
                loadUsers();
            } catch (e) {
                alert("Fout bij blokkeren: " + e);
            }
        }
    };

    if (loading && users.length === 0) {
        return (
            <div className="card">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-pulse text-gray-400">Loading global users...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="table-container animate-fade-in shadow-2xl shadow-blue-900/10">
            <div className="p-6 border-b border-[var(--card-border)] bg-[var(--sidebar-bg)]">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Global User Table
                            <span className="px-2 py-0.5 rounded text-xs bg-blue-500 text-white">v1.2.0</span>
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Real-time user sessions across all connected platforms</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm text-gray-400">{users.length} active sessions</span>
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th className="w-[200px]">User</th>
                        <th>Source (Project)</th>
                        <th>Activity</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Last Seen</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentUsers.map((user, idx) => (
                        <tr key={`${user.id}-${idx}`} className="group hover:bg-[var(--hover-bg)] transition-colors">
                            <td>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white font-semibold shadow-lg group-hover:from-blue-600 group-hover:to-purple-600 transition-all">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-medium text-white group-hover:text-blue-400 transition-colors">{user.name}</div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getSourceBadgeColor(user.sourceTheme)}`}>
                                    {user.source}
                                </span>
                            </td>
                            <td className="text-gray-300 font-mono text-xs">{user.activity}</td>
                            <td className="text-gray-300">
                                <span className="flex items-center gap-1">
                                    📍 {user.location}
                                </span>
                            </td>
                            <td>
                                <span className={`badge ${getStatusBadge(user.status)}`}>
                                    {user.status}
                                </span>
                            </td>
                            <td className="text-gray-400 text-xs">{formatLastSeen(user.lastSeen)}</td>
                            <td>
                                <button
                                    onClick={() => handleManage(user)}
                                    className="px-3 py-1.5 rounded-md bg-[var(--card-border)] hover:bg-blue-600 text-white text-xs font-medium transition-colors flex items-center gap-1 active:scale-95"
                                >
                                    <Settings className="w-3 h-3" />
                                    Manage
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--card-border)] bg-[var(--card-bg)]">
                <div className="text-sm text-gray-400">
                    Showing {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, users.length)} of {users.length} users
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
