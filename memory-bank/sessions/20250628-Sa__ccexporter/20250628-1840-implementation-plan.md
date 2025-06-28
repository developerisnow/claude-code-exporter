# Implementation Plan for Bug Fixes

## Analysis Summary

After testing, I found that:
1. The aggregate format flags (--txt, --json, --markdown) ARE working correctly
2. The real issue is the OUTPUT STRUCTURE doesn't match user expectations

## User Expectations vs Current Behavior

### Current v1 Aggregate Behavior:
- Creates one file per project containing ALL prompts from ALL sessions
- Filename: `aggregated-{timestamp}-{ProjectName}.{ext}`
- Structure: Single file with all prompts aggregated

### Expected Behavior (from bug report):
- Creates nested directory structure: `ProjectName/SessionName/`
- Individual files per prompt or session
- Filename format: `{type}-{timestamp}-{title}-{id}.{ext}`

## Root Cause
The v1 aggregate was designed as a "summary" feature (all prompts in one file per project), but the user expects it to work like the regular export feature (individual files in nested directories).

## Solution Options

### Option 1: Enhance v1 Aggregate (Recommended)
Add a new flag `--aggregate-structure` with options:
- `flat` (default, current behavior): One file per project
- `nested`: Create project/session/file structure

### Option 2: Fix Regular Export
The user might actually want the regular export functionality but for ALL projects, not just one.

## Implementation Tasks

1. **Fix "Both Directories" Option**
   - Modify _resolveClaudeHome to allow selecting both directories
   - Process projects from both locations

2. **Add Nested Structure Support**
   - Modify aggregate methods to support nested output
   - Use same naming convention as regular export

3. **Fix Inconsistent Results**
   - Ensure deterministic project scanning
   - Sort projects and sessions consistently

4. **Add Missing Wizard Mode**
   - Implement interactive prompts for aggregate mode
   - Allow selecting specific projects to aggregate