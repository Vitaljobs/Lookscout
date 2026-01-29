'use client';

import React, { useEffect, useState } from 'react';
import StatCard from '@/components/StatCard';
import LiveUsersTable from '@/components/LiveUsersTable';
import { useProjects } from '@/context/ProjectContext';
import { StatCardData } from '@/types';
import { PulseAPI } from '@/lib/api/pulse';
import MasterAreaChart from '@/components/charts/MasterAreaChart';
import { Users, Activity, DollarSign, FolderKanban } from 'lucide-react';
import LiveActivityFeed from '@/components/LiveActivityFeed';
import LaunchStatsWidget from '@/components/LaunchStatsWidget';

export default function DashboardPage() {
  const [stats, setStats] = useState<StatCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const { projects } = useProjects();

  useEffect(() => {
    loadStats();
  }, [projects]); // Reload when projects load

  const loadStats = async () => {
    try {
      // Initialize with default project (or fetch from user prefs later)
      const api = new PulseAPI('commonground');
      const { data } = await api.getStats();

      // Calculate total stats across all projects if possible, or just use Common Ground as proxy for now
      // But for "Active Projects" we have the real list
      const activeProjectsCount = projects.filter(p => p.status === 'operational').length;

      const statCards: StatCardData[] = [
        {
          title: 'Total Users',
          value: data.total_users || 0,
          change: 12.5,
          trend: 'up',
          badge: { text: 'Growth', color: 'green' }
        },
        {
          title: 'Live Visitors',
          value: data.active_now || 0,
          badge: { text: 'Live', color: 'red' }
        },
        {
          title: 'Page Views (24h)',
          value: data.page_views_24h || 0,
          change: 8.2,
          trend: 'up',
          badge: { text: 'Native', color: 'blue' }
        },
        {
          title: 'Active Projects',
          value: activeProjectsCount || 3, // Fallback to 3 if context empty for some reason
          badge: { text: 'Running', color: 'orange' }
        }
      ];

      setStats(statCards);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Hey there, Control Tower! 👋
        </h1>
        <p className="text-gray-400">
          Welcome back. Here's what's happening with your projects.
        </p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-32 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatCard key={index} data={stat} />
          ))}
        </div>
      )}

      {/* Master Chart Section */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Combined Traffic Volume (24h)</h3>
        </div>
        <div className="h-[320px] w-full flex items-center justify-center">
          <MasterAreaChart />
        </div>
      </div>

      {/* Live Users Table */}
      <div className="mb-8">
        <LiveUsersTable />
      </div>

      {/* Popular Lab & Launch Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        {/* Left Column: Quick Actions & Launch Stats */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <LaunchStatsWidget />

          <div className="card flex-1">
            <h3 className="text-lg font-semibold text-white mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center gap-3 p-4 rounded-lg bg-[var(--sidebar-bg)] hover:bg-[var(--hover-bg)] transition-colors text-left">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium text-white">View All Users</div>
                  <div className="text-sm text-gray-400">Manage user accounts</div>
                </div>
              </button>
              <button className="flex items-center gap-3 p-4 rounded-lg bg-[var(--sidebar-bg)] hover:bg-[var(--hover-bg)] transition-colors text-left">
                <Activity className="w-5 h-5 text-green-500" />
                <div>
                  <div className="font-medium text-white">Activity Log</div>
                  <div className="text-sm text-gray-400">View recent activity</div>
                </div>
              </button>
              <button className="flex items-center gap-3 p-4 rounded-lg bg-[var(--sidebar-bg)] hover:bg-[var(--hover-bg)] transition-colors text-left">
                <DollarSign className="w-5 h-5 text-yellow-500" />
                <div>
                  <div className="font-medium text-white">Revenue Report</div>
                  <div className="text-sm text-gray-400">Financial overview</div>
                </div>
              </button>
              <button className="flex items-center gap-3 p-4 rounded-lg bg-[var(--sidebar-bg)] hover:bg-[var(--hover-bg)] transition-colors text-left">
                <FolderKanban className="w-5 h-5 text-purple-500" />
                <div>
                  <div className="font-medium text-white">Add Project</div>
                  <div className="text-sm text-gray-400">Create new project</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Feed */}
        <div className="min-h-[400px]">
          <LiveActivityFeed />
        </div>
      </div>
    </div>
  );
}
