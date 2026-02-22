const { getSupportMessages, getHelpdeskStats } = require('./app/actions/helpdesk');

// Mocking environment for server action
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://cwhcxazrmayjhaadtjqs.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3aGN4YXpybWF5amhhYWR0anFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODI0MjcsImV4cCI6MjA4NDc1ODQyN30.D0hr9a0O581o44erXMxtWqXbIhEzZ5yJ1t4b5CNhulg';

async function testActions() {
    console.log('--- Testing Helpdesk Server Actions ---');
    try {
        const messages = await getSupportMessages();
        console.log(`getSupportMessages returned ${messages.length} messages.`);

        const stats = await getHelpdeskStats();
        console.log('Stats:', JSON.stringify(stats, null, 2));
    } catch (error) {
        console.error('Error testing actions:', error);
    }
}

testActions();
