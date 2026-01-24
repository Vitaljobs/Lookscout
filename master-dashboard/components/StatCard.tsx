'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { StatCardData } from '@/types';

interface StatCardProps {
    data: StatCardData;
}

export default function StatCard({ data }: StatCardProps) {
    const { title, value, change, trend, badge } = data;

    const badgeColors = {
        red: 'badge-red',
        green: 'badge-green',
        blue: 'badge-blue',
        orange: 'badge-orange',
    };

    return (
        <div className="card animate-fade-in">
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400">{title}</h3>
                {badge && (
                    <span className={`badge ${badgeColors[badge.color]}`}>
                        {badge.text}
                    </span>
                )}
            </div>

            <div className="flex items-end justify-between">
                <div>
                    <p className="text-3xl font-bold text-white mb-1">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    {change !== undefined && (
                        <div className="flex items-center gap-1 text-sm">
                            {trend === 'up' ? (
                                <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-red-500" />
                            )}
                            <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                                {Math.abs(change)}%
                            </span>
                            <span className="text-gray-500">vs last month</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
