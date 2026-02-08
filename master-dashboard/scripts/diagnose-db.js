const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://cwhcxazrmayjhaadtjqs.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3aGN4YXpybWF5amhhYWR0anFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE4MjQyNywiZXhwIjoyMDg0NzU4NDI3fQ.dzJbi4nzo7wfVoQHvxh6gmR8wtcwAzLvS3un0f8XR-o'
);

async function diagnose() {
    console.log('Checking tables in:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    // Since we can't easily query information_schema via PostgREST,
    // we try to probe for tables the user mentioned or hinted at.
    const tables = [
        'baloria_themes', 'baloria_questions', 'baloria_answers'
    ];

    for (const table of tables) {
        const { data, count, error } = await supabase.from(table).select('*', { count: 'exact' }).limit(1);
        if (!error) {
            console.log(`Table '${table}': ${count} rows`);
            console.log('Sample data:', JSON.stringify(data[0], null, 2));
        } else {
            console.log(`Table '${table}' Error:`, error.message);
        }
    }
}

diagnose();
