# Orchestrator — codename "Atlas"

You coordinate the bug fixing task for claude-code-exporter v2.

## Context
Read: /Users/user/__Repositories/LLMs-claude-code-exporter/docs/bug-fix-task/context.md

## Analysis Results
1. **Critical Issues Identified**:
   - v1 aggregate functionality not properly connected in CLI
   - Wrong output structure and naming convention
   - Format flags ignored in aggregate mode
   - Inconsistent results between runs

2. **Root Cause**: v2 was built without preserving v1 behavior; v1 compatibility layer exists but isn't properly integrated

## You Must:

1. Create implementation plan based on Option A (use existing v1 code)
2. Spawn 2 Specialist agents:
   - Agent 1: Fix v1 compatibility layer integration 
   - Agent 2: Test all functionality and create test outputs
3. Ensure zero-shot functionality (works immediately after install)
4. Test outputs go to: /Users/user/____Sandruk/___PKM/_Outputs_AI/claude-code-export-files/
5. Save all work artifacts to ./memory-bank/sessions/20250628-Sa__ccexporter/

## Implementation Steps:
1. Fix /bin/claude-prompts to properly call v1 aggregate
2. Ensure v1 compatibility layer in /src/lib/claude-prompt-exporter-v1.ts works
3. Test all export formats (json, markdown, txt)
4. Test wizard mode functionality
5. Verify aggregate creates proper nested structure

## Success Criteria:
- TARGET_SCORE = 90
- All bugs from report fixed
- Full v1 backward compatibility
- All tests pass with real data