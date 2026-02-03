'use client';

import React, { useEffect, useState } from 'react';
import StatCard from '@/components/StatCard';
import LiveUsersTable from '@/components/LiveUsersTable';
import { useProjects } from '@/context/ProjectContext';
import { StatCardData } from '@/types';
import { PulseAPI } from '@/lib/api/pulse';
import MasterAreaChart from '@/components/charts/MasterAreaChart';
import TrendWidget from '@/components/TrendWidget';
import SecurityChart from '@/components/charts/SecurityChart';
import { Users, Activity, DollarSign, FolderKanban, ShieldAlert } from 'lucide-react';
import LiveActivityFeed from '@/components/LiveActivityFeed';
import LaunchStatsWidget from '@/components/LaunchStatsWidget';
import DashboardHeader from "@/components/DashboardHeader";
import HoloGlobe from "@/components/HoloGlobe";
import ReputationCounter from '@/components/ReputationCounter';
import AntigravityMonitor from '@/components/AntigravityMonitor';
import SupportHub from '@/components/SupportHub';
import ReputationTrendChart from '@/components/ReputationTrendChart';
import SecurityWidget from '@/components/SecurityWidget';

import { useAnomalyDetection } from "@/hooks/useAnomalyDetection";
import { SecurityEvent } from "@/types/support";
import NeuralInsights from '@/components/NeuralInsights';

export default function DashboardPage() {
  const [stats, setStats] = useState<StatCardData[]>([]);
  const [loading, setLoading] = useState(true);
  // Mock events for now, or fetch them properly. 
  // Ideally we would lift state from SecurityWidget or fetch here.
  // For the prompt's sake, we'll initialize with empty array and let the hook handle empty events gracefully (normal state),
  // OR we simulate an event if needed. The hook logic handles empty events fine (no critical alerts).
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const { projects, selectedProjectId } = useProjects();

  const { level: alertLevel, message: alertMessage } = useAnomalyDetection(stats, events);

  useEffect(() => {
    loadStats();
  }, [projects, selectedProjectId]); // Reload when projects or selection changes

  const loadStats = async () => {
    try {
      const targetProjectId = selectedProjectId || 'commonground'; // Default for stats API or use aggregation
      const api = new PulseAPI(targetProjectId);
      const { data } = await api.getStats();

      // If filtering, active projects is 1 (if operational) or 0
      // If global, sum of operational
      const activeProjectsCount = selectedProjectId
        ? (projects.find(p => p.id === selectedProjectId)?.status === 'operational' ? 1 : 0)
        : projects.filter(p => p.status === 'operational').length;

      const statCards: StatCardData[] = [
        {
          title: selectedProjectId ? 'Project Users' : 'Total Users',
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
          title: selectedProjectId ? 'Status' : 'Active Projects',
          value: selectedProjectId ? 'Active' : activeProjectsCount || 3,
          badge: { text: selectedProjectId ? 'Operational' : 'Running', color: 'green' }
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
      <DashboardHeader />

      {/* Neural Link Insight Widget */}
      <div className="mb-8">
        <NeuralInsights />
      </div>

      {/* Status Central */}
      <div className="flex flex-wrap items-center gap-6 mb-8 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">System Status</span>
          <div className="h-4 w-[1px] bg-gray-700"></div>
        </div>
        {projects.map(p => (
          <div key={p.id} className={`flex items-center gap-3 bg-[var(--sidebar-bg)] px-4 py-2 rounded-lg border border-[var(--card-border)] ${selectedProjectId === p.id ? 'border-blue-500/50 bg-blue-500/10' : 'opacity-80'}`}>
            <div className={`w-3 h-3 rounded-full animate-[pulse_1.5s_infinite] ${p.status === 'operational' ? 'bg-green-500 shadow-[0_0_12px_#22c55e]' : 'bg-red-500 shadow-[0_0_12px_#ef4444]'}`}></div>
            <span className={`font-semibold ${p.status === 'operational' ? 'text-white' : 'text-red-400'}`}>{p.name}</span>
          </div>
        ))}
      </div>

      {/* Stat Cards */}
      {
        loading ? (
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
        )
      }
      {/* Split Row: Master Chart & Security Watch */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Combined Traffic Volume (24h)</h3>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono border border-blue-500/20">Live Update</span>
          </div>

          <div className="mb-6 px-4">
            <TrendWidget />
          </div>

          <div className="h-[320px] w-full flex items-center justify-center">
            <MasterAreaChart />
          </div>
        </div>

        {/* Security Watch - Now using SecurityWidget */}
        <SecurityWidget />
      </div>

      {/* Support Hub & Reputation Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SupportHub />
        <ReputationTrendChart />
      </div>

      {/* Live Global Pulse Map (Replaces static table) */}
      {/* Live Global Pulse Map (Replaces static table) -> Upgraded to HoloGlobe */}
      <div className="mb-8">
        <HoloGlobe alertLevel={alertLevel} alertMessage={alertMessage} />
      </div>

      {/* Popular Lab & Launch Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        {/* Left Column: Quick Actions & Launch Stats */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReputationCounter />
            <AntigravityMonitor />
          </div>
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
    </div >
  );
}
