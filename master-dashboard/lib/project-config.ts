export interface ProjectConfig {
    url: string;
    key: string;
}

export const PROJECT_CONFIG: Record<string, ProjectConfig> = {
    'commonground': {
        url: 'https://gzedshdaekxeccomkxkn.supabase.co/rest/v1',
        key: 'sb_publishable_jFJVJgP161jS6QW45A4IVQ_UZlCk7bh'
    },
    // Placeholders for other projects
    'vibechain': {
        url: '',
        key: ''
    },
    'vitaljobs': {
        url: '',
        key: ''
    }
};

export function getProjectConfig(projectId: string): ProjectConfig | null {
    return PROJECT_CONFIG[projectId] || null;
}
