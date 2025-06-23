# Dual Claude Home Directory Support Specification

## Overview

This document specifies the implementation of dual Claude home directory support for the claude-code-exporter tool. The feature will enable the tool to work with both `~/.claude` and `~/.config/claude` directories, with user selection when both exist.

## Problem Statement

Currently, the tool only supports the `~/.claude` directory. However, Claude may store data in different locations depending on the version or installation method:
- Legacy/original location: `~/.claude`
- XDG Base Directory compliant location: `~/.config/claude`

Users may have data in either or both locations, particularly after upgrades.

## Requirements

### Functional Requirements

1. **FR1: Directory Detection**
   - The tool MUST detect if `~/.claude/projects` exists
   - The tool MUST detect if `~/.config/claude/projects` exists
   - Detection MUST be performed on each run

2. **FR2: User Selection**
   - When both directories exist, the tool MUST prompt the user to select which one to use
   - The prompt MUST clearly show both paths
   - The selection MUST be made via interactive CLI prompt

3. **FR3: Automatic Selection**
   - When only one directory exists, the tool MUST use it automatically
   - When neither directory exists, the tool MUST provide a clear error message

4. **FR4: Override Mechanisms**
   - Support `--claude-home` CLI option to explicitly specify the base directory
   - Support `CLAUDE_HOME` environment variable for non-interactive usage
   - CLI option MUST take precedence over environment variable

### Non-Functional Requirements

1. **NFR1: Backward Compatibility**
   - Existing usage patterns MUST continue to work without modification
   - Default behavior when only `~/.claude` exists MUST remain unchanged

2. **NFR2: Performance**
   - Directory detection MUST not significantly impact startup time
   - File system checks MUST be minimal and efficient

3. **NFR3: User Experience**
   - Prompts MUST be clear and concise
   - Error messages MUST be helpful and actionable

## Design

### Priority Order for Claude Home Resolution

1. `--claude-home` CLI option (highest priority)
2. `CLAUDE_HOME` environment variable
3. Interactive prompt when both directories exist
4. Automatic selection when only one exists
5. Error when none exist

### Code Architecture

```
ClaudePromptExporter
├── constructor(options)
│   └── this.claudeHome = this._resolveClaudeHome(options)
├── _resolveClaudeHome(options)
│   ├── Check CLI option (options.claudeHome)
│   ├── Check environment variable (process.env.CLAUDE_HOME)
│   ├── Detect available directories
│   └── Prompt user if needed
├── _detectClaudeHomes()
│   └── Returns array of existing Claude home paths
└── _promptForClaudeHome(availableHomes)
    └── Interactive CLI prompt for selection
```

### Implementation Checklist

- [ ] Add `_detectClaudeHomes()` method to check both directories
- [ ] Add `_promptForClaudeHome()` method for interactive selection
- [ ] Refactor constructor to use `_resolveClaudeHome()`
- [ ] Add readline-sync dependency for interactive prompts
- [ ] Update CLI to support `--claude-home` option
- [ ] Add environment variable support
- [ ] Update error messages for missing directories
- [ ] Add validation for custom Claude home paths
- [ ] Update tests for all scenarios
- [ ] Update documentation

## Implementation Details

### Directory Detection Logic

```javascript
_detectClaudeHomes() {
  const homes = [];
  const candidates = [
    path.join(os.homedir(), '.claude'),
    path.join(os.homedir(), '.config', 'claude')
  ];
  
  for (const candidate of candidates) {
    const projectsPath = path.join(candidate, 'projects');
    if (fs.existsSync(projectsPath)) {
      homes.push(candidate);
    }
  }
  
  return homes;
}
```

### User Prompt Interface

```
Multiple Claude home directories found:
1) /Users/username/.claude
2) /Users/username/.config/claude

Which would you like to use? [1-2]:
```

### CLI Options

```bash
# Use specific Claude home
claude-prompts --claude-home ~/.config/claude

# Use environment variable
CLAUDE_HOME=~/.config/claude claude-prompts

# Interactive selection (when both exist)
claude-prompts
```

## Testing Strategy

1. **Unit Tests**
   - Test `_detectClaudeHomes()` with mocked file system
   - Test `_resolveClaudeHome()` with various option combinations
   - Test priority order of resolution methods

2. **Integration Tests**
   - Test with only `~/.claude` existing
   - Test with only `~/.config/claude` existing
   - Test with both directories existing
   - Test with neither directory existing
   - Test CLI option override
   - Test environment variable override

3. **Manual Testing Checklist**
   - [ ] Fresh install with no Claude directories
   - [ ] Upgrade scenario with data in both locations
   - [ ] CLI option functionality
   - [ ] Environment variable functionality
   - [ ] Interactive prompt behavior

## Migration Notes

No data migration is required. Users can:
1. Continue using their existing Claude home directory
2. Manually select their preferred directory when both exist
3. Set `CLAUDE_HOME` environment variable for consistent behavior

## Security Considerations

- Path validation MUST prevent directory traversal attacks
- User-provided paths MUST be normalized and validated
- File system permissions MUST be respected

## Future Enhancements

1. Remember user's choice for future runs (config file)
2. Support for merging data from both directories
3. Migration tool to consolidate data into one location

## Success Criteria

- [ ] Tool works with `~/.claude` when it's the only directory
- [ ] Tool works with `~/.config/claude` when it's the only directory
- [ ] Tool prompts user when both directories exist
- [ ] `--claude-home` option overrides detection
- [ ] `CLAUDE_HOME` environment variable works
- [ ] All existing functionality remains intact
- [ ] Clear error messages for missing directories
- [ ] All tests pass
- [ ] Documentation is updated