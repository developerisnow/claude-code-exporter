# Awesome MCP Lists Submission Commands

## Quick Setup Commands

### 1. wong2/awesome-mcp-servers

```bash
# Fork and clone
gh repo fork wong2/awesome-mcp-servers --clone
cd awesome-mcp-servers

# Create branch
git checkout -b add-claude-code-exporter

# Edit README.md and add entry in appropriate section
# Then commit
git add README.md
git commit -m "Add claude-code-exporter MCP server"

# Push and create PR
git push origin add-claude-code-exporter
gh pr create --title "Add claude-code-exporter MCP server" --body-file pr-wong2.md
```

### 2. punkpeye/awesome-mcp-servers

```bash
# Fork and clone
gh repo fork punkpeye/awesome-mcp-servers --clone
cd awesome-mcp-servers

# Create branch
git checkout -b add-claude-code-exporter

# Edit README.md and add to "Coding Agents" or "Developer Productivity & Utilities"
# Then commit
git add README.md
git commit -m "Add claude-code-exporter to Developer Productivity category"

# Push and create PR
git push origin add-claude-code-exporter
gh pr create --title "Add claude-code-exporter to Developer Productivity category" --body-file pr-punkpeye.md
```

### 3. TensorBlock/awesome-mcp-servers

```bash
# Fork and clone
gh repo fork TensorBlock/awesome-mcp-servers --clone
cd awesome-mcp-servers

# Create branch
git checkout -b add-claude-code-exporter

# Edit the appropriate category file
echo '[developerisnow/claude-code-exporter](https://github.com/developerisnow/claude-code-exporter/tree/main/mcp-exporter): MCP server that enables AI assistants to export and aggregate Claude Code conversations. Features include multiple export modes (prompts/outputs/full), format options (markdown/JSON), project aggregation, activity tracking, and comprehensive reporting capabilities.' >> docs/developer-productivity--utilities.md

# Commit
git add docs/developer-productivity--utilities.md
git commit -m "Add claude-code-exporter to Developer Productivity & Utilities"

# Push and create PR
git push origin add-claude-code-exporter
gh pr create --title "Add claude-code-exporter to Developer Productivity & Utilities" --body-file pr-tensorblock.md
```

## PR Body Files

Create these files before running the commands above:

### pr-wong2.md
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
- **[claude-code-exporter](https://github.com/developerisnow/claude-code-exporter/tree/main/mcp-exporter)** - Export and aggregate Claude Code conversations programmatically via MCP
```

### pr-punkpeye.md
```markdown
## Description
Adding claude-code-exporter MCP server to the Developer Productivity & Utilities category.

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
- **[claude-code-exporter](https://github.com/developerisnow/claude-code-exporter/tree/main/mcp-exporter)** 📇 🏠 - MCP server for exporting and aggregating Claude Code conversations with powerful filtering, multiple export formats, and comprehensive analysis capabilities
```

### pr-tensorblock.md
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
```

## Alternative: Manual Submission

If you prefer browser-based submission:

1. Visit each repository
2. Click "Fork" button
3. Edit file directly on GitHub
4. Create pull request from web interface
5. Use the PR templates from the main guide

## Verification Commands

```bash
# Verify your entry is formatted correctly
grep -n "claude-code-exporter" README.md

# Check markdown linting
npx markdownlint README.md

# Preview changes
git diff --cached
```

## Post-Submission Tracking

```bash
# List your PRs
gh pr list --author @me --search "claude-code-exporter"

# Check PR status
gh pr status

# View PR comments
gh pr view --comments
```