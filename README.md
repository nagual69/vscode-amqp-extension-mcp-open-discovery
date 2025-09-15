<!-- BEGIN UNIFIED BRAND HEADER (copy/paste to other repos) -->
<div align="center">
  <p>
    <h1>VS Code AMQP MCP Bridge</h1>
  </p>
  <p>
    <img src="./mcp-open-discovery-logo-white.png" alt="MCP Open Discovery" width="128" height="128" />
    <img src="./VibeForge01.png" alt="VibeForge Systems" width="128" height="128" />
    <img src="./CodedwithAI-white-transparent.png" alt="Coded with AI" width="128" height="128" />
  </p>

  <p><em>Forging Intelligent Systems with Purpose</em></p>
  <p><strong>Unified launch: MCP Open Discovery • AMQP Transport • VS Code Bridge</strong></p>
  <p>
    <a href="https://modelcontextprotocol.io/" target="_blank">Model Context Protocol</a>
    ·
    <a href="https://github.com/nagual69/mcp-open-discovery" target="_blank">MCP Open Discovery</a>
    ·
    <a href="https://github.com/nagual69/AMQPConnectorforMCP" target="_blank">AMQP Transport</a>
    ·
    <a href="https://github.com/nagual69/vscode-mcp-open-discovery-amqp-bridge" target="_blank">VS Code AMQP Bridge</a>
    ·
    <a href="https://vibeforgesystems.com/" target="_blank">VibeForge Systems</a>
  </p>

</div>
<!-- END UNIFIED BRAND HEADER -->
<p align="center">
  <em>Connect VS Code's MCP client to AMQP-based MCP Open Discovery servers</em><br/>
  <strong>by VibeForge Systems</strong>
  
</p>

A professional VS Code extension that bridges VS Code's built-in MCP client to AMQP-based MCP Open Discovery servers, so you can develop and test your OpenMCP Discovery server directly from VS Code Chat.

## Docs map

