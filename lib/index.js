const fs = require('fs');
const path = require('path');

class ClaudePromptExporter {
  constructor(projectPath, options = {}) {
    if (!projectPath) {
      throw new Error('Project path is required');
    }

    this.projectPath = path.resolve(projectPath);
    this.options = {
      verbose: options.verbose || false,
      ...options
    };
    
    this.claudeHome = path.join(process.env.HOME || process.env.USERPROFILE, '.claude', 'projects');
    
    if (!fs.existsSync(this.claudeHome)) {
      throw new Error('Claude home directory not found. Please ensure Claude Code is installed.');
    }
  }

  log(message) {
    if (this.options.verbose) {
      console.log(`[DEBUG] ${message}`);
    }
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

  extractPrompts() {
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

    return sessions.filter(s => s.prompts.length > 0);
  }

  processSession(filepath) {
    const sessionId = path.basename(filepath, '.jsonl');
    const prompts = [];
    const stats = {
      totalLines: 0,
      userMessages: 0,
      skippedMessages: 0
    };

    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    stats.totalLines = lines.length;

    lines.forEach((line, index) => {
      try {
        const data = JSON.parse(line);
        
        if (this.isUserPrompt(data)) {
          prompts.push({
            content: data.message.content,
            timestamp: data.timestamp || new Date().toISOString(),
            index: index
          });
          stats.userMessages++;
        } else if (data.message?.role === 'user') {
          stats.skippedMessages++;
        }
      } catch (error) {
        this.log(`Skipping invalid JSON at line ${index + 1}: ${error.message}`);
      }
    });

    this.log(`Session ${sessionId}: ${stats.userMessages} prompts found, ${stats.skippedMessages} skipped`);

    return { sessionId, prompts, stats };
  }

  isUserPrompt(data) {
    if (!data.message || data.message.role !== 'user' || !data.message.content) {
      return false;
    }

    const content = data.message.content;
    
    // Skip if content is not a string (e.g., arrays or objects)
    if (typeof content !== 'string') {
      return false;
    }
    
    // Skip if content is a stringified JSON object/array (tool results)
    const trimmed = content.trim();
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
        (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      return false;
    }
    
    // Skip system-generated messages
    const skipPatterns = [
      'Caveat: The messages below were generated by the user while running local commands',
      '<command-name>',
      '<local-command-stdout>',
      '<local-command-stderr>'
    ];

    return !skipPatterns.some(pattern => content.includes(pattern));
  }

  exportToMarkdown(outputDir = './claude-prompts') {
    const absoluteOutputDir = path.resolve(outputDir);
    const sessions = this.extractPrompts();
    
    if (sessions.length === 0) {
      console.log('No sessions with user prompts found.');
      return { sessionsExported: 0, totalPrompts: 0 };
    }

    // Create output directory
    fs.mkdirSync(absoluteOutputDir, { recursive: true });

    let totalPrompts = 0;

    sessions.forEach(({ sessionId, prompts }) => {
      const title = this.generateTitle(prompts[0].content);
      const filename = this.sanitizeFilename(`${sessionId}-${title}.md`);
      const content = this.formatMarkdown(sessionId, prompts);
      
      fs.writeFileSync(path.join(absoluteOutputDir, filename), content);
      console.log(`✓ ${sessionId}: ${prompts.length} prompts`);
      totalPrompts += prompts.length;
    });

    console.log(`\nExported ${sessions.length} sessions (${totalPrompts} total prompts) to ${absoluteOutputDir}/`);
    
    return { sessionsExported: sessions.length, totalPrompts };
  }

  generateTitle(firstPrompt) {
    // Extract meaningful title from first prompt
    let title = firstPrompt
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

  formatMarkdown(sessionId, prompts) {
    const firstTimestamp = prompts[0].timestamp;
    const lastTimestamp = prompts[prompts.length - 1].timestamp;
    
    let md = `# Claude Code Session Export\n\n`;
    md += `## Session Information\n\n`;
    md += `- **Session ID**: \`${sessionId}\`\n`;
    md += `- **Total Prompts**: ${prompts.length}\n`;
    md += `- **First Prompt**: ${new Date(firstTimestamp).toLocaleString()}\n`;
    md += `- **Last Prompt**: ${new Date(lastTimestamp).toLocaleString()}\n`;
    md += `- **Project Path**: \`${this.projectPath}\`\n\n`;
    md += `---\n\n`;

    prompts.forEach((prompt, i) => {
      md += `## Prompt ${i + 1}\n\n`;
      md += `> ${new Date(prompt.timestamp).toLocaleString()}\n\n`;
      md += '```\n';
      md += prompt.content;
      md += '\n```\n\n';
      
      if (i < prompts.length - 1) {
        md += '---\n\n';
      }
    });

    return md;
  }

  // Static method for CLI version info
  static getVersion() {
    const packageJson = require('../package.json');
    return packageJson.version;
  }
}

module.exports = ClaudePromptExporter;
