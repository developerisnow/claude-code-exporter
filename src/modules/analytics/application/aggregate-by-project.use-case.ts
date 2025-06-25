import { Injectable, Logger, Inject } from '@nestjs/common';
import { ISessionRepository } from '../../sessions/domain/session.repository.interface';
import { IPromptRepository } from '../../prompts/domain/prompt.repository.interface';
import { FileSystemService } from '../../export/infrastructure/file-system.service';
import { AggregateByProjectCommand } from './commands/aggregate-by-project.command';
import { AggregateByProjectResult } from './aggregate-by-project-result.dto';
import { Session } from '../../sessions/domain/session.entity';
import { Prompt } from '../../prompts/domain/prompt.entity';
import * as path from 'path';

@Injectable()
export class AggregateByProjectUseCase {
  private readonly logger = new Logger(AggregateByProjectUseCase.name);

  constructor(
    @Inject('ISessionRepository')
    private readonly sessionRepository: ISessionRepository,
    @Inject('IPromptRepository')
    private readonly promptRepository: IPromptRepository,
    private readonly fileSystemService: FileSystemService,
  ) {}

  async execute(command: AggregateByProjectCommand): Promise<AggregateByProjectResult> {
    this.logger.debug('Aggregating prompts by project', { command });

    try {
      // Get all sessions
      const sessions = await this.sessionRepository.findAll();
      
      // Group sessions by project
      const sessionsByProject = this.groupSessionsByProject(sessions);
      
      // Aggregate prompts for each project
      const projectsAggregated = new Set<string>();
      let totalPrompts = 0;
      
      for (const [projectPath, projectSessions] of sessionsByProject) {
        const prompts = await this.collectPromptsForProject(projectSessions);
        
        if (prompts.length > 0) {
          await this.saveAggregatedContent(
            projectPath,
            prompts,
            projectSessions,
            command,
          );
          projectsAggregated.add(projectPath);
          totalPrompts += prompts.length;
        }
      }
      
      return new AggregateByProjectResult({
        projectsAggregated: projectsAggregated.size,
        totalPrompts,
        outputPath: command.outputPath,
      });
    } catch (error) {
      this.logger.error('Aggregation failed', error.stack);
      throw error;
    }
  }

  private groupSessionsByProject(sessions: Session[]): Map<string, Session[]> {
    const grouped = new Map<string, Session[]>();
    
    for (const session of sessions) {
      const existing = grouped.get(session.projectPath) || [];
      existing.push(session);
      grouped.set(session.projectPath, existing);
    }
    
    return grouped;
  }

  private async collectPromptsForProject(sessions: Session[]): Promise<Prompt[]> {
    const allPrompts: Prompt[] = [];
    
    for (const session of sessions) {
      const prompts = await this.promptRepository.findBySessionId(session.id);
      allPrompts.push(...prompts);
    }
    
    // Sort by timestamp
    return allPrompts.sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  private async saveAggregatedContent(
    projectPath: string,
    prompts: Prompt[],
    sessions: Session[],
    command: AggregateByProjectCommand,
  ): Promise<void> {
    const filename = this.sanitizeFilename(projectPath) + '.md';
    const filepath = path.join(command.outputPath, filename);
    
    let content = '';
    
    // Append to existing file if specified
    if (command.appendOnly && await this.fileSystemService.exists(filepath)) {
      content = await this.fileSystemService.readFile(filepath);
      content += '\n\n---\n\n';
    } else {
      // Create new file header
      content = this.createHeader(projectPath, sessions, prompts);
    }
    
    // Add prompts
    content += this.formatPrompts(prompts);
    
    await this.fileSystemService.writeFile(filepath, content);
    
    this.logger.log(`Aggregated ${prompts.length} prompts for project: ${projectPath}`);
  }

  private createHeader(
    projectPath: string,
    sessions: Session[],
    prompts: Prompt[],
  ): string {
    const lines: string[] = [];
    
    lines.push(`# Claude Code Sessions - ${path.basename(projectPath)}`);
    lines.push('');
    lines.push(`**Project Path**: ${projectPath}`);
    lines.push(`**Total Sessions**: ${sessions.length}`);
    lines.push(`**Total Prompts**: ${prompts.length}`);
    lines.push(`**Aggregated At**: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    
    return lines.join('\n');
  }

  private formatPrompts(prompts: Prompt[]): string {
    const lines: string[] = [];
    let currentDate: string | null = null;
    
    for (const prompt of prompts) {
      const promptDate = prompt.timestamp.toISOString().split('T')[0];
      
      // Add date header if changed
      if (promptDate !== currentDate) {
        if (currentDate !== null) {
          lines.push('');
        }
        lines.push(`## ${promptDate}`);
        lines.push('');
        currentDate = promptDate;
      }
      
      // Add prompt
      lines.push(`### ${prompt.role.toUpperCase()} - ${prompt.timestamp.toLocaleTimeString()}`);
      lines.push('');
      lines.push('```');
      lines.push(prompt.content);
      lines.push('```');
      lines.push('');
    }
    
    return lines.join('\n');
  }

  private sanitizeFilename(projectPath: string): string {
    // Replace path separators and special characters
    return path.basename(projectPath)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .toLowerCase();
  }
}