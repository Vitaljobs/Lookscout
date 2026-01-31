'use client';

import React, { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

interface AnimatedCounterProps {
    value: number;
    direction?: 'up' | 'down';
    className?: string;
    prefix?: string;
    suffix?: string;
}

export default function AnimatedCounter({
    value,
    direction = 'up',
    className = "",
    prefix = "",
    suffix = ""
}: AnimatedCounterProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        damping: 30,
        stiffness: 100,
    });
    const isInView = useInView(ref, { once: true, margin: "-10px" });

    useEffect(() => {
        if (isInView) {
            motionValue.set(value);
        }
    }, [motionValue, isInView, value]);

    useEffect(() => {
        springValue.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = `${prefix}${Intl.NumberFormat('en-US').format(Math.floor(latest))}${suffix}`;
            }
        });
    }, [springValue, prefix, suffix]);

    return <span ref={ref} className={className} />;
}
