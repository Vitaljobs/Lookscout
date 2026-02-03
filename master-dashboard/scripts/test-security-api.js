// Quick test script for security logging API
// Run with: node scripts/test-security-api.js

async function testSecurityAPI() {
    console.log('Testing Security Logging API...\n');

    try {
        const response = await fetch('http://localhost:3000/api/security/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event_type: 'failed_login',
                ip_address: '127.0.0.1',
                severity: 'medium',
                project_source: 'master-dashboard',
                endpoint: '/login',
                metadata: { test: true, email: 'test@example.com' }
            })
        });

        const result = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(result, null, 2));

        if (response.ok) {
            console.log('\n✅ Security event logged successfully!');
            console.log('Check Security Watch widget in dashboard.');
        } else {
            console.log('\n❌ Failed to log security event');
            console.log('Error:', result.error);
        }
    } catch (error) {
        console.error('\n❌ Network error:', error.message);
        console.log('Make sure the dev server is running on localhost:3000');
    }
}

testSecurityAPI();
