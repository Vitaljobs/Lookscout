import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get all blocked IPs
        const { data: blockedIPs, error: blockedError } = await supabase
            .from('blocked_ips')
            .select('*')
            .order('blocked_at', { ascending: false });

        if (blockedError) throw blockedError;

        // Get recent security events
        const { data: events, error: eventsError } = await supabase
            .from('security_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (eventsError) throw eventsError;

        return NextResponse.json({
            blockedIPs: blockedIPs || [],
            events: events || [],
        });
    } catch (error) {
        console.error('Error fetching security data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch security data' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, ip_address, reason, duration_minutes } = body;

        const supabase = await createClient();

        if (action === 'block') {
            const blockedUntil = duration_minutes
                ? new Date(Date.now() + duration_minutes * 60 * 1000).toISOString()
                : null;

            const { error } = await supabase.from('blocked_ips').insert({
                ip_address,
                reason,
                blocked_until: blockedUntil,
                is_permanent: !duration_minutes,
                blocked_by: 'manual',
            });

            if (error) throw error;

            // Log the event
            await supabase.from('security_events').insert({
                event_type: 'manual_ip_block',
                ip_address,
                reason,
                severity: 'high',
                project_source: 'titan-control-tower',
            });

            return NextResponse.json({ success: true, message: 'IP blocked successfully' });
        } else if (action === 'unblock') {
            const { error } = await supabase
                .from('blocked_ips')
                .delete()
                .eq('ip_address', ip_address);

            if (error) throw error;

            // Log the event
            await supabase.from('security_events').insert({
                event_type: 'manual_ip_unblock',
                ip_address,
                reason: 'Manually unblocked',
                severity: 'low',
                project_source: 'titan-control-tower',
            });

            return NextResponse.json({ success: true, message: 'IP unblocked successfully' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error in security API:', error);
        return NextResponse.json(
            { error: 'Failed to process security action' },
            { status: 500 }
        );
    }
}
