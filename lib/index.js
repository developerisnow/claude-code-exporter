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
    
    const index = readlineSync.questionInt(`\nWhich would you like to use? [1-${availableHomes.length}]: `, {
      min: 1,
      max: availableHomes.length
    });
    
    const selected = availableHomes[index - 1];
    console.log(`Using: ${selected}\n`);
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

  extractMessages() {
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

    return { sessionId, messages, stats };
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

  exportToMarkdown(outputDir = './claude-prompts') {
    const absoluteOutputDir = path.resolve(outputDir);
    const sessions = this.extractMessages();
    
    if (sessions.length === 0) {
      const modeText = {
        [ExportMode.PROMPTS_ONLY]: 'user prompts',
        [ExportMode.FULL_CONVERSATION]: 'messages',
        [ExportMode.OUTPUTS_ONLY]: 'assistant outputs'
      }[this.options.exportMode];
      console.log(`No sessions with ${modeText} found.`);
      return { sessionsExported: 0, totalMessages: 0 };
    }

    // Create output directory
    fs.mkdirSync(absoluteOutputDir, { recursive: true });

    let totalMessages = 0;

    sessions.forEach(({ sessionId, messages, stats }) => {
      const title = this.generateTitle(messages, this.options.exportMode);
      const suffix = this.getModeSuffix();
      const filename = this.sanitizeFilename(`${sessionId}-${title}${suffix}.md`);
      const content = this.formatMarkdown(sessionId, messages, stats);
      
      fs.writeFileSync(path.join(absoluteOutputDir, filename), content);
      
      const countText = {
        [ExportMode.PROMPTS_ONLY]: `${messages.length} prompts`,
        [ExportMode.FULL_CONVERSATION]: `${messages.length} messages`,
        [ExportMode.OUTPUTS_ONLY]: `${messages.length} outputs`
      }[this.options.exportMode];
      
      console.log(`✓ ${sessionId}: ${countText}`);
      totalMessages += messages.length;
    });

    const summaryText = {
      [ExportMode.PROMPTS_ONLY]: `prompts`,
      [ExportMode.FULL_CONVERSATION]: `messages`,
      [ExportMode.OUTPUTS_ONLY]: `outputs`
    }[this.options.exportMode];
    
    console.log(`\nExported ${sessions.length} sessions (${totalMessages} total ${summaryText}) to ${absoluteOutputDir}/`);
    
    return { sessionsExported: sessions.length, totalMessages, totalPrompts: totalMessages };
  }

  generateTitle(messages, exportMode) {
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

  // Static method for CLI version info
  static getVersion() {
    const packageJson = require('../package.json');
    return packageJson.version;
  }

  // Export static constants for external use
  static get ExportMode() {
    return ExportMode;
  }
}

module.exports = ClaudePromptExporter;
