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

    // 1. Send email via Resend
    // We'll use a fetch to a local api if we want to keep logic separated, 
    // or just use the resend client here.
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/support/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messageId: id,
            to: recipientEmail,
            replyText: reply,
            originalSubject: subject
        })
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send email reply');
    }

    // 2. Update Supabase
    const { data, error } = await supabase
        .from('support_messages')
        .update({
            status: 'closed',
            reply_message: reply,
            responded_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/helpdesk');
    return data[0];
}
