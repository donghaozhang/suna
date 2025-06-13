#!/usr/bin/env node

/**
 * Railway API Testing Script
 * Tests the fixed API endpoints to ensure they work correctly
 */

const https = require('https');
const http = require('http');

// Configuration
const RAILWAY_BACKEND_URL = process.env.RAILWAY_BACKEND_URL || 'https://your-backend-url.railway.app';
const TEST_TOKEN = process.env.TEST_JWT_TOKEN || null;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test helper function
async function testEndpoint(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, RAILWAY_BACKEND_URL);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test cases
const tests = [
  {
    name: 'Health Check',
    path: '/api/health',
    expectedStatus: 200,
    requiresAuth: false
  },
  {
    name: 'Billing Subscription',
    path: '/api/billing/subscription',
    expectedStatus: [200, 401], // 401 if no auth token
    requiresAuth: true
  },
  {
    name: 'Billing Status',
    path: '/api/billing/check-status',
    expectedStatus: [200, 401],
    requiresAuth: true
  },
  {
    name: 'Available Models',
    path: '/api/billing/available-models',
    expectedStatus: [200, 401],
    requiresAuth: true
  }
];

async function runTests() {
  log('🚀 Starting Railway API Tests', 'blue');
  log(`Backend URL: ${RAILWAY_BACKEND_URL}`, 'yellow');
  log('─'.repeat(50), 'yellow');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      log(`\n🧪 Testing: ${test.name}`, 'blue');
      log(`   Endpoint: ${test.path}`);

      const options = {};
      if (test.requiresAuth && TEST_TOKEN) {
        options.headers = { 'Authorization': `Bearer ${TEST_TOKEN}` };
      }

      const result = await testEndpoint(test.path, options);
      const expectedStatuses = Array.isArray(test.expectedStatus) 
        ? test.expectedStatus 
        : [test.expectedStatus];

      if (expectedStatuses.includes(result.status)) {
        log(`   ✅ PASS - Status: ${result.status}`, 'green');
        passed++;
      } else {
        log(`   ❌ FAIL - Expected: ${expectedStatuses.join(' or ')}, Got: ${result.status}`, 'red');
        log(`   Response: ${result.data.substring(0, 200)}...`);
        failed++;
      }

    } catch (error) {
      log(`   ❌ ERROR - ${error.message}`, 'red');
      failed++;
    }
  }

  log('\n' + '─'.repeat(50), 'yellow');
  log(`📊 Test Results: ${passed} passed, ${failed} failed`, passed === tests.length ? 'green' : 'red');
  
  if (!TEST_TOKEN) {
    log('\n💡 Tip: Set TEST_JWT_TOKEN environment variable to test authenticated endpoints', 'yellow');
  }
}

// Usage instructions
function showUsage() {
  log('🛤️  Railway API Testing Script', 'blue');
  log('\nUsage:');
  log('  node test-railway-api.js', 'green');
  log('\nEnvironment Variables:');
  log('  RAILWAY_BACKEND_URL - Your Railway backend URL (required)');
  log('  TEST_JWT_TOKEN - JWT token for authenticated endpoints (optional)');
  log('\nExample:');
  log('  RAILWAY_BACKEND_URL=https://your-app.railway.app node test-railway-api.js', 'green');
}

// Main execution
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showUsage();
  } else if (!RAILWAY_BACKEND_URL || RAILWAY_BACKEND_URL.includes('your-backend-url')) {
    log('❌ Please set RAILWAY_BACKEND_URL environment variable', 'red');
    log('Example: RAILWAY_BACKEND_URL=https://your-app.railway.app node test-railway-api.js', 'yellow');
  } else {
    runTests().catch(console.error);
  }
}

module.exports = { testEndpoint, runTests }; 