'use client';

import React, { useState, useEffect } from 'react';
import { LiveUser } from '@/types';
import { commonGroundAPI } from '@/lib/api/commonground';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LiveUsersTable() {
    const [users, setUsers] = useState<LiveUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 5;

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const { data } = await commonGroundAPI.getLiveUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const formatLastSeen = (date: Date) => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 60000);

        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        const hours = Math.floor(diff / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    if (loading) {
        return (
            <div className="card">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-pulse text-gray-400">Loading live users...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="table-container animate-fade-in">
            <div className="p-6 border-b border-[var(--card-border)]">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Live Users</h2>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm text-gray-400">{users.length} active</span>
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>
                            <div className="flex items-center gap-2">
                                User
                                <ArrowUpDown className="w-3 h-3" />
                            </div>
                        </th>
                        <th>Activity</th>
                        <th>
                            <div className="flex items-center gap-2">
                                Location
                                <ArrowUpDown className="w-3 h-3" />
                            </div>
                        </th>
                        <th>
                            <div className="flex items-center gap-2">
                                Status
                                <ArrowUpDown className="w-3 h-3" />
                            </div>
                        </th>
                        <th>Last Seen</th>
                    </tr>
                </thead>
                <tbody>
                    {currentUsers.map((user) => (
                        <tr key={user.id}>
                            <td>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">{user.name}</div>
                                        <div className="text-sm text-gray-400">{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="text-gray-300">{user.activity}</td>
                            <td className="text-gray-300">{user.location}</td>
                            <td>
                                <span className={`badge ${getStatusBadge(user.status)}`}>
                                    {user.status}
                                </span>
                            </td>
                            <td className="text-gray-400">{formatLastSeen(user.lastSeen)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--card-border)]">
                <div className="text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-400 hover:bg-[var(--hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-400 hover:bg-[var(--hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
