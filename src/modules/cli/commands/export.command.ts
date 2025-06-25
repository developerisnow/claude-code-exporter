import { Command, CommandRunner, Option } from 'nest-commander';
import { Logger } from '@nestjs/common';
import * as readlineSync from 'readline-sync';
import { ExportSessionUseCase } from '../../export/application/export-session.use-case';
import { ExportSessionCommand } from '../../export/application/commands/export-session.command';
import { ExportFormat, ExportMode } from '../../export/domain/export-format.enum';
import * as ora from 'ora';

interface ExportOptions {
  path?: string;
  output?: string;
  prompts?: boolean;
  outputs?: boolean;
  full?: boolean;
  json?: boolean;
  markdown?: boolean;
  both?: boolean;
  verbose?: boolean;
  interactive?: boolean;
}

@Command({
  name: 'export',
  description: 'Export Claude Code sessions (backward compatible)',
})
export class ExportCommand extends CommandRunner {
  private readonly logger = new Logger(ExportCommand.name);

  constructor(private readonly exportUseCase: ExportSessionUseCase) {
    super();
  }

  async run(passedParams: string[], options: ExportOptions): Promise<void> {
    // Handle backward compatibility - default export command
    const projectPath = options.path || passedParams[0] || process.cwd();
    const outputPath = options.output || 'claude-prompts';
    
    // Determine export mode from CLI flags
    let exportMode: ExportMode | null = null;
    if (options.prompts) {
      exportMode = ExportMode.PROMPTS_ONLY;
    } else if (options.outputs) {
      exportMode = ExportMode.OUTPUTS_ONLY;
    } else if (options.full) {
      exportMode = ExportMode.FULL_CONVERSATION;
    }

    // Determine export format from CLI flags
    let exportFormat: ExportFormat = ExportFormat.MARKDOWN;
    if (options.json) {
      exportFormat = ExportFormat.JSON;
    } else if (options.both) {
      exportFormat = ExportFormat.BOTH;
    }

    // Interactive prompts if not specified
    if (options.interactive !== false) {
      if (!exportMode) {
        exportMode = await this.promptForExportMode();
      }
      
      if (exportFormat === ExportFormat.MARKDOWN && !options.markdown && !options.json && !options.both) {
        exportFormat = await this.promptForExportFormat();
      }
    } else {
      // Default values for non-interactive mode
      exportMode = exportMode || ExportMode.PROMPTS_ONLY;
    }

    const spinner = ora('Exporting sessions...').start();

    try {
      const command = new ExportSessionCommand({
        projectPath,
        outputPath,
        format: exportFormat,
        mode: exportMode!,
      });

      const result = await this.exportUseCase.execute(command);

      spinner.succeed(
        `Export completed: ${result.filesCreated} file(s) created`,
      );

      if (options.verbose) {
        this.logger.log('Export details:', {
          projectPath,
          outputPath,
          format: exportFormat,
          mode: exportMode,
          filesCreated: result.filesCreated,
        });
      }
    } catch (error) {
      spinner.fail('Export failed');
      throw error;
    }
  }

  private async promptForExportMode(): Promise<ExportMode> {
    console.log('\nChoose a mode:');
    console.log('1) Prompts Only');
    console.log('2) Outputs Only');
    console.log('3) Both: Prompts and Outputs');
    console.log('Defaulting to: 1) Prompts Only');
    
    const answer = readlineSync.question('What do you want to export? [1-3]: ', {
      defaultInput: '1',
    });
    const choice = parseInt(answer) || 1;
    
    const modes = [
      ExportMode.PROMPTS_ONLY,
      ExportMode.OUTPUTS_ONLY,
      ExportMode.FULL_CONVERSATION,
    ];
    const selected = modes[Math.min(Math.max(choice - 1, 0), 2)];
    
    const labels = {
      [ExportMode.PROMPTS_ONLY]: 'Prompts Only',
      [ExportMode.OUTPUTS_ONLY]: 'Outputs Only',
      [ExportMode.FULL_CONVERSATION]: 'Both: Prompts and Outputs',
    };
    
    console.log(`Using: ${Math.min(Math.max(choice, 1), 3)}) ${labels[selected]}\n`);
    return selected;
  }

  private async promptForExportFormat(): Promise<ExportFormat> {
    console.log('\nChoose a format:');
    console.log('1) Markdown');
    console.log('2) JSON');
    console.log('3) Both: Markdown and JSON');
    console.log('Defaulting to: 1) Markdown');
    
    const answer = readlineSync.question('What format do you want? [1-3]: ', {
      defaultInput: '1',
    });
    const choice = parseInt(answer) || 1;
    
    const formats = [ExportFormat.MARKDOWN, ExportFormat.JSON, ExportFormat.BOTH];
    const selected = formats[Math.min(Math.max(choice - 1, 0), 2)];
    
    const labels = {
      [ExportFormat.MARKDOWN]: 'Markdown',
      [ExportFormat.JSON]: 'JSON',
      [ExportFormat.BOTH]: 'Both: Markdown and JSON',
    };
    
    console.log(`Using: ${Math.min(Math.max(choice, 1), 3)}) ${labels[selected]}\n`);
    return selected;
  }

  @Option({
    flags: '-p, --path <path>',
    description: 'Path to Claude project directory',
  })
  parsePath(val: string): string {
    return val;
  }

  @Option({
    flags: '-o, --output <output>',
    description: 'Output directory',
  })
  parseOutput(val: string): string {
    return val;
  }

  @Option({
    flags: '--prompts',
    description: 'Export prompts only',
  })
  parsePrompts(): boolean {
    return true;
  }

  @Option({
    flags: '--outputs',
    description: 'Export outputs only',
  })
  parseOutputs(): boolean {
    return true;
  }

  @Option({
    flags: '--full',
    description: 'Export full conversation',
  })
  parseFull(): boolean {
    return true;
  }

  @Option({
    flags: '--json',
    description: 'Export as JSON',
  })
  parseJson(): boolean {
    return true;
  }

  @Option({
    flags: '--markdown',
    description: 'Export as Markdown',
  })
  parseMarkdown(): boolean {
    return true;
  }

  @Option({
    flags: '--both',
    description: 'Export in both formats',
  })
  parseBoth(): boolean {
    return true;
  }

  @Option({
    flags: '-v, --verbose',
    description: 'Verbose output',
  })
  parseVerbose(): boolean {
    return true;
  }

  @Option({
    flags: '--no-interactive',
    description: 'Disable interactive prompts',
  })
  parseNoInteractive(): boolean {
    return false;
  }
}