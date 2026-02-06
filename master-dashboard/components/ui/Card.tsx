import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

export function Card({ children, className, noPadding = false, ...props }: CardProps) {
    return (
        <div
            className={twMerge(
                "bg-[var(--card-bg)]/60 backdrop-blur-md border border-[var(--card-border)] rounded-xl shadow-lg transition-all duration-300 hover:shadow-blue-900/10 hover:border-blue-500/30",
                noPadding ? "" : "p-6",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={twMerge("mb-4 flex items-center justify-between", className)}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <h3 className={twMerge("text-lg font-semibold text-white", className)}>
            {children}
        </h3>
    );
}
