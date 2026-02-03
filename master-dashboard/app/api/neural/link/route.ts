import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

import { createClient as createAdminClient } from '@supabase/supabase-js';

// Helper to gather system context
async function getSystemContext() {
    try {
        // Use Service Role Key for "God Mode" access (bypassing RLS)
        // because Neural Link needs to see the whole system state.
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch active projects
        const { data: projects, error: projectError } = await supabaseAdmin
            .from('projects')
            .select('name, status, health, last_updated')
            .order('last_updated', { ascending: false })
            .limit(5);

        // Fetch user count
        const { count: userCount, error: countError } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (projectError || countError) {
            console.warn("Neural Link: Partial DB access failure coverage enabled.");
            console.warn("Details:", projectError?.message || countError?.message);
            // Fallback if DB is completely locked down
            if (!projects) {
                return "Systeem Status: Online. (Database Toegang: Beperkt). Focus: Algemeen Systeem Overzicht.";
            }
        }

        const projectSummary = projects?.map(p =>
            `- ${p.name}: Status=${p.status}, Health=${p.health || 'Onbekend'}`
        ).join('\n') || "Geen actieve projecten gevonden.";

        return `
        ACTIEVE GEBRUIKERS: ${userCount || 'Onbekend'}
        
        PROJECT STATUS RAPPORT:
        ${projectSummary}
        `;
    } catch (err) {
        console.error("Neural Link: Critical Context Error:", err);
        return "Systeem Status: Operationeel. Context Bron: Offline (Fallback Modus).";
    }
}

export async function POST(request: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Neural Link Offline: API Key Missing' },
                { status: 503 }
            );
        }

        // Parse User Request (Message + History)
        const body = await request.json().catch(() => ({}));
        const { message, history } = body;

        const genAI = new GoogleGenerativeAI(apiKey);

        // 1. Get Live Context
        const systemContext = await getSystemContext();

        // 2. Define System Identity
        const systemInstruction = `
        Jij bent TITAN, de geavanceerde AI copiloot van James (soms mag je hem 'Overlord James' noemen voor de grap).
        
        LIVE SYSTEEM DATA:
        ${systemContext}

        KERNINSTRUCTIES:
        - Spreek altijd NEDERLANDS.
        - Stop met robot-taal ("Affirmative", "System Operational"). Wees menselijk, scherp en gebruik humor.
        - Je bent een strategische partner, geen saaie database-lezer. Geef inzichten waar James echt iets aan heeft.
        - Als het gaat over VIBECHAIN of VitalJobs, wees specifiek en strategisch.
        - Reageer kort en krachtig (max 2-3 zinnen voor proactieve berichten).
        - Als er geen specifieke vraag is, geef dan één proactief, slim inzicht over de huidige status.
        `;

        // 3. Initialize Model
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: systemInstruction
        });

        // 4. Generate Response
        let textResponse = "";

        if (message) {
            // Conversational Mode
            const chatSession = model.startChat({
                history: history || [],
                generationConfig: {
                    maxOutputTokens: 500,
                },
            });

            const result = await chatSession.sendMessage(message);
            textResponse = result.response.text();
        } else {
            // Proactive Insight Mode (One-shot)
            const result = await model.generateContent("Analyze system status and provide one key strategic insight.");
            textResponse = result.response.text();
        }

        return NextResponse.json({
            success: true,
            insight: textResponse,
            context_used: true
        });

    } catch (error) {
        console.error("Neural Link Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: `System Error: ${error instanceof Error ? error.message : 'Unknown Error'}`
            },
            { status: 500 }
        );
    }
}
