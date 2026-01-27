export interface ProjectConfig {
    url: string;
    key: string;
}

export const PROJECT_CONFIG: Record<string, ProjectConfig> = {
    'commonground': {
        url: 'https://cwhcxazrmayjhaadtjqs.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3aGN4YXpybWF5amhhYWR0anFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODI0MjcsImV4cCI6MjA4NDc1ODQyN30.D0hr9a0O581o44erXMxtWqXbIhEzZ5yJ1t4b5CNhulg'
    },
    'vibechain': {
        url: 'https://cwhcxazrmayjhaadtjqs.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3aGN4YXpybWF5amhhYWR0anFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODI0MjcsImV4cCI6MjA4NDc1ODQyN30.D0hr9a0O581o44erXMxtWqXbIhEzZ5yJ1t4b5CNhulg'
    },
    'vitaljobs': {
        url: 'https://cwhcxazrmayjhaadtjqs.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3aGN4YXpybWF5amhhYWR0anFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODI0MjcsImV4cCI6MjA4NDc1ODQyN30.D0hr9a0O581o44erXMxtWqXbIhEzZ5yJ1t4b5CNhulg'
    }
};

export function getProjectConfig(projectId: string): ProjectConfig | null {
    return PROJECT_CONFIG[projectId] || null;
}
