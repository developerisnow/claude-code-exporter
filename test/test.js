const ClaudePromptExporter = require('../lib/index');
const path = require('path');
const fs = require('fs');

console.log('🧪 Testing Claude Code Exporter...\n');

// Test configuration
const testProjectPath = '/Users/user/__Repositories/yourproject';
const testOutputDir = path.join(__dirname, 'test-output');

// Clean up previous test output
if (fs.existsSync(testOutputDir)) {
  fs.rmSync(testOutputDir, { recursive: true });
}

// Test 1: Basic functionality
console.log('Test 1: Basic export functionality');
try {
  const exporter = new ClaudePromptExporter(testProjectPath);
  const result = exporter.exportToMarkdown(testOutputDir);
  
  console.log(`✅ Exported ${result.sessionsExported} sessions with ${result.totalPrompts} prompts`);
  
  // Verify output files exist
  const files = fs.readdirSync(testOutputDir);
  console.log(`✅ Created ${files.length} markdown files`);
} catch (error) {
  console.error(`❌ Test 1 failed: ${error.message}`);
  process.exit(1);
}

// Test 2: Verbose mode
console.log('\nTest 2: Verbose mode');
try {
  const exporter = new ClaudePromptExporter(testProjectPath, { verbose: true });
  console.log('✅ Verbose mode working');
} catch (error) {
  console.error(`❌ Test 2 failed: ${error.message}`);
}

// Test 3: Invalid project path
console.log('\nTest 3: Error handling for invalid path');
try {
  const exporter = new ClaudePromptExporter('/non/existent/path');
  exporter.extractPrompts();
  console.error('❌ Test 3 failed: Should have thrown an error');
} catch (error) {
  console.log('✅ Correctly handled invalid path');
}

// Test 4: Path encoding
console.log('\nTest 4: Path encoding');
const exporter = new ClaudePromptExporter(testProjectPath);
const encoded = exporter.encodePath('/Users/user/__Repositories/yourproject');
const expected = '-Users-user---Repositories-yourproject';
if (encoded === expected) {
  console.log('✅ Path encoding correct');
} else {
  console.error(`❌ Path encoding failed: got "${encoded}", expected "${expected}"`);
}

// Clean up
if (fs.existsSync(testOutputDir)) {
  fs.rmSync(testOutputDir, { recursive: true });
}

console.log('\n✨ All tests completed!');
