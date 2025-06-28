#!/usr/bin/env node

// Simple test to verify the MCP server can load
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing MCP server components...\n');

try {
  // Test 1: Can we import the wrapper?
  console.log('1. Testing exporter wrapper import...');
  const { default: ClaudePromptExporter } = await import('./exporter-wrapper.js');
  console.log('✓ Exporter wrapper imported successfully');
  console.log(`  - ClaudePromptExporter is a ${typeof ClaudePromptExporter}`);
  
  // Test 2: Can we create an instance?
  console.log('\n2. Testing exporter instantiation...');
  try {
    const exporter = new ClaudePromptExporter('/tmp/test-project', {
      interactive: false,
      verbose: false
    });
    console.log('✓ Exporter instance created (will fail on finding Claude home, which is expected)');
  } catch (error) {
    if (error.message.includes('Claude')) {
      console.log('✓ Exporter instantiation works (Claude home not found - expected)');
    } else {
      throw error;
    }
  }
  
  // Test 3: Check MCP SDK
  console.log('\n3. Testing MCP SDK import...');
  const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
  console.log('✓ MCP SDK imported successfully');
  console.log(`  - Server is a ${typeof Server}`);
  
  console.log('\n✅ All tests passed! The MCP server should work correctly.');
  
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}