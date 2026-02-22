const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cwhcxazrmayjhaadtjqs.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3aGN4YXpybWF5amhhYWR0anFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE4MjQyNywiZXhwIjoyMDg0NzU4NDI3fQ.dzJbi4nzo7wfVoQHvxh6gmR8wtcwAzLvS3un0f8XR-o';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function check() {
    console.log('--- Helpdesk Data Check ---');

    // Check sites
    const { data: sites } = await supabase.from('external_sites').select('*');
    console.log(`Found ${sites?.length || 0} sites:`);
    console.log(JSON.stringify(sites, null, 2));

    // Check messages
    const { data: messages, error } = await supabase
        .from('support_messages')
        .select('*, site:external_sites(site_name)');

    if (error) {
        console.error('Error fetching messages with join:', error);
    } else {
        console.log(`Found ${messages?.length || 0} messages:`);
        console.log(JSON.stringify(messages, null, 2));
    }
}

check();
