// Test script to trigger security events
// Run with: node scripts/test-security.js

const BASE_URL = 'http://localhost:3000';

async function logSecurityEvent(event) {
    const response = await fetch(`${BASE_URL}/api/security/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
    });

    const result = await response.json();
    console.log(`[${event.event_type}] ${response.status}:`, result);
    return result;
}

async function runTests() {
    console.log('🛡️ Testing Security Logging System\n');

    // Test 1: Failed login (single)
    console.log('Test 1: Single failed login');
    await logSecurityEvent({
        event_type: 'failed_login',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        endpoint: '/api/auth/signin',
        severity: 'medium',
        project_source: 'master-dashboard',
        metadata: { email: 'test@example.com' }
    });

    // Test 2: Multiple failed logins (should trigger block)
    console.log('\nTest 2: Multiple failed logins (triggering auto-block)');
    for (let i = 0; i < 5; i++) {
        await logSecurityEvent({
            event_type: 'failed_login',
            ip_address: '10.0.0.50',
            user_agent: 'Mozilla/5.0',
            endpoint: '/api/auth/signin',
            severity: 'high',
            project_source: 'master-dashboard',
            metadata: { attempt: i + 1 }
        });
        await new Promise(resolve => setTimeout(resolve, 200)); // Small delay
    }

    // Test 3: Suspicious request
    console.log('\nTest 3: Suspicious request');
    await logSecurityEvent({
        event_type: 'suspicious_request',
        ip_address: '172.16.0.25',
        user_agent: 'curl/7.64.1',
        endpoint: '/admin/users',
        severity: 'high',
        project_source: 'master-dashboard',
        metadata: { reason: 'Unauthorized admin access attempt' }
    });

    // Test 4: Rate limiting
    console.log('\nTest 4: Rate limiting violation');
    await logSecurityEvent({
        event_type: 'rate_limit',
        ip_address: '203.0.113.45',
        user_agent: 'Python-requests/2.28.0',
        endpoint: '/api/data',
        severity: 'critical',
        project_source: 'vitaljobs',
        metadata: { requests_per_minute: 150 }
    });

    // Test 5: Cross-project event
    console.log('\nTest 5: Cross-project security event');
    await logSecurityEvent({
        event_type: 'unauthorized_access',
        ip_address: '198.51.100.78',
        user_agent: 'Mozilla/5.0',
        endpoint: '/api/protected',
        severity: 'high',
        project_source: 'commonground',
        metadata: { user_id: null, attempted_resource: 'admin_panel' }
    });

    console.log('\n✅ Tests complete! Check Security Watch widget.');
}

runTests().catch(console.error);
