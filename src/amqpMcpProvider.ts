import * as vscode from 'vscode';
import * as path from 'path';

interface AMQPServerConfig {
    id: string;
    name: string;
    amqpUrl: string;
    serverQueuePrefix: string;
    exchangeName: string;
    enabled: boolean;
}

export class AMQPMcpServerDefinitionProvider implements vscode.McpServerDefinitionProvider {
    private _onDidChangeMcpServerDefinitions = new vscode.EventEmitter<void>();
    public readonly onDidChangeMcpServerDefinitions = this._onDidChangeMcpServerDefinitions.event;

    provideMcpServerDefinitions(): vscode.McpServerDefinition[] {
        const config = vscode.workspace.getConfiguration('amqpMcpBridge');
        const servers: AMQPServerConfig[] = config.get('servers', []);

        // Resolve bridge script path relative to this compiled extension file
        // __dirname points to the compiled dist directory at runtime
        const bridgePath = path.join(__dirname, 'bridge.js');

        // Debug logging
        console.log('[AMQP MCP] Bridge path:', bridgePath);
        console.log('[AMQP MCP] Servers found:', servers.length);

        return servers
            .filter(server => server.enabled)
            .map(server => {
                const definition = {
                    type: 'stdio' as const,
                    label: server.name,  // VS Code requires 'label' instead of 'name'
                    command: 'node',
                    args: [bridgePath],
                    env: {
                        AMQP_URL: server.amqpUrl,
                        SERVER_QUEUE_PREFIX: server.serverQueuePrefix,
                        EXCHANGE_NAME: server.exchangeName,
                        SERVER_ID: server.id  // Pass server ID via environment
                    }
                };
                console.log('[AMQP MCP] Creating server definition:', {
                    label: definition.label,
                    command: definition.command,
                    args: definition.args
                });
                return definition;
            });
    }

    async resolveMcpServerDefinition(definition: vscode.McpServerDefinition): Promise<vscode.McpServerDefinition> {
        // Perform any additional setup or validation here
        const config = vscode.workspace.getConfiguration('amqpMcpBridge');
        const servers: AMQPServerConfig[] = config.get('servers', []);
        const serverConfig = servers.find(s => s.name === definition.label);

        if (serverConfig) {
            // Test connection before returning
            try {
                await this.testAMQPConnection(serverConfig);
                vscode.window.showInformationMessage(`Ready to connect to AMQP MCP server: ${serverConfig.name}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to validate AMQP server ${serverConfig.name}: ${error}`);
                throw error;
            }
        }

        return definition;
    }

    private async testAMQPConnection(config: AMQPServerConfig): Promise<void> {
        // Import amqplib dynamically to avoid compile-time issues
        const amqp = require('amqplib');
        let connection: any;

        try {
            connection = await amqp.connect(config.amqpUrl);
            await connection.close();
        } catch (error) {
            throw new Error(`Cannot connect to AMQP broker at ${config.amqpUrl}: ${error}`);
        }
    }

    public refresh(): void {
        this._onDidChangeMcpServerDefinitions.fire();
    }

    public async testConnections(): Promise<{ success: boolean; connectedCount: number; error?: string }> {
        const config = vscode.workspace.getConfiguration('amqpMcpBridge');
        const servers: AMQPServerConfig[] = config.get('servers', []);

        let connectedCount = 0;
        let lastError: string | undefined;

        for (const server of servers.filter(s => s.enabled)) {
            try {
                await this.testAMQPConnection(server);
                connectedCount++;
            } catch (error) {
                lastError = `${server.name}: ${error}`;
            }
        }

        return {
            success: connectedCount > 0,
            connectedCount,
            error: lastError
        };
    }
}
