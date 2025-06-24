# Product Requirements Document - Claude Code Exporter v1.3.0

## Overview

Claude Code Exporter is a Node.js CLI tool and library for exporting Claude Code conversation sessions to various formats. This PRD defines the requirements for v1.3.0, which introduces multiple export modes, format options, enhanced directory handling, and improved user experience.

## Release Version

**v1.3.0** - Major feature release

## Core Requirements

### 1. Dual Claude Home Directory Support

- [ ] Detect both `~/.claude` and `~/.config/claude` directories
- [ ] When both exist:
  - [ ] Show numbered selection menu
  - [ ] Display default option (prefer `~/.config/claude`)
  - [ ] Allow selection with timeout (default after 10s)
  - [ ] Remember selection for the session
- [ ] Support `CLAUDE_HOME` environment variable override
- [ ] Support `--claude-home` CLI flag override
- [ ] Validate selected directory exists and contains sessions

### 2. Export Mode Selection

- [ ] Implement three export modes:
  - [ ] **Prompts Only** - Export only user messages (default, backward compatible)
  - [ ] **Outputs Only** - Export only assistant responses
  - [ ] **Full Conversation** - Export both prompts and outputs
- [ ] Interactive mode selection when not specified:
  - [ ] Show numbered menu with descriptions
  - [ ] Display default option
  - [ ] Support keyboard selection with timeout
- [ ] CLI flags for direct mode selection:
  - [ ] `--prompts` or `-p` for prompts only
  - [ ] `--outputs` or `-o` for outputs only
  - [ ] `--full` or `-f` for full conversation
- [ ] Maintain backward compatibility (no flag = prompts only)

### 3. Export Format Selection

- [ ] Support multiple export formats:
  - [ ] **Markdown** (.md) - Default format
  - [ ] **JSON** (.json) - Structured data format
  - [ ] **Both** - Export in both formats simultaneously
- [ ] Interactive format selection:
  - [ ] Show after mode selection
  - [ ] Display default option (Markdown)
  - [ ] Support timeout selection
- [ ] CLI flags for format selection:
  - [ ] `--markdown` or `-m` for Markdown only
  - [ ] `--json` or `-j` for JSON only
  - [ ] `--all-formats` for both formats
- [ ] Format-specific features:
  - [ ] Markdown: Preserve formatting, code blocks, lists
  - [ ] JSON: Include metadata, timestamps, message types

### 4. Enhanced File Organization

- [ ] Implement timestamp-based directory structure:
  - [ ] Create subdirectory per session: `YYYYMMDD-HHMMSS-{title}/`
  - [ ] Place all related files in session directory
- [ ] File naming convention:
  - [ ] Pattern: `{mode}-{timestamp}-{title}-{session-id}.{format}`
  - [ ] Mode prefixes: `prompts-`, `outputs-`, `full-`
  - [ ] Example: `prompts-20250623-172748-untitled-2d002199.md`
- [ ] Maintain backward compatibility:
  - [ ] Keep flat file structure for single mode/format exports
  - [ ] Use directories only for multi-format exports
- [ ] Handle special characters in titles:
  - [ ] Replace spaces with hyphens
  - [ ] Remove special characters
  - [ ] Truncate to reasonable length (50 chars)

### 5. Session Statistics

- [ ] Display enhanced session information:
  - [ ] Total message count
  - [ ] User message count
  - [ ] Assistant message count
  - [ ] Last activity timestamp
- [ ] Format: `✓ {session-id}: {total} messages ({user} user, {assistant} assistant) last {timestamp}`
- [ ] Include statistics in exported files:
  - [ ] Session metadata header
  - [ ] Message type breakdown
  - [ ] Export timestamp

### 6. Interactive UI Improvements

- [ ] Implement consistent interactive prompts:
  - [ ] Show current selection
  - [ ] Display default option
  - [ ] Support arrow key navigation
  - [ ] Add timeout with visual countdown
- [ ] Default selection behavior:
  - [ ] Claude home: `~/.config/claude` (if exists)
  - [ ] Export mode: Prompts Only
  - [ ] Format: Markdown
