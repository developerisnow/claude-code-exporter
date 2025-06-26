import { Command, CommandRunner, Option } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { ImportSessionUseCase } from '../../import/application/import-session.use-case';
import { ImportSessionCommand } from '../../import/application/commands/import-session.command';
import ora from 'ora';

interface ImportOptions {
  path?: string;
  recursive?: boolean;
  force?: boolean;
  continueOnError?: boolean;
  verbose?: boolean;
}

@Command({
  name: 'import',
  description: 'Import Claude Code sessions into database',
})
export class ImportCommand extends CommandRunner {
  private readonly logger = new Logger(ImportCommand.name);

  constructor(private readonly importUseCase: ImportSessionUseCase) {
    super();
  }

  async run(passedParams: string[], options: ImportOptions): Promise<void> {
    const projectPath = options.path || passedParams[0] || process.cwd();

    const spinner = ora('Importing Claude sessions...').start();

    try {
      const command = new ImportSessionCommand(
        projectPath,
        options.recursive !== false,
        options.force || false,
        options.continueOnError !== false,
      );

      const result = await this.importUseCase.execute(command);

      if (result.isSuccess()) {
        spinner.succeed(
          `Import completed: ${result.sessionCount} sessions, ${result.promptCount} prompts`,
        );
      } else if (result.hasErrors()) {
        spinner.warn(
          `Import completed with errors: ${result.sessionCount} sessions, ${result.promptCount} prompts`,
        );
        result.errors.forEach((error) => console.error(`  - ${error}`));
      } else {
        spinner.info('No sessions found to import');
      }

      if (options.verbose) {
        this.logger.log('Import details:', result.toJSON());
      }
    } catch (error) {
      spinner.fail('Import failed');
      throw error;
    }
  }

  @Option({
    flags: '-p, --path <path>',
    description: 'Path to Claude project directory',
  })
  parsePath(val: string): string {
    return val;
  }

  @Option({
    flags: '--no-recursive',
    description: 'Do not search recursively',
  })
  parseNoRecursive(): boolean {
    return false;
  }

  @Option({
    flags: '-f, --force',
    description: 'Force re-import of existing sessions',
  })
  parseForce(): boolean {
    return true;
  }

  @Option({
    flags: '--no-continue-on-error',
    description: 'Stop on first error',
  })
  parseNoContinueOnError(): boolean {
    return false;
  }

  @Option({
    flags: '-v, --verbose',
    description: 'Verbose output',
  })
  parseVerbose(): boolean {
    return true;
  }
}
