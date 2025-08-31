const amqp = require('amqplib');
const readline = require('readline');

let connection, channel, responseQueue;
let isReady = false;
const pendingMessages = [];

const AMQP_URL = process.env.AMQP_URL;
const QUEUE_PREFIX = process.env.SERVER_QUEUE_PREFIX || 'mcp.discovery';
const EXCHANGE_BASE = process.env.EXCHANGE_NAME || 'mcp.notifications';
const ROUTING_EXCHANGE = `${EXCHANGE_BASE}.mcp.routing`;

function detectMessageType(msg) {
    if (msg && (msg.result !== undefined || msg.error !== undefined) && msg.id !== undefined && msg.id !== null) return 'response';
    if (msg && msg.method && (msg.id !== undefined && msg.id !== null)) return 'request';
    if (msg && msg.method && (msg.id === undefined || msg.id === null)) return 'notification';
    return 'notification';
}

function getToolCategory(method = '') {
    if (method.startsWith('nmap_')) return 'nmap';
    if (method.startsWith('snmp_')) return 'snmp';
    if (method.startsWith('proxmox_')) return 'proxmox';
    if (method.startsWith('zabbix_')) return 'zabbix';
    if (['ping', 'telnet', 'wget', 'netstat', 'ifconfig', 'arp', 'route', 'nslookup', 'tcp_connect', 'whois'].includes(method)) return 'network';
    if (method.startsWith('memory_') || method.startsWith('cmdb_')) return 'memory';
    if (method.startsWith('credentials_') || method.startsWith('creds_')) return 'credentials';
    if (method.startsWith('registry_') || method.startsWith('tool_')) return 'registry';
    return 'general';
}

function getRoutingKeyForMessage(message) {
    const type = detectMessageType(message);
    if (type === 'request') {
        const category = getToolCategory(message.method || '');
        return `mcp.request.${category}.${(message.method || 'general').replace(/\//g, '.')}`;
    }
    if (type === 'notification') {
        return `mcp.notification.${(message.method || 'general').replace(/\//g, '.')}`;
    }
    return 'mcp.response';
}

async function connectAMQP() {
    try {
        connection = await amqp.connect(AMQP_URL);
        channel = await connection.createChannel();

        // Assert routing exchange for new bidirectional system
        await channel.assertExchange(ROUTING_EXCHANGE, 'topic', { durable: true });

        // Create exclusive response queue for this bridge session
        const res = await channel.assertQueue('', { exclusive: true, autoDelete: true });
        responseQueue = res.queue;

        // Listen for direct responses
        await channel.consume(responseQueue, (msg) => {
            if (!msg) return;
            try {
                const response = JSON.parse(msg.content.toString());
                process.stdout.write(JSON.stringify(response) + '\n');
            } catch (err) {
                console.error('Response parse error:', err);
            } finally {
                try { channel.ack(msg); } catch {}
            }
        }, { noAck: false });

        // Optional: subscribe to notifications for this session
        const notif = await channel.assertQueue('', { exclusive: true, autoDelete: true });
        for (const key of ['mcp.notification.#', 'discovery.notification.#', 'discovery.event.#']) {
            await channel.bindQueue(notif.queue, ROUTING_EXCHANGE, key);
        }
        await channel.consume(notif.queue, (msg) => {
            if (!msg) return;
            try {
                const envelope = JSON.parse(msg.content.toString());
                const payload = envelope.message || envelope;
                process.stdout.write(JSON.stringify(payload) + '\n');
            } catch (e) {
                console.error('Notification parse error:', e.message);
            }
        }, { noAck: true });

        console.error(`[Bridge] Connected: ${AMQP_URL}`);
        console.error(`[Bridge] Queue prefix: ${QUEUE_PREFIX}`);
        console.error(`[Bridge] Routing exchange: ${ROUTING_EXCHANGE}`);
        console.error('[Bridge] Ready for JSON-RPC over stdin/stdout');

        isReady = true;
        while (pendingMessages.length) {
            const msg = pendingMessages.shift();
            // eslint-disable-next-line no-await-in-loop
            await processMessage(msg);
        }
    } catch (error) {
        console.error('AMQP connection failed:', error.message || String(error));
        process.exit(1);
    }
}

async function processMessage(message) {
    try {
        if (!channel || !isReady) {
            pendingMessages.push(message);
            return;
        }

        const correlationId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const routingKey = getRoutingKeyForMessage(message);

        // Wrap in envelope for server-side compatibility where expected
        const envelope = {
            message,
            timestamp: Date.now(),
            type: detectMessageType(message),
            correlationId,
            replyTo: responseQueue
        };

        await channel.publish(ROUTING_EXCHANGE, routingKey, Buffer.from(JSON.stringify(envelope)), {
            correlationId,
            replyTo: responseQueue,
            persistent: false,
            timestamp: Date.now()
        });

        console.error(`[Bridge] Published -> ${routingKey} cid=${correlationId} id=${message.id ?? 'n/a'} method=${message.method ?? 'n/a'}`);
    } catch (error) {
        console.error('Error processing message:', error.message || String(error));
        if (message && typeof message === 'object' && message.id !== undefined) {
            const err = { jsonrpc: '2.0', id: message.id, error: { code: -32603, message: 'Internal error', data: String(error.message || error) } };
            process.stdout.write(JSON.stringify(err) + '\n');
        }
    }
}

// Read JSON-RPC messages from VS Code MCP client via stdin
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
rl.on('line', async (line) => {
    try {
        const msg = JSON.parse(line);
        if (isReady) {
            await processMessage(msg);
        } else {
            pendingMessages.push(msg);
        }
    } catch (e) {
        console.error('Invalid JSON from stdin:', e.message);
    }
});

// Graceful shutdown
async function shutdown(status = 0) {
    try { if (channel) await channel.close(); } catch {}
    try { if (connection) await connection.close(); } catch {}
    process.exit(status);
}

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));

connectAMQP().catch(() => shutdown(1));
