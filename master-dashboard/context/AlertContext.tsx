'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useProjects } from './ProjectContext';
import { PulseAPI } from '@/lib/api/pulse';
import { AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

type AlertType = 'error' | 'warning' | 'success';

interface Alert {
    id: string;
    message: string;
    type: AlertType;
    projectId?: string;
    timestamp: Date;
}

interface AlertContextType {
    alerts: Alert[];
    addAlert: (message: string, type: AlertType, projectId?: string) => void;
    removeAlert: (id: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const { projects } = useProjects();

    const addAlert = (message: string, type: AlertType, projectId?: string) => {
        // Prevent duplicate alerts for the same project/message
        setAlerts(prev => {
            const exists = prev.find(a => a.message === message && a.projectId === projectId);
            if (exists) return prev;
            return [...prev, { id: Math.random().toString(36).substring(7), message, type, projectId, timestamp: new Date() }];
        });
    };

    const removeAlert = (id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    // Polling Logic for Health Checks
    useEffect(() => {
        const checkHealth = async () => {
            // We don't want to spam alerts, but we need to know if status changes.
            // For this MVP, we just check and alert if offline.
            for (const p of projects) {
                if (p.status === 'operational' || p.status === 'maintenance') {
                    try {
                        const api = new PulseAPI(p.id);
                        const { isLive, error } = await api.getStats();

                        if (!isLive && p.status === 'operational') {
                            addAlert(`Connection to ${p.name} lost! ${error ? `(${error})` : ''}`, 'error', p.id);
                        } else if (error) {
                            addAlert(`Error in ${p.name}: ${error}`, 'warning', p.id);
                        }
                    } catch (e) {
                        // Should be caught by pulse api, but just in case
                        addAlert(`Critical failure monitoring ${p.name}`, 'error', p.id);
                    }
                }
            }
        };

        // Check initially and then every 60s
        checkHealth();
        const interval = setInterval(checkHealth, 60000);
        return () => clearInterval(interval);
    }, [projects]);

    return (
        <AlertContext.Provider value={{ alerts, addAlert, removeAlert }}>
            {children}
            {/* Render Alerts here to avoid needing a separate component everywhere */}
            <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                {alerts.map(alert => (
                    <div
                        key={alert.id}
                        className={`pointer-events-auto min-w-[300px] p-4 rounded-lg shadow-2xl border flex items-start gap-3 transition-all animate-in slide-in-from-right duration-300 ${alert.type === 'error' ? 'bg-red-900/90 border-red-500/50 text-white' :
                                alert.type === 'warning' ? 'bg-yellow-900/90 border-yellow-500/50 text-white' :
                                    'bg-green-900/90 border-green-500/50 text-white'
                            }`}
                    >
                        {alert.type === 'error' && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                        {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />}
                        {alert.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />}

                        <div className="flex-1">
                            <h4 className="font-bold text-sm mb-0.5">System Alert</h4>
                            <p className="text-sm text-gray-200">{alert.message}</p>
                        </div>

                        <button onClick={() => removeAlert(alert.id)} className="hover:bg-white/10 p-1 rounded">
                            <XCircle className="w-4 h-4 opacity-50" />
                        </button>
                    </div>
                ))}
            </div>
        </AlertContext.Provider>
    );
}

export const useAlerts = () => {
    const context = useContext(AlertContext);
    if (!context) throw new Error('useAlerts must be used within AlertProvider');
    return context;
};
