# Conversation Export Modes Specification

## Overview

This document specifies the implementation of additional export modes for the claude-code-exporter tool, enabling users to export full conversations or assistant outputs only, in addition to the existing user prompts only mode.

## Current State

The tool currently exports only user prompts, filtering out:
- Assistant responses
- System messages
- Tool results
- Command outputs

## Requirements

### Functional Requirements

1. **FR1: Export Modes**
   - Default mode: User prompts only (current behavior)
   - Full mode: Complete conversation with all messages
   - Outputs mode: Assistant outputs only

2. **FR2: CLI Flags**
   - `--full`: Export full conversation
   - `--outputs-only`: Export only assistant outputs
   - Flags are mutually exclusive

3. **FR3: Message Types**
   - User messages (human prompts)
   - Assistant messages (AI responses)
   - System messages (optional in full mode)
   - Tool use/results (optional in full mode)

4. **FR4: Formatting**
   - Clear visual distinction between message types
   - Preserve chronological order
   - Include timestamps for all messages
   - Maintain readability in markdown

### Non-Functional Requirements

1. **NFR1: Backward Compatibility**
   - Default behavior unchanged
   - Existing API compatibility maintained

2. **NFR2: Performance**
   - Minimal impact on processing time
   - Efficient memory usage for large conversations

3. **NFR3: Extensibility**
   - Easy to add new export modes
   - Clean separation of concerns

## Design

### Architecture

```
ExportMode (enum)
├── PROMPTS_ONLY (default)
├── FULL_CONVERSATION
└── OUTPUTS_ONLY

MessageProcessor
├── extractMessages(mode: ExportMode)
├── filterByMode(messages, mode)
└── processMessage(data, mode)

MarkdownFormatter
├── formatMessages(messages, mode)
├── formatUserMessage(message)
├── formatAssistantMessage(message)
└── formatSystemMessage(message)
```

### Implementation Strategy

1. **Single Responsibility**: Each component handles one aspect
   - MessageProcessor: Extract and filter messages
   - MarkdownFormatter: Format messages for output
   - ExportMode: Define export behavior

2. **Open/Closed**: Extensible for new modes without modifying existing code

3. **DRY**: Reuse message processing logic across modes

### Message Identification

```javascript
// Message roles
const MessageRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system'
};

// Export modes
const ExportMode = {
  PROMPTS_ONLY: 'prompts',
  FULL_CONVERSATION: 'full',
  OUTPUTS_ONLY: 'outputs'
};
```

### CLI Options

```bash
# Default (prompts only)
claude-prompts /path/to/project

# Full conversation
claude-prompts --full /path/to/project

# Outputs only
claude-prompts --outputs-only /path/to/project
```

## Output Format

### Full Conversation Mode

```markdown
# Claude Session Export

## Session Information
- **Session ID**: `abc-123`
- **Export Mode**: Full Conversation
- **Total Messages**: 14 (7 user, 7 assistant)
- **Duration**: 2024-06-23 10:00 - 11:30

---

## Conversation

### User
> 2024-06-23 10:00:15

```
Create a REST API with Express.js
```

### Assistant
> 2024-06-23 10:00:18

I'll help you create a REST API with Express.js. Let me set up a basic structure...

```javascript
const express = require('express');
const app = express();
```

---
```

### Outputs Only Mode

```markdown
# Claude Session Export

## Session Information
- **Session ID**: `abc-123`
- **Export Mode**: Assistant Outputs Only
- **Total Outputs**: 7
- **Duration**: 2024-06-23 10:00 - 11:30

---

## Assistant Outputs

### Output 1
> 2024-06-23 10:00:18

I'll help you create a REST API with Express.js. Let me set up a basic structure...

```javascript
const express = require('express');
const app = express();
```

---
```

## Testing Strategy

1. **Unit Tests**
   - Test message filtering for each mode
   - Test format output for each message type
   - Test mode selection logic

2. **Integration Tests**
   - Test full export pipeline for each mode
   - Test CLI flag parsing and validation
   - Test file output generation

3. **Test Cases**
   - Empty conversations
   - Single message conversations
   - Mixed message types
   - Large conversations (performance)

## Implementation Checklist

- [ ] Add ExportMode enum/constants
- [ ] Extend message extraction to capture all message types
- [ ] Implement message filtering by mode
- [ ] Update markdown formatter for different message types
- [ ] Add CLI flags parsing
- [ ] Update help text
- [ ] Add tests for all modes
- [ ] Update documentation
- [ ] Update examples

## Success Criteria

- [ ] Default behavior unchanged
- [ ] Full conversation export works correctly
- [ ] Outputs-only export works correctly
- [ ] Clear visual distinction between message types
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Performance acceptable for large conversations