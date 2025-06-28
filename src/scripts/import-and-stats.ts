import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';

interface SessionStats {
  sessionId: string;
  projectPath: string;
  messageCount: number;
  userMessages: number;
  assistantMessages: number;
  firstMessage: Date;
  lastMessage: Date;
  title: string;
}

async function importAllSessions() {
  const logger = new Logger('ImportScript');
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    logger.log('🚀 Starting import of all Claude sessions...\n');

    // Find Claude home directory
    const claudeHomes = [
      path.join(process.env.HOME!, '.claude'),
      path.join(process.env.HOME!, '.config/claude'),
    ];

    let claudeProjectsPath: string | null = null;
    for (const home of claudeHomes) {
      const projectsPath = path.join(home, 'projects');
      if (fs.existsSync(projectsPath)) {
        claudeProjectsPath = projectsPath;
        logger.log(`✅ Found Claude projects at: ${projectsPath}`);
        break;
      }
    }

    if (!claudeProjectsPath) {
      throw new Error('Claude projects directory not found');
    }

    // Scan all project directories
    const projectDirs = fs.readdirSync(claudeProjectsPath)
      .filter(dir => dir.startsWith('-'))
      .map(dir => path.join(claudeProjectsPath!, dir));

    logger.log(`📁 Found ${projectDirs.length} projects\n`);

    const allStats: SessionStats[] = [];
    let totalSessions = 0;
    let totalMessages = 0;

    // Process each project
    for (const projectDir of projectDirs) {
      const projectPath = decodeProjectPath(path.basename(projectDir));
      logger.log(`\n📂 Processing project: ${projectPath}`);

      // Find all JSONL files
      const sessionFiles = fs.readdirSync(projectDir)
        .filter(file => file.endsWith('.jsonl'))
        .map(file => path.join(projectDir, file));

      logger.log(`   Found ${sessionFiles.length} sessions`);

      // Process each session
      for (const sessionFile of sessionFiles) {
        const sessionId = path.basename(sessionFile, '.jsonl');
        const stats = await processSession(sessionFile, sessionId, projectPath, dataSource);
        
        if (stats) {
          allStats.push(stats);
          totalSessions++;
          totalMessages += stats.messageCount;
          
          logger.log(`   ✓ ${sessionId}: ${stats.messageCount} messages (${stats.userMessages}U/${stats.assistantMessages}A)`);
        }
      }
    }

    // Display overall statistics
    logger.log('\n' + '='.repeat(80));
    logger.log('📊 IMPORT SUMMARY');
    logger.log('='.repeat(80));
    logger.log(`Total Projects: ${projectDirs.length}`);
    logger.log(`Total Sessions: ${totalSessions}`);
    logger.log(`Total Messages: ${totalMessages}`);
    logger.log(`Average Messages per Session: ${Math.round(totalMessages / totalSessions)}`);

    // Top projects by message count
    const projectStats = new Map<string, { sessions: number; messages: number }>();
    allStats.forEach(stat => {
      const current = projectStats.get(stat.projectPath) || { sessions: 0, messages: 0 };
      current.sessions++;
      current.messages += stat.messageCount;
      projectStats.set(stat.projectPath, current);
    });

    const topProjects = Array.from(projectStats.entries())
      .sort((a, b) => b[1].messages - a[1].messages)
      .slice(0, 10);

    logger.log('\n📈 TOP 10 PROJECTS BY MESSAGE COUNT:');
    logger.log('-'.repeat(80));
    topProjects.forEach(([project, stats], index) => {
      logger.log(`${index + 1}. ${project}`);
      logger.log(`   Sessions: ${stats.sessions}, Messages: ${stats.messages}`);
    });

    // Session length distribution
    const lengthBuckets = {
      '1-10': 0,
      '11-50': 0,
      '51-100': 0,
      '101-500': 0,
      '500+': 0,
    };

    allStats.forEach(stat => {
      if (stat.messageCount <= 10) lengthBuckets['1-10']++;
      else if (stat.messageCount <= 50) lengthBuckets['11-50']++;
      else if (stat.messageCount <= 100) lengthBuckets['51-100']++;
      else if (stat.messageCount <= 500) lengthBuckets['101-500']++;
      else lengthBuckets['500+']++;
    });

    logger.log('\n📊 SESSION LENGTH DISTRIBUTION:');
    logger.log('-'.repeat(80));
    Object.entries(lengthBuckets).forEach(([range, count]) => {
      const percentage = ((count / totalSessions) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round((count / totalSessions) * 50));
      logger.log(`${range.padEnd(10)} messages: ${count.toString().padEnd(5)} (${percentage}%) ${bar}`);
    });

    // Daily activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStats = allStats.filter(stat => stat.lastMessage > thirtyDaysAgo);
    const dailyActivity = new Map<string, number>();

    recentStats.forEach(stat => {
      const date = stat.lastMessage.toISOString().split('T')[0];
      dailyActivity.set(date, (dailyActivity.get(date) || 0) + stat.messageCount);
    });

    logger.log('\n📅 ACTIVITY LAST 30 DAYS:');
    logger.log('-'.repeat(80));
    const sortedDays = Array.from(dailyActivity.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-10);

    sortedDays.forEach(([date, messages]) => {
      const bar = '▓'.repeat(Math.round(messages / 10));
      logger.log(`${date}: ${messages.toString().padEnd(4)} messages ${bar}`);
    });

    // Database verification
    const dbStats = await dataSource.query(`
      SELECT 
        COUNT(DISTINCT p.id) as project_count,
        COUNT(DISTINCT s.id) as session_count,
        SUM(s.message_count) as total_messages,
        SUM(s.user_message_count) as total_user_messages,
        SUM(s.assistant_message_count) as total_assistant_messages
      FROM sessions s
      JOIN projects p ON s.project_id = p.id
    `);

    logger.log('\n✅ DATABASE VERIFICATION:');
    logger.log('-'.repeat(80));
    logger.log(`Projects in DB: ${dbStats[0].project_count}`);
    logger.log(`Sessions in DB: ${dbStats[0].session_count}`);
    logger.log(`Messages in DB: ${dbStats[0].total_messages}`);
    logger.log(`User Messages: ${dbStats[0].total_user_messages}`);
    logger.log(`Assistant Messages: ${dbStats[0].total_assistant_messages}`);

  } catch (error) {
    logger.error('Import failed:', error);
  } finally {
    await app.close();
  }
}