- [ ] Timeout handling:
  - [ ] 10-second timeout for all prompts
  - [ ] Show countdown in prompt
  - [ ] Auto-select default on timeout
- [ ] Error handling:
  - [ ] Clear error messages
  - [ ] Suggest corrective actions
  - [ ] Non-zero exit codes for failures

### 7. CLI Enhancements

- [ ] Add comprehensive help system:
  - [ ] `--help` or `-h` flag
  - [ ] Show all available options
  - [ ] Include usage examples
- [ ] Version information:
  - [ ] `--version` or `-v` flag
  - [ ] Display current version
- [ ] Verbose mode improvements:
  - [ ] Show selected options
  - [ ] Display processing steps
  - [ ] Include timing information
- [ ] Quiet mode:
  - [ ] `--quiet` or `-q` flag
  - [ ] Suppress all output except errors
  - [ ] Useful for scripting

### 8. Programmatic API Enhancements

- [ ] Update `ClaudePromptExporter` class:
  - [ ] Add `exportMode` option
  - [ ] Add `exportFormat` option
  - [ ] Add `claudeHome` option
  - [ ] Support multiple format exports
- [ ] New methods:
  - [ ] `detectClaudeHomes()` - Find available directories
  - [ ] `exportToJSON()` - JSON export functionality
  - [ ] `getSessionStatistics()` - Message counts
- [ ] Maintain backward compatibility:
  - [ ] Keep existing method signatures
  - [ ] Add new parameters as options
  - [ ] Default to current behavior

### 9. Testing Requirements

- [ ] Unit tests for all new features:
  - [ ] Directory detection logic
  - [ ] Mode selection parsing
  - [ ] Format conversion
  - [ ] File naming logic
- [ ] Integration tests:
  - [ ] Multi-directory scenarios
  - [ ] All export mode combinations
  - [ ] Format conversion accuracy
  - [ ] CLI flag combinations
- [ ] Manual testing checklist:
  - [ ] Test on macOS, Linux, Windows
  - [ ] Verify backward compatibility
  - [ ] Check timeout behaviors
  - [ ] Validate file outputs

### 10. Documentation Updates

- [ ] Update README.md:
  - [ ] New usage examples
  - [ ] All CLI options
  - [ ] API documentation
  - [ ] Migration guide
- [ ] Create CHANGELOG.md entry:
  - [ ] List all new features
  - [ ] Breaking changes (if any)
  - [ ] Bug fixes
  - [ ] Upgrade instructions
- [ ] Update package.json:
  - [ ] Bump version to 1.3.0
  - [ ] Update description if needed
  - [ ] Verify dependencies

## Non-Functional Requirements

### Performance

- [ ] Session detection < 100ms
- [ ] Export processing < 1s per 1000 messages
- [ ] Memory usage < 200MB for large sessions
- [ ] Support sessions with 10,000+ messages

### Compatibility

- [ ] Node.js 14.0.0 or higher
- [ ] Cross-platform support (macOS, Linux, Windows)
- [ ] Backward compatibility with v1.2.x
- [ ] Forward compatibility considerations

### Security

- [ ] No storage of sensitive information
- [ ] Respect file system permissions
- [ ] Safe handling of user input
- [ ] No external network requests

### User Experience

- [ ] Intuitive command structure
- [ ] Clear error messages
- [ ] Helpful progress indicators
- [ ] Consistent formatting

## Success Criteria

- [ ] All unit tests pass (100% of new code covered)
- [ ] All integration tests pass
- [ ] Manual testing completed on all platforms
- [ ] Documentation fully updated
- [ ] Zero regression from v1.2.x
- [ ] Performance benchmarks met
- [ ] Published to npm registry
- [ ] GitHub release created with notes

## Future Considerations (v1.4.0+)

- Export to other formats (PDF, HTML)
- Session filtering by date range
- Batch export capabilities
- Cloud storage integration
- Session merging functionality
- Real-time export monitoring