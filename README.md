# Claude Code Exporter

[![npm version](https://img.shields.io/npm/v/claude-code-exporter.svg)](https://www.npmjs.com/package/claude-code-exporter)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/claude-code-exporter.svg)](https://nodejs.org)

Export your Claude Code session prompts to markdown files for documentation, analysis, and archival purposes.

## 🚀 Features

- **Extract User Prompts**: Automatically extracts all user prompts from Claude Code sessions
- **Markdown Export**: Generates clean, readable markdown files for each session
- **Smart Filtering**: Excludes system-generated messages and command outputs
- **Flexible Path Detection**: Automatically finds Claude sessions for your projects
- **CLI & API**: Use as a command-line tool or integrate into your Node.js applications
- **Cross-Platform**: Works on macOS, Linux, and Windows

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Command Line Interface](#command-line-interface)
  - [Programmatic API](#programmatic-api)
- [Output Format](#output-format)
- [Examples](#examples)
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

Export prompts from your current project:

```bash
claude-prompts
```

Export prompts from a specific project:

```bash
claude-prompts /path/to/your/project
```

## 📖 Usage

### Command Line Interface

```bash
claude-prompts [options] [project-path] [output-dir]
```

#### Arguments

- `project-path` - Path to your project (default: current directory)
- `output-dir` - Output directory for markdown files (default: `./claude-prompts`)

#### Options

- `-h, --help` - Show help message
- `-v, --version` - Show version number
- `-V, --verbose` - Enable verbose output for debugging
- `--list` - List available sessions without exporting

#### Examples

```bash
# Export from current directory
claude-prompts

# Export from specific project
claude-prompts /Users/username/my-project

# Export to custom directory
claude-prompts /Users/username/my-project ./my-exports

# List sessions without exporting
claude-prompts --list /Users/username/my-project

# Enable verbose mode for debugging
claude-prompts -V /Users/username/my-project
```

### Programmatic API

```javascript
const ClaudePromptExporter = require('claude-code-exporter');

// Create exporter instance
const exporter = new ClaudePromptExporter('/path/to/project', {
  verbose: true  // Optional: enable debug output
});

// Export to markdown files
const result = exporter.exportToMarkdown('./output-directory');
console.log(`Exported ${result.sessionsExported} sessions`);

// Or just extract prompts without exporting
const sessions = exporter.extractPrompts();
sessions.forEach(({ sessionId, prompts }) => {
  console.log(`Session ${sessionId}: ${prompts.length} prompts`);
});
```

## 📄 Output Format

Each exported markdown file follows this structure:

```markdown
# Claude Code Session Export

## Session Information

- **Session ID**: `2ead3268-3c7c-48ab-b46b-8b7a706d097c`
- **Total Prompts**: 7
- **First Prompt**: 12/25/2024, 10:30:45 AM
- **Last Prompt**: 12/25/2024, 11:45:23 AM
- **Project Path**: `/Users/username/my-project`

---

## Prompt 1

> 12/25/2024, 10:30:45 AM

```
Create a REST API with Express.js for a todo application
```

---

## Prompt 2

> 12/25/2024, 10:35:12 AM

```
Add authentication using JWT tokens
```
```

### File Naming Convention

Files are named using the pattern: `{session-id}-{title}.md`

- `session-id`: Unique identifier for the Claude session
- `title`: Generated from the first few words of the initial prompt

Example: `2ead3268-3c7c-48ab-b46b-8b7a706d097c-create-rest-api-with.md`

## 🔍 Examples

### Example 1: Documenting Project Development

Export all prompts from your project development:

```bash
claude-prompts ~/projects/my-app ./documentation/claude-sessions
```

### Example 2: Creating a Learning Archive

Archive your Claude Code learning sessions:

```bash
claude-prompts ~/learning/javascript ./learning-archive
```

### Example 3: Batch Processing Multiple Projects

```javascript
const ClaudePromptExporter = require('claude-code-exporter');
const projects = [
  '/Users/me/project1',
  '/Users/me/project2',
  '/Users/me/project3'
];

projects.forEach(projectPath => {
  try {
    const exporter = new ClaudePromptExporter(projectPath);
    const outputDir = `./exports/${path.basename(projectPath)}`;
    exporter.exportToMarkdown(outputDir);
  } catch (error) {
    console.error(`Failed to export ${projectPath}: ${error.message}`);
  }
});
```

## ⚙️ Configuration

### Requirements

- **Node.js**: Version 14.0.0 or higher
- **Claude Code**: Must be installed with sessions stored in `~/.claude/projects/`
- **Operating System**: macOS, Linux, or Windows

### Environment Variables

The exporter uses standard environment variables:

- `HOME` (macOS/Linux) or `USERPROFILE` (Windows) - Used to locate the Claude home directory

## 🔧 Troubleshooting

### Common Issues

#### "No Claude sessions found for project"

**Cause**: The project path doesn't match any Claude Code sessions.

**Solution**:
1. Verify the project path is correct
2. Ensure you have Claude Code sessions for this project
3. Check that sessions exist in `~/.claude/projects/`
4. Use `--verbose` flag for detailed debugging output

#### "Claude home directory not found"

**Cause**: Claude Code is not installed or not in the expected location.

**Solution**:
1. Install Claude Code from [claude.ai](https://claude.ai)
2. Verify `~/.claude/` directory exists
3. Check environment variables `HOME` or `USERPROFILE`

#### Empty or Missing Prompts

**Cause**: Sessions may contain only system messages or commands.

**Solution**:
1. The exporter automatically filters system-generated content
2. Verify your sessions contain actual user prompts
3. Use `--list` to preview available sessions

### Debug Mode

Enable verbose output for troubleshooting:

```bash
claude-prompts --verbose /path/to/project
```

This will show:
- Path encoding details
- Session discovery process
- Message filtering information
- Processing statistics

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
git clone https://github.com/yourusername/claude-code-exporter.git
cd claude-code-exporter

# Install dependencies
npm install

# Run tests
npm test

# Test CLI locally
./bin/claude-prompts /path/to/test/project
```

### Code Style

- Use 2 spaces for indentation
- Follow Node.js best practices
- Add JSDoc comments for public methods
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the Claude Code community
- Inspired by the need to document AI-assisted development
- Thanks to all contributors and users

## 📚 Resources

- [Claude Code Documentation](https://claude.ai/docs)
- [Report Issues](https://github.com/yourusername/claude-code-exporter/issues)
- [NPM Package](https://www.npmjs.com/package/claude-code-exporter)

---

Made with ❤️ for developers using Claude Code
