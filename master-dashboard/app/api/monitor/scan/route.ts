import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAlertEmail } from '@/lib/email';

// Cron secret to prevent unauthorized triggers (optional for MVP, good for production)
// const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
    try {
        console.log("🔍 Titan Monitor: Starting system scan...");

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Configuration Error: Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const results = [];

        // 2. Check Common Ground Pulse Health
        const { data: stats, error } = await supabase
            .from('stats')
            .select('*')
            .single();

        if (stats) {
            const healthScore = stats.health_score || 85; // Default safe if missing
            const activeNow = stats.active_now || 0;

            if (healthScore < 70) {
                await triggerAlert(supabase, 'commonground', 'health', 'high',
                    `Health Score Dropped to ${healthScore}%`,
                    `Vital signs for **Common Ground** are critical. Health score is at ${healthScore}%. Immediate attention required.`);
                results.push({ project: 'commonground', status: 'ALERT_TRIGGERED' });
            } else {
                results.push({ project: 'commonground', status: 'HEALTHY' });
            }
        }

        // 3. Simulate Other Projects (VitalJobs)
        const { searchParams } = new URL(request.url);
        if (searchParams.get('force_alert') === 'true') {
            await triggerAlert(supabase, 'vitaljobs', 'health', 'critical',
                'VitalJobs Health Critical',
                '**VitalJobs** health has dropped below 50%. User churn detected.'
            );
            results.push({ project: 'vitaljobs', status: 'FORCED_ALERT' });
        }

        return NextResponse.json({ success: true, scan_results: results });

    } catch (globalError: any) {
        console.error("🔥 Monitor Route Crashed:", globalError);
        return NextResponse.json({
            success: false,
            error: globalError.message || 'Unknown Server Error',
            details: globalError.toString()
        }, { status: 500 });
    }
}

async function triggerAlert(supabase: any, projectId: string, type: string, severity: string, subject: string, message: string) {
    console.log(`⚠️ Triggering Alert: ${subject}`);

    // A. Check Duplicate Prevention (Don't spam if alert sent in last 24h)
    const { data: recentAlerts } = await supabase
        .from('alerts')
        .select('*')
        .eq('project_id', projectId)
        .eq('type', type)
        .eq('status', 'sent')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24h

    if (recentAlerts && recentAlerts.length > 0) {
        console.log("Skipping duplicate alert (sent in last 24h).");
        return;
    }

    // B. Log to Database
    const { data: alertEntry, error: dbError } = await supabase
        .from('alerts')
        .insert({
            project_id: projectId,
            type,
            severity,
            message: subject, // Short message for DB
            status: 'new'
        })
        .select()
        .single();

    if (dbError) {
        console.error("Failed to log alert:", dbError);
        // Continue to try sending email even if DB log fails? 
        // Better to fail here to debug DB issues.
        throw new Error(`Database Insert Failed: ${dbError.message}`);
    }

    // C. Send Email
    // Using a hardcoded email for James or from env
    const targetEmail = process.env.TITAN_ADMIN_EMAIL || 'privemail@gmail.com';
    const emailResult = await sendAlertEmail({
        to: targetEmail,
        subject: subject,
        markdown: message
    });

    // D. Update Status
    if (emailResult.success) {
        await supabase.from('alerts').update({ status: 'sent' }).eq('id', alertEntry.id);
        console.log("📧 Email sent successfully.");
    } else {
        await supabase.from('alerts').update({ status: 'failed' }).eq('id', alertEntry.id);
        console.error("📧 Email failed:", emailResult.error);
        throw new Error(`Resend Email Failed: ${JSON.stringify(emailResult.error)}`);
    }
}
