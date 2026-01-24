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
  enabled: boolean;
  stats?: CommonGroundStats;
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
