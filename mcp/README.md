# Claude Code Exporter MCP Server

This is the Model Context Protocol (MCP) server component of claude-code-exporter.

## Installation

The MCP server is included with the main package:

```bash
npm install -g claude-code-exporter
```

## Usage with Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "claude-code-exporter": {
      "command": "npx",
      "args": ["claude-code-exporter", "mcp"]
    }
  }
}
```

## Available Tools

### export_conversation
Export Claude Code conversations from a specific project.

Parameters:
- `projectPath` (required): Path to the project
- `outputPath` (optional): Where to save exports (default: ./claude-exports)
- `exportMode` (optional): "prompts" | "outputs" | "full" (default: "prompts")
- `exportFormat` (optional): "markdown" | "json" | "both" (default: "markdown")

### aggregate_sessions
Aggregate sessions across all Claude projects.

Parameters:
- `outputPath` (optional): Where to save the report (default: ./aggregated-sessions)
- `groupBy` (optional): "project" | "date" (default: "project")

## Development

The MCP server uses the existing `lib/index.js` functionality through a wrapper.

For more information, see the [main documentation](https://github.com/developerisnow/claude-code-exporter).