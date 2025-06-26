#!/usr/bin/env node

import { ClaudePromptExporter } from './lib/claude-prompt-exporter';
import * as path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const projectPath = args[0] || process.cwd();

// Parse flags
const options: any = {};
for (let i = 1; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--prompts') options.exportMode = 'prompts-only';
  else if (arg === '--outputs') options.exportMode = 'outputs-only';
  else if (arg === '--full') options.exportMode = 'full-conversation';
  else if (arg === '--json') options.exportFormat = 'json';
  else if (arg === '--markdown') options.exportFormat = 'markdown';
  else if (arg === '--both') options.exportFormat = 'both';
  else if (arg === '-o' || arg === '--output') {
    options.outputDir = args[++i];
  }
  else if (arg === '-v' || arg === '--verbose') options.verbose = true;
  else if (arg === '-i' || arg === '--interactive') options.interactive = true;
}

async function main() {
  try {
    const exporter = new ClaudePromptExporter(projectPath, options);
    const result = await exporter.export();
    
    console.log(`\nExported ${result.statistics?.sessionCount || 0} sessions (${result.statistics?.totalMessages || 0} total messages) to ${result.outputPath}/`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();