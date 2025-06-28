# MCP (Model Context Protocol) Basics Guide

## What is MCP?

The Model Context Protocol (MCP) is an open standard created by Anthropic that standardizes how AI applications connect to data sources and tools. Think of it like a USB-C port for AI applications - just as USB-C provides a universal way to connect devices to peripherals, MCP provides a standardized way to connect AI models to different data sources and tools.

MCP replaces fragmented integrations with a single protocol, allowing developers to build against a standard interface rather than maintaining separate connectors for each data source.

## Core Concepts

### Architecture
MCP follows a client-server architecture:
- **MCP Servers**: Expose resources, tools, and prompts to AI models
- **MCP Clients**: Connect to servers and use their capabilities (e.g., Claude Desktop)
- **Transport Layer**: Handles communication between clients and servers (stdio, HTTP)

### Key Components
1. **Resources**: Data sources exposed by servers (files, databases, APIs)
2. **Tools**: Functions that servers provide for clients to execute
3. **Prompts**: Pre-defined conversation starters or templates
4. **Protocol Messages**: Standardized communication format between clients and servers

## Basic Structure and Requirements

### Minimum Requirements
- **Node.js** 18+ (for TypeScript SDK)
- **Python** 3.9+ (for Python SDK)
- **Package Manager**: npm/yarn (TypeScript) or pip/uv (Python)

### Basic Server Structure
```
mcp-server/
├── src/
│   └── index.ts (or main.py)
├── package.json (or pyproject.toml)
├── tsconfig.json (TypeScript only)
└── README.md
```

### Essential Dependencies
- **TypeScript**: `@modelcontextprotocol/sdk`
- **Python**: `mcp[cli]`

## MCP SDK and Development Tools

### Official SDKs

1. **TypeScript SDK**
   - Repository: https://github.com/modelcontextprotocol/typescript-sdk
   - Installation: `npm install @modelcontextprotocol/sdk`
   - Features: Full protocol implementation, standard transports, TypeScript types

2. **Python SDK**
   - Repository: https://github.com/modelcontextprotocol/python-sdk
   - Installation: `pip install mcp[cli]`
   - Features: Async support, type hints, built-in CLI tools

3. **C# SDK** (Microsoft partnership)
   - Developed by Microsoft in partnership with Anthropic
   - Full .NET integration

4. **Java SDK**
   - Community-supported implementation

### Development Tools

1. **MCP Inspector**
   - Test and debug MCP servers
   - Command: `npx @modelcontextprotocol/inspector <server-command>`

2. **Claude Desktop**
   - Primary testing environment for MCP servers
   - Supports local MCP server connections
   - Configuration via `claude_desktop_config.json`

3. **FastMCP** (Python)
   - High-level Pythonic framework
   - Repository: https://github.com/jlowin/fastmcp
   - Simplifies server creation with decorators

## Official Documentation Links

### Primary Resources
1. **Official Documentation**: https://docs.anthropic.com/en/docs/agents-and-tools/mcp
2. **Protocol Website**: https://modelcontextprotocol.io
3. **GitHub Organization**: https://github.com/modelcontextprotocol
4. **Announcement Blog**: https://www.anthropic.com/news/model-context-protocol

### Quickstart Guides
1. **Server Development**: https://modelcontextprotocol.io/quickstart/server
2. **Client Development**: https://modelcontextprotocol.io/quickstart/client
3. **Claude Desktop Setup**: https://support.anthropic.com/en/articles/10949351-getting-started-with-model-context-protocol-mcp-on-claude-for-desktop

## Example MCPs to Learn From

### Official Examples
Repository: https://github.com/modelcontextprotocol/servers

1. **Filesystem Server**
   - Secure file operations with access controls
   - Read, write, list directory operations
   - Path validation and security

2. **PostgreSQL Server**
   - Database query execution
   - Schema inspection
   - Transaction management

3. **GitHub Server**
   - Repository management
   - Issue and PR operations
   - Code search functionality

4. **Slack Server**
   - Message sending and retrieval
   - Channel management
   - User interactions

### Community Examples

1. **Awesome MCP Servers**
   - Curated lists: 
     - https://github.com/wong2/awesome-mcp-servers
     - https://github.com/punkpeye/awesome-mcp-servers
   - Categories: Development, Productivity, Data, AI/ML

2. **Weather Server (Tutorial)**
   - Simple API integration example
   - Available in both Python and TypeScript
   - Good starting point for beginners

3. **MongoDB Lens**
   - Full-featured MongoDB integration
   - Query building and analysis
   - Performance monitoring

### Simple Example: Hello World MCP Server (TypeScript)

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  {
    name: "hello-world",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define a simple tool
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "sayHello",
        description: "Says hello to someone",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name to greet" },
          },
          required: ["name"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "sayHello") {
    const name = request.params.arguments?.name || "World";
    return {
      content: [
        {
          type: "text",
          text: `Hello, ${name}!`,
        },
      ],
    };
  }
});

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Getting Started Steps

1. **Choose Your SDK**: TypeScript or Python based on your preference
2. **Install Claude Desktop**: Latest version for testing
3. **Create Basic Server**: Follow quickstart guide
4. **Test with Inspector**: Debug your implementation
5. **Configure Claude Desktop**: Add your server to config
6. **Iterate and Expand**: Add more tools and resources

## Key Adoption and Ecosystem

- **Early Adopters**: Block, Apollo, Zed, Replit, Codeium, Sourcegraph
- **OpenAI Integration**: ChatGPT Desktop, Agents SDK, Responses API
- **Growing Community**: Active development of new servers and tools
- **Enterprise Ready**: Production deployments at major companies

## Best Practices

1. **Security First**: Always validate inputs and restrict file access
2. **Clear Documentation**: Document all tools and their parameters
3. **Error Handling**: Implement robust error handling and logging
4. **Testing**: Use MCP Inspector for thorough testing
5. **Performance**: Consider async operations for long-running tasks
6. **Versioning**: Follow semantic versioning for your servers

## Next Steps

1. Review the official quickstart guides
2. Clone and study example servers
3. Start with a simple server (weather or filesystem)
4. Join the MCP community discussions
5. Build your own MCP server for a specific use case