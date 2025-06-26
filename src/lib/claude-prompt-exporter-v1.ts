import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as readlineSync from 'readline-sync';

// Export modes
export enum ExportMode {
  PROMPTS_ONLY = 'prompts',
  FULL_CONVERSATION = 'full',
  OUTPUTS_ONLY = 'outputs'
}

// Export formats
export enum ExportFormat {
  MARKDOWN = 'markdown',
  JSON = 'json',
  TXT = 'txt',
  BOTH = 'both'
}

// Message roles
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

// Interfaces
export interface ExporterOptions {
  verbose?: boolean;
  exportMode?: ExportMode;
  exportFormat?: ExportFormat;
  interactive?: boolean;
  timeout?: number;
  claudeHome?: string;
}

export interface Message {
  role: MessageRole;
  content: string;
  timestamp: string;
  index: number;
  isToolResult: boolean;
  isSystemGenerated: boolean;
}

export interface SessionStats {
  totalLines?: number;
  userMessages: number;
  assistantMessages: number;
  systemMessages: number;
  skippedMessages?: number;
}

export interface Session {
  sessionId: string;
  messages: Message[];
  stats: SessionStats;
  lastTimestamp: string | null;
}

export interface ExportResult {
  sessionsExported: number;
  totalMessages: number;
  totalPrompts?: number;
}

export class ClaudePromptExporterV1 {
  private projectPath: string;
  private options: Required<ExporterOptions>;
  private claudeHome: string;

  constructor(projectPath: string, options: ExporterOptions = {}) {
    if (!projectPath) {
      throw new Error('Project path is required');
    }

    this.projectPath = path.resolve(projectPath);
    this.options = {
      verbose: options.verbose || false,
      exportMode: options.exportMode || ExportMode.PROMPTS_ONLY,
      exportFormat: options.exportFormat || ExportFormat.MARKDOWN,
      interactive: options.interactive !== false, // Default true
      timeout: options.timeout || 10000, // 10 seconds
      claudeHome: options.claudeHome || ''
    };
    
    // Resolve Claude home directory with support for multiple locations
    const baseClaudeHome = this._resolveClaudeHome(options);
    this.claudeHome = path.join(baseClaudeHome, 'projects');
    
    if (!fs.existsSync(this.claudeHome)) {
      throw new Error(`Claude projects directory not found at ${this.claudeHome}. Please ensure Claude Code is installed.`);
    }
  }

  private log(message: string): void {
    if (this.options.verbose) {
      console.log(`[DEBUG] ${message}`);
    }
  }

  private _resolveClaudeHome(options: ExporterOptions): string {
    // Priority 1: CLI option
    if (options.claudeHome) {
      const resolved = path.resolve(options.claudeHome);
      this.log(`Using Claude home from CLI option: ${resolved}`);
      return resolved;
    }

    // Priority 2: Environment variable
    if (process.env.CLAUDE_HOME) {
      const resolved = path.resolve(process.env.CLAUDE_HOME);
      this.log(`Using Claude home from CLAUDE_HOME environment variable: ${resolved}`);
      return resolved;
    }

    // Priority 3: Detect available directories
    const availableHomes = this._detectClaudeHomes();
    
    if (availableHomes.length === 0) {
      throw new Error('No Claude home directory found. Please ensure Claude Code is installed at ~/.claude or ~/.config/claude');
    }
    
    if (availableHomes.length === 1) {
      this.log(`Using detected Claude home: ${availableHomes[0]}`);
      return availableHomes[0];
    }
    
    // Priority 4: Interactive prompt when multiple directories exist
    return this._promptForClaudeHome(availableHomes);
  }

  private _detectClaudeHomes(): string[] {
    const homes: string[] = [];
    const homeDir = os.homedir();
    const candidates = [
      path.join(homeDir, '.claude'),
      path.join(homeDir, '.config', 'claude')
    ];
    
    for (const candidate of candidates) {
      const projectsPath = path.join(candidate, 'projects');
      if (fs.existsSync(projectsPath)) {
        homes.push(candidate);
        this.log(`Found Claude home at: ${candidate}`);
      }
    }
    
    return homes;
  }

  private _promptForClaudeHome(availableHomes: string[]): string {
    console.log('\nMultiple Claude home directories found:');
    availableHomes.forEach((home, index) => {
      console.log(`${index + 1}) ${home}`);
    });
    
    // Prefer ~/.config/claude as default
    const defaultIndex = availableHomes.findIndex(home => home.includes('.config/claude')) + 1 || 1;
    console.log(`Defaulting to: ${defaultIndex}) ${availableHomes[defaultIndex - 1]}`);
    
    let index: number;
    if (this.options.interactive) {
      // Note: readline-sync doesn't support actual timeouts
      const answer = readlineSync.question(`Which would you like to use? [1-${availableHomes.length}]: `, {
        defaultInput: defaultIndex.toString()
      });
      index = parseInt(answer) || defaultIndex;
      if (index < 1 || index > availableHomes.length) {
        index = defaultIndex;
      }
    } else {
      index = defaultIndex;
    }
    
    const selected = availableHomes[index - 1];
    console.log(`Using: ${selected}\n`);
    return selected;
  }