async function processSession(
  sessionFile: string, 
  sessionId: string, 
  projectPath: string,
  dataSource: DataSource
): Promise<SessionStats | null> {
  try {
    const content = fs.readFileSync(sessionFile, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    let userMessages = 0;
    let assistantMessages = 0;
    let firstMessage: Date | null = null;
    let lastMessage: Date | null = null;
    let title = 'Untitled';

    lines.forEach(line => {
      try {
        const data = JSON.parse(line);
        if (data.message) {
          const timestamp = new Date(data.timestamp);
          if (!firstMessage || timestamp < firstMessage) firstMessage = timestamp;
          if (!lastMessage || timestamp > lastMessage) lastMessage = timestamp;

          if (data.message.role === 'user') {
            userMessages++;
            // Extract title from first user message
            if (userMessages === 1 && typeof data.message.content === 'string') {
              title = data.message.content.substring(0, 100).split('\n')[0];
            }
          } else if (data.message.role === 'assistant') {
            assistantMessages++;
          }
        }
      } catch (e) {
        // Skip invalid lines
      }
    });

    const messageCount = userMessages + assistantMessages;
    if (messageCount === 0) return null;

    // Save to database
    await dataSource.query(`
      INSERT INTO sessions (
        session_id, project_id, title, message_count, 
        user_message_count, assistant_message_count,
        started_at, ended_at, imported_at
      )
      SELECT 
        $1, p.id, $2, $3, $4, $5, $6, $7, NOW()
      FROM projects p
      WHERE p.path = $8
      ON CONFLICT (session_id) 
      DO UPDATE SET
        message_count = EXCLUDED.message_count,
        user_message_count = EXCLUDED.user_message_count,
        assistant_message_count = EXCLUDED.assistant_message_count,
        ended_at = EXCLUDED.ended_at
    `, [sessionId, title, messageCount, userMessages, assistantMessages, firstMessage, lastMessage, projectPath]);

    return {
      sessionId,
      projectPath,
      messageCount,
      userMessages,
      assistantMessages,
      firstMessage: firstMessage!,
      lastMessage: lastMessage!,
      title,
    };
  } catch (error) {
    console.error(`Failed to process session ${sessionId}:`, error);
    return null;
  }
}

function decodeProjectPath(encodedPath: string): string {
  return encodedPath
    .replace(/^-/, '/')
    .replace(/-/g, '/');
}

// Run the import
importAllSessions().catch(console.error);