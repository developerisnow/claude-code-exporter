#!/usr/bin/env node

import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  // Check if running as CLI
  const isCliMode = process.argv.length > 2;

  if (isCliMode) {
    // Run as CLI
    await CommandFactory.run(AppModule, {
      logger: ['error', 'warn'],
      errorHandler: (error) => {
        const logger = new Logger('CLI');
        logger.error(error.message, error.stack);
        process.exit(1);
      },
    });
  } else {
    // Show help
    console.log('Claude Code Exporter v2.0.0');
    console.log('');
    console.log('Usage: claude-prompts [command] [options]');
    console.log('');
    console.log('Commands:');
    console.log('  export     Export Claude Code sessions (default)');
    console.log('  import     Import Claude Code sessions into database');
    console.log('  aggregate  Aggregate all prompts by project');
    console.log('');
    console.log(
      'Run "claude-prompts [command] --help" for command-specific options',
    );
  }
}

bootstrap().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
