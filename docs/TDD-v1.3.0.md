# Test-Driven Development Plan - Claude Code Exporter v1.3.0

## Overview

This document outlines the test-driven development approach for implementing v1.3.0 features. Each test should be written before its corresponding implementation, following red-green-refactor cycles.

## Test Categories

### 1. Unit Tests

#### Directory Detection Tests

```javascript
describe('ClaudePromptExporter - Directory Detection', () => {
  // Test: Should detect ~/.claude directory
  // Test: Should detect ~/.config/claude directory  
  // Test: Should return both when both exist
  // Test: Should handle missing directories gracefully
  // Test: Should respect CLAUDE_HOME environment variable
  // Test: Should validate directory contains sessions
});
```

#### Export Mode Tests

```javascript
describe('Export Modes', () => {
  // Test: Should export prompts only (default)
  // Test: Should export outputs only
  // Test: Should export full conversation
  // Test: Should filter system messages in prompts mode
  // Test: Should filter tool results in all modes
  // Test: Should preserve message order in full mode
});
```

#### Format Conversion Tests

```javascript
describe('Export Formats', () => {
  // Test: Should export to Markdown format
  // Test: Should export to JSON format
  // Test: Should export to both formats simultaneously
  // Test: Should preserve code blocks in Markdown
  // Test: Should include metadata in JSON
  // Test: Should handle special characters in all formats
});
```

#### File Naming Tests

```javascript
describe('File Organization', () => {
  // Test: Should generate timestamp-based directories
  // Test: Should create mode-specific filenames
  // Test: Should handle special characters in titles
  // Test: Should truncate long titles appropriately
  // Test: Should maintain backward compatible flat structure
  // Test: Should avoid filename collisions
});
```

#### Statistics Tests

```javascript
describe('Session Statistics', () => {
  // Test: Should count total messages accurately
  // Test: Should separate user and assistant counts
  // Test: Should identify last activity timestamp
  // Test: Should handle empty sessions
  // Test: Should include statistics in exports
});
```

### 2. Integration Tests

#### CLI Integration Tests

```javascript
describe('CLI Integration', () => {
  // Test: Should handle --prompts flag
  // Test: Should handle --outputs flag
  // Test: Should handle --full flag
  // Test: Should handle --json flag
  // Test: Should handle --markdown flag
  // Test: Should handle --all-formats flag
  // Test: Should handle --claude-home flag
  // Test: Should handle combined flags
  // Test: Should show help with --help
  // Test: Should show version with --version
});
```

#### Interactive Mode Tests

```javascript
describe('Interactive Prompts', () => {
  // Test: Should prompt for Claude home when multiple exist
  // Test: Should prompt for export mode when not specified
  // Test: Should prompt for format when not specified
  // Test: Should timeout and use defaults
  // Test: Should handle invalid selections
  // Test: Should remember selections for session
});
```

#### File System Tests

```javascript
describe('File System Operations', () => {
  // Test: Should create directories as needed
  // Test: Should write files with correct permissions
  // Test: Should handle write failures gracefully
  // Test: Should not overwrite without confirmation
  // Test: Should clean up on failure
});
```

### 3. End-to-End Tests

#### Complete Workflow Tests

```javascript
describe('E2E Workflows', () => {
  // Test: Fresh install to first export
  // Test: Export with all combinations of modes/formats
  // Test: Large session export (1000+ messages)
  // Test: Multiple session batch export
  // Test: Cross-platform compatibility
});
```

### 4. Performance Tests

```javascript
describe('Performance Benchmarks', () => {
  // Test: Directory detection < 100ms
  // Test: Export < 1s per 1000 messages
  // Test: Memory usage < 200MB for large sessions
  // Test: No memory leaks during batch operations
});
```

## Test Implementation Plan

### Phase 1: Core Functionality Tests
1. Directory detection unit tests
2. Export mode filtering tests
3. Basic CLI integration tests

### Phase 2: Format and Organization Tests
1. Format conversion tests
2. File naming and organization tests
3. Statistics calculation tests

### Phase 3: Interactive Features Tests
1. Interactive prompt tests
2. Timeout behavior tests
3. Default selection tests

### Phase 4: Integration and E2E Tests
1. Full CLI integration tests
2. Complete workflow tests
3. Cross-platform tests

### Phase 5: Performance and Edge Cases
1. Performance benchmark tests
2. Error handling tests
3. Edge case scenarios

## Test Data Requirements

### Mock Session Data
- Small session (10 messages)
- Medium session (100 messages)
- Large session (1000+ messages)
- Session with code blocks
- Session with special characters
- Session with tool results
- Empty session

### Mock Directory Structures
- Only ~/.claude exists
- Only ~/.config/claude exists
- Both directories exist
- Neither directory exists
- Corrupted session files

## Test Utilities

### Helper Functions
```javascript
// Create mock session data
function createMockSession(messageCount, options = {})

// Setup test directories
function setupTestDirectories(structure)

// Cleanup test artifacts
function cleanupTestFiles()

// Simulate user input
function simulateInteractiveInput(selections)

// Measure performance
function measurePerformance(operation)
```

### Test Fixtures
- Example session JSON files
- Expected output files for comparison
- Directory structure templates
- Configuration examples

## Continuous Integration

### Test Pipeline
1. Lint checks
2. Unit tests
3. Integration tests
4. E2E tests (subset)
5. Performance tests
6. Coverage report

### Coverage Requirements
- Minimum 90% code coverage
- 100% coverage for critical paths
- All error paths tested
- All edge cases covered

## Test Execution Strategy

### Development Phase
- Run relevant unit tests on save
- Run integration tests before commit
- Run full suite before PR

### CI/CD Phase
- Run all tests on every push
- Block merge on test failure
- Generate coverage reports
- Performance regression detection

## Success Criteria

- All tests pass consistently
- No flaky tests
- Performance benchmarks met
- Coverage targets achieved
- Cross-platform validation complete

## Test Maintenance

- Update tests with implementation changes
- Add regression tests for bugs
- Refactor tests for clarity
- Document test patterns
- Regular test suite optimization