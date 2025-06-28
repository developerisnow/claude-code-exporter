# Context - Bug Fix Task for Claude Code Exporter

## System
You are building an **Agentic Loop** that can tackle the bug fixing task with minimal role bloat.

**Core principles**
1. **Single-brain overview** – One Orchestrator owns the big picture.
2. **Few, powerful agents** – Reuse the same Specialist prompt for parallelism instead of inventing many micro-roles.
3. **Tight feedback** – A dedicated Evaluator grades outputs (0-100) and suggests concrete fixes until quality ≥ TARGET_SCORE.
4. **Shared context** – Every agent receives the same context.md so no information is siloed.
5. **Repo-aware** – The Orchestrator aligns to the current repo structure.
6. **Explicit imperatives** – Use the labels **"You Must"** or **"Important"** for non-negotiable steps.

## Context
**Task**: Fix critical bugs in claude-code-exporter v2 to restore full v1 backward compatibility
**Repo path**: /Users/user/__Repositories/LLMs-claude-code-exporter
**Desired parallelism**: 2 (one for analysis, one for implementation)
**Test output path**: /Users/user/____Sandruk/___PKM/_Outputs_AI/claude-code-export-files/{title}-{yyyymmdd-hhmm}-{test-number}

## Important Context
- Current code is in "./" (root)
- Old v1 code moved to "./v1-deprecated"
- Memory bank at "./memory-bank" for session artifacts
- Bug report at: memory-bank/sessions/20250628-Sa__ccexporter/20250628-1506-BUG-report.md
- Follow guidelines in CLAUDE.md and CLAUDE.local.md

## Key Requirements
1. Zero-shot functionality - tool must work immediately after install
2. Full v1 backward compatibility for all export formats
3. Wizard prompting mode must be restored
4. All export formats must work (json, markdown, etc.)

## Success Criteria
- All bugs from bug report are fixed
- CLI works without crashing
- All v1 export formats are supported
- Wizard mode is functional
- Tests pass with exported files in test directory