# Awesome MCP Lists Submission Guide

## Overview

This guide provides PR templates and submission strategies for getting claude-code-exporter listed in major awesome-mcp repositories. The MCP server allows AI assistants to export and aggregate Claude Code conversations programmatically.

## Target Repositories

### 1. wong2/awesome-mcp-servers
- **URL**: https://github.com/wong2/awesome-mcp-servers
- **Format**: Simple list format
- **Category**: Best fit under "Developer Tools" or "Productivity"

### 2. punkpeye/awesome-mcp-servers
- **URL**: https://github.com/punkpeye/awesome-mcp-servers
- **Format**: Categorized with language/platform indicators
- **Category**: "Coding Agents" or "Developer Productivity & Utilities"
- **Indicators**: 📇 TypeScript, 🏠 Local Service

### 3. TensorBlock/awesome-mcp-servers
- **URL**: https://github.com/TensorBlock/awesome-mcp-servers
- **Format**: Comprehensive with detailed categories
- **Category**: "Developer Productivity & Utilities" (`docs/developer-productivity--utilities.md`)

## Submission Descriptions

### Short Description (for simple lists)
```
Export and aggregate Claude Code conversations programmatically via MCP
```

### Medium Description (for categorized lists)
```
MCP server for exporting and aggregating Claude Code conversations with powerful filtering, multiple export formats, and comprehensive analysis capabilities
```

### Detailed Description (for comprehensive lists)
```
[developerisnow/claude-code-exporter](https://github.com/developerisnow/claude-code-exporter/tree/main/mcp-exporter): MCP server that enables AI assistants to export and aggregate Claude Code conversations. Features include multiple export modes (prompts/outputs/full), format options (markdown/JSON), project aggregation, activity tracking, and comprehensive reporting capabilities.
```

## Pull Request Templates

### PR Template 1: wong2/awesome-mcp-servers

**Title**: Add claude-code-exporter MCP server

**Body**:
```markdown
## Description
Adding claude-code-exporter MCP server to the list. This server enables AI assistants to programmatically export and aggregate Claude Code conversations.

## Why should this be included?
- Fills a gap in the ecosystem for Claude Code conversation management
- Provides essential functionality for developers using Claude Code
- Well-documented with clear installation instructions
- Actively maintained with comprehensive features

## Checklist
- [x] The project implements MCP (Model Context Protocol)
- [x] The project has clear documentation
- [x] The project is publicly accessible
- [x] The description is concise and informative

## Addition
Under the appropriate section:
```
- **[claude-code-exporter](https://github.com/developerisnow/claude-code-exporter/tree/main/mcp-exporter)** - Export and aggregate Claude Code conversations programmatically via MCP
```
```

### PR Template 2: punkpeye/awesome-mcp-servers

**Title**: Add claude-code-exporter to Coding Agents/Developer Productivity category

**Body**:
```markdown
## Description
Adding claude-code-exporter MCP server to the Coding Agents or Developer Productivity & Utilities category.

## Details
- **Name**: claude-code-exporter
- **Repository**: https://github.com/developerisnow/claude-code-exporter/tree/main/mcp-exporter
- **Language**: TypeScript 📇
- **Type**: Local Service 🏠
- **Platform**: Cross-platform (🍎 macOS, 🪟 Windows, 🐧 Linux)

## Features
- Export Claude Code conversations (prompts, outputs, or full)
- Aggregate sessions across multiple projects
- Multiple export formats (Markdown, JSON)
- Project activity tracking and reporting
- Non-interactive operation suitable for MCP

## Addition
```
- **[claude-code-exporter](https://github.com/developerisnow/claude-code-exporter/tree/main/mcp-exporter)** 📇 🏠 - MCP server for exporting and aggregating Claude Code conversations with powerful filtering, multiple export formats, and comprehensive analysis capabilities
```
```

### PR Template 3: TensorBlock/awesome-mcp-servers

**Title**: Add claude-code-exporter to Developer Productivity & Utilities

**Body**:
```markdown
## Description
Adding claude-code-exporter MCP server to the Developer Productivity & Utilities category.

## Why this addition?
The claude-code-exporter MCP server fills an important need in the Claude Code ecosystem by enabling programmatic access to conversation exports and aggregation. This is essential for developers who want to:
- Build knowledge bases from their Claude interactions
- Track project activity and patterns
- Create documentation from conversations
- Analyze their development workflow with Claude

## Server Details
- **Repository**: https://github.com/developerisnow/claude-code-exporter/tree/main/mcp-exporter
- **NPM Package**: mcp-claude-exporter
- **Language**: TypeScript/Node.js
- **License**: MIT

## Key Features
1. **Export Modes**: Prompts only, outputs only, or full conversations
2. **Multiple Formats**: Markdown and JSON export options
3. **Aggregation**: Combine sessions across all projects with statistics
4. **Grouping Options**: By project, date, or custom criteria
5. **Non-Interactive**: Designed specifically for MCP operation

## Tools Provided
- `export_conversation`: Export specific project conversations
- `aggregate_sessions`: Aggregate and analyze all sessions

## Addition for `docs/developer-productivity--utilities.md`:
```
[developerisnow/claude-code-exporter](https://github.com/developerisnow/claude-code-exporter/tree/main/mcp-exporter): MCP server that enables AI assistants to export and aggregate Claude Code conversations. Features include multiple export modes (prompts/outputs/full), format options (markdown/JSON), project aggregation, activity tracking, and comprehensive reporting capabilities.
```
```

## Submission Strategy

### Step 1: Prepare the Repository
1. Ensure README.md is comprehensive and up-to-date
2. Add clear MCP-specific documentation
3. Include example usage in the MCP context
4. Verify all installation instructions work

### Step 2: Test Installation
1. Test NPM global installation path
2. Verify Claude Desktop configuration examples
3. Ensure the MCP server starts correctly
4. Test both tools with various parameters

### Step 3: Submit PRs
1. Fork each target repository
2. Create feature branch: `add-claude-code-exporter`
3. Add the entry in the appropriate location
4. Follow each repository's contribution guidelines
5. Submit PR with appropriate template

### Step 4: Follow Up
1. Monitor PR for feedback
2. Respond to maintainer questions promptly
3. Make requested changes quickly
4. Thank maintainers upon merge

## Alternative Descriptions

### For Developer Tools Category
```
Export and manage Claude Code conversations through MCP tools for documentation and analysis
```

### For Productivity Category
```
Streamline Claude Code workflow with automated conversation export and aggregation via MCP
```

### For AI/LLM Integration Category
```
Bridge Claude Code conversations to external tools through MCP-based export and analysis
```

## Key Selling Points

1. **Unique Value**: First MCP server specifically for Claude Code conversation management
2. **Developer Focus**: Helps developers build knowledge bases from AI interactions
3. **Comprehensive Features**: Not just export, but aggregation and analysis
4. **Easy Integration**: Simple npm install and Claude Desktop config
5. **Active Development**: Regular updates and feature additions

## Additional Resources

- NPM Package: https://www.npmjs.com/package/mcp-claude-exporter
- Main Repository: https://github.com/developerisnow/claude-code-exporter
- MCP Documentation: https://github.com/developerisnow/claude-code-exporter/tree/main/mcp-exporter

## Notes

- Emphasize the MCP-specific functionality over the CLI tool
- Highlight the programmatic access aspect for AI assistants
- Focus on the developer productivity benefits
- Mention the cross-platform compatibility