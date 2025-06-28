# Aggregate Functionality Analysis

## Current State

The v1 compatibility layer has a full aggregate implementation that:
1. Scans all projects in Claude home directory
2. Reads all sessions from each project
3. Exports aggregated data per project

## Key Issues Found

### 1. Output Structure Mismatch
**Current v1 behavior**: Creates flat files like:
- `aggregated-20241228-183000-ProjectName.md`
- `aggregated-20241228-183000-ProjectName.txt`
- `aggregated-20241228-183000.json` (single file for all projects)

**Expected behavior per bug report**: Nested directory structure:
```
ProjectName/
├── session1/
│   ├── prompt-20241228-183000-title-id.md
│   └── ...
└── session2/
    ├── prompt-20241228-183100-title-id.md
    └── ...
```

### 2. Format Flag Handling
The aggregate method DOES respect format flags:
- `--txt` → calls exportAggregatedTXT
- `--json` → calls exportAggregatedJSON  
- `--markdown` (default) → calls exportAggregatedMarkdown

But the bug report says it always outputs markdown, suggesting the CLI might not be passing the format option correctly.

### 3. Directory Selection
The v1 code only allows selecting one Claude home directory, not both as requested in the bug report.

## Root Cause
The v1 aggregate was designed to create summary files (all prompts from a project in one file), not individual prompt files in a nested structure. This is a fundamental design difference, not a bug in the implementation.