import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ISessionRepository } from '../../sessions/domain/session.repository.interface';
import { IPromptRepository } from '../../prompts/domain/prompt.repository.interface';
import { MarkdownExporter } from '../infrastructure/markdown-exporter';
import { JsonExporter } from '../infrastructure/json-exporter';
import { FileSystemService } from '../infrastructure/file-system.service';
import { ExportSessionCommand } from './commands/export-session.command';
import { ExportResult } from './export-result.dto';
import { ExportFormat, ExportMode } from '../domain/export-format.enum';
import { Session } from '../../sessions/domain/session.entity';
import { Prompt, Role } from '../../prompts/domain/prompt.entity';
import * as path from 'path';

@Injectable()
export class ExportSessionUseCase {
  private readonly logger = new Logger(ExportSessionUseCase.name);

  constructor(
    @Inject('ISessionRepository')
    private readonly sessionRepository: ISessionRepository,
    @Inject('IPromptRepository')
    private readonly promptRepository: IPromptRepository,
    private readonly markdownExporter: MarkdownExporter,
    private readonly jsonExporter: JsonExporter,
    private readonly fileSystemService: FileSystemService,
  ) {}

  async execute(command: ExportSessionCommand): Promise<ExportResult> {
    this.logger.debug('Exporting sessions', { command });

    try {
      // Get sessions
      const sessions = command.projectPath
        ? await this.sessionRepository.findByProjectPath(command.projectPath)
        : await this.sessionRepository.findAll();

      if (sessions.length === 0) {
        return new ExportResult({
          filesCreated: 0,
          format: command.format,
          errors: [],
        });
      }

      // Prepare export data
      const exportData = await this.prepareExportData(sessions, command);

      // Ensure output directory
      await this.fileSystemService.ensureDirectory(command.outputPath);

      // Export based on format
      const filesCreated = await this.performExport(exportData, command);

      return new ExportResult({
        filesCreated,
        format: command.format,
        errors: [],
      });
    } catch (error) {
      this.logger.error('Export failed', error.stack);
      throw error;
    }
  }

  private async prepareExportData(
    sessions: Session[],
    command: ExportSessionCommand,
  ): Promise<ExportData[]> {
    const data: ExportData[] = [];

    for (const session of sessions) {
      const prompts = await this.promptRepository.findBySessionId(session.id);
      const filteredPrompts = this.filterPromptsByMode(prompts, command.mode);

      data.push({
        session,
        prompts: filteredPrompts,
      });
    }

    return data;
  }

  private filterPromptsByMode(prompts: Prompt[], mode: ExportMode): Prompt[] {
    switch (mode) {
      case ExportMode.PROMPTS_ONLY:
        return prompts.filter((p) => p.role === Role.USER);
      case ExportMode.OUTPUTS_ONLY:
        return prompts.filter((p) => p.role === Role.ASSISTANT);
      case ExportMode.FULL_CONVERSATION:
        return prompts;
      default:
        return prompts;
    }
  }

  private async performExport(
    data: ExportData[],
    command: ExportSessionCommand,
  ): Promise<number> {
    let filesCreated = 0;

    if (command.format === ExportFormat.BOTH) {
      // Export all modes in both formats
      const modes = [
        ExportMode.PROMPTS_ONLY,
        ExportMode.OUTPUTS_ONLY,
        ExportMode.FULL_CONVERSATION,
      ];

      for (const mode of modes) {
        // Re-filter data for each mode
        const modeData = data.map((item) => ({
          ...item,
          prompts: this.filterPromptsByMode(item.prompts, mode),
        }));

        // Export in markdown
        const mdContent = this.markdownExporter.export({
          sessions: modeData,
          mode,
        });
        const mdFilename = this.generateFilename(command, mode, 'md');
        await this.fileSystemService.writeFile(
          path.join(command.outputPath, mdFilename),
          mdContent,
        );
        filesCreated++;

        // Export in JSON
        const jsonContent = this.jsonExporter.export({
          sessions: modeData,
          mode,
        });
        const jsonFilename = this.generateFilename(command, mode, 'json');
        await this.fileSystemService.writeFile(
          path.join(command.outputPath, jsonFilename),
          jsonContent,
        );
        filesCreated++;
      }
    } else {
      // Single format export
      const content =
        command.format === ExportFormat.MARKDOWN
          ? this.markdownExporter.export({ sessions: data, mode: command.mode })
          : this.jsonExporter.export({ sessions: data, mode: command.mode });

      const extension =
        command.format === ExportFormat.MARKDOWN ? 'md' : 'json';
      const filename = this.generateFilename(command, command.mode, extension);

      await this.fileSystemService.writeFile(
        path.join(command.outputPath, filename),
        content,
      );
      filesCreated++;
    }

    return filesCreated;
  }

  private generateFilename(
    command: ExportSessionCommand,
    mode: ExportMode,
    extension: string,
  ): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const modePrefix = this.getModePrefix(mode);
    return `${timestamp}-${modePrefix}.${extension}`;
  }

  private getModePrefix(mode: ExportMode): string {
    switch (mode) {
      case ExportMode.PROMPTS_ONLY:
        return 'prompts-only';
      case ExportMode.OUTPUTS_ONLY:
        return 'outputs-only';
      case ExportMode.FULL_CONVERSATION:
        return 'full-conversation';
      default:
        return 'export';
    }
  }
}

interface ExportData {
  session: Session;
  prompts: Prompt[];
}
