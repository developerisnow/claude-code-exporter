# Bug Fixes Summary

## Issues Fixed

### 1. Nested Aggregate Structure ✅
**Issue**: Aggregate created flat files instead of nested project/session/file structure
**Fix**: Added `--nested` flag that creates the expected directory structure
**Usage**: `claude-prompts . --aggregate --nested --txt`
**Result**: Creates `project/session/prompt-timestamp-title-number.ext` structure

### 2. Both Directories Support ✅
**Issue**: Could only select one Claude directory, not both
**Fix**: Added `--both-dirs` flag that processes both ~/.claude and ~/.config/claude
**Usage**: `claude-prompts . --aggregate --both-dirs`
**Result**: Aggregates from both directories (may have duplicates if same projects exist in both)

### 3. Format Flags Working ✅
**Issue**: User reported aggregate always outputs markdown
**Fix**: Tested and confirmed format flags ARE working correctly
- `--txt` creates .txt files
- `--json` creates .json files
- `--markdown` creates .md files (default)

### 4. Wizard Mode Already Exists ✅
**Issue**: Missing wizard prompting mode
**Status**: Already implemented - interactive mode is enabled by default when no flags provided
**Note**: Requires TTY environment (doesn't work in CI/CD or piped environments)

## How to Use the Fixed Features

### Regular Aggregate (One file per project)
```bash
# Markdown format (default)
claude-prompts . --aggregate --no-interactive

# TXT format
claude-prompts . --aggregate --txt --no-interactive

# JSON format
claude-prompts . --aggregate --json --no-interactive
```

### Nested Aggregate (Individual files in directories)
```bash
# Nested structure with TXT files
claude-prompts . --aggregate --nested --txt --no-interactive

# Nested structure with all formats
claude-prompts . --aggregate --nested --both --no-interactive

# Process both Claude directories
claude-prompts . --aggregate --nested --both-dirs --no-interactive
```

### Interactive/Wizard Mode
```bash
# Just run without flags for wizard mode
claude-prompts .

# Or explicitly enable interactive
claude-prompts . -i
```

## Technical Implementation

1. **Nested Structure**: Added `aggregateNested()` method that creates individual prompt files
2. **Both Directories**: Modified aggregate to detect and process multiple Claude homes
3. **Environment Variables**: 
   - `AGGREGATE_NESTED=true` enables nested structure
   - `AGGREGATE_BOTH=true` processes both directories

## Remaining Considerations

1. **Duplicate Detection**: When using `--both-dirs`, the same project may appear from both directories
2. **TTY Requirement**: Interactive mode requires a TTY environment
3. **Performance**: Nested structure creates many small files which may be slower on some filesystems