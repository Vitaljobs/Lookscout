import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        let {
            event_type,
            ip_address,
            user_agent,
            endpoint,
            severity,
            project_source,
            metadata = {}
        } = body;

        // Get real IP address from headers
        const forwarded = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        ip_address = forwarded?.split(',')[0] || realIp || ip_address || 'unknown';

        // Get user agent if not provided
        if (!user_agent) {
            user_agent = request.headers.get('user-agent') || 'unknown';
        }

        // Validation
        if (!event_type || !ip_address || !severity || !project_source) {
            return NextResponse.json(
                { error: 'Missing required fields: event_type, ip_address, severity, project_source' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // 1. Check if IP is blocked
        const { data: blockedIP } = await supabase
            .from('blocked_ips')
            .select('*')
            .eq('ip_address', ip_address)
            .single();

        if (blockedIP) {
            // Check if block has expired
            if (blockedIP.expires_at && new Date(blockedIP.expires_at) < new Date()) {
                // Expired - unblock
                await supabase
                    .from('blocked_ips')
                    .delete()
                    .eq('ip_address', ip_address);
            } else {
                // Still blocked
                return NextResponse.json(
                    { error: 'IP address is blocked', blocked: true, reason: blockedIP.reason },
                    { status: 403 }
                );
            }
        }

        // 2. Log the security event
        const { error: insertError } = await supabase
            .from('security_events')
            .insert({
                event_type,
                ip_address,
                user_agent,
                endpoint,
                severity,
                project_source,
                metadata,
                blocked: false
            });

        if (insertError) throw insertError;

        // 3. Auto-blocking logic for failed logins
        if (event_type === 'failed_login') {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

            const { data: recentFailures, error: countError } = await supabase
                .from('security_events')
                .select('id')
                .eq('ip_address', ip_address)
                .eq('event_type', 'failed_login')
                .gte('created_at', fiveMinutesAgo);

            if (countError) throw countError;

            // If 5+ failed logins in 5 minutes, block the IP
            if (recentFailures && recentFailures.length >= 5) {
                const { error: blockError } = await supabase
                    .from('blocked_ips')
                    .insert({
                        ip_address,
                        reason: `Multiple failed login attempts (${recentFailures.length} in 5 minutes)`,
                        auto_blocked: true,
                        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
                    });

                if (blockError && blockError.code !== '23505') { // Ignore duplicate key errors
                    console.error('Error blocking IP:', blockError);
                }

                // Update the event to mark it as blocked
                await supabase
                    .from('security_events')
                    .update({ blocked: true })
                    .eq('ip_address', ip_address)
                    .eq('event_type', 'failed_login')
                    .gte('created_at', fiveMinutesAgo);

                return NextResponse.json({
                    success: true,
                    blocked: true,
                    message: 'IP has been automatically blocked due to multiple failed login attempts'
                });
            }
        }

        return NextResponse.json({ success: true, blocked: false });
    } catch (error: any) {
        console.error('Security logging error:', error);
        return NextResponse.json(
            { error: 'Failed to log security event', details: error.message },
            { status: 500 }
        );
    }
}

// GET endpoint to retrieve recent security events (for debugging)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const project = searchParams.get('project');
        const limit = parseInt(searchParams.get('limit') || '50');

        const supabase = await createClient();

        let query = supabase
            .from('security_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (project) {
            query = query.eq('project_source', project);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ events: data });
    } catch (error: any) {
        console.error('Error fetching security events:', error);
        return NextResponse.json(
            { error: 'Failed to fetch security events', details: error.message },
            { status: 500 }
        );
    }
}
