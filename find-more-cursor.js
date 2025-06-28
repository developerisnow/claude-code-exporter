#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

const searchPaths = [
  '/Users/user/Documents',
  '/Users/user/Desktop', 
  '/Users/user/Downloads',
  '/Users/user/dev',
  '/Users/user/Projects',
  '/Users/user/Code',
  '/Users/user/workspace',
  '/Users/user/Sites',
  '/Users/user/____Sandruk',
  '/Users/user/Work'
];

console.log('🔍 Searching for Cursor projects in additional locations...\n');

let totalFound = 0;

for (const searchPath of searchPaths) {
  try {
    const cmd = `find "${searchPath}" -type d -name ".specstory" -maxdepth 6 2>/dev/null | head -100`;
    const result = execSync(cmd, { encoding: 'utf8' });
    
    const projects = result
      .split('\n')
      .filter(line => line.trim())
      .map(specPath => path.dirname(specPath));
    
    if (projects.length > 0) {
      console.log(`\n📂 ${searchPath}:`);
      projects.forEach(p => {
        console.log(`  - ${p}`);
        totalFound++;
      });
    }
  } catch (e) {
    // Path doesn't exist or no access
  }
}

console.log(`\n✅ Total additional Cursor projects found: ${totalFound}`);

// Also check for any .cursor-history or similar
console.log('\n🔍 Checking for other Cursor-related directories...');

try {
  const otherCmd = `find /Users/user -name "*cursor*" -type d -maxdepth 4 2>/dev/null | grep -E "(history|session|chat)" | head -20`;
  const otherResult = execSync(otherCmd, { encoding: 'utf8' });
  
  if (otherResult.trim()) {
    console.log('\nOther Cursor-related directories:');
    console.log(otherResult);
  }
} catch (e) {
  // Ignore
}