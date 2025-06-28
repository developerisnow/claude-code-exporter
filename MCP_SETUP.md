# MCP Setup Guide for Claude Code Exporter

## Installation

```bash
npm install -g claude-code-exporter
```

## Configuration for Claude Desktop

1. Open Claude Desktop configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/claude/claude_desktop_config.json`

2. Add the MCP server configuration:

```json
{
  "mcpServers": {
    "claude-code-exporter": {
      "command": "claude-prompts",
      "args": ["mcp"]
    }
  }
}
```

3. Restart Claude Desktop

## Available MCP Tools

### export_conversation
Export Claude Code conversations from a specific project.

Example usage in Claude:
- "Use the export_conversation tool to export my project at /Users/john/myproject"
- "Export the conversation from /path/to/project as JSON"

### aggregate_sessions  
Aggregate and analyze all your Claude sessions across projects.

Example usage in Claude:
- "Use aggregate_sessions to show me all my Claude projects"
- "Aggregate all sessions and group by date"

## Troubleshooting

If MCP server doesn't appear in Claude Desktop:
1. Verify installation: `claude-prompts --version`
2. Test MCP server: `claude-prompts mcp` (should show "MCP Server running")
3. Check Claude Desktop logs for errors
4. Ensure config file is valid JSON

## Note

The MCP server uses the same underlying functionality as the CLI tool but provides programmatic access through Claude Desktop.