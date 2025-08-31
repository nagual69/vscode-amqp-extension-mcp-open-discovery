// Test script to verify bridge path resolution
console.log('Bridge script test starting...');
console.log('Process arguments:', process.argv);
console.log('Environment variables:');
console.log('AMQP_URL:', process.env.AMQP_URL);
console.log('SERVER_QUEUE_PREFIX:', process.env.SERVER_QUEUE_PREFIX);
console.log('EXCHANGE_NAME:', process.env.EXCHANGE_NAME);
console.log('SERVER_ID:', process.env.SERVER_ID);

// Test if amqplib is available
try {
    const amqp = require('amqplib');
    console.log('✅ amqplib module loaded successfully');
    console.log('amqplib version:', amqp.version || 'version not available');
} catch (error) {
    console.error('❌ Failed to load amqplib:', error.message);
    process.exit(1);
}

console.log('Bridge test completed successfully');
process.exit(0);
