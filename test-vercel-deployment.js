#!/usr/bin/env node

// Test script for Vercel deployment
const https = require('https');

const BASE_URL = 'https://obs-telegram.vercel.app';

const testEndpoints = [
    {
        path: '/api/obs/connections',
        name: 'OBS Connections API',
        expected: [] // Empty array expected
    },
    {
        path: '/api/bot/status',
        name: 'Bot Status API',
        expected: ['isRunning', 'userCount', 'activeUsers', 'botConfigured', 'obsConnections']
    },
    {
        path: '/api/db/fix-schema',
        name: 'Database Schema API',
        expected: ['message', 'schema']
    }
];

function testEndpoint(endpoint) {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}${endpoint.path}`;
        
        console.log(`\n🔍 Testing ${endpoint.name}...`);
        console.log(`URL: ${url}`);
        
        const req = https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    console.log(`Status: ${res.statusCode}`);
                    console.log(`Response:`, JSON.stringify(response, null, 2));
                    
                    if (res.statusCode === 200) {
                        // Check expected fields
                        const hasExpectedFields = endpoint.expected.every(field => 
                            field in response || (Array.isArray(response) && endpoint.expected.length === 0)
                        );
                        
                        if (hasExpectedFields) {
                            console.log(`✅ ${endpoint.name} - SUCCESS`);
                            resolve({ endpoint, success: true, response, status: res.statusCode });
                        } else {
                            console.log(`⚠️ ${endpoint.name} - Missing expected fields`);
                            resolve({ endpoint, success: false, response, status: res.statusCode });
                        }
                    } else {
                        console.log(`❌ ${endpoint.name} - FAILED (${res.statusCode})`);
                        resolve({ endpoint, success: false, response, status: res.statusCode });
                    }
                } catch (error) {
                    console.log(`❌ ${endpoint.name} - JSON Parse Error`);
                    console.log(`Raw response:`, data);
                    resolve({ endpoint, success: false, response: data, status: res.statusCode });
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ ${endpoint.name} - Connection Error`);
            console.log(`Error:`, error.message);
            resolve({ endpoint, success: false, error: error.message });
        });
        
        req.setTimeout(10000, () => {
            console.log(`❌ ${endpoint.name} - Timeout`);
            req.destroy();
            resolve({ endpoint, success: false, error: 'Timeout' });
        });
    });
}

async function runTests() {
    console.log('🚀 Testing Vercel Deployment');
    console.log('==========================');
    console.log(`Base URL: ${BASE_URL}\n`);
    
    const results = [];
    
    for (const endpoint of testEndpoints) {
        const result = await testEndpoint(endpoint);
        results.push(result);
    }
    
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.endpoint.name} (${result.status || 'N/A'})`);
    });
    
    console.log(`\nSummary: ${successCount}/${totalCount} tests passed`);
    
    if (successCount === totalCount) {
        console.log('\n🎉 All tests passed! The deployment is working correctly.');
    } else {
        console.log('\n⚠️ Some tests failed. Check the environment variables and database configuration.');
    }
    
    return results;
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests, testEndpoints };