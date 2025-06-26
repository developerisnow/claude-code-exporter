import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  IClaudeSessionParser,
  RawMessage,
  RawSessionData,
} from '../domain/claude-session-parser.interface';

@Injectable()
export class ClaudeSessionParser implements IClaudeSessionParser {
  private readonly logger = new Logger(ClaudeSessionParser.name);

  async parse(projectPath: string): Promise<RawSessionData[]> {
    const claudeHome = await this.resolveClaudeHome();
    const sessionDir = await this.findSessionDirectory(projectPath, claudeHome);

    if (!sessionDir) {
      return [];
    }

    const sessionFiles = await this.findSessionFiles(sessionDir);
    const sessions: RawSessionData[] = [];

    for (const file of sessionFiles) {
      try {
        const session = await this.parseSessionFile(file, projectPath);
        if (session && session.messages.length > 0) {
          sessions.push(session);
        }
      } catch (error) {
        this.logger.error(`Failed to parse session file ${file}`, error.stack);
      }
    }

    return sessions;
  }

  private async resolveClaudeHome(): Promise<string> {
    const homeDir = os.homedir();
    const candidates = [
      path.join(homeDir, '.claude'),
      path.join(homeDir, '.config', 'claude'),
    ];

    for (const candidate of candidates) {
      try {
        await fs.access(candidate);
        return candidate;
      } catch {
        // Continue to next candidate
      }
    }

    throw new Error('Claude home directory not found');
  }

  private async findSessionDirectory(
    projectPath: string,
    claudeHome: string,
  ): Promise<string | null> {
    const encodedPath = this.encodePath(projectPath);
    const projectsDir = path.join(claudeHome, 'projects');
    const sessionDir = path.join(projectsDir, encodedPath);

    try {
      await fs.access(sessionDir);
      return sessionDir;
    } catch {
      // Try to find by project name
      const projectName = path.basename(projectPath);
      const dirs = await fs.readdir(projectsDir);

      const candidates = dirs.filter((dir) => dir.includes(projectName));
      if (candidates.length > 0) {
        // Use the first match
        return path.join(projectsDir, candidates[0]);
      }

      return null;
    }
  }

  private encodePath(projectPath: string): string {
    return projectPath.replace(/\//g, '-').replace(/_/g, '-');
  }

  private async findSessionFiles(sessionDir: string): Promise<string[]> {
    const files = await fs.readdir(sessionDir);
    return files
      .filter((file) => file.endsWith('.jsonl'))
      .map((file) => path.join(sessionDir, file));
  }

  private async parseSessionFile(
    filepath: string,
    projectPath: string,
  ): Promise<RawSessionData | null> {
    const sessionId = path.basename(filepath, '.jsonl');
    const content = await fs.readFile(filepath, 'utf8');
    const lines = content.split('\n').filter((line) => line.trim());

    const messages: RawMessage[] = [];

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.message && data.message.role) {
          const message: RawMessage = {
            role: data.message.role,
            content: this.extractContent(data.message.content),
            timestamp: data.timestamp || new Date().toISOString(),
            metadata: data.metadata,
          };
          messages.push(message);
        }
      } catch (error) {
        this.logger.debug(`Skipping invalid JSON line: ${error.message}`);
      }
    }

    if (messages.length === 0) {
      return null;
    }

    return {
      sessionId,
      projectPath,
      messages,
      createdAt: messages[0]?.timestamp,
      metadata: {
        filepath,
        messageCount: messages.length,
      },
    };
  }

  private extractContent(content: any): string {
    if (typeof content === 'string') {
      return content;
    }
    // Handle non-string content (arrays, objects)
    return JSON.stringify(content, null, 2);
  }
}
