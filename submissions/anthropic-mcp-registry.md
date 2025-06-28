# MCP Registry Submission: Claude Code Exporter

## Server Information

**Name**: claude-code-exporter  
**Version**: 2.0.1  
**Author**: developerisnow  
**License**: MIT  

## Description

### Brief (One-liner)
Export and aggregate Claude Code conversations with powerful filtering and organization features.

### Detailed
Claude Code Exporter is a comprehensive tool for extracting, organizing, and analyzing conversations from Claude Code. It provides both CLI and MCP server interfaces, enabling users to export conversations in multiple formats (Markdown, JSON), filter by time periods, and aggregate data across multiple projects. Perfect for documentation, knowledge management, and conversation analysis.

## Features

- **Multiple Export Modes**: Export prompts only, outputs only, or full conversations
- **Multiple Formats**: Export to Markdown, JSON, or both
- **Time-based Filtering**: Filter by days, weeks, months, or years
- **Aggregation**: Combine prompts across all projects with smart grouping
- **MCP Integration**: Native Model Context Protocol support for Claude Desktop
- **Interactive CLI**: User-friendly prompts with sensible defaults

## Installation

```bash
npm install -g claude-code-exporter
```

## MCP Configuration

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

## Tools Provided

### export_conversation
Export Claude Code conversations from a specific project path with customizable options for mode and format.

**Input Schema**:
- `projectPath` (string, required): Absolute path to the project directory
- `outputDir` (string): Output directory for exported files (default: ./claude-prompts)
- `exportMode` (enum): prompts, full, or outputs (default: prompts)
- `exportFormat` (enum): markdown, json, or both (default: markdown)
- `claudeHome` (string): Claude home directory path (optional)

### aggregate_sessions
Aggregate and analyze Claude Code sessions across multiple projects with statistics and grouping options.

**Input Schema**:
- `claudeHome` (string): Claude home directory path (optional)
- `outputDir` (string): Output directory for aggregated report (default: ./aggregated-prompts)
- `includeStats` (boolean): Include detailed statistics (default: true)
- `groupBy` (enum): project, date, or none (default: project)

## Repository

- **GitHub**: https://github.com/developerisnow/claude-code-exporter
- **NPM**: https://www.npmjs.com/package/claude-code-exporter
- **Issues**: https://github.com/developerisnow/claude-code-exporter/issues

## Category

Developer Tools / Documentation

## Keywords

claude, claude-code, export, prompts, markdown, cli, anthropic, mcp, model-context-protocol, claude-desktop, ai-tools, documentation, knowledge-management