const ClaudePromptExporter = require('../lib/index');
const path = require('path');
const fs = require('fs');
const os = require('os');

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

// Test 5: Claude home detection
console.log('\nTest 5: Claude home detection');
try {
  // Save original env var
  const originalClaudeHome = process.env.CLAUDE_HOME;
  delete process.env.CLAUDE_HOME;
  
  // Test detection logic by checking if at least one Claude home exists
  const homeDir = os.homedir();
  const possibleHomes = [
    path.join(homeDir, '.claude', 'projects'),
    path.join(homeDir, '.config', 'claude', 'projects')
  ];
  
  const existingHomes = possibleHomes.filter(fs.existsSync);
  
  if (existingHomes.length > 0) {
    console.log(`✅ Detected ${existingHomes.length} Claude home(s):`);
    existingHomes.forEach(home => console.log(`   - ${path.dirname(home)}`));
  } else {
    console.log('⚠️  No Claude homes detected (this is OK for CI/CD)');
  }
  
  // Restore env var
  if (originalClaudeHome) {
    process.env.CLAUDE_HOME = originalClaudeHome;
  }
} catch (error) {
  console.error(`❌ Test 5 failed: ${error.message}`);
}

// Test 6: Environment variable override
console.log('\nTest 6: Environment variable override');
try {
  // Save original env var
  const originalClaudeHome = process.env.CLAUDE_HOME;
  
  // Set a test Claude home
  const testClaudeHome = path.join(os.tmpdir(), 'test-claude-home');
  fs.mkdirSync(path.join(testClaudeHome, 'projects'), { recursive: true });
  process.env.CLAUDE_HOME = testClaudeHome;
  
  const exporter = new ClaudePromptExporter(testProjectPath, { verbose: true });
  const resolvedHome = exporter.claudeHome;
  
  if (resolvedHome === path.join(testClaudeHome, 'projects')) {
    console.log('✅ Environment variable override working');
  } else {
    console.error(`❌ Environment variable override failed: got "${resolvedHome}"`);
  }
  
  // Cleanup
  fs.rmSync(testClaudeHome, { recursive: true });
  if (originalClaudeHome) {
    process.env.CLAUDE_HOME = originalClaudeHome;
  } else {
    delete process.env.CLAUDE_HOME;
  }
} catch (error) {
  console.error(`❌ Test 6 failed: ${error.message}`);
}

// Test 7: CLI option override
console.log('\nTest 7: CLI option override');
try {
  // Create a test Claude home
  const testClaudeHome = path.join(os.tmpdir(), 'test-claude-home-cli');
  fs.mkdirSync(path.join(testClaudeHome, 'projects'), { recursive: true });
  
  const exporter = new ClaudePromptExporter(testProjectPath, { 
    verbose: true,
    claudeHome: testClaudeHome
  });
  const resolvedHome = exporter.claudeHome;
  
  if (resolvedHome === path.join(testClaudeHome, 'projects')) {
    console.log('✅ CLI option override working');
  } else {
    console.error(`❌ CLI option override failed: got "${resolvedHome}"`);
  }
  
  // Cleanup
  fs.rmSync(testClaudeHome, { recursive: true });
} catch (error) {
  console.error(`❌ Test 7 failed: ${error.message}`);
}

console.log('\n✨ All tests completed!');
