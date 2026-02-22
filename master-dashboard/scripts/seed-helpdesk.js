const { createClient } = require('@supabase/supabase-js');

// Configuration - Usually these would come from .env
const SUPABASE_URL = 'https://cwhcxazrmayjhaadtjqs.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3aGN4YXpybWF5amhhYWR0anFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE4MjQyNywiZXhwIjoyMDg0NzU4NDI3fQ.dzJbi4nzo7wfVoQHvxh6gmR8wtcwAzLvS3un0f8XR-o';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seed() {
    console.log('--- Starting Helpdesk Seed ---');

    // 1. Get or create a site
    let { data: sites } = await supabase.from('external_sites').select('id, site_name').limit(2);

    if (!sites || sites.length === 0) {
        console.log('No sites found, creating a dummy site...');
        const { data: insertedData, error: insertError } = await supabase.from('external_sites').insert([
            { site_name: 'Main Storefront', api_key: 'dummy', webhook_url: 'https://example.com/webhook' }
        ]).select();

        if (insertError) {
            console.error('Error creating dummy site:', insertError);
            return;
        }
        sites = insertedData;
    }

    if (!sites || !sites[0]) {
        console.error('Failed to get or create a site.');
        return;
    }

    const site1 = sites[0];
    const site2 = sites[1] || site1;

    console.log(`Using sites: ${site1.site_name} (${site1.id}) and ${site2.site_name} (${site2.id})`);

    // 2. Clear existing messages (optional, but good for clean demo)
    // await supabase.from('support_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 3. Insert mock messages
    const mockMessages = [
        {
            site_id: site1.id,
            sender_name: 'James Wilson',
            sender_email: 'james.w@example.com',
            subject: 'Order #4459 not delivered',
            body: 'Hello, my order was supposed to arrive yesterday but I still have not received it. Can you check the tracking?',
            status: 'open',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        },
        {
            site_id: site1.id,
            sender_name: 'Sarah Chen',
            sender_email: 's.chen@outlook.com',
            subject: 'Question about returns policy',
            body: 'Is it possible to return an item after 30 days if it is still in original packaging?',
            status: 'pending',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
        },
        {
            site_id: site2.id,
            sender_name: 'Mark Rouso',
            sender_email: 'mark@nexus.tech',
            subject: 'API Integration Issue',
            body: 'Our systems are seeing a 403 error when trying to sync inventory. Please assist.',
            status: 'open',
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 mins ago
        },
        {
            site_id: site2.id,
            sender_name: 'Elena Gilbert',
            sender_email: 'elena@mystic.com',
            subject: 'Account password reset',
            body: 'I am not receiving the password reset email. I have checked my spam folder.',
            status: 'closed',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            responded_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
        }
    ];

    const { error } = await supabase.from('support_messages').insert(mockMessages);

    if (error) {
        console.error('Error seeding messages:', error);
    } else {
        console.log('Successfully seeded 4 mock messages!');
    }
}

seed();
