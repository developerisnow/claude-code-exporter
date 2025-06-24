# Product Requirements Document - Claude Code Exporter v1.3.0

## Overview

Claude Code Exporter is a Node.js CLI tool and library for exporting Claude Code conversation sessions to various formats. This PRD defines the requirements for v1.3.0, which introduces multiple export modes, format options, enhanced directory handling, and improved user experience.

## Release Version

**v1.3.0** - Major feature release

## Core Requirements

### 1. Dual Claude Home Directory Support

- [x] Detect both `~/.claude` and `~/.config/claude` directories
- [ ] When both exist:
  - [x] Show numbered selection menu
  - [x] Display default option (prefer `~/.config/claude`)
  - [-] Allow selection with timeout (default after 10s) - timeout not working
  - [-] Remember selection for the session - not implemented
- [x] Support `CLAUDE_HOME` environment variable override
- [x] Support `--claude-home` CLI flag override
- [x] Validate selected directory exists and contains sessions

### 2. Export Mode Selection

- [x] Implement three export modes:
  - [x] **Prompts Only** - Export only user messages (default, backward compatible)
  - [x] **Outputs Only** - Export only assistant responses
  - [x] **Full Conversation** - Export both prompts and outputs
- [/] Interactive mode selection when not specified:
  - [x] Show numbered menu with descriptions
  - [x] Display default option
  - [-] Support keyboard selection with timeout - timeout not working
- [x] CLI flags for direct mode selection:
  - [x] `--prompts` or `-p` for prompts only
  - [x] `--outputs` or `-o` for outputs only
  - [x] `--full` or `-f` for full conversation
- [x] Maintain backward compatibility (no flag = prompts only)

### 3. Export Format Selection

- [x] Support multiple export formats:
  - [x] **Markdown** (.md) - Default format
  - [x] **JSON** (.json) - Structured data format
  - [x] **Both** - Export in both formats simultaneously
- [/] Interactive format selection:
  - [x] Show after mode selection
  - [x] Display default option (Markdown)
  - [-] Support timeout selection - not possible with readline-sync
- [x] CLI flags for format selection:
  - [x] `--markdown` or `-m` for Markdown only
  - [x] `--json` or `-j` for JSON only
  - [x] `--all-formats` for both formats
- [x] Format-specific features:
  - [x] Markdown: Preserve formatting, code blocks, lists
  - [x] JSON: Include metadata, timestamps, message types

### 4. Enhanced File Organization

- [x] Implement timestamp-based directory structure:
  - [x] Create subdirectory per session: `YYYYMMDD-HHMMSS-{title}/`
  - [x] Place all related files in session directory
- [/] File naming convention:
  - [x] Pattern: `{mode}-{timestamp}-{title}-{session-id}.{format}`
  - [/] Mode prefixes: `prompts-`, `outputs-`, `full-output-` (not `full-`)
  - [x] Example: `prompts-20250623-172748-untitled-2d002199.md`
- [x] Maintain backward compatibility:
  - [x] Keep flat file structure for single mode/format exports
  - [x] Use directories only for multi-format exports
- [x] Handle special characters in titles:
  - [x] Replace spaces with hyphens
  - [x] Remove special characters
  - [x] Truncate to reasonable length (50 chars)

### 5. Session Statistics

- [x] Display enhanced session information:
  - [x] Total message count
  - [x] User message count
  - [x] Assistant message count
  - [x] Last activity timestamp
- [x] Format: `✓ {session-id}: {total} messages ({user} user, {assistant} assistant) last {timestamp}`
- [x] Include statistics in exported files:
  - [x] Session metadata header
  - [x] Message type breakdown
  - [x] Export timestamp

### 6. Interactive UI Improvements

- [/] Implement consistent interactive prompts:
  - [-] Show current selection - not implemented
  - [x] Display default option
  - [-] Support arrow key navigation - not possible with readline-sync
  - [-] Add timeout with visual countdown - not possible with readline-sync
- [x] Default selection behavior:
  - [x] Claude home: `~/.config/claude` (if exists)
  - [x] Export mode: Prompts Only
  - [x] Format: Markdown
- [-] Timeout handling:
  - [-] 10-second timeout for all prompts - not possible with readline-sync
  - [-] Show countdown in prompt - not possible with readline-sync
  - [-] Auto-select default on timeout - not possible with readline-sync
- [x] Error handling:
  - [x] Clear error messages
  - [x] Suggest corrective actions
  - [x] Non-zero exit codes for failures

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