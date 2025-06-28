# Claude Code Exporter 🚀

[![npm version](https://img.shields.io/npm/v/claude-code-exporter.svg)](https://www.npmjs.com/package/claude-code-exporter)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/claude-code-exporter.svg)](https://nodejs.org)

Export and aggregate Claude Code conversations with powerful filtering and organization features.

## ✨ Features

- [x] 📤 **Multiple Export Modes** - Prompts only, outputs only, or full conversations
- [x] 📁 **Multiple Formats** - Export to Markdown, JSON, or both
- [x] 🏠 **Dual Directory Support** - Works with `~/.claude` and `~/.config/claude`
- [x] 📊 **Aggregate Mode** - Combine prompts across all projects
- [x] 📅 **Period Filtering** - Filter by days, weeks, months, or years
- [x] 🗓️ **Period Grouping** - Group exports by time periods
- [x] 🎯 **Smart Organization** - Timestamp-based directories with clear naming
- [x] 💬 **Interactive Mode** - User-friendly prompts with defaults
- [x] 🔧 **CLI & API** - Use as command-line tool or Node.js library
- [x] 🤖 **MCP Server** - Model Context Protocol support for Claude Desktop (v2.0.1+)

## 🚀 Quick Start

```bash
# Install globally
npm install -g claude-code-exporter

# Export current project
claude-prompts

# Export with aggregation
claude-prompts --aggregate

# Export last 7 days
claude-prompts --aggregate --period=7d

# Export grouped by days
claude-prompts --aggregate --period=7d --periodGroup=d --nested
```

## 📦 Installation

### Global (Recommended)
```bash
npm install -g claude-code-exporter
```

### Local Project
```bash
npm install claude-code-exporter
```

### Without Installation
```bash
npx claude-code-exporter /path/to/project
```

## 📖 Usage

### Basic Commands

```bash
# Interactive mode
claude-prompts

# Export specific project
claude-prompts /path/to/project

# Export full conversations
claude-prompts --full /path/to/project

# Export to JSON
claude-prompts --json /path/to/project

# List available sessions
claude-prompts --list /path/to/project
```

### Advanced Aggregation

```bash
# Aggregate all projects
claude-prompts --aggregate

# Aggregate with nested structure
claude-prompts --aggregate --nested

# Filter by time period
claude-prompts --aggregate --period=30d    # Last 30 days
claude-prompts --aggregate --period=2w     # Last 2 weeks
claude-prompts --aggregate --period=3m     # Last 3 months

# Group by time period
claude-prompts --aggregate --period=1m --periodGroup=w  # Group by weeks
claude-prompts --aggregate --period=1y --periodGroup=m  # Group by months
```

### CLI Options

| Option | Short | Description |
|--------|-------|-------------|
| `--help` | `-h` | Show help |
| `--version` | `-v` | Show version |
| `--prompts` | `-p` | Export user prompts only (default) |
| `--outputs` | `-o` | Export assistant outputs only |
| `--full` | `-f` | Export full conversations |
| `--markdown` | `-m` | Export as Markdown (default) |
| `--json` | `-j` | Export as JSON |
| `--all-formats` | | Export in both formats |
| `--aggregate` | `-a` | Aggregate prompts across projects |
| `--nested` | | Create nested folder structure |
| `--period` | | Filter by time period (e.g., 7d, 2w, 1m) |
| `--periodGroup` | | Group by period (d, w, m, y) |
| `--both-dirs` | | Process both Claude directories |
| `--no-interactive` | | Disable interactive prompts |
| `--quiet` | `-q` | Suppress output |
| `--verbose` | `-V` | Enable verbose logging |

## 📊 Export Formats

### Prompts Only (Default)
Exports only user messages, perfect for:
- 📝 Creating prompt libraries
- 🔍 Analyzing your questions
- 📚 Building documentation

### Outputs Only
Exports only assistant responses, ideal for:
- 💻 Collecting code examples
- 📖 Building knowledge bases
- 🎯 Extracting solutions

### Full Conversation
Exports complete dialogue, best for:
- 📜 Complete documentation
- 🎓 Learning from interactions
- 🐛 Debugging conversations

## 📁 Output Structure

### Standard Export
```
claude-prompts/
├── 2d002199-untitled-prompts.md
├── 33c13f1c-react-hooks-full.md
└── 73d2983f-api-design-outputs.json
```

### Aggregated Export
```
aggregated-prompts/
├── aggregated-20250628-project1.md
├── aggregated-20250628-project2.json
└── aggregated-20250628-project3.txt
```

### Nested Aggregate
```
aggregated-prompts/
├── project1/
│   └── session1/
│       ├── prompts.md
│       ├── outputs.txt
│       └── full.json
└── project2/
    └── session1/
        └── ...
```

### Period Grouped
```
aggregated-prompts/
├── 20250628-Dd/  # Daily groups
│   └── sessions...
├── 2025-W26/     # Weekly groups
│   └── sessions...
└── 2025-06M/     # Monthly groups
    └── sessions...
```

## 🤖 MCP Server Integration (v2.0.1+)

### Setup for Claude Desktop

1. Install the package globally:
```bash
npm install -g claude-code-exporter
```

2. Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):
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

3. Restart Claude Desktop and use tools:
- "Use export_conversation to export my project at /path/to/project"
- "Use aggregate_sessions to analyze all my Claude sessions"

## 🔧 Programmatic API

```javascript
const ClaudePromptExporter = require('claude-code-exporter');

// Basic usage
const exporter = new ClaudePromptExporter('/path/to/project');
const result = await exporter.export('./output');

// With options
const exporter = new ClaudePromptExporter('/path/to/project', {
  exportMode: ClaudePromptExporter.ExportMode.FULL_CONVERSATION,
  exportFormat: ClaudePromptExporter.ExportFormat.BOTH,
  aggregate: true,
  period: '7d',
  periodGroup: 'd'
});

// Aggregate multiple projects
const result = await exporter.aggregate('./aggregated-output');
```

## ⚙️ Configuration

### Requirements
- **Node.js**: v14.0.0 or higher
- **Claude Code**: Installed with sessions in standard directories

### Environment
- `CLAUDE_HOME` - Override Claude home directory
- `AGGREGATE_NESTED=true` - Default to nested structure
- `AGGREGATE_BOTH=true` - Process both directories by default

## 🐛 Troubleshooting

### Common Issues

- [ ] **"No Claude sessions found"** → Check project path matches Claude usage
- [ ] **"No sessions with [type] found"** → Try `--full` mode
- [ ] **Multiple directories detected** → Use `--claude-home` to specify
- [ ] **Period validation error** → Ensure period group ≤ period range

### Debug Mode
```bash
claude-prompts --verbose /path/to/project
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/claude-code-exporter)
- [GitHub Repository](https://github.com/developerisnow/claude-code-exporter)
- [Report Issues](https://github.com/developerisnow/claude-code-exporter/issues)

---

Made with ❤️ for the Claude Code community