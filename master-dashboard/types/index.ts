// TypeScript interfaces for Master Dashboard

export interface CommonGroundStats {
  total_users: number;
  active_now: number;
  page_views_24h: number;
  popular_lab: string;
}

export interface LiveUser {
  id: string;
  name: string;
  email: string;
  activity: string;
  location: string;
  status: 'online' | 'idle' | 'offline';
  lastSeen: Date;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  apiKey?: string;
  publicUrl?: string; // New field for public site link
  enabled: boolean;
  status: 'operational' | 'maintenance' | 'degraded';
  theme: 'blue' | 'green' | 'orange' | 'purple' | 'pink' | 'red';
  stats?: CommonGroundStats;
}

export interface ActivityFeedItem {
  id: string;
  user: string;
  action: string; // "Checked in", "Signed up", "Completed session"
  metadata?: {
    mood?: number;
    note?: string;
    project?: string;
  };
  timestamp: Date;
}

export interface StatCardData {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down';
  badge?: {
    text: string;
    color: 'red' | 'green' | 'blue' | 'orange';
  };
}
