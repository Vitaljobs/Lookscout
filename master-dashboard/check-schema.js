const fs = require('fs');
const path = require('path');

async function checkSchema() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const env = {};
    envContent.split(/\r?\n/).forEach(line => {
        const parts = line.split('=');
        if (parts[0] && parts[1]) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    });

    const anonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
    const baseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];

    if (!baseUrl || !anonKey) {
        console.error("❌ Missing config");
        return;
    }

    // Attempt to insert with metadata to see if it fails
    console.log("🔍 Checking if 'metadata' column exists in 'support_messages'...");

    // We can also query information_schema if we have service role, 
    // but with anon key we just try a limited select or an insert.
    const url = `${baseUrl}/rest/v1/support_messages?select=metadata&limit=1`;

    try {
        const response = await fetch(url, {
            headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${anonKey}`,
            }
        });

        if (response.ok) {
            console.log("✅ Column 'metadata' exists.");
        } else {
            const err = await response.json();
            if (err.code === '42703') { // undefined_column
                console.log("❌ Column 'metadata' does NOT exist.");
            } else {
                console.error("❌ Unexpected error:", err);
            }
        }

    } catch (err) {
        console.error("❌ Exception:", err);
    }
}

checkSchema();