- [Quick Start](#quick-start)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- Configuration
  - [Options](#configuration-options)
  - [Examples](#configuration-examples)
  - [Server Configuration Format](#server-configuration-format)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Project Docs](#project-docs)
  - [Contributing](./CONTRIBUTING.md)
  - [Code of Conduct](./CODE_OF_CONDUCT.md)
  - [Security Policy](./SECURITY.md)
  - [Changelog](./CHANGELOG.md)
- [Maintainer & Contact](#maintainer--contact)
- [Examples](#examples)
- [License](#license)

## Overview

This extension creates a transport bridge that:

1. **Connects VS Code's MCP client** to your AMQP-based MCP servers
2. **Translates stdio MCP messages** to AMQP messages for your server
3. **Forwards responses back** to VS Code's integrated MCP client
4. **Enables full testing** of tools, resources, and prompts via VS Code Chat

## How It Works

```
VS Code MCP Client (stdio) → Bridge Extension → AMQP → Your OpenMCP Discovery Server
                                     ↓
VS Code Chat Interface    ←    AMQP Response    ←    Server Response
```

The bridge extension:

- Registers as an MCP Server Definition Provider in VS Code
- Creates a Node.js bridge process that speaks stdio with VS Code
- Connects via AMQP to your OpenMCP Discovery server
- Translates between stdio JSON-RPC and AMQP JSON-RPC messages

## Quick Start

Follow these steps to get up and running fast on Windows (PowerShell):

1. Install dependencies

```powershell
npm install
```

2. Build and run in Extension Development Host

```powershell
npm run compile
# Press F5 in VS Code to launch the Extension Development Host
```

3. Or install from a packaged VSIX

```powershell
code --install-extension .\vscode-mcp-open-discovery-amqp-bridge-1.0.1.vsix --force
```

4. Add a server in VS Code Settings (Ctrl+,)

```json
{
  "amqpMcpBridge.servers": [
    {
      "id": "mcpOpenDiscovery",
      "name": "MCP Open Discovery Server",
      "amqpUrl": "amqp://mcp:discovery@localhost:5672",
      "serverQueuePrefix": "mcp.discovery",
      "exchangeName": "mcp.notifications",
      "enabled": true
    }
  ]
}
```

5. Test the connection

- Open Command Palette (Ctrl+Shift+P) → "AMQP MCP: Test Connection"
- Open VS Code Chat (Ctrl+Alt+I), enable Agent Mode, and try your tools

## Installation & Setup

### Prerequisites

- VS Code 1.95.0 or higher
- Node.js 18+
- RabbitMQ (or another AMQP 0-9-1 broker) reachable from your machine
- Your OpenMCP Discovery server connected to the same broker

### 1. Install Dependencies

```powershell
npm install
```

### 2. Compile the Extension

```powershell
npm run compile
```

### 3. Install in VS Code

- Open VS Code
- Press `F5` to launch Extension Development Host
- Or package the extension (optional) and install the `.vsix` file

Development mode:

```powershell
# run from the repo folder
npm run compile
# then press F5 in VS Code
```

From a packaged VSIX:

```powershell
code --install-extension .\vscode-mcp-open-discovery-amqp-bridge-1.0.1.vsix --force
```

Note: Packaged `.vsix` artifacts should be distributed via GitHub Releases and not committed to source control.

### 4. Configure Your AMQP Server

Open VS Code settings and configure your OpenMCP Discovery server:

```json
{
  "amqpMcpBridge.servers": [
    {
      "id": "mcpOpenDiscovery",
      "name": "MCP Open Discovery Server",
      "amqpUrl": "amqp://mcp:discovery@localhost:5672",
      "serverQueuePrefix": "mcp.discovery",
      "exchangeName": "mcp.notifications",
      "enabled": true
    }
  ]
}
```

### 5. Start Your AMQP Broker & MCP Server

```powershell
# Start RabbitMQ (example: Docker Desktop compose)
docker compose up -d

# Start your OpenMCP Discovery server
# (Ensure it uses the same queue prefix: "mcp.discovery")
```

## Usage

### Testing Your MCP Server

1. **Open VS Code Chat** (Ctrl+Alt+I or Cmd+Option+I)
2. **Enable Agent Mode** - Toggle the agent mode switch
3. **Your AMQP server appears** in the MCP servers list
4. **Test tools, resources, and prompts** directly in chat

### Available Commands

- `AMQP MCP: Refresh Servers` - Reload server configurations
- `AMQP MCP: Test Connection` - Test AMQP connectivity

### Monitoring

- Check the **Output panel** → "AMQP MCP Bridge" for connection logs
- Server errors appear in VS Code's MCP debugging interface
- Use `MCP: List Servers` command to manage your servers

## Configuration Options

| Setting                              | Description                         | Default           |
| ------------------------------------ | ----------------------------------- | ----------------- |
| `amqpMcpBridge.servers`              | Array of AMQP server configurations | See example above |
| `amqpMcpBridge.defaultTimeout`       | Request timeout in milliseconds     | 30000             |
| `amqpMcpBridge.reconnectDelay`       | Reconnection delay in milliseconds  | 5000              |
| `amqpMcpBridge.maxReconnectAttempts` | Maximum reconnection attempts       | 10                |

## Configuration Examples

### Multiple Servers

```json
{
  "amqpMcpBridge.servers": [
    {
      "id": "discovery1",
      "name": "Local Discovery Server",
      "amqpUrl": "amqp://localhost:5672",
      "serverQueuePrefix": "local.discovery",
      "exchangeName": "mcp.local"
    },
    {
      "id": "discovery2",
      "name": "Remote Discovery Server",
      "amqpUrl": "amqp://user:pass@remote.server:5672",
      "serverQueuePrefix": "remote.discovery",
      "exchangeName": "mcp.remote"
    }
  ]
}
```

### Custom Timeouts

```json
{
  "amqpMcpBridge.defaultTimeout": 60000,
  "amqpMcpBridge.reconnectDelay": 3000,
  "amqpMcpBridge.maxReconnectAttempts": 5
}
```

## Server Configuration Format

Each server in the `amqpMcpBridge.servers` array needs:

```typescript
{
  id: string; // Unique identifier
  name: string; // Display name in VS Code
  amqpUrl: string; // AMQP broker connection URL
  serverQueuePrefix: string; // Your server's queue prefix
  exchangeName: string; // Exchange for notifications
  enabled: boolean; // Whether to load this server
}
```

## Troubleshooting

### Connection Issues

1. **Check AMQP broker** is running: `docker ps | grep rabbitmq`
2. **Verify credentials** in your `amqpUrl`
3. **Test basic connectivity**: Run the "Test Connection" command
4. **Check server logs** in VS Code Output panel

### Message Flow Issues

1. **Verify queue names** match between bridge and your server
2. **Check server queue prefix** is correct in configuration
3. **Monitor AMQP queues** using RabbitMQ management UI (localhost:15672)
4. **Enable debug logging** in your OpenMCP Discovery server

### Fix: Queue mismatch (serverQueuePrefix / exchangeName)

If the bridge and server use different queue names, update VS Code settings to match your server:

Incorrect example (bridge):

```json
{
  "amqpMcpBridge.servers": [
    {
      "serverQueuePrefix": "openmcp.discovery" // wrong
    }
  ]
}
```

Correct example:

```json
{
  "amqpMcpBridge.servers": [
    {
      "id": "openmcp-discovery",
      "name": "OpenMCP Discovery Server",
      "enabled": true,
      "amqpUrl": "amqp://mcp:discovery@localhost:5672",
      "serverQueuePrefix": "mcp.discovery",
      "exchangeName": "mcp.notifications"
    }
  ]
}
```

Tips:

- Ensure the bridge publishes to `${exchangeName}.mcp.routing`
- Ensure the server consumes from `${serverQueuePrefix}.requests`
- Verify via RabbitMQ Management UI (http://localhost:15672)

### Enable verbose debug logs

PowerShell (Windows):

```powershell
$env:DEBUG = "amqp:*"
node .\your-openmcp-server.js
```

### VS Code Integration Issues

1. **Restart VS Code** after configuration changes
2. **Check MCP is enabled** in VS Code settings
3. **Use Command Palette** → "MCP: List Servers" to verify registration
4. **Try Extension Development Host** mode for debugging

## Development

### Architecture

The bridge works by creating a Node.js child process that:

- Reads JSON-RPC messages from stdin (VS Code MCP client)
- Forwards them via AMQP to your OpenMCP Discovery server
- Receives AMQP responses and writes them to stdout (back to VS Code)

### Extending the Bridge

To add features:

1. Modify `src/amqpMcpProvider.ts` for server registration logic
2. Update the `getBridgeScript()` method for protocol changes
3. Add new configuration options in `package.json`

### Testing

Test the bridge extension:

```bash
# Run in Extension Development Host
code --extensionDevelopmentPath=/path/to/vscode-amqp-mcp-bridge

# Test AMQP connectivity
npm run test-connection
```

## Project Docs

- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Code of Conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- Security Policy: [SECURITY.md](./SECURITY.md)
- Changelog: [CHANGELOG.md](./CHANGELOG.md)

## Maintainer & Contact

Maintained by VibeForge Systems.

- Website: https://vibeforgesystems.com/
- Contact: https://vibeforgesystems.com/#contact

## Examples

### Example OpenMCP Discovery Server Configuration

Your OpenMCP Discovery server should be configured to:

- Listen on queue: `mcp.discovery.requests`
- Use exchange: `mcp.notifications`
- Respond to correlation IDs from the bridge

Note: The bridge and server communicate via a bidirectional routing exchange `${exchangeName}.mcp.routing`. The bridge publishes envelopes with `correlationId` and `replyTo` for direct responses.

### Example MCP Commands in VS Code Chat

Once connected, you can test in VS Code Chat:

- `@agent discover packages for typescript` (if you have discovery tools)
- `list available resources` (to see MCP resources)
- Use slash commands for prompts: `/mcp.openMcpDiscovery.promptName`

## License

Licensed under the Apache License, Version 2.0 — see `LICENSE` and `NOTICE` for details.

## Related

- OpenMCP Discovery — your AMQP MCP server implementation
- [VS Code MCP Documentation](https://code.visualstudio.com/api/extension-guides/ai/mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
