# Claude Code Exporter MCP Server

An MCP (Model Context Protocol) server that provides tools for exporting and aggregating Claude Code conversations.

## Overview

This MCP server exposes two main tools:
- **export_conversation**: Export conversations from a specific project
- **aggregate_sessions**: Aggregate and analyze sessions across multiple projects

## Installation

### Prerequisites

- Node.js 18 or higher
- Claude Desktop application

### Setup

#### Option 1: Install from NPM (Recommended)

1. Install the package globally:
```bash
npm install -g mcp-claude-exporter
```

2. Find the installation path:
```bash
npm list -g mcp-claude-exporter
```

#### Option 2: Install from Source

1. Clone the repository:
```bash
git clone https://github.com/developerisnow/claude-code-exporter.git
cd claude-code-exporter/mcp-exporter
```

2. Install dependencies:
```bash
npm install
```

### Configure Claude Desktop

Edit your Claude Desktop config file:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Add the MCP server configuration:

**For NPM installation:**
```json
{
  "mcpServers": {
    "claude-code-exporter": {
      "command": "npx",
      "args": ["mcp-claude-exporter"],
      "env": {
        "CLAUDE_HOME": "/path/to/.claude"
      }
    }
  }
}
```

**For source installation:**
```json
{
  "mcpServers": {
    "claude-code-exporter": {
      "command": "node",
      "args": ["/absolute/path/to/claude-code-exporter/mcp-exporter/index.js"],
      "env": {
        "CLAUDE_HOME": "/path/to/.claude"
      }
    }
  }
}
```

3. Restart Claude Desktop

## Usage

### Tool: export_conversation

Export conversations from a specific project to markdown or JSON files.

**Parameters:**
- `projectPath` (required): Absolute path to the project directory
- `outputDir`: Output directory (default: "./claude-prompts")
- `exportMode`: Export mode - "prompts", "full", or "outputs" (default: "prompts")
- `exportFormat`: Export format - "markdown", "json", or "both" (default: "markdown")
- `claudeHome`: Claude home directory path (optional)

**Example:**
```
Use the export_conversation tool to export my project at /Users/me/myproject
```

### Tool: aggregate_sessions

Aggregate and analyze Claude Code sessions across all projects.

**Parameters:**
- `claudeHome`: Claude home directory path (optional)
- `outputDir`: Output directory (default: "./aggregated-prompts")
- `includeStats`: Include detailed statistics (default: true)
- `groupBy`: How to group sessions - "project", "date", or "none" (default: "project")

**Example:**
```
Use the aggregate_sessions tool to create a summary of all my Claude sessions
```

## Output Formats

### Export Conversation

The tool exports conversations in the following structure:
```
claude-prompts/
├── sessionId-title-prompts.md    # For prompts mode
├── sessionId-title-full.md       # For full mode
└── sessionId-title-outputs.md    # For outputs mode
```

### Aggregate Sessions

Creates a comprehensive report:
```
aggregated-prompts/
├── aggregate-report-YYYY-MM-DD.md   # Human-readable report
└── aggregate-data-YYYY-MM-DD.json   # Machine-readable data
```

## Environment Variables

- `CLAUDE_HOME`: Override the default Claude home directory location

## Troubleshooting

### Claude home directory not found

The server looks for Claude configuration in these locations:
1. Value specified in tool parameters
2. `CLAUDE_HOME` environment variable
3. `~/.claude`
4. `~/.config/claude`

### No sessions found

Ensure the project path exactly matches the one used in Claude Code. The path encoding can sometimes cause mismatches.

## Features

- Non-interactive operation suitable for MCP
- Supports all export modes (prompts, outputs, full conversation)
- Multiple export formats (markdown, JSON, both)
- Automatic Claude home directory detection
- Comprehensive aggregation reports
- Project activity tracking

## License

MIT