'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { saveApiKey, getApiKey, removeApiKey } from '@/lib/storage';

import { CommonGroundStats } from '@/types';

export type ProjectStatus = 'operational' | 'maintenance' | 'degraded';
export type ProjectTheme = 'green' | 'blue' | 'orange' | 'purple' | 'pink' | 'red';

export interface Project {
    id: string;
    name: string;
    description: string;
    slug: string; // Used for URL routing (e.g. 'commonground')
    status: ProjectStatus;
    url: string;
    publicUrl?: string;
    key: string;
    theme: ProjectTheme;
    stats?: CommonGroundStats;
}

interface ProjectContextType {
    projects: Project[];
    selectedProjectId: string | null;
    selectProject: (id: string | null) => void;
    addProject: (project: Omit<Project, 'id'>) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;
    getProject: (slug: string) => Project | undefined;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const DEFAULT_PROJECTS: Project[] = [
    {
        id: 'commonground',
        name: 'Common Ground Pulse',
        description: 'Real-time social sentiment monitoring',
        slug: 'commonground',
        status: 'operational',
        url: process.env.NEXT_PUBLIC_PULSE_API_URL || '',
        publicUrl: '',
        key: process.env.NEXT_PUBLIC_PULSE_API_KEY || '',
        theme: 'green'
    },
    {
        id: 'vibechain',
        name: 'VIBECHAIN',
        description: 'Blockchain-based vibe tracking',
        slug: 'vibechain',
        status: 'operational',
        url: process.env.NEXT_PUBLIC_VIBECHAIN_URL || process.env.NEXT_PUBLIC_VIBECHAIN_API_URL || process.env.NEXT_PUBLIC_PULSE_API_URL || '',
        publicUrl: '',
        key: process.env.NEXT_PUBLIC_VIBECHAIN_KEY || process.env.NEXT_PUBLIC_VIBECHAIN_API_KEY || process.env.NEXT_PUBLIC_PULSE_API_KEY || '',
        theme: 'blue'
    },
    {
        id: 'vitaljobs',
        name: 'VitalJobs',
        description: 'Essential workforce analytics',
        slug: 'vitaljobs',
        status: 'operational',
        url: process.env.NEXT_PUBLIC_VITALJOBS_URL || process.env.NEXT_PUBLIC_VITALJOBS_API_URL || process.env.NEXT_PUBLIC_PULSE_API_URL || '',
        publicUrl: '',
        key: process.env.NEXT_PUBLIC_VITALJOBS_KEY || process.env.NEXT_PUBLIC_VITALJOBS_API_KEY || process.env.NEXT_PUBLIC_PULSE_API_KEY || '',
        theme: 'orange'
    },
    {
        id: 'baztion',
        name: 'Baztion',
        description: 'Psychological Safety & Culture',
        slug: 'baztion',
        status: 'operational',
        url: 'https://baztion.vercel.app',
        publicUrl: '',
        key: '',
        theme: 'purple'
    }
];

export function ProjectProvider({ children }: { children: ReactNode }) {
    const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('titan_projects');
        if (saved) {
            try {
                const parsed: Project[] = JSON.parse(saved);
                // Hydrate with secure keys, falling back to Env Vars if storage is empty
                // 1. Hydrate existing projects from storage
                const hydratedExisting = parsed.map(p => {
                    const defaultP = DEFAULT_PROJECTS.find(d => d.id === p.id);
                    // 1. Secure Storage (Session) 2. Local Storage (Persisted) 3. Env Var (Default)
                    const effectiveKey = getApiKey(p.id) || p.key || defaultP?.key || '';
                    const effectiveUrl = p.url || defaultP?.url || '';

                    return {
                        ...p,
                        key: effectiveKey,
                        url: effectiveUrl
                    };
                });

                // 2. Add any new default projects that are missing from storage (e.g. Baztion)
                const newDefaults = DEFAULT_PROJECTS.filter(d => !parsed.some(p => p.id === d.id));

                setProjects([...hydratedExisting, ...newDefaults]);
            } catch (e) {
                console.error('Failed to parse projects', e);
            }
        } else {
            // First run: Check secure storage for default projects
            const hydrated = DEFAULT_PROJECTS.map(p => ({
                ...p,
                key: getApiKey(p.id) || p.key || ''
            }));
            setProjects(hydrated);
        }
        setIsLoaded(true);
    }, []);

    // Save to LocalStorage on change
    useEffect(() => {
        if (isLoaded) {
            // Save project config (excluding sensitive key if we wanted, but keeping for now)
            // Ideally we strip the key before saving to plain localStorage, but for now we sync both
            localStorage.setItem('titan_projects', JSON.stringify(projects));
        }
    }, [projects, isLoaded]);

    const selectProject = (id: string | null) => {
        setSelectedProjectId(id);
    };

    const addProject = (data: Omit<Project, 'id'>) => {
        const newProject: Project = {
            ...data,
            id: data.slug // Use slug as ID for simplicity
        };

        if (newProject.key) {
            saveApiKey(newProject.id, newProject.key);
        }

        setProjects(prev => [...prev, newProject]);
    };

    const updateProject = (id: string, updates: Partial<Project>) => {
        if (updates.key !== undefined) {
            saveApiKey(id, updates.key);
        }
        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const deleteProject = (id: string) => {
        removeApiKey(id);
        setProjects(prev => prev.filter(p => p.id !== id));
    };

    const getProject = (slug: string) => {
        return projects.find(p => p.slug === slug);
    };

    return (
        <ProjectContext.Provider value={{
            projects,
            selectedProjectId,
            selectProject,
            addProject,
            updateProject,
            deleteProject,
            getProject
        }}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProjects() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProjects must be used within a ProjectProvider');
    }
    return context;
}
