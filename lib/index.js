const fs = require('fs');
const path = require('path');
const os = require('os');
const readlineSync = require('readline-sync');

// Export modes
const ExportMode = {
  PROMPTS_ONLY: 'prompts',
  FULL_CONVERSATION: 'full',
  OUTPUTS_ONLY: 'outputs'
};

// Export formats
const ExportFormat = {
  MARKDOWN: 'markdown',
  JSON: 'json',
  BOTH: 'both'
};

// Message roles
const MessageRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system'
};

class ClaudePromptExporter {
  constructor(projectPath, options = {}) {
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
      ...options
    };
    
    // Resolve Claude home directory with support for multiple locations
    const baseClaudeHome = this._resolveClaudeHome(options);
    this.claudeHome = path.join(baseClaudeHome, 'projects');
    
    if (!fs.existsSync(this.claudeHome)) {
      throw new Error(`Claude projects directory not found at ${this.claudeHome}. Please ensure Claude Code is installed.`);
    }
  }

  log(message) {
    if (this.options.verbose) {
      console.log(`[DEBUG] ${message}`);
    }
  }

  _resolveClaudeHome(options) {
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

  _detectClaudeHomes() {
    const homes = [];
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

  _promptForClaudeHome(availableHomes) {
    console.log('\nMultiple Claude home directories found:');
    availableHomes.forEach((home, index) => {
      console.log(`${index + 1}) ${home}`);
    });
    
    // Prefer ~/.config/claude as default
    const defaultIndex = availableHomes.findIndex(home => home.includes('.config/claude')) + 1 || 1;
    console.log(`Defaulting to: ${defaultIndex}) ${availableHomes[defaultIndex - 1]}`);
    
    let index;
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

  promptForExportMode() {
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
    
    const labels = {
      [ExportMode.PROMPTS_ONLY]: 'Prompts Only',
      [ExportMode.OUTPUTS_ONLY]: 'Outputs Only',
      [ExportMode.FULL_CONVERSATION]: 'Both: Prompts and Outputs'
    };
    
    console.log(`Using: ${Math.min(Math.max(choice, 1), 3)}) ${labels[selected]}\n`);
    this.options.exportMode = selected;
    return selected;
  }

  promptForExportFormat() {
    if (!this.options.interactive || this.options.exportFormat !== ExportFormat.MARKDOWN) {
      return this.options.exportFormat;
    }

    console.log('\nChoose a format:');
    console.log('1) Markdown');
    console.log('2) JSON');
    console.log('3) Both: Markdown and JSON');
    console.log('Defaulting to: 1) Markdown');
    
    const answer = readlineSync.question('What do you want to export? [1-3]: ', {
      defaultInput: '1'
    });
    const choice = parseInt(answer) || 1;
    
    const formats = [ExportFormat.MARKDOWN, ExportFormat.JSON, ExportFormat.BOTH];
    const selected = formats[Math.min(Math.max(choice - 1, 0), 2)];
    
    const labels = {
      [ExportFormat.MARKDOWN]: 'Markdown',
      [ExportFormat.JSON]: 'JSON',
      [ExportFormat.BOTH]: 'Both: Markdown and JSON'
    };
    
    console.log(`Using: ${Math.min(Math.max(choice, 1), 3)}) ${labels[selected]}\n`);
    this.options.exportFormat = selected;
    return selected;
  }

  encodePath(projectPath) {
    // Claude's encoding: / becomes -, _ becomes -
    // Example: /Users/user/__Repositories/yourproject → -Users-user---Repositories-yourproject
    return projectPath
      .replace(/\//g, '-')   // Replace slashes with dashes
      .replace(/_/g, '-');   // Replace underscores with dashes
  }

  findSessionDirectory() {
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

  calculateSimilarity(str1, str2) {
    // Simple similarity score based on common substrings
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
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

  parsePeriod(period) {
    if (!period) return null;
    
    const match = period.match(/^(\d+)([dwmy])$/);
    if (!match) {
      throw new Error(`Invalid period format: ${period}. Use format like 7d, 2w, 3m, 1y`);
    }
    
    const [, value, unit] = match;
    const num = parseInt(value);
    const now = new Date();
    const start = new Date(now);
    
    switch (unit) {
      case 'd':
        start.setDate(start.getDate() - num);
        break;
      case 'w':
        start.setDate(start.getDate() - (num * 7));
        break;
      case 'm':
        start.setMonth(start.getMonth() - num);
        break;
      case 'y':
        start.setFullYear(start.getFullYear() - num);
        break;
    }
    
    return { start, end: now };
  }

  validatePeriodGroup(period, periodGroup) {
    if (!periodGroup) return true;
    
    const periodMatch = period.match(/^(\d+)([dwmy])$/);
    if (!periodMatch) return false;
    
    const [, periodValue, periodUnit] = periodMatch;
    const periodNum = parseInt(periodValue);
    
    // Validate that period group is not larger than the period range
    const validations = {
      'd': { d: true, w: periodNum >= 7, m: periodNum >= 30, y: periodNum >= 365 },
      'w': { d: false, w: true, m: periodNum >= 4, y: periodNum >= 52 },
      'm': { d: false, w: false, m: true, y: periodNum >= 12 },
      'y': { d: false, w: false, m: false, y: true }
    };
    
    return validations[periodUnit]?.[periodGroup] || false;
  }

  getGroupKey(date, periodGroup) {
    const d = new Date(date);
    
    switch (periodGroup) {
      case 'd':
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
      case 'w':
        // Get week number
        const onejan = new Date(d.getFullYear(), 0, 1);
        const weekNum = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
        return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
      case 'm':
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      case 'y':
        return d.getFullYear().toString();
      default:
        return 'all';
    }
  }

  extractMessages() {
    const sessionDir = this.findSessionDirectory();
    const sessionFiles = fs.readdirSync(sessionDir)
      .filter(f => f.endsWith('.jsonl'));

    if (sessionFiles.length === 0) {
      throw new Error('No session files found in the project directory');
    }

    this.log(`Found ${sessionFiles.length} session file(s)`);

    // Parse period if provided
    const dateRange = this.options.period ? this.parsePeriod(this.options.period) : null;

    const sessions = sessionFiles.map(file => {
      try {
        const session = this.processSession(path.join(sessionDir, file));
        
        // Filter by date range if period is specified
        if (dateRange && session.messages.length > 0) {
          const firstMessageDate = new Date(session.messages[0].timestamp);
          const lastMessageDate = new Date(session.messages[session.messages.length - 1].timestamp);
          
          // Check if session overlaps with the date range
          if (lastMessageDate < dateRange.start || firstMessageDate > dateRange.end) {
            return null;
          }
          
          // Filter messages within the date range
          session.messages = session.messages.filter(msg => {
            const msgDate = new Date(msg.timestamp);
            return msgDate >= dateRange.start && msgDate <= dateRange.end;
          });
          
          // Recalculate stats
          if (session.messages.length > 0) {
            session.stats = {
              userMessages: session.messages.filter(m => m.role === MessageRole.USER).length,
              assistantMessages: session.messages.filter(m => m.role === MessageRole.ASSISTANT).length,
              systemMessages: session.messages.filter(m => m.role === MessageRole.SYSTEM).length
            };
            session.lastTimestamp = session.messages[session.messages.length - 1].timestamp;
          }
        }
        
        return session;
      } catch (error) {
        console.error(`Error processing ${file}: ${error.message}`);
        return null;
      }
    }).filter(Boolean);

    return sessions.filter(s => s.messages.length > 0);
  }

  // Backward compatibility method
  extractPrompts() {
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

  processSession(filepath) {
    const sessionId = path.basename(filepath, '.jsonl');
    const messages = [];
    const stats = {
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
            stats.skippedMessages++;
          }
        }
      } catch (error) {
        this.log(`Skipping invalid JSON at line ${index + 1}: ${error.message}`);
      }
    });

    const modeText = {
      [ExportMode.PROMPTS_ONLY]: `${stats.userMessages} prompts`,
      [ExportMode.FULL_CONVERSATION]: `${stats.userMessages} user, ${stats.assistantMessages} assistant messages`,
      [ExportMode.OUTPUTS_ONLY]: `${stats.assistantMessages} outputs`
    }[this.options.exportMode];
    
    this.log(`Session ${sessionId}: ${modeText} found, ${stats.skippedMessages} skipped`);

    // Get last message timestamp
    const lastTimestamp = messages.length > 0 ? messages[messages.length - 1].timestamp : null;
    
    return { sessionId, messages, stats, lastTimestamp };
  }

  extractMessage(data, index) {
    if (!data.message || !data.message.role) {
      return null;
    }

    const { role, content } = data.message;
    
    // Handle different content types
    let processedContent = content;
    if (typeof content !== 'string') {
      // For non-string content (arrays, objects), stringify for full mode
      if (this.options.exportMode === ExportMode.FULL_CONVERSATION) {
        processedContent = JSON.stringify(content, null, 2);
      } else {
        return null;
      }
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

  shouldIncludeMessage(message) {
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

  isToolResult(content) {
    if (typeof content !== 'string') return false;
    const trimmed = content.trim();
    return (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
           (trimmed.startsWith('{') && trimmed.endsWith('}'));
  }

  isSystemGenerated(content) {
    if (typeof content !== 'string') return false;
    const skipPatterns = [
      'Caveat: The messages below were generated by the user while running local commands',
      '<command-name>',
      '<local-command-stdout>',
      '<local-command-stderr>'
    ];
    return skipPatterns.some(pattern => content.includes(pattern));
  }

  filterMessagesForMode(messages, mode) {
    return messages.filter(message => {
      switch (mode) {
        case ExportMode.PROMPTS_ONLY:
          return message.role === MessageRole.USER && !message.isToolResult && !message.isSystemGenerated;
        case ExportMode.OUTPUTS_ONLY:
          return message.role === MessageRole.ASSISTANT && !message.isToolResult && !message.isSystemGenerated;
        case ExportMode.FULL_CONVERSATION:
          return !message.isToolResult && !message.isSystemGenerated;
        default:
          return false;
      }
    });
  }

  exportToMarkdown(outputDir = './claude-prompts') {
    return this.export(outputDir);
  }

  export(outputDir = './claude-prompts') {
    const absoluteOutputDir = path.resolve(outputDir);
    
    // Create output directory
    fs.mkdirSync(absoluteOutputDir, { recursive: true });

    let totalSessionsExported = 0;
    let totalMessagesExported = 0;

    // Handle aggregate mode
    if (this.options.aggregate) {
      return this.exportAggregate(absoluteOutputDir);
    }

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
          if (modeMessages.length > 0) {
            // Recalculate stats for the filtered messages
            const modeStats = {
              userMessages: modeMessages.filter(m => m.role === MessageRole.USER).length,
              assistantMessages: modeMessages.filter(m => m.role === MessageRole.ASSISTANT).length,
              systemMessages: modeMessages.filter(m => m.role === MessageRole.SYSTEM).length
            };
            this.exportSessionMarkdown(sessionOutputDir, sessionId, modeMessages, modeStats, title, timestamp);
            this.exportSessionJSON(sessionOutputDir, sessionId, modeMessages, modeStats, title, timestamp);
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
        const modeText = {
          [ExportMode.PROMPTS_ONLY]: 'user prompts',
          [ExportMode.FULL_CONVERSATION]: 'messages',
          [ExportMode.OUTPUTS_ONLY]: 'assistant outputs'
        }[this.options.exportMode] || 'messages';
        console.log(`No sessions with ${modeText} found.`);
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
        }
        
        // Enhanced statistics display
        const lastActivity = lastTimestamp ? new Date(lastTimestamp).toLocaleString() : 'Unknown';
        if (this.options.exportMode === ExportMode.FULL_CONVERSATION) {
          console.log(`✓ ${sessionId}: ${messages.length} messages (${stats.userMessages} user, ${stats.assistantMessages} assistant) last ${lastActivity}`);
        } else {
          const countText = {
            [ExportMode.PROMPTS_ONLY]: `${messages.length} prompts`,
            [ExportMode.OUTPUTS_ONLY]: `${messages.length} outputs`
          }[this.options.exportMode];
          console.log(`✓ ${sessionId}: ${countText}`);
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

  exportSessionMarkdown(outputDir, sessionId, messages, stats, title, timestamp) {
    const suffix = this.getModeSuffix();
    const modePrefix = this.getModePrefix();
    const ext = this.getFileExtension();
    // If using both formats, use new naming scheme, otherwise maintain backward compatibility
    const filename = this.options.exportFormat === ExportFormat.BOTH ?
      this.sanitizeFilename(`${modePrefix}-${timestamp}-${title}-${sessionId}${ext}`) :
      this.sanitizeFilename(`${sessionId}-${title}${suffix}${ext}`);
    const content = this.formatMarkdown(sessionId, messages, stats);
    
    fs.writeFileSync(path.join(outputDir, filename), content);
  }

  exportSessionJSON(outputDir, sessionId, messages, stats, title, timestamp) {
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

  getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  generateTitle(messages, exportMode) {
    if (!messages || messages.length === 0) {
      return 'empty-session';
    }
    
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

  sanitizeFilename(filename) {
    // Ensure filename is safe for all operating systems
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove invalid characters
      .replace(/\s+/g, '-')                   // Replace spaces with dashes
      .replace(/--+/g, '-')                   // Replace multiple dashes with single
      .replace(/^-+|-+$/g, '');               // Remove leading/trailing dashes
  }

  formatMarkdown(sessionId, messages, stats) {
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

  formatConversationMessage(message) {
    const roleLabel = {
      [MessageRole.USER]: 'User',
      [MessageRole.ASSISTANT]: 'Assistant',
      [MessageRole.SYSTEM]: 'System'
    }[message.role] || message.role;

    let md = `### ${roleLabel}\n`;
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

  getExportModeLabel() {
    return {
      [ExportMode.PROMPTS_ONLY]: 'User Prompts Only',
      [ExportMode.FULL_CONVERSATION]: 'Full Conversation',
      [ExportMode.OUTPUTS_ONLY]: 'Assistant Outputs Only'
    }[this.options.exportMode] || 'Unknown';
  }

  getModeSuffix() {
    return {
      [ExportMode.PROMPTS_ONLY]: '-prompts',
      [ExportMode.FULL_CONVERSATION]: '-full',
      [ExportMode.OUTPUTS_ONLY]: '-outputs'
    }[this.options.exportMode] || '';
  }

  getModePrefix() {
    return {
      [ExportMode.PROMPTS_ONLY]: 'prompts',
      [ExportMode.FULL_CONVERSATION]: 'full-output',
      [ExportMode.OUTPUTS_ONLY]: 'outputs'
    }[this.options.exportMode] || '';
  }

  getFileExtension() {
    // Use .txt for full and outputs modes to avoid Obsidian indexing
    if (this.options.exportMode === ExportMode.FULL_CONVERSATION || 
        this.options.exportMode === ExportMode.OUTPUTS_ONLY) {
      return '.txt';
    }
    // Keep .md for prompts only
    return '.md';
  }

  exportAggregate(outputDir) {
    const allClaudeHomes = this._detectAllClaudeHomes();
    let allSessions = [];
    let totalSessionsExported = 0;
    let totalMessagesExported = 0;

    // Process all Claude homes
    for (const claudeHome of allClaudeHomes) {
      this.log(`Processing Claude home: ${claudeHome}`);
      const projectsDir = path.join(claudeHome, 'projects');
      
      if (!fs.existsSync(projectsDir)) {
        this.log(`Projects directory not found at ${projectsDir}, skipping`);
        continue;
      }

      // Get all project directories
      const projectDirs = fs.readdirSync(projectsDir)
        .filter(dir => fs.statSync(path.join(projectsDir, dir)).isDirectory());

      for (const projectDir of projectDirs) {
        try {
          const sessionDir = path.join(projectsDir, projectDir);
          const sessionFiles = fs.readdirSync(sessionDir)
            .filter(f => f.endsWith('.jsonl'));

          if (sessionFiles.length === 0) continue;

          // Temporarily set claudeHome for this project
          const originalHome = this.claudeHome;
          this.claudeHome = projectsDir;

          // Extract sessions
          const sessions = sessionFiles.map(file => {
            try {
              return this.processSession(path.join(sessionDir, file));
            } catch (error) {
              this.log(`Error processing ${file}: ${error.message}`);
              return null;
            }
          }).filter(Boolean);

          // Apply period filtering if specified
          const filteredSessions = this.options.period ? 
            sessions.filter(s => s.messages.length > 0) : sessions;

          // Add project info to sessions
          filteredSessions.forEach(session => {
            session.projectPath = this._decodeProjectPath(projectDir);
            session.claudeHome = claudeHome;
          });

          allSessions = allSessions.concat(filteredSessions);
          this.claudeHome = originalHome;
        } catch (error) {
          this.log(`Error processing project ${projectDir}: ${error.message}`);
        }
      }
    }

    if (allSessions.length === 0) {
      console.log('No sessions found across all projects.');
      return { sessionsExported: 0, totalMessages: 0 };
    }

    // Export based on nested option
    this.log(`Aggregate export - nested: ${this.options.nested}, periodGroup: ${this.options.periodGroup}`);
    
    if (this.options.nested && this.options.periodGroup) {
      // Validate period group
      if (this.options.period && !this.validatePeriodGroup(this.options.period, this.options.periodGroup)) {
        throw new Error(`Period group '${this.options.periodGroup}' is too large for period '${this.options.period}'`);
      }
      this.log('Using nested export with period grouping');
      return this.exportAggregateNested(outputDir, allSessions);
    } else {
      this.log('Using flat export');
      return this.exportAggregateFlat(outputDir, allSessions);
    }
  }

  exportAggregateNested(outputDir, allSessions) {
    let totalSessionsExported = 0;
    let totalMessagesExported = 0;

    // Group sessions by period group
    const grouped = {};
    allSessions.forEach(session => {
      if (session.messages.length === 0) return;
      
      const lastMessage = session.messages[session.messages.length - 1];
      const groupKey = this.getGroupKey(lastMessage.timestamp, this.options.periodGroup);
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(session);
    });

    // Export each group to its own directory
    Object.entries(grouped).forEach(([groupKey, sessions]) => {
      const groupDir = path.join(outputDir, groupKey);
      fs.mkdirSync(groupDir, { recursive: true });

      sessions.forEach(session => {
        const title = this.generateTitle(session.messages, this.options.exportMode);
        const timestamp = this.getTimestamp();
        const ext = this.getFileExtension();

        if (this.options.exportFormat === ExportFormat.MARKDOWN || 
            this.options.exportFormat === ExportFormat.BOTH) {
          this.exportSessionMarkdown(groupDir, session.sessionId, session.messages, 
            session.stats, title, timestamp);
        }
        
        if (this.options.exportFormat === ExportFormat.JSON || 
            this.options.exportFormat === ExportFormat.BOTH) {
          this.exportSessionJSON(groupDir, session.sessionId, session.messages, 
            session.stats, title, timestamp);
        }

        totalSessionsExported++;
        totalMessagesExported += session.messages.length;
      });

      console.log(`✓ ${groupKey}: ${sessions.length} sessions, ${sessions.reduce((sum, s) => sum + s.messages.length, 0)} messages`);
    });

    console.log(`\nExported ${totalSessionsExported} sessions (${totalMessagesExported} total messages) to ${outputDir}/`);
    return { sessionsExported: totalSessionsExported, totalMessages: totalMessagesExported };
  }

  exportAggregateFlat(outputDir, allSessions) {
    let totalSessionsExported = 0;
    let totalMessagesExported = 0;

    allSessions.forEach(session => {
      if (session.messages.length === 0) return; // Skip empty sessions
      
      const title = this.generateTitle(session.messages, this.options.exportMode);
      const timestamp = this.getTimestamp();
      const projectName = path.basename(session.projectPath);

      if (this.options.exportFormat === ExportFormat.MARKDOWN || 
          this.options.exportFormat === ExportFormat.BOTH) {
        this.exportSessionMarkdown(outputDir, `${projectName}-${session.sessionId}`, 
          session.messages, session.stats, title, timestamp);
      }
      
      if (this.options.exportFormat === ExportFormat.JSON || 
          this.options.exportFormat === ExportFormat.BOTH) {
        this.exportSessionJSON(outputDir, `${projectName}-${session.sessionId}`, 
          session.messages, session.stats, title, timestamp);
      }

      totalSessionsExported++;
      totalMessagesExported += session.messages.length;
    });

    console.log(`\nExported ${totalSessionsExported} sessions (${totalMessagesExported} total messages) to ${outputDir}/`);
    return { sessionsExported: totalSessionsExported, totalMessages: totalMessagesExported };
  }

  _detectAllClaudeHomes() {
    if (this.options.bothDirs || (!this.options.claudeHome && this.options.aggregate)) {
      // Return all available Claude homes
      return this._detectClaudeHomes();
    } else {
      // Return just the current Claude home
      const baseHome = this._resolveClaudeHome(this.options);
      return [baseHome];
    }
  }

  _decodeProjectPath(encodedPath) {
    // Claude's encoding: / becomes -, _ becomes -
    // So we need to carefully decode, handling the ambiguity
    // For now, simple approach: all dashes become slashes
    return encodedPath.replace(/-/g, '/');
  }

  // Static method for CLI version info
  static getVersion() {
    const packageJson = require('../package.json');
    return packageJson.version;
  }

  // Export static constants for external use
  static get ExportMode() {
    return ExportMode;
  }

  static get ExportFormat() {
    return ExportFormat;
  }
}

module.exports = ClaudePromptExporter;
