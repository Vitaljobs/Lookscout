'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ProjectStatus = 'operational' | 'maintenance' | 'degraded';
export type ProjectTheme = 'green' | 'blue' | 'orange' | 'purple' | 'pink' | 'red';

export interface Project {
    id: string;
    name: string;
    description: string;
    slug: string; // Used for URL routing (e.g. 'commonground')
    status: ProjectStatus;
    url: string;
    key: string;
    theme: ProjectTheme;
}

interface ProjectContextType {
    projects: Project[];
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
        url: '',
        key: '',
        theme: 'green'
    },
    {
        id: 'vibechain',
        name: 'VIBECHAIN',
        description: 'Blockchain-based vibe tracking',
        slug: 'vibechain',
        status: 'operational',
        url: '',
        key: '',
        theme: 'blue'
    },
    {
        id: 'vitaljobs',
        name: 'VitalJobs',
        description: 'Essential workforce analytics',
        slug: 'vitaljobs',
        status: 'operational',
        url: '',
        key: '',
        theme: 'orange'
    }
];

export function ProjectProvider({ children }: { children: ReactNode }) {
    const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('titan_projects');
        if (saved) {
            try {
                setProjects(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse projects', e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to LocalStorage on change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('titan_projects', JSON.stringify(projects));
        }
    }, [projects, isLoaded]);

    const addProject = (data: Omit<Project, 'id'>) => {
        const newProject: Project = {
            ...data,
            id: data.slug // Use slug as ID for simplicity
        };
        setProjects(prev => [...prev, newProject]);
    };

    const updateProject = (id: string, updates: Partial<Project>) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const deleteProject = (id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
    };

    const getProject = (slug: string) => {
        return projects.find(p => p.slug === slug);
    };

    return (
        <ProjectContext.Provider value={{ projects, addProject, updateProject, deleteProject, getProject }}>
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