  public promptForExportMode(): ExportMode {
    if (!this.options.interactive || this.options.exportMode) {
      return this.options.exportMode;
    }

    console.log('\nChoose a mode:');
    console.log('1) Prompts Only');
    console.log('2) Outputs Only');
    console.log('3) Both: Prompts and Outputs');
    console.log('Defaulting to: 1) Prompts Only');
    
    const answer = readlineSync.question('What do you want to export? [1-3]: ', {
      defaultInput: '1'
    });
    const choice = parseInt(answer) || 1;
    
    const modes = [ExportMode.PROMPTS_ONLY, ExportMode.OUTPUTS_ONLY, ExportMode.FULL_CONVERSATION];
    const selected = modes[Math.min(Math.max(choice - 1, 0), 2)];
    
    const labels: Record<ExportMode, string> = {
      [ExportMode.PROMPTS_ONLY]: 'Prompts Only',
      [ExportMode.OUTPUTS_ONLY]: 'Outputs Only',
      [ExportMode.FULL_CONVERSATION]: 'Both: Prompts and Outputs'
    };
    
    console.log(`Using: ${Math.min(Math.max(choice, 1), 3)}) ${labels[selected]}\n`);
    this.options.exportMode = selected;
    return selected;
  }

  public promptForExportFormat(): ExportFormat {
    if (!this.options.interactive || this.options.exportFormat !== ExportFormat.MARKDOWN) {
      return this.options.exportFormat;
    }

    console.log('\nChoose a format:');
    console.log('1) Markdown');
    console.log('2) JSON');
    console.log('3) Plain Text');
    console.log('4) All Formats');
    console.log('Defaulting to: 1) Markdown');
    
    const answer = readlineSync.question('What do you want to export? [1-4]: ', {
      defaultInput: '1'
    });
    const choice = parseInt(answer) || 1;
    
    const formats = [ExportFormat.MARKDOWN, ExportFormat.JSON, ExportFormat.TXT, ExportFormat.BOTH];
    const selected = formats[Math.min(Math.max(choice - 1, 0), 3)];
    
    const labels: Record<ExportFormat, string> = {
      [ExportFormat.MARKDOWN]: 'Markdown',
      [ExportFormat.JSON]: 'JSON',
      [ExportFormat.TXT]: 'Plain Text',
      [ExportFormat.BOTH]: 'All Formats'
    };
    
    console.log(`Using: ${Math.min(Math.max(choice, 1), 4)}) ${labels[selected]}\n`);
    this.options.exportFormat = selected;
    return selected;
  }

