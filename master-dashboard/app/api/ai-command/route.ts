import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// AI Command handler for IP blocking
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { command, parameters } = body;

        const supabase = await createClient();

        switch (command) {
            case 'block_ip': {
                const { ip_address, reason, duration_minutes } = parameters;

                if (!ip_address) {
                    return NextResponse.json(
                        { error: 'IP address is required' },
                        { status: 400 }
                    );
                }

                const blockedUntil = duration_minutes
                    ? new Date(Date.now() + duration_minutes * 60 * 1000).toISOString()
                    : null;

                const { error } = await supabase.from('blocked_ips').insert({
                    ip_address,
                    reason: reason || 'Blocked via AI command',
                    blocked_until: blockedUntil,
                    is_permanent: !duration_minutes,
                    blocked_by: 'titan-ai',
                });

                if (error) throw error;

                // Log security event
                await supabase.from('security_events').insert({
                    event_type: 'ai_command_block',
                    ip_address,
                    reason: `AI blocked IP: ${reason || 'No reason provided'}`,
                    severity: 'high',
                    project_source: 'titan-ai',
                });

                return NextResponse.json({
                    success: true,
                    message: `IP ${ip_address} has been blocked${duration_minutes ? ` for ${duration_minutes} minutes` : ' permanently'}`,
                    action: 'block_ip',
                    ip_address,
                });
            }

            case 'unblock_ip': {
                const { ip_address } = parameters;

                if (!ip_address) {
                    return NextResponse.json(
                        { error: 'IP address is required' },
                        { status: 400 }
                    );
                }

                const { error } = await supabase
                    .from('blocked_ips')
                    .delete()
                    .eq('ip_address', ip_address);

                if (error) throw error;

                // Log security event
                await supabase.from('security_events').insert({
                    event_type: 'ai_command_unblock',
                    ip_address,
                    reason: 'AI unblocked IP',
                    severity: 'low',
                    project_source: 'titan-ai',
                });

                return NextResponse.json({
                    success: true,
                    message: `IP ${ip_address} has been unblocked`,
                    action: 'unblock_ip',
                    ip_address,
                });
            }

            case 'list_blocked_ips': {
                const { data, error } = await supabase
                    .from('blocked_ips')
                    .select('*')
                    .order('blocked_at', { ascending: false })
                    .limit(10);

                if (error) throw error;

                return NextResponse.json({
                    success: true,
                    blocked_ips: data || [],
                    count: data?.length || 0,
                });
            }

            case 'get_security_stats': {
                const { data: events, error: eventsError } = await supabase
                    .from('security_events')
                    .select('severity')
                    .gte('created_at', new Date(Date.now() - 24 * 3600000).toISOString());

                if (eventsError) throw eventsError;

                const stats = {
                    total: events?.length || 0,
                    critical: events?.filter((e) => e.severity === 'critical').length || 0,
                    high: events?.filter((e) => e.severity === 'high').length || 0,
                    medium: events?.filter((e) => e.severity === 'medium').length || 0,
                    low: events?.filter((e) => e.severity === 'low').length || 0,
                };

                const { data: blockedIPs, error: blockedError } = await supabase
                    .from('blocked_ips')
                    .select('id');

                if (blockedError) throw blockedError;

                return NextResponse.json({
                    success: true,
                    stats: {
                        ...stats,
                        blocked_ips: blockedIPs?.length || 0,
                    },
                    period: 'last_24_hours',
                });
            }

            default:
                return NextResponse.json(
                    { error: 'Unknown command', available_commands: ['block_ip', 'unblock_ip', 'list_blocked_ips', 'get_security_stats'] },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in AI command:', error);
        return NextResponse.json(
            { error: 'Failed to execute AI command' },
            { status: 500 }
        );
    }
}

// GET endpoint for available commands
export async function GET() {
    return NextResponse.json({
        available_commands: [
            {
                command: 'block_ip',
                description: 'Block an IP address',
                parameters: {
                    ip_address: 'string (required)',
                    reason: 'string (optional)',
                    duration_minutes: 'number (optional, permanent if omitted)',
                },
                example: {
                    command: 'block_ip',
                    parameters: {
                        ip_address: '192.168.1.100',
                        reason: 'Suspicious activity detected',
                        duration_minutes: 60,
                    },
                },
            },
            {
                command: 'unblock_ip',
                description: 'Unblock an IP address',
                parameters: {
                    ip_address: 'string (required)',
                },
                example: {
                    command: 'unblock_ip',
                    parameters: {
                        ip_address: '192.168.1.100',
                    },
                },
            },
            {
                command: 'list_blocked_ips',
                description: 'List currently blocked IPs',
                parameters: {},
                example: {
                    command: 'list_blocked_ips',
                    parameters: {},
                },
            },
            {
                command: 'get_security_stats',
                description: 'Get security statistics for last 24 hours',
                parameters: {},
                example: {
                    command: 'get_security_stats',
                    parameters: {},
                },
            },
        ],
    });
}
