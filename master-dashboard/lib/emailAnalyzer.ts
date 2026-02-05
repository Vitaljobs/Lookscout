import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface EmailAnalysis {
    project_id: string | null;  // UUID from projects table
    project: string;  // slug for backwards compatibility
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    summary: string;
}

/**
 * Get project UUID by slug from database
 */
async function getProjectId(slug: string): Promise<string | null> {
    try {
        // Dynamic import to avoid circular dependencies
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase
            .from('projects')
            .select('id')
            .eq('slug', slug)
            .single();

        if (error || !data) {
            console.warn(`Project not found for slug: ${slug}`);
            return null;
        }

        return data.id;
    } catch (error) {
        console.error('Error fetching project ID:', error);
        return null;
    }
}

const PROJECT_KEYWORDS = {
    'echo-chamber': ['echo', 'chamber', 'reputation', 'score', 'mission', 'contribution'],
    'commonground': ['common', 'ground', 'wellness', 'mental health', 'check-in', 'mood'],
    'vitaljobs': ['vital', 'jobs', 'vacature', 'sollicitatie', 'cv', 'recruitment'],
    'lookscout': ['lookscout', 'dashboard', 'titan', 'control tower', 'monitoring'],
};

/**
 * Analyzes email content using Gemini AI to detect:
 * - Which project the email is about
 * - Sentiment (positive/neutral/negative)
 * - Confidence score
 */
export async function analyzeEmail(
    subject: string,
    body: string,
    senderEmail: string
): Promise<EmailAnalysis> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `Analyseer deze email en bepaal:
1. Over welk project gaat dit? Opties: echo-chamber, commonground, vitaljobs, lookscout, unknown
2. Wat is het sentiment? Opties: positive, neutral, negative
3. Geef een korte samenvatting (max 50 woorden)

Email:
Van: ${senderEmail}
Onderwerp: ${subject}
Bericht: ${body}

Project keywords voor referentie:
- echo-chamber: ${PROJECT_KEYWORDS['echo-chamber'].join(', ')}
- commonground: ${PROJECT_KEYWORDS['commonground'].join(', ')}
- vitaljobs: ${PROJECT_KEYWORDS['vitaljobs'].join(', ')}
- lookscout: ${PROJECT_KEYWORDS['lookscout'].join(', ')}

Antwoord in JSON format:
{
  "project": "project-naam",
  "sentiment": "positive|neutral|negative",
  "confidence": 0.0-1.0,
  "summary": "korte samenvatting"
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in AI response');
        }

        const analysis = JSON.parse(jsonMatch[0]) as EmailAnalysis;

        // Validate project
        const validProjects = ['echo-chamber', 'commonground', 'vitaljobs', 'lookscout', 'unknown'];
        if (!validProjects.includes(analysis.project)) {
            analysis.project = 'unknown';
        }

        // Validate sentiment
        const validSentiments = ['positive', 'neutral', 'negative'];
        if (!validSentiments.includes(analysis.sentiment)) {
            analysis.sentiment = 'neutral';
        }

        // Get project_id from database
        analysis.project_id = await getProjectId(analysis.project);

        return analysis;
    } catch (error) {
        console.error('Error analyzing email with AI:', error);

        // Fallback: simple keyword matching
        return await fallbackAnalysis(subject, body);
    }
}

/**
 * Fallback analysis using simple keyword matching
 */
async function fallbackAnalysis(subject: string, body: string): Promise<EmailAnalysis> {
    const text = `${subject} ${body}`.toLowerCase();

    // Detect project
    let project = 'unknown';
    let maxMatches = 0;

    for (const [proj, keywords] of Object.entries(PROJECT_KEYWORDS)) {
        const matches = keywords.filter(keyword => text.includes(keyword.toLowerCase())).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            project = proj;
        }
    }

    // Detect sentiment (very basic)
    const positiveWords = ['bedankt', 'geweldig', 'goed', 'perfect', 'thanks', 'great', 'excellent'];
    const negativeWords = ['probleem', 'fout', 'werkt niet', 'bug', 'issue', 'error', 'broken'];

    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;

    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';

    // Get project_id from database
    const project_id = await getProjectId(project);

    return {
        project_id,
        project,
        sentiment,
        confidence: maxMatches > 0 ? 0.6 : 0.3,
        summary: `Email over ${project}`,
    };
}
