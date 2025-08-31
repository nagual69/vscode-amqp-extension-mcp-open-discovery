// Test script to manually send initialize message to our bridge
const { spawn } = require('child_process');
const path = require('path');

console.log('Testing AMQP MCP Bridge directly...');

// Path to the bridge script
const bridgePath = path.join(__dirname, 'dist', 'bridge.js');
console.log('Bridge path:', bridgePath);

// Spawn the bridge process
const bridge = spawn('node', [bridgePath], {
    env: {
        ...process.env,
        AMQP_URL: 'amqp://mcp:discovery@localhost:5672',
        SERVER_QUEUE_PREFIX: 'mcp.discovery',
        EXCHANGE_NAME: 'mcp.notifications',
        SERVER_ID: 'test-client'
    },
    stdio: ['pipe', 'pipe', 'pipe']
});

// Listen for bridge output
bridge.stderr.on('data', (data) => {
    console.log('[Bridge stderr]:', data.toString());
});

bridge.stdout.on('data', (data) => {
    console.log('[Bridge stdout]:', data.toString());
});

// Wait a moment for bridge to connect
setTimeout(() => {
    console.log('Sending initialize message...');
    
    // Send MCP initialize message
    const initMessage = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
            protocolVersion: '2024-11-05',
            capabilities: {
                roots: {
                    listChanged: true
                }
            },
            clientInfo: {
                name: 'Test VS Code',
                version: '1.0.0'
            }
        }
    };
    
    bridge.stdin.write(JSON.stringify(initMessage) + '\n');
    console.log('Initialize message sent!');
}, 2000);

// Clean up after 10 seconds
setTimeout(() => {
    console.log('Test complete, cleaning up...');
    bridge.kill();
    process.exit(0);
}, 10000);

bridge.on('close', (code) => {
    console.log(`Bridge process exited with code ${code}`);
});
