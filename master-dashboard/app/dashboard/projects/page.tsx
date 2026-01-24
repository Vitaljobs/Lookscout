'use client';

import React from 'react';
import Link from 'next/link';
import { FolderKanban, ArrowRight } from 'lucide-react';

const projects = [
    {
        id: 'commonground',
        name: 'Common Ground Pulse',
        slug: 'commonground',
        description: 'Community monitoring and analytics dashboard',
        status: 'active',
        users: 12847,
        color: 'green'
    },
    // Placeholders for future projects
    {
        id: 'titan',
        name: 'Titan',
        slug: 'titan',
        description: 'Structure visualization and management',
        status: 'planned',
        users: 0,
        color: 'blue'
    },
    {
        id: 'cybermatch',
        name: 'Cybermatch',
        slug: 'cybermatch',
        description: 'Security & matchmaking protocol',
        status: 'planned',
        users: 0,
        color: 'purple'
    }
];

export default function ProjectsPage() {
    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
                <p className="text-gray-400">
                    Overview of all your connected projects
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="card group hover:border-blue-500/50 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${project.color}-500/10`}>
                                <FolderKanban className={`w-5 h-5 text-${project.color}-500`} />
                            </div>
                            <span className={`badge ${project.status === 'active' ? 'badge-green' : 'badge-blue'
                                }`}>
                                {project.status}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">{project.name}</h3>
                        <p className="text-gray-400 text-sm mb-6">{project.description}</p>

                        <div className="flex items-center justify-between mt-auto">
                            <div className="text-sm text-gray-500">
                                {project.users > 0 && `${project.users.toLocaleString()} users`}
                            </div>

                            {project.status === 'active' ? (
                                <Link
                                    href={`/projects/${project.slug}`}
                                    className="p-2 rounded-full bg-[var(--sidebar-bg)] hover:bg-blue-600 hover:text-white text-gray-400 transition-all"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            ) : (
                                <button disabled className="p-2 rounded-full bg-[var(--sidebar-bg)] text-gray-600 cursor-not-allowed">
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
