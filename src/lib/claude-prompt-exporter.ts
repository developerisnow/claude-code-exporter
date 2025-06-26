import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ImportSessionUseCase } from '../modules/import/application/import-session.use-case';
import { ExportSessionUseCase } from '../modules/export/application/export-session.use-case';
import { ImportSessionCommand } from '../modules/import/application/commands/import-session.command';
import { ExportSessionCommand } from '../modules/export/application/commands/export-session.command';
import {
  ExportFormat,
  ExportMode,
} from '../modules/export/domain/export-format.enum';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

interface LegacyOptions {
  verbose?: boolean;
  exportMode?: string;
  exportFormat?: string;
  interactive?: boolean;
  timeout?: number;
  claudeHome?: string;
}

/**
 * Backward compatibility wrapper for v1 API
 */
export class ClaudePromptExporter {
  private app: any;
  private importUseCase: ImportSessionUseCase;
  private exportUseCase: ExportSessionUseCase;
  private projectPath: string;
  private options: LegacyOptions;

  static ExportMode = ExportMode;
  static ExportFormat = ExportFormat;
  static MessageRole = {
    USER: 'user',
    ASSISTANT: 'assistant',
    SYSTEM: 'system',
  };

  constructor(projectPath: string, options: LegacyOptions = {}) {
    if (!projectPath) {
      throw new Error('Project path is required');
    }

    this.projectPath = path.resolve(projectPath);
    this.options = {
      verbose: options.verbose || false,
      exportMode: options.exportMode || ExportMode.PROMPTS_ONLY,
      exportFormat: options.exportFormat || ExportFormat.MARKDOWN,
      interactive: options.interactive !== false,
      timeout: options.timeout || 10000,
      ...options,
    };
  }

  log(message: string): void {
    if (this.options.verbose) {
      console.log(`[DEBUG] ${message}`);
    }
  }

  async init(): Promise<void> {
    // Initialize NestJS application context
    this.app = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    });

    this.importUseCase = this.app.get(ImportSessionUseCase);
    this.exportUseCase = this.app.get(ExportSessionUseCase);
  }

  async dispose(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }

  /**
   * Legacy method - exports to files
   */
  async export(): Promise<{
    filesCreated: number;
    outputPath: string;
    statistics?: any;
  }> {
    await this.init();

    try {
      // First import sessions to database
      const importCommand = new ImportSessionCommand(
        this.projectPath,
        true,
        false,
        true,
      );

      await this.importUseCase.execute(importCommand);

      // Then export based on options
      const exportCommand = new ExportSessionCommand({
        projectPath: this.projectPath,
        outputPath: 'claude-prompts',
        format: this.options.exportFormat as ExportFormat,
        mode: this.options.exportMode as ExportMode,
      });

      const result = await this.exportUseCase.execute(exportCommand);

      return {
        filesCreated: result.filesCreated,
        outputPath: 'claude-prompts',
        statistics: {
          format: result.format,
          mode: this.options.exportMode,
        },
      };
    } finally {
      await this.dispose();
    }
  }

  /**
   * Legacy method - extracts messages without exporting
   */
  async extractMessages(): Promise<any[]> {
    await this.init();

    try {
      // Import sessions
      const importCommand = new ImportSessionCommand(
        this.projectPath,
        true,
        false,
        true,
      );

      const result = await this.importUseCase.execute(importCommand);

      // Return legacy format
      return [
        {
          sessionId: 'legacy',
          messages: [],
          stats: {
            totalLines: 0,
            userMessages: result.promptCount,
            assistantMessages: 0,
            systemMessages: 0,
            skippedMessages: 0,
          },
          lastTimestamp: new Date().toISOString(),
        },
      ];
    } finally {
      await this.dispose();
    }
  }

  /**
   * Legacy method - extracts prompts
   */
  async extractPrompts(): Promise<any[]> {
    const messages = await this.extractMessages();
    return messages.map((session) => ({
      ...session,
      prompts: session.messages,
    }));
  }

  // Legacy helper methods
  getModePrefix(mode: string): string {
    switch (mode) {
      case ExportMode.PROMPTS_ONLY:
        return 'prompts-only';
      case ExportMode.OUTPUTS_ONLY:
        return 'outputs-only';
      case ExportMode.FULL_CONVERSATION:
        return 'full-output';
      default:
        return 'output';
    }
  }

  private _resolveClaudeHome(options: LegacyOptions): string {
    if (options.claudeHome) {
      return path.resolve(options.claudeHome);
    }

    if (process.env.CLAUDE_HOME) {
      return path.resolve(process.env.CLAUDE_HOME);
    }

    const homeDir = os.homedir();
    const candidates = [
      path.join(homeDir, '.claude'),
      path.join(homeDir, '.config', 'claude'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(path.join(candidate, 'projects'))) {
        return candidate;
      }
    }

    throw new Error('No Claude home directory found');
  }
}
