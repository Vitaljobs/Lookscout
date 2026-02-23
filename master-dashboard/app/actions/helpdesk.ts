'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface SupportMessage {
    id: string;
    site_id: string;
    site_name?: string; // Joined from external_sites
    sender_name: string;
    sender_email: string;
    subject: string;
    body: string;
    status: 'open' | 'pending' | 'closed';
    reply_message: string | null;
    created_at: string;
    responded_at: string | null;
}

export interface HelpdeskStats {
    totalTickets: number;
    openTickets: number;
    pendingTickets: number;
    closedTickets: number;
    avgResponseTimeHours: number;
}

export async function getSupportMessages() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('support_messages')
        .select('*, site:external_sites(site_name)')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((msg: any) => ({
        ...msg,
        site_name: msg.site?.site_name || 'Unknown Site'
    })) as SupportMessage[];
}

export async function updateMessageStatus(id: string, status: 'open' | 'pending' | 'closed') {
    const supabase = await createClient();

    const updates: any = { status };
    if (status === 'closed') {
        updates.responded_at = new Date().toISOString();
    }

    const { data, error } = await supabase
        .from('support_messages')
        .update(updates)
        .eq('id', id)
        .select();

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/helpdesk');
    return data[0];
}

export async function getHelpdeskStats(): Promise<HelpdeskStats> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('support_messages')
        .select('*');

    if (error) throw new Error(error.message);

    const messages = data || [];
    const totalTickets = messages.length;
    const openTickets = messages.filter(m => m.status === 'open').length;
    const pendingTickets = messages.filter(m => m.status === 'pending').length;
    const closedTickets = messages.filter(m => m.status === 'closed').length;

    // Calculate AVG response time for closed tickets
    const resolvedTickets = messages.filter(m => m.status === 'closed' && m.responded_at);
    let avgResponseTimeHours = 0;

    if (resolvedTickets.length > 0) {
        const totalTime = resolvedTickets.reduce((acc, curr) => {
            const start = new Date(curr.created_at).getTime();
            const end = new Date(curr.responded_at!).getTime();
            return acc + (end - start);
        }, 0);

        // Convert to hours
        avgResponseTimeHours = totalTime / (1000 * 60 * 60) / resolvedTickets.length;
    }

    return {
        totalTickets,
        openTickets,
        pendingTickets,
        closedTickets,
        avgResponseTimeHours: Math.round(avgResponseTimeHours * 10) / 10
    };
}

export async function sendHelpdeskReply(id: string, reply: string, recipientEmail: string, subject: string) {
    const supabase = await createClient();

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    if (resendApiKey) {
        try {
            // 1. Send email via Resend directly
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: `Titan Control Tower <${fromEmail}>`,
                    to: [recipientEmail],
                    subject: `Re: ${subject}`,
                    html: `
                      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                          <h1 style="color: white; margin: 0; font-size: 24px;">Titan Control Tower</h1>
                          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Response from Support</p>
                        </div>
                        <div style="background: #f9fafb; padding: 30px;">
                          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <p style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${reply}</p>
                          </div>
                          <p style="color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center;">
                            Dit bericht is verzonden vanuit Titan Control Tower
                          </p>
                        </div>
                      </div>
                    `,
                }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error('Resend API error:', errorText);
                // We don't throw an error here, since we want the ticket to close anyway in demo environments.
                console.warn('Could not send email because of Resend config. Proceeding to close ticket in DB.');
            }
        } catch (emailError) {
            console.error('Failed to execute email fetch:', emailError);
        }
    } else {
        console.warn('RESEND_API_KEY is missing. Proceeding to close ticket in DB without sending email.');
    }

    // 2. Update Supabase – keep as 'pending' (in behandeling) so admin can keep replying
    const { data, error } = await supabase
        .from('support_messages')
        .update({
            status: 'pending',
            reply_message: reply,
            responded_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

    if (error) throw new Error(error.message);

    // 3. Sync back to SERVLY directly via Supabase (same database, no HTTP needed)
    const threadIdMatch = recipientEmail.match(/\+id_([^@]+)@/);
    if (threadIdMatch && threadIdMatch[1]) {
        const threadId = threadIdMatch[1];
        console.log(`[Helpdesk Sync] Direct Supabase insert for SERVLY thread ${threadId}...`);
        try {
            const { error: insertError } = await supabase
                .from('messages')
                .insert({
                    project_id: 'SERVLY',
                    thread_id: threadId,
                    content: `[Support Antwoord] ${reply}`,
                    role: 'pro',
                    is_system: false
                });

            if (insertError) {
                console.error('[Helpdesk Sync] Failed to insert reply into SERVLY messages:', insertError);
            } else {
                console.log('[Helpdesk Sync] Reply synced to SERVLY successfully.');
            }
        } catch (err) {
            console.error('[Helpdesk Sync] Unexpected error during SERVLY sync:', err);
        }
    }

    revalidatePath('/dashboard/helpdesk');
    return data[0];
}
