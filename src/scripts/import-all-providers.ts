#!/usr/bin/env node
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { ImportSessionUseCase } from '../modules/import/application/import-session.use-case';
import { CursorImportService } from '../modules/import/cursor/cursor-import.service';

interface ImportStats {
  provider: string;
  projects: number;
  sessions: number;
  conversations: number;
  messages: number;
  turns: number;
  errors: string[];
}

async function importAllProviders() {
  const logger = new Logger('ImportAllProviders');
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const stats: ImportStats[] = [];

  try {
    logger.log('🚀 Starting multi-provider import...\n');

    // 1. Import Claude Code sessions
    logger.log('📦 Importing Claude Code sessions...');
    const claudeStats = await importClaudeCode(app, dataSource);
    stats.push(claudeStats);

    // 2. Import Cursor conversations
    logger.log('\n📝 Importing Cursor conversations...');
    const cursorStats = await importCursor(app);
    stats.push(cursorStats);

    // 3. Import from specific directories if provided
    const specificPaths = process.argv.slice(2);
    if (specificPaths.length > 0) {
      logger.log('\n📁 Importing from specific paths...');
      for (const pathArg of specificPaths) {
        if (pathArg.includes('.specstory')) {
          const projectPath = pathArg.replace('/.specstory/history', '');
          const result = await importCursorPath(app, projectPath);
          stats.push(result);
        }
      }
    }

    // Display summary
    displaySummary(stats, logger);

  } catch (error) {
    logger.error('Import failed:', error);
  } finally {
    await app.close();
  }
}

async function importClaudeCode(app: any, dataSource: DataSource): Promise<ImportStats> {
  const stats: ImportStats = {
    provider: 'Claude Code',
    projects: 0,
    sessions: 0,
    conversations: 0,
    messages: 0,
    turns: 0,
    errors: [],
  };

  try {
    const claudeHomes = [
      path.join(process.env.HOME!, '.claude'),
      path.join(process.env.HOME!, '.config/claude'),
    ];

    let claudeProjectsPath: string | null = null;
    for (const home of claudeHomes) {
      const projectsPath = path.join(home, 'projects');
      if (fs.existsSync(projectsPath)) {
        claudeProjectsPath = projectsPath;
        break;
      }
    }

    if (!claudeProjectsPath) {
      stats.errors.push('Claude projects directory not found');
      return stats;
    }

    const importUseCase = app.get(ImportSessionUseCase);
    const projectDirs = fs.readdirSync(claudeProjectsPath)
      .filter(dir => dir.startsWith('-'));

    stats.projects = projectDirs.length;

    for (const projectDir of projectDirs) {
      const projectPath = decodeProjectPath(projectDir);
      const fullPath = path.join(claudeProjectsPath, projectDir);
      
      const sessionFiles = fs.readdirSync(fullPath)
        .filter(file => file.endsWith('.jsonl'));

      for (const sessionFile of sessionFiles) {
        try {
          const sessionId = path.basename(sessionFile, '.jsonl');
          const result = await importUseCase.execute({
            projectPath,
            sessionId,
          });
          
          stats.sessions += result.sessionsImported;
          stats.messages += result.totalMessages;
        } catch (error) {
          stats.errors.push(`Failed to import ${sessionFile}: ${error.message}`);
        }
      }
    }

    // Get actual counts from database
    const dbCounts = await dataSource.query(`
      SELECT 
        COUNT(DISTINCT s.id) as sessions,
        SUM(s.message_count) as messages
      FROM sessions s
      JOIN projects p ON s.project_id = p.id
      JOIN providers pr ON p.provider_id = pr.id
      WHERE pr.name = 'claude_code'
    `);

    if (dbCounts[0]) {
      stats.sessions = parseInt(dbCounts[0].sessions);
      stats.messages = parseInt(dbCounts[0].messages);
    }

  } catch (error) {
    stats.errors.push(`Fatal error: ${error.message}`);
  }

  return stats;
}

async function importCursor(app: any): Promise<ImportStats> {
  const cursorImportService = app.get(CursorImportService);
  const result = await cursorImportService.importAllCursorProjects();

  return {
    provider: 'Cursor',
    projects: result.projectsImported,
    sessions: 0,
    conversations: result.conversationsImported,
    messages: 0,
    turns: result.turnsImported,
    errors: result.errors,
  };
}

async function importCursorPath(app: any, projectPath: string): Promise<ImportStats> {
  const cursorImportService = app.get(CursorImportService);
  const result = await cursorImportService.importFromDirectory(projectPath);

  return {
    provider: 'Cursor (specific)',
    projects: result.projectsImported,
    sessions: 0,
    conversations: result.conversationsImported,
    messages: 0,
    turns: result.turnsImported,
    errors: result.errors,
  };
}

function displaySummary(stats: ImportStats[], logger: Logger) {
  logger.log('\n' + '='.repeat(80));
  logger.log('📊 IMPORT SUMMARY');
  logger.log('='.repeat(80));

  const table: any[] = [];
  let totalProjects = 0;
  let totalSessions = 0;
  let totalConversations = 0;
  let totalMessages = 0;
  let totalTurns = 0;
  let totalErrors = 0;

  for (const stat of stats) {
    table.push({
      Provider: stat.provider,
      Projects: stat.projects,
      Sessions: stat.sessions,
      Conversations: stat.conversations,
      Messages: stat.messages,
      Turns: stat.turns,
      Errors: stat.errors.length,
    });

    totalProjects += stat.projects;
    totalSessions += stat.sessions;
    totalConversations += stat.conversations;
    totalMessages += stat.messages;
    totalTurns += stat.turns;
    totalErrors += stat.errors.length;
  }

  console.table(table);

  logger.log('\n📈 TOTALS:');
  logger.log(`Total Projects: ${totalProjects}`);
  logger.log(`Total Sessions: ${totalSessions}`);
  logger.log(`Total Conversations: ${totalConversations}`);
  logger.log(`Total Messages: ${totalMessages}`);
  logger.log(`Total Turns: ${totalTurns}`);
  logger.log(`Total Errors: ${totalErrors}`);

  if (totalErrors > 0) {
    logger.log('\n❌ ERRORS:');
    for (const stat of stats) {
      if (stat.errors.length > 0) {
        logger.log(`\n${stat.provider}:`);
        stat.errors.forEach(err => logger.log(`  - ${err}`));
      }
    }
  }

  logger.log('\n✅ Import complete!');
}

function decodeProjectPath(encodedPath: string): string {
  return encodedPath.replace(/^-/, '/').replace(/-/g, '/');
}

// Run the import
importAllProviders().catch(console.error);