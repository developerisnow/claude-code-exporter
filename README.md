# Claude Code Exporter

[![npm version](https://img.shields.io/npm/v/claude-code-exporter.svg)](https://www.npmjs.com/package/claude-code-exporter)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/claude-code-exporter.svg)](https://nodejs.org)

Export Claude Code conversations to markdown or JSON with flexible modes and formats.

## 🚀 Features

- **Multiple Export Modes**: Extract user prompts, assistant outputs, or full conversations
- **Multiple Formats**: Export to Markdown, JSON, or both simultaneously
- **Dual Directory Support**: Automatically handles both `~/.claude` and `~/.config/claude`
- **Interactive Mode**: User-friendly prompts with smart defaults and timeouts
- **Enhanced Statistics**: Message counts, timestamps, and session metadata
- **Smart Organization**: Timestamp-based directories for multi-format exports
- **Flexible CLI**: Rich command-line options with shortcuts
- **Programmatic API**: Full-featured library for Node.js integration
- **Cross-Platform**: Works on macOS, Linux, and Windows

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Command Line Interface](#command-line-interface)
  - [Interactive Mode](#interactive-mode)
  - [Programmatic API](#programmatic-api)
- [Export Modes](#export-modes)
- [Export Formats](#export-formats)
- [Output Examples](#output-examples)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🔧 Installation

### Global Installation (Recommended)

```bash
npm install -g claude-code-exporter
```

### Local Installation

```bash
npm install claude-code-exporter
```

### Using npx (No Installation)

```bash
npx claude-code-exporter /path/to/project
```

## 🎯 Quick Start

Export with interactive prompts:

```bash
claude-prompts
```

Export full conversations:

```bash
claude-prompts --full /path/to/project
```

Export to JSON format:

```bash
claude-prompts --json /path/to/project
```

Export everything (all modes and formats):

```bash
claude-prompts --full --all-formats /path/to/project
```

## 📖 Usage

### Command Line Interface

```bash
claude-prompts [options] [project-path] [output-dir]
```

#### Arguments

- `project-path` - Path to your project (default: current directory)
- `output-dir` - Output directory for exported files (default: `./claude-prompts`)

#### Options

##### Basic Options
- `-h, --help` - Show help message
- `-v, --version` - Show version number
- `-V, --verbose` - Enable verbose output for debugging
- `-q, --quiet` - Suppress all output except errors
- `--list` - List available sessions without exporting

##### Export Modes
- `-p, --prompts` - Export user prompts only (default)
- `-o, --outputs` - Export assistant outputs only
- `-f, --full` - Export full conversations

##### Export Formats
- `-m, --markdown` - Export as Markdown (default)
- `-j, --json` - Export as JSON
- `--all-formats` - Export in both Markdown and JSON

##### Other Options
- `--no-interactive` - Disable interactive prompts, use defaults
- `--claude-home DIR` - Specify Claude home directory
- `--timeout SECONDS` - Timeout for interactive prompts (default: 10)

#### Examples

```bash
# Interactive mode (prompts for all options)
claude-prompts

# Export user prompts (default)
claude-prompts /path/to/project

# Export full conversations
claude-prompts --full /path/to/project

# Export only assistant outputs as JSON
claude-prompts --outputs --json /path/to/project

# Export everything in both formats
claude-prompts --full --all-formats /path/to/project ./exports

# List sessions without exporting
claude-prompts --list /path/to/project

# Non-interactive with specific Claude home
claude-prompts --no-interactive --claude-home ~/.config/claude /path/to/project

# Quiet mode for scripts
claude-prompts --quiet --full /path/to/project
```

### Interactive Mode

When run without mode or format flags, the tool enters interactive mode:

```
Choose a mode:
1) Prompts Only
2) Outputs Only
3) Full Conversation
Defaulting to: 1) Prompts Only
What do you want to export? [1-3]: _

Choose a format:
1) Markdown
2) JSON
3) Both: Markdown and JSON
Defaulting to: 1) Markdown
What format do you want? [1-3]: _
```

Interactive features:
- Smart defaults (Prompts Only, Markdown)
- 10-second timeout (auto-selects default)
- Multiple Claude home directory handling
- Clear visual feedback

### Programmatic API

```javascript
const ClaudePromptExporter = require('claude-code-exporter');

// Basic usage
const exporter = new ClaudePromptExporter('/path/to/project');
const result = await exporter.export('./output');

// Advanced usage with all options
const exporter = new ClaudePromptExporter('/path/to/project', {
  exportMode: ClaudePromptExporter.ExportMode.FULL_CONVERSATION,
  exportFormat: ClaudePromptExporter.ExportFormat.BOTH,
  verbose: true,
  interactive: false,
  timeout: 5000,
  claudeHome: '/custom/claude/home'
});

// Export with specific mode/format
const result = await exporter.export('./output');
console.log(`Exported ${result.sessionsExported} sessions`);
console.log(`Total messages: ${result.totalMessages}`);
console.log(`User messages: ${result.totalUserMessages}`);
console.log(`Assistant messages: ${result.totalAssistantMessages}`);

// Or use specific methods
const sessions = exporter.extractMessages();
const homes = exporter._detectClaudeHomes();
```

## 📊 Export Modes

### Prompts Only (Default)
Exports only user messages, filtering out:
- System messages
- Tool results
- Assistant responses

Best for: Creating prompt libraries, analyzing your questions

### Outputs Only
Exports only assistant responses, excluding:
- User prompts
- System messages
- Tool results

Best for: Collecting code examples, building documentation

### Full Conversation
Exports complete conversations including:
- User prompts
- Assistant responses
- Context and flow

Best for: Documentation, learning from interactions, debugging

## 📄 Export Formats

### Markdown Format
Human-readable format with:
- Session metadata
- Formatted timestamps
- Syntax highlighting for code
- Clear message separation

### JSON Format
Structured data including:
- Complete metadata
- Message arrays with roles
- Timestamps and indices
- Statistics object

### Both Formats
When exporting both formats:
- Creates timestamp-based directories
- Organizes files by session
- Maintains consistent naming

## 📁 Output Examples

### Single Format Output
```
claude-prompts/
├── 2d002199-ca50-464e-ab59-d2165df9e248-untitled-prompts.md
├── 33c13f1c-928d-4128-86a2-28b241f47949-react-hooks-full.md
└── 73d2983f-16f9-4267-9611-3b55f790562e-api-design-outputs.json
```

### Multi-Format Output (--all-formats)
```
claude-prompts/
├── 20250623-143022-react-hooks/
│   ├── prompts-20250623-143022-react-hooks-33c13f1c.md
│   ├── prompts-20250623-143022-react-hooks-33c13f1c.json
└── 20250623-143156-api-design/
    ├── full-20250623-143156-api-design-73d2983f.md
    └── full-20250623-143156-api-design-73d2983f.json
```

### Statistics Output
```
✓ 2d002199-ca50-464e-ab59-d2165df9e248: 143 messages (56 user, 87 assistant) last 6/23/2025, 5:27:48 PM
✓ 33c13f1c-928d-4128-86a2-28b241f47949: 177 messages (89 user, 88 assistant) last 6/23/2025, 6:45:12 PM
✓ 73d2983f-16f9-4267-9611-3b55f790562e: 235 messages (112 user, 123 assistant) last 6/24/2025, 9:15:33 AM

Exported 3 sessions (555 total messages) to ./claude-prompts/
```

## ⚙️ Configuration

### Requirements

- **Node.js**: Version 14.0.0 or higher
- **Claude Code**: Must be installed with sessions stored in:
  - `~/.claude/projects/` (original location)
  - `~/.config/claude/projects/` (XDG Base Directory compliant)
- **Operating System**: macOS, Linux, or Windows

### Environment Variables

- `CLAUDE_HOME` - Override the Claude home directory location
- `HOME` (macOS/Linux) or `USERPROFILE` (Windows) - Used to locate the Claude home directory

### Directory Priority

1. `--claude-home` CLI option (highest priority)
2. `CLAUDE_HOME` environment variable
3. Interactive selection (when both directories exist)
4. Automatic detection (when one directory exists)
5. Error (when no directory found)

## 🔧 Troubleshooting

### Multiple Claude Directories

When both `~/.claude` and `~/.config/claude` exist:
- Interactive mode: Prompts for selection with smart default
- Non-interactive mode: Uses `~/.config/claude` (newer standard)
- Override: Use `--claude-home` or `CLAUDE_HOME` environment variable

### Common Issues

#### "No Claude sessions found"
- Verify project path matches Claude Code usage
- Check sessions exist in Claude directories
- Use `--verbose` for detailed path matching info

#### "No sessions with [type] found"
- Some sessions may not contain the requested message type
- Try `--full` to see all messages
- Use `--list` to preview session contents

### Debug Mode

```bash
# Verbose output for troubleshooting
claude-prompts --verbose /path/to/project

# List sessions with details
claude-prompts --list --verbose /path/to/project
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/developerisnow/claude-code-exporter.git
cd claude-code-exporter

# Install dependencies
npm install

# Run tests
npm test

# Test CLI locally
./bin/claude-prompts /path/to/test/project
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the Claude Code community
- Inspired by the need to document AI-assisted development
- Thanks to all contributors and users

## 📚 Resources

- [Claude Code Documentation](https://claude.ai/docs)
- [Report Issues](https://github.com/developerisnow/claude-code-exporter/issues)
- [NPM Package](https://www.npmjs.com/package/claude-code-exporter)

---

Made with ❤️ for developers