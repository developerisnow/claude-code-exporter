import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ProjectEntity } from '../../projects/infrastructure/entities/project.entity';
import { ConversationEntity } from './entities/conversation.entity';
import { ConversationTurnEntity } from './entities/conversation-turn.entity';
import { ProvidersService } from '../../providers/providers.service';

interface CursorImportResult {
  projectsImported: number;
  conversationsImported: number;
  turnsImported: number;
  errors: string[];
}

@Injectable()
export class CursorImportService {
  private readonly logger = new Logger(CursorImportService.name);

  constructor(
    @InjectRepository(ProjectEntity)
    private projectRepo: Repository<ProjectEntity>,
    @InjectRepository(ConversationEntity)
    private conversationRepo: Repository<ConversationEntity>,
    @InjectRepository(ConversationTurnEntity)
    private turnRepo: Repository<ConversationTurnEntity>,
    private providersService: ProvidersService,
  ) {}

  async importFromDirectory(projectPath: string): Promise<CursorImportResult> {
    const result: CursorImportResult = {
      projectsImported: 0,
      conversationsImported: 0,
      turnsImported: 0,
      errors: [],
    };

    try {
      const specStoryPath = path.join(projectPath, '.specstory', 'history');
      
      // Check if .specstory directory exists
      try {
        await fs.access(specStoryPath);
      } catch {
        result.errors.push(`No .specstory/history directory found at ${projectPath}`);
        return result;
      }

      // Get or create project
      const cursorProvider = await this.providersService.getProvider('cursor');
      let project = await this.projectRepo.findOne({
        where: { path: projectPath, providerId: cursorProvider.id }
      });

      if (!project) {
        project = await this.projectRepo.save({
          path: projectPath,
          name: path.basename(projectPath),
          encodedPath: this.encodePath(projectPath),
          providerId: cursorProvider.id,
          projectType: 'cursor',
          metadata: { importedAt: new Date() }
        });
        result.projectsImported++;
      }

      // Import conversations
      const files = await fs.readdir(specStoryPath);
      const mdFiles = files.filter(f => f.endsWith('.md'));

      for (const file of mdFiles) {
        try {
          await this.importConversation(
            path.join(specStoryPath, file),
            project,
            result
          );
        } catch (error) {
          result.errors.push(`Failed to import ${file}: ${error.message}`);
        }
      }

      // Import summaries if they exist
      const summariesPath = path.join(specStoryPath, 'summaries');
      try {
        await fs.access(summariesPath);
        const summaryFiles = await fs.readdir(summariesPath);
        for (const file of summaryFiles.filter(f => f.endsWith('.md'))) {
          await this.importConversation(
            path.join(summariesPath, file),
            project,
            result,
            true
          );
        }
      } catch {
        // No summaries directory, that's ok
      }

    } catch (error) {
      result.errors.push(`Fatal error: ${error.message}`);
    }

    return result;
  }

  private async importConversation(
    filePath: string,
    project: ProjectEntity,
    result: CursorImportResult,
    isSummary = false
  ): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const filename = path.basename(filePath);
    
    // Parse filename for date and title
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2})-(.+)\.md$/);
    let conversationDate = new Date();
    let title = filename.replace('.md', '');
    
    if (match) {
      const [, date, time, titlePart] = match;
      conversationDate = new Date(`${date}T${time.replace('-', ':')}:00`);
      title = titlePart.replace(/-/g, ' ');
    }

    // Extract title from first header if present
    const titleMatch = content.match(/^#\s+(.+?)(?:\s+\(|$)/m);
    if (titleMatch) {
      title = titleMatch[1];
    }

    // Check if conversation already exists
    let conversation = await this.conversationRepo.findOne({
      where: { filename, projectId: project.id }
    });

    if (!conversation) {
      conversation = await this.conversationRepo.save({
        projectId: project.id,
        filename,
        title,
        conversationDate,
        isSummary,
        metadata: { 
          originalPath: filePath,
          importedAt: new Date()
        }
      });
      result.conversationsImported++;
    }

    // Parse conversation turns
    const turns = this.parseConversationTurns(content);
    
    // Delete existing turns if re-importing
    await this.turnRepo.delete({ conversationId: conversation.id });

    // Save turns
    for (let i = 0; i < turns.length; i++) {
      await this.turnRepo.save({
        conversationId: conversation.id,
        turnNumber: i + 1,
        role: turns[i].role,
        content: turns[i].content,
        metadata: turns[i].metadata || {}
      });
      result.turnsImported++;
    }
  }

  private parseConversationTurns(content: string): Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: any;
  }> {
    const turns: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
      metadata?: any;
    }> = [];
    
    // Remove header and metadata
    const conversationStart = content.indexOf('_**User**_');
    if (conversationStart === -1) {
      return turns;
    }
    
    const conversationContent = content.substring(conversationStart);
    
    // Split by turn markers
    const parts = conversationContent.split(/\n---\n/);
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      
      if (trimmed.startsWith('_**User**_')) {
        const content = trimmed.replace(/^_\*\*User\*\*_\n+/, '').trim();
        turns.push({ role: 'user' as const, content });
      } else if (trimmed.startsWith('_**Assistant**_')) {
        const content = trimmed.replace(/^_\*\*Assistant\*\*_\n+/, '').trim();
        turns.push({ role: 'assistant' as const, content });
      } else if (trimmed.includes('Previous Conversation Compacted')) {
        // This is a summary section
        turns.push({ 
          role: 'system' as const, 
          content: trimmed,
          metadata: { type: 'summary' }
        });
      }
    }
    
    return turns;
  }

  async importAllCursorProjects(basePath?: string): Promise<CursorImportResult> {
    const aggregatedResult: CursorImportResult = {
      projectsImported: 0,
      conversationsImported: 0,
      turnsImported: 0,
      errors: [],
    };

    // If specific path provided, import just that
    if (basePath) {
      const result = await this.importFromDirectory(basePath);
      return result;
    }

    // Otherwise scan for all projects with .specstory directories
    const homeDir = process.env.HOME || process.env.USERPROFILE || '/Users/user';
    const searchPaths = [
      path.join(homeDir, 'Documents'),
      path.join(homeDir, 'Projects'),
      path.join(homeDir, 'Code'),
      path.join(homeDir, '__Repositories'),
    ];

    for (const searchPath of searchPaths) {
      try {
        await this.scanForSpecStoryProjects(searchPath, aggregatedResult);
      } catch (error) {
        this.logger.warn(`Could not scan ${searchPath}: ${error.message}`);
      }
    }

    return aggregatedResult;
  }

  private async scanForSpecStoryProjects(
    dirPath: string, 
    result: CursorImportResult,
    depth = 0,
    maxDepth = 3
  ): Promise<void> {
    if (depth > maxDepth) return;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith('.') && entry.name !== '.specstory') continue;
        
        const fullPath = path.join(dirPath, entry.name);
        
        // Check if this directory has .specstory
        if (entry.name === '.specstory') {
          const projectPath = path.dirname(fullPath);
          this.logger.log(`Found Cursor project at: ${projectPath}`);
          const importResult = await this.importFromDirectory(projectPath);
          
          // Aggregate results
          result.projectsImported += importResult.projectsImported;
          result.conversationsImported += importResult.conversationsImported;
          result.turnsImported += importResult.turnsImported;
          result.errors.push(...importResult.errors);
        } else {
          // Recurse into subdirectory
          await this.scanForSpecStoryProjects(fullPath, result, depth + 1, maxDepth);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  private encodePath(projectPath: string): string {
    return projectPath.replace(/\//g, '-').replace(/^-/, '');
  }
}