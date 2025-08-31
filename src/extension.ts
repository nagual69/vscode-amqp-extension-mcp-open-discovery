import * as vscode from 'vscode';
import { AMQPMcpServerDefinitionProvider } from './amqpMcpProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('AMQP MCP Bridge extension is now active');

    // Register the AMQP MCP server definition provider
    const provider = new AMQPMcpServerDefinitionProvider();
    const disposable = vscode.lm.registerMcpServerDefinitionProvider('amqpMcpProvider', provider);
    context.subscriptions.push(disposable);

    // Register commands
    const refreshCommand = vscode.commands.registerCommand('amqpMcpBridge.refreshServers', () => {
        provider.refresh();
        vscode.window.showInformationMessage('AMQP MCP servers refreshed');
    });
    context.subscriptions.push(refreshCommand);

    const testConnectionCommand = vscode.commands.registerCommand('amqpMcpBridge.testConnection', async () => {
        const result = await provider.testConnections();
        if (result.success) {
            vscode.window.showInformationMessage(`Successfully connected to ${result.connectedCount} AMQP servers`);
        } else {
            vscode.window.showErrorMessage(`Failed to connect to AMQP servers: ${result.error}`);
        }
    });
    context.subscriptions.push(testConnectionCommand);

    // Listen for configuration changes
    const configWatcher = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('amqpMcpBridge')) {
            provider.refresh();
        }
    });
    context.subscriptions.push(configWatcher);
}

export function deactivate() {
    console.log('AMQP MCP Bridge extension is now deactivated');
}