  private encodePath(projectPath: string): string {
    // Claude's encoding: / becomes -, _ becomes -
    // Example: /Users/user/__Repositories/yourproject → -Users-user---Repositories-yourproject
    return projectPath
      .replace(/\//g, '-')   // Replace slashes with dashes
      .replace(/_/g, '-');   // Replace underscores with dashes
  }

  public findSessionDirectory(): string {
    const encodedPath = this.encodePath(this.projectPath);
    let sessionDir = path.join(this.claudeHome, encodedPath);
    
    this.log(`Looking for encoded path: ${encodedPath}`);
    
    if (fs.existsSync(sessionDir)) {
      this.log(`Found exact match: ${sessionDir}`);
      return sessionDir;
    }

    // Fallback: search for directories containing the project name
    const projectName = path.basename(this.projectPath);
    const candidates = fs.readdirSync(this.claudeHome)
      .filter(dir => dir.includes(projectName))
      .map(dir => ({
        name: dir,
        path: path.join(this.claudeHome, dir),
        score: this.calculateSimilarity(dir, encodedPath)
      }))
      .sort((a, b) => b.score - a.score);

    if (candidates.length > 0) {
      this.log(`Found ${candidates.length} candidate(s), using best match: ${candidates[0].name}`);
      return candidates[0].path;
    }

    throw new Error(`No Claude sessions found for project: ${this.projectPath}`);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity score based on common substrings
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  public extractMessages(): Session[] {
    const sessionDir = this.findSessionDirectory();
    const sessionFiles = fs.readdirSync(sessionDir)
      .filter(f => f.endsWith('.jsonl'));

    if (sessionFiles.length === 0) {
      throw new Error('No session files found in the project directory');
    }

    this.log(`Found ${sessionFiles.length} session file(s)`);

    const sessions = sessionFiles.map(file => {
      try {
        return this.processSession(path.join(sessionDir, file));
      } catch (error) {
        console.error(`Error processing ${file}: ${(error as Error).message}`);
        return null;
      }
    }).filter((s): s is Session => s !== null);

    return sessions.filter(s => s.messages.length > 0);
  }

  // Backward compatibility method
  public extractPrompts(): any[] {
    const originalMode = this.options.exportMode;
    this.options.exportMode = ExportMode.PROMPTS_ONLY;
    const result = this.extractMessages();
    this.options.exportMode = originalMode;
    // Transform messages back to prompts for compatibility
    return result.map(session => ({
      ...session,
      prompts: session.messages
    }));
  }

  private processSession(filepath: string): Session | null {
    const sessionId = path.basename(filepath, '.jsonl');
    const messages: Message[] = [];
    const stats: SessionStats = {
      totalLines: 0,
      userMessages: 0,
      assistantMessages: 0,
      systemMessages: 0,
      skippedMessages: 0
    };

    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    stats.totalLines = lines.length;

    lines.forEach((line, index) => {
      try {
        const data = JSON.parse(line);
        const message = this.extractMessage(data, index);
        
        if (message) {
          if (this.shouldIncludeMessage(message)) {
            messages.push(message);
            // Update stats
            switch (message.role) {
              case MessageRole.USER:
                stats.userMessages++;
                break;
              case MessageRole.ASSISTANT:
                stats.assistantMessages++;
                break;
              case MessageRole.SYSTEM:
                stats.systemMessages++;
                break;
            }
          } else {
            stats.skippedMessages!++;
          }
        }
      } catch (error) {
        this.log(`Skipping invalid JSON at line ${index + 1}: ${(error as Error).message}`);
      }
    });

    const modeText: Record<ExportMode, string> = {
      [ExportMode.PROMPTS_ONLY]: `${stats.userMessages} prompts`,
      [ExportMode.FULL_CONVERSATION]: `${stats.userMessages} user, ${stats.assistantMessages} assistant messages`,
      [ExportMode.OUTPUTS_ONLY]: `${stats.assistantMessages} outputs`
    };
    
    this.log(`Session ${sessionId}: ${modeText[this.options.exportMode]} found, ${stats.skippedMessages} skipped`);

    // Get last message timestamp
    const lastTimestamp = messages.length > 0 ? messages[messages.length - 1].timestamp : null;
    
    return { sessionId, messages, stats, lastTimestamp };
  }

  private extractMessage(data: any, index: number): Message | null {
    if (!data.message || !data.message.role) {
      return null;
    }

    const { role, content } = data.message;
    
    // Handle different content types
    let processedContent = content;
    if (typeof content !== 'string') {
      // Claude messages often have structured content
      if (Array.isArray(content)) {
        // Extract text from content array
        const textParts = content
          .filter(part => part.type === 'text')
          .map(part => part.text)
          .join('\n\n');
        processedContent = textParts || JSON.stringify(content, null, 2);
      } else if (content && typeof content === 'object' && content.text) {
        // Handle single text object
        processedContent = content.text;
      } else {
        // Fallback to stringifying
        processedContent = JSON.stringify(content, null, 2);
      }
    }
    
    // Debug log for assistant messages
    if (role === 'assistant' && index < 5) {
      this.log(`Assistant message ${index}: content type=${typeof content}, extracted length=${processedContent?.length || 0}`);
    }

    return {
      role,
      content: processedContent,
      timestamp: data.timestamp || new Date().toISOString(),
      index,
      isToolResult: this.isToolResult(processedContent),
      isSystemGenerated: this.isSystemGenerated(processedContent)
    };
  }

  private shouldIncludeMessage(message: Message): boolean {
    const { exportMode } = this.options;
    
    // Filter out tool results and system-generated content in non-full modes
    if (exportMode !== ExportMode.FULL_CONVERSATION) {
      if (message.isToolResult || message.isSystemGenerated) {
        return false;
      }
    }

    switch (exportMode) {
      case ExportMode.PROMPTS_ONLY:
        return message.role === MessageRole.USER;
      case ExportMode.OUTPUTS_ONLY:
        return message.role === MessageRole.ASSISTANT;
      case ExportMode.FULL_CONVERSATION:
        return true;
      default:
        return false;
    }
  }

  private isToolResult(content: string): boolean {
    if (typeof content !== 'string') return false;
    const trimmed = content.trim();
    return (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
           (trimmed.startsWith('{') && trimmed.endsWith('}'));
  }

  private isSystemGenerated(content: string): boolean {
    if (typeof content !== 'string') return false;
    const skipPatterns = [
      'Caveat: The messages below were generated by the user while running local commands',
      '<command-name>',
      '<local-command-stdout>',
      '<local-command-stderr>'
    ];
    return skipPatterns.some(pattern => content.includes(pattern));
  }

  private filterMessagesForMode(messages: Message[], mode: ExportMode): Message[] {
    return messages.filter(message => {
      switch (mode) {
        case ExportMode.PROMPTS_ONLY:
          return message.role === MessageRole.USER && !message.isToolResult && !message.isSystemGenerated;
        case ExportMode.OUTPUTS_ONLY:
          const includeOutput = message.role === MessageRole.ASSISTANT && !message.isToolResult && !message.isSystemGenerated;
          if (message.role === MessageRole.ASSISTANT && !includeOutput) {
            this.log(`Excluding assistant message: isToolResult=${message.isToolResult}, isSystemGenerated=${message.isSystemGenerated}`);
          }
          return includeOutput;
        case ExportMode.FULL_CONVERSATION:
          return !message.isToolResult && !message.isSystemGenerated;
        default:
          return false;
      }
    });
  }

  public exportToMarkdown(outputDir: string = './claude-prompts'): ExportResult {
    return this.export(outputDir);
  }

  public export(outputDir: string = './claude-prompts'): ExportResult {
    const absoluteOutputDir = path.resolve(outputDir);
    
    // Create output directory
    fs.mkdirSync(absoluteOutputDir, { recursive: true });

    let totalSessionsExported = 0;
    let totalMessagesExported = 0;

    // When "Both" format is selected, we export ALL modes
    if (this.options.exportFormat === ExportFormat.BOTH) {
      // Export all three modes for complete output
      const modes = [ExportMode.PROMPTS_ONLY, ExportMode.OUTPUTS_ONLY, ExportMode.FULL_CONVERSATION];
      
      // Get sessions for full mode to have all data
      const originalMode = this.options.exportMode;
      this.options.exportMode = ExportMode.FULL_CONVERSATION;
      const allSessions = this.extractMessages();
      
      allSessions.forEach(({ sessionId, messages, stats, lastTimestamp }) => {
        const title = this.generateTitle(messages, ExportMode.PROMPTS_ONLY);
        const timestamp = this.getTimestamp();
        
        // Create per-session directory
        const dirName = `${timestamp}-${title}`;
        const sessionOutputDir = path.join(absoluteOutputDir, this.sanitizeFilename(dirName));
        fs.mkdirSync(sessionOutputDir, { recursive: true });
        
        // Export all modes and formats
        modes.forEach(mode => {
          this.options.exportMode = mode;
          const modeMessages = this.filterMessagesForMode(messages, mode);
          this.log(`Mode ${mode}: filtered ${modeMessages.length} messages from ${messages.length} total`);
          if (modeMessages.length > 0) {
            // Recalculate stats for the filtered messages
            const modeStats: SessionStats = {
              userMessages: modeMessages.filter(m => m.role === MessageRole.USER).length,
              assistantMessages: modeMessages.filter(m => m.role === MessageRole.ASSISTANT).length,
              systemMessages: modeMessages.filter(m => m.role === MessageRole.SYSTEM).length
            };
            this.exportSessionMarkdown(sessionOutputDir, sessionId, modeMessages, modeStats, title, timestamp);
            this.exportSessionJSON(sessionOutputDir, sessionId, modeMessages, modeStats, title, timestamp);
            // When format=both, also export TXT for outputs and full modes
            if (mode === ExportMode.OUTPUTS_ONLY || mode === ExportMode.FULL_CONVERSATION) {
              this.exportSessionTXT(sessionOutputDir, sessionId, modeMessages, modeStats, title, timestamp);
            }
          }
        });
        
        // Display statistics for the full conversation
        const lastActivity = lastTimestamp ? new Date(lastTimestamp).toLocaleString() : 'Unknown';
        console.log(`✓ ${sessionId}: ${stats.userMessages + stats.assistantMessages} messages (${stats.userMessages} user, ${stats.assistantMessages} assistant) last ${lastActivity}`);
        totalSessionsExported++;
        totalMessagesExported += stats.userMessages + stats.assistantMessages;
      });
      
      this.options.exportMode = originalMode;
    } else {
      // Single mode export
      const sessions = this.extractMessages();
      
      if (sessions.length === 0) {
        const modeText: Record<ExportMode, string> = {
          [ExportMode.PROMPTS_ONLY]: 'user prompts',
          [ExportMode.FULL_CONVERSATION]: 'messages',
          [ExportMode.OUTPUTS_ONLY]: 'assistant outputs'
        };
        console.log(`No sessions with ${modeText[this.options.exportMode] || 'messages'} found.`);
        return { sessionsExported: 0, totalMessages: 0 };
      }

      sessions.forEach(({ sessionId, messages, stats, lastTimestamp }) => {
        const title = this.generateTitle(messages, this.options.exportMode);
        const timestamp = this.getTimestamp();
        
        // Export based on format
        if (this.options.exportFormat === ExportFormat.MARKDOWN) {
          this.exportSessionMarkdown(absoluteOutputDir, sessionId, messages, stats, title, timestamp);
        } else if (this.options.exportFormat === ExportFormat.JSON) {
          this.exportSessionJSON(absoluteOutputDir, sessionId, messages, stats, title, timestamp);
        } else if (this.options.exportFormat === ExportFormat.TXT) {
          this.exportSessionTXT(absoluteOutputDir, sessionId, messages, stats, title, timestamp);
        }
        
        // Enhanced statistics display
        const lastActivity = lastTimestamp ? new Date(lastTimestamp).toLocaleString() : 'Unknown';
        if (this.options.exportMode === ExportMode.FULL_CONVERSATION) {
          console.log(`✓ ${sessionId}: ${messages.length} messages (${stats.userMessages} user, ${stats.assistantMessages} assistant) last ${lastActivity}`);
        } else {
          const countText: Record<ExportMode, string> = {
            [ExportMode.PROMPTS_ONLY]: `${messages.length} prompts`,
            [ExportMode.OUTPUTS_ONLY]: `${messages.length} outputs`,
            [ExportMode.FULL_CONVERSATION]: `${messages.length} messages`
          };
          console.log(`✓ ${sessionId}: ${countText[this.options.exportMode]}`);
        }
        
        totalMessagesExported += messages.length;
        totalSessionsExported++;
      });
    }

    const summaryText = this.options.exportFormat === ExportFormat.BOTH ? 'messages' : {
      [ExportMode.PROMPTS_ONLY]: `prompts`,
      [ExportMode.FULL_CONVERSATION]: `messages`,
      [ExportMode.OUTPUTS_ONLY]: `outputs`
    }[this.options.exportMode];
    
    console.log(`\nExported ${totalSessionsExported} sessions (${totalMessagesExported} total ${summaryText}) to ${absoluteOutputDir}/`);
    
    return { 
      sessionsExported: totalSessionsExported, 
      totalMessages: totalMessagesExported,
      totalPrompts: totalMessagesExported
    };
  }

  private exportSessionMarkdown(outputDir: string, sessionId: string, messages: Message[], stats: SessionStats, title: string, timestamp: string): void {
    const suffix = this.getModeSuffix();
    const modePrefix = this.getModePrefix();
    // If using both formats, use new naming scheme, otherwise maintain backward compatibility
    const filename = this.options.exportFormat === ExportFormat.BOTH ?
      this.sanitizeFilename(`${modePrefix}-${timestamp}-${title}-${sessionId}.md`) :
      this.sanitizeFilename(`${sessionId}-${title}${suffix}.md`);
    const content = this.formatMarkdown(sessionId, messages, stats);
    
    fs.writeFileSync(path.join(outputDir, filename), content);
  }

  private exportSessionJSON(outputDir: string, sessionId: string, messages: Message[], stats: SessionStats, title: string, timestamp: string): void {
    const suffix = this.getModeSuffix();
    const modePrefix = this.getModePrefix();
    // If using both formats, use new naming scheme, otherwise use standard naming
    const filename = this.options.exportFormat === ExportFormat.BOTH ?
      this.sanitizeFilename(`${modePrefix}-${timestamp}-${title}-${sessionId}.json`) :
      this.sanitizeFilename(`${sessionId}-${title}${suffix}.json`);
    
    const jsonData = {
      sessionId,
      exportMode: this.options.exportMode,
      projectPath: this.projectPath,
      exportTimestamp: new Date().toISOString(),
      statistics: {
        total: messages.length,
        userMessages: stats.userMessages,
        assistantMessages: stats.assistantMessages,
        systemMessages: stats.systemMessages
      },
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        index: msg.index
      }))
    };
    
    fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(jsonData, null, 2));
  }

  private exportSessionTXT(outputDir: string, sessionId: string, messages: Message[], stats: SessionStats, title: string, timestamp: string): void {
    const suffix = this.getModeSuffix();
    const modePrefix = this.getModePrefix();
    // TXT files always use new naming scheme
    const filename = this.sanitizeFilename(`${modePrefix}-${timestamp}-${title}-${sessionId}.txt`);
    
    let content = `Claude Session Export
===================

Session ID: ${sessionId}
Export Mode: ${this.getExportModeLabel()}
Total Messages: ${messages.length}
Project Path: ${this.projectPath}
Export Date: ${new Date().toLocaleString()}

`;

    if (this.options.exportMode === ExportMode.OUTPUTS_ONLY) {
      content += 'ASSISTANT OUTPUTS\n';
      content += '=================\n\n';
      
      messages.forEach((msg, index) => {
        content += `Output ${index + 1} - ${new Date(msg.timestamp).toLocaleString()}\n`;
        content += '-'.repeat(50) + '\n';
        content += msg.content + '\n\n';
      });
    } else if (this.options.exportMode === ExportMode.PROMPTS_ONLY) {
      content += 'USER PROMPTS\n';
      content += '============\n\n';
      
      messages.forEach((msg, index) => {
        content += `Prompt ${index + 1} - ${new Date(msg.timestamp).toLocaleString()}\n`;
        content += '-'.repeat(50) + '\n';
        content += msg.content + '\n\n';
      });
    } else {
      content += 'FULL CONVERSATION\n';
      content += '================\n\n';
      
      messages.forEach((msg, index) => {
        const roleLabel = msg.role.toUpperCase();
        content += `[${roleLabel}] - ${new Date(msg.timestamp).toLocaleString()}\n`;
        content += '-'.repeat(50) + '\n';
        content += msg.content + '\n\n';
      });
    }
    
    fs.writeFileSync(path.join(outputDir, filename), content);
  }

  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  private generateTitle(messages: Message[], exportMode: ExportMode): string {
    // For full conversations, try to find the first user message
    let sourceContent = messages[0].content;
    
    if (exportMode === ExportMode.FULL_CONVERSATION) {
      const firstUserMessage = messages.find(m => m.role === MessageRole.USER);
      if (firstUserMessage) {
        sourceContent = firstUserMessage.content;
      }
    }
    
    // Extract meaningful title from content
    let title = sourceContent
      .split('\n')[0]  // Take first line
      .replace(/^(drop it\.?|real|actually|honestly)[\s,.]*/i, '') // Remove common prefixes
      .trim()
      .split(/[\s/]+/)
      .slice(0, 5)
      .join('-')
      .replace(/[^a-zA-Z0-9-]/g, '')
      .toLowerCase();

    return title.slice(0, 50) || 'untitled';
  }

  private sanitizeFilename(filename: string): string {
    // Ensure filename is safe for all operating systems
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove invalid characters
      .replace(/\s+/g, '-')                   // Replace spaces with dashes
      .replace(/--+/g, '-')                   // Replace multiple dashes with single
      .replace(/^-+|-+$/g, '');               // Remove leading/trailing dashes
  }

  private formatMarkdown(sessionId: string, messages: Message[], stats: SessionStats): string {
    const firstTimestamp = messages[0].timestamp;
    const lastTimestamp = messages[messages.length - 1].timestamp;
    
    let md = `# Claude Session Export\n\n`;
    md += `## Session Information\n\n`;
    md += `- **Session ID**: \`${sessionId}\`\n`;
    md += `- **Export Mode**: ${this.getExportModeLabel()}\n`;
    
    // Add message counts based on mode
    if (this.options.exportMode === ExportMode.FULL_CONVERSATION) {
      md += `- **Total Messages**: ${messages.length} (${stats.userMessages} user, ${stats.assistantMessages} assistant)\n`;
    } else if (this.options.exportMode === ExportMode.PROMPTS_ONLY) {
      md += `- **Total Prompts**: ${messages.length}\n`;
    } else if (this.options.exportMode === ExportMode.OUTPUTS_ONLY) {
      md += `- **Total Outputs**: ${messages.length}\n`;
    }
    
    md += `- **First Message**: ${new Date(firstTimestamp).toLocaleString()}\n`;
    md += `- **Last Message**: ${new Date(lastTimestamp).toLocaleString()}\n`;
    md += `- **Project Path**: \`${this.projectPath}\`\n\n`;
    md += `---\n\n`;

    if (this.options.exportMode === ExportMode.FULL_CONVERSATION) {
      md += `## Conversation\n\n`;
      messages.forEach((message, i) => {
        md += this.formatConversationMessage(message);
        if (i < messages.length - 1) {
          md += '---\n\n';
        }
      });
    } else {
      const titlePrefix = this.options.exportMode === ExportMode.OUTPUTS_ONLY ? 'Output' : 'Prompt';
      messages.forEach((message, i) => {
        md += `## ${titlePrefix} ${i + 1}\n\n`;
        md += `> ${new Date(message.timestamp).toLocaleString()}\n\n`;
        md += '```\n';
        md += message.content;
        md += '\n```\n\n';
        
        if (i < messages.length - 1) {
          md += '---\n\n';
        }
      });
    }

    return md;
  }

  private formatConversationMessage(message: Message): string {
    const roleLabel: Record<MessageRole, string> = {
      [MessageRole.USER]: 'User',
      [MessageRole.ASSISTANT]: 'Assistant',
      [MessageRole.SYSTEM]: 'System'
    };

    let md = `### ${roleLabel[message.role] || message.role}\n`;
    md += `> ${new Date(message.timestamp).toLocaleString()}\n\n`;
    
    // For code blocks or structured content
    if (message.content.includes('```') || message.isToolResult) {
      md += message.content + '\n\n';
    } else {
      // For regular text, don't wrap in code blocks
      md += message.content + '\n\n';
    }
    
    return md;
  }

  private getExportModeLabel(): string {
    const labels: Record<ExportMode, string> = {
      [ExportMode.PROMPTS_ONLY]: 'User Prompts Only',
      [ExportMode.FULL_CONVERSATION]: 'Full Conversation',
      [ExportMode.OUTPUTS_ONLY]: 'Assistant Outputs Only'
    };
    return labels[this.options.exportMode] || 'Unknown';
  }

  private getModeSuffix(): string {
    const suffixes: Record<ExportMode, string> = {
      [ExportMode.PROMPTS_ONLY]: '-prompts',
      [ExportMode.FULL_CONVERSATION]: '-full',
      [ExportMode.OUTPUTS_ONLY]: '-outputs'
    };
    return suffixes[this.options.exportMode] || '';
  }

  private getModePrefix(): string {
    const prefixes: Record<ExportMode, string> = {
      [ExportMode.PROMPTS_ONLY]: 'prompts',
      [ExportMode.FULL_CONVERSATION]: 'full-output',
      [ExportMode.OUTPUTS_ONLY]: 'outputs'
    };
    return prefixes[this.options.exportMode] || '';
  }

  // Export method for "Both" formats functionality
  private _exportInBothFormats(outputDir: string): ExportResult {
    // This is handled within the main export() method
    // when this.options.exportFormat === ExportFormat.BOTH
    return this.export(outputDir);
  }

  // Aggregate prompts across all projects
  public aggregate(outputDir: string = './aggregated-prompts'): ExportResult {
    const absoluteOutputDir = path.resolve(outputDir);
    fs.mkdirSync(absoluteOutputDir, { recursive: true });

    console.log('Claude Session Aggregator\n');
    console.log(`Aggregating prompts from all projects...\n`);

    // Find all project directories
    const allProjects = this.findAllProjects(this.claudeHome);
    
    if (allProjects.length === 0) {
      console.log('No projects found.');
      return { sessionsExported: 0, totalMessages: 0 };
    }

    console.log(`Found ${allProjects.length} projects to aggregate.\n`);

    const aggregatedData: Map<string, any> = new Map();
    let totalPromptsAggregated = 0;
    let totalSessionsProcessed = 0;

    // Process each project
    allProjects.forEach(projectDir => {
      const projectPath = this.decodeProjectPath(path.basename(projectDir));
      const sessions = this.getSessionFiles(projectDir);
      
      if (sessions.length === 0) return;

      const projectData = {
        projectPath,
        projectName: path.basename(projectPath),
        sessions: [] as any[],
        totalPrompts: 0,
        sessionCount: sessions.length,
        firstPrompt: null as Date | null,
        lastPrompt: null as Date | null
      };

      // Process each session
      sessions.forEach(sessionFile => {
        const sessionData = this.processSessionForAggregate(sessionFile);
        if (sessionData && sessionData.prompts.length > 0) {
          projectData.sessions.push(sessionData);
          projectData.totalPrompts += sessionData.prompts.length;
          totalPromptsAggregated += sessionData.prompts.length;
          totalSessionsProcessed++;

          // Update date range
          const firstDate = new Date(sessionData.prompts[0].timestamp);
          const lastDate = new Date(sessionData.prompts[sessionData.prompts.length - 1].timestamp);
          
          if (!projectData.firstPrompt || firstDate < projectData.firstPrompt) {
            projectData.firstPrompt = firstDate;
          }
          if (!projectData.lastPrompt || lastDate > projectData.lastPrompt) {
            projectData.lastPrompt = lastDate;
          }
        }
      });

      if (projectData.totalPrompts > 0) {
        // Sort sessions by timestamp
        projectData.sessions.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        aggregatedData.set(projectPath, projectData);
      }
    });

    // Export aggregated data
    if (aggregatedData.size === 0) {
      console.log('No prompts found to aggregate.');
      return { sessionsExported: 0, totalMessages: 0 };
    }

    // Export based on format
    const timestamp = this.getTimestamp();
    if (this.options.exportFormat === ExportFormat.JSON) {
      this.exportAggregatedJSON(absoluteOutputDir, aggregatedData, timestamp);
    } else if (this.options.exportFormat === ExportFormat.TXT) {
      this.exportAggregatedTXT(absoluteOutputDir, aggregatedData, timestamp);
    } else {
      // Default to markdown
      this.exportAggregatedMarkdown(absoluteOutputDir, aggregatedData, timestamp);
    }

    console.log(`\nAggregated ${aggregatedData.size} projects (${totalPromptsAggregated} total prompts from ${totalSessionsProcessed} sessions) to ${absoluteOutputDir}/`);

    return {
      sessionsExported: totalSessionsProcessed,
      totalMessages: totalPromptsAggregated,
      totalPrompts: totalPromptsAggregated
    };
  }

  // Helper methods for aggregation
  private findAllProjects(claudeProjectsPath: string): string[] {
    const projects: string[] = [];
    try {
      const entries = fs.readdirSync(claudeProjectsPath);
      for (const entry of entries) {
        const fullPath = path.join(claudeProjectsPath, entry);
        if (fs.statSync(fullPath).isDirectory() && entry.startsWith('-')) {
          projects.push(fullPath);
        }
      }
    } catch (error) {
      this.log(`Error reading projects directory: ${error.message}`);
    }
    return projects;
  }

  private getSessionFiles(projectDir: string): string[] {
    const sessions: string[] = [];
    try {
      const entries = fs.readdirSync(projectDir);
      for (const entry of entries) {
        if (entry.endsWith('.jsonl')) {
          sessions.push(path.join(projectDir, entry));
        }
      }
    } catch (error) {
      this.log(`Error reading session files: ${error.message}`);
    }
    return sessions;
  }

  private decodeProjectPath(encodedPath: string): string {
    // Reverse Claude's encoding: - becomes / or _
    return encodedPath
      .replace(/^-/, '/')
      .replace(/-/g, '/')
      .replace(/_/g, '_');
  }

  private processSessionForAggregate(sessionFile: string): any {
    const sessionId = path.basename(sessionFile, '.jsonl');
    const prompts: any[] = [];
    
    try {
      const content = fs.readFileSync(sessionFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      lines.forEach((line, index) => {
        try {
          const data = JSON.parse(line);
          if (data.message && data.message.role === 'user') {
            const content = this.extractTextContent(data.message.content);
            if (content && !this.isSystemGenerated(content)) {
              prompts.push({
                index: prompts.length,
                timestamp: data.timestamp || new Date().toISOString(),
                content: content
              });
            }
          }
        } catch (e) {
          // Skip invalid lines
        }
      });
      
      if (prompts.length > 0) {
        return {
          sessionId,
          timestamp: prompts[0].timestamp,
          prompts
        };
      }
    } catch (error) {
      this.log(`Error processing session ${sessionId}: ${error.message}`);
    }
    
    return null;
  }

  private extractTextContent(content: any): string {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('\n\n');
    }
    if (content && typeof content === 'object' && content.text) {
      return content.text;
    }
    return '';
  }

  private exportAggregatedMarkdown(outputDir: string, aggregatedData: Map<string, any>, timestamp: string): void {
    aggregatedData.forEach((projectData, projectPath) => {
      const filename = `aggregated-${timestamp}-${this.sanitizeFilename(projectData.projectName)}.md`;
      let content = `# Aggregated Prompts for ${projectData.projectName}\n\n`;
      content += `**Project**: \`${projectPath}\`\n`;
      content += `**Sessions**: ${projectData.sessionCount}\n`;
      content += `**Total Prompts**: ${projectData.totalPrompts}\n`;
      content += `**Date Range**: ${projectData.firstPrompt?.toLocaleDateString()} to ${projectData.lastPrompt?.toLocaleDateString()}\n\n`;
      
      projectData.sessions.forEach((session: any) => {
        content += `## Session: ${session.sessionId} (${new Date(session.timestamp).toLocaleDateString()})\n\n`;
        
        session.prompts.forEach((prompt: any, index: number) => {
          content += `### Prompt ${index + 1} - ${new Date(prompt.timestamp).toLocaleString()}\n\n`;
          content += '```\n';
          content += prompt.content;
          content += '\n```\n\n';
          
          if (index < session.prompts.length - 1) {
            content += '---\n\n';
          }
        });
        
        content += '\n---\n\n';
      });
      
      fs.writeFileSync(path.join(outputDir, filename), content);
      console.log(`✓ ${projectData.projectName}: ${projectData.totalPrompts} prompts from ${projectData.sessionCount} sessions`);
    });
  }

  private exportAggregatedJSON(outputDir: string, aggregatedData: Map<string, any>, timestamp: string): void {
    const allData = {
      aggregationType: 'project',
      aggregatedAt: new Date().toISOString(),
      projects: Array.from(aggregatedData.values())
    };
    
    const filename = `aggregated-${timestamp}.json`;
    fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(allData, null, 2));
    
    aggregatedData.forEach((projectData) => {
      console.log(`✓ ${projectData.projectName}: ${projectData.totalPrompts} prompts from ${projectData.sessionCount} sessions`);
    });
  }

  private exportAggregatedTXT(outputDir: string, aggregatedData: Map<string, any>, timestamp: string): void {
    aggregatedData.forEach((projectData, projectPath) => {
      const filename = `aggregated-${timestamp}-${this.sanitizeFilename(projectData.projectName)}.txt`;
      let content = 'AGGREGATED PROMPTS\n';
      content += '==================\n\n';
      content += `Project: ${projectPath}\n`;
      content += `Sessions: ${projectData.sessionCount}\n`;
      content += `Total Prompts: ${projectData.totalPrompts}\n`;
      content += `Date Range: ${projectData.firstPrompt?.toLocaleDateString()} to ${projectData.lastPrompt?.toLocaleDateString()}\n\n`;
      
      projectData.sessions.forEach((session: any) => {
        content += '='.repeat(80) + '\n';
        content += `SESSION: ${session.sessionId} (${new Date(session.timestamp).toLocaleDateString()})\n`;
        content += '='.repeat(80) + '\n\n';
        
        session.prompts.forEach((prompt: any) => {
          content += `[${new Date(prompt.timestamp).toLocaleString()}]\n`;
          content += '-'.repeat(50) + '\n';
          content += prompt.content + '\n\n';
        });
        
        content += '\n';
      });
      
      fs.writeFileSync(path.join(outputDir, filename), content);
      console.log(`✓ ${projectData.projectName}: ${projectData.totalPrompts} prompts from ${projectData.sessionCount} sessions`);
    });
  }

  // Static method for CLI version info
  static getVersion(): string {
    // This would be imported from package.json in a real implementation
    return '1.0.0';
  }

  // Export static constants for external use
  static get ExportMode() {
    return ExportMode;
  }

  static get ExportFormat() {
    return ExportFormat;
  }
}