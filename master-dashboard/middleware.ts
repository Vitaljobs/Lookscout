import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Rate limiting map (in-memory, for production use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// IP blocking check
async function isIPBlocked(ip: string): Promise<boolean> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('blocked_ips')
            .select('*')
            .eq('ip_address', ip)
            .maybeSingle();

        if (error) {
            console.error('Error checking blocked IP:', error);
            return false;
        }

        if (!data) return false;

        // Check if block has expired
        if (data.blocked_until && new Date(data.blocked_until) < new Date()) {
            // Remove expired block
            await supabase.from('blocked_ips').delete().eq('id', data.id);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in isIPBlocked:', error);
        return false;
    }
}

// Log security event
async function logSecurityEvent(
    ip: string,
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    reason: string,
    userAgent?: string
) {
    try {
        const supabase = await createClient();
        await supabase.from('security_events').insert({
            event_type: eventType,
            ip_address: ip,
            user_agent: userAgent,
            reason,
            severity,
            project_source: 'titan-control-tower',
        });
    } catch (error) {
        console.error('Error logging security event:', error);
    }
}

// Block IP address
async function blockIP(ip: string, reason: string, durationMinutes?: number) {
    try {
        const supabase = await createClient();
        const blockedUntil = durationMinutes
            ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
            : null;

        await supabase.from('blocked_ips').insert({
            ip_address: ip,
            reason,
            blocked_until: blockedUntil,
            is_permanent: !durationMinutes,
            blocked_by: 'lockout-scout',
        });

        await logSecurityEvent(ip, 'ip_blocked', 'high', reason);
    } catch (error) {
        console.error('Error blocking IP:', error);
    }
}

// Rate limiting check
function checkRateLimit(ip: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (record.count >= maxRequests) {
        return false;
    }

    record.count++;
    return true;
}

export async function middleware(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const pathname = request.nextUrl.pathname;

    // Skip middleware for static files and API routes that don't need protection
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api/proxy') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Check if IP is blocked
    if (await isIPBlocked(ip)) {
        await logSecurityEvent(ip, 'blocked_access_attempt', 'critical', 'Attempted access from blocked IP', userAgent);

        return new NextResponse(
            JSON.stringify({
                error: 'Access Denied',
                message: 'Your IP address has been blocked due to suspicious activity.',
            }),
            {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    // Rate limiting check
    if (!checkRateLimit(ip, 100, 60000)) {
        await logSecurityEvent(ip, 'rate_limit_exceeded', 'medium', `Exceeded 100 requests per minute`, userAgent);

        // Block IP for 15 minutes after rate limit violation
        await blockIP(ip, 'Rate limit exceeded - 100 req/min', 15);

        return new NextResponse(
            JSON.stringify({
                error: 'Too Many Requests',
                message: 'Rate limit exceeded. Please try again later.',
            }),
            {
                status: 429,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    // Suspicious pattern detection
    const suspiciousPatterns = [
        /\.\./,  // Path traversal
        /<script/i,  // XSS attempts
        /union.*select/i,  // SQL injection
        /eval\(/i,  // Code injection
    ];

    const fullUrl = request.url;
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(fullUrl)) {
            await logSecurityEvent(
                ip,
                'suspicious_pattern_detected',
                'high',
                `Suspicious pattern in URL: ${pattern.toString()}`,
                userAgent
            );

            // Block IP permanently for attack attempts
            await blockIP(ip, `Attack pattern detected: ${pattern.toString()}`);

            return new NextResponse(
                JSON.stringify({
                    error: 'Forbidden',
                    message: 'Suspicious activity detected.',
                }),
                {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }
    }

    // Log normal access for monitoring
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/api')) {
        // Only log occasionally to avoid spam (1 in 10 requests)
        if (Math.random() < 0.1) {
            await logSecurityEvent(ip, 'normal_access', 'low', `Access to ${pathname}`, userAgent);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
