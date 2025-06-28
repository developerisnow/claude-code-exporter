// Utility functions for Claude Code Exporter MCP Server

import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Configuration constants
 */
export const CONFIG = {
  MAX_PATH_LENGTH: 1024,
  MAX_OUTPUT_DIR_LENGTH: 512,
  MAX_PROJECTS_TO_PROCESS: 1000,
  REQUEST_TIMEOUT_MS: 300000, // 5 minutes
  LOG_LEVELS: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  },
  CURRENT_LOG_LEVEL: process.env.MCP_LOG_LEVEL || 'INFO'
};

/**
 * Logger utility class
 */
export class Logger {
  constructor(name) {
    this.name = name;
    this.level = CONFIG.LOG_LEVELS[CONFIG.CURRENT_LOG_LEVEL] || CONFIG.LOG_LEVELS.INFO;
  }

  _log(level, message, data = {}) {
    if (CONFIG.LOG_LEVELS[level] > this.level) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      component: this.name,
      message,
      ...data
    };
    
    console.error(JSON.stringify(logEntry));
  }

  error(message, data) { this._log('ERROR', message, data); }
  warn(message, data) { this._log('WARN', message, data); }
  info(message, data) { this._log('INFO', message, data); }
  debug(message, data) { this._log('DEBUG', message, data); }
}

/**
 * Input validation utilities
 */
export class InputValidator {
  static validatePath(pathStr, paramName) {
    if (!pathStr || typeof pathStr !== 'string') {
      throw new Error(`${paramName} must be a non-empty string`);
    }
    
    if (pathStr.length > CONFIG.MAX_PATH_LENGTH) {
      throw new Error(`${paramName} exceeds maximum length of ${CONFIG.MAX_PATH_LENGTH} characters`);
    }
    
    // Security: Check for path traversal attempts
    const normalizedPath = path.normalize(pathStr);
    if (normalizedPath.includes('..')) {
      throw new Error(`${paramName} contains invalid path traversal patterns`);
    }
    
    return normalizedPath;
  }
  
  static validateExportMode(mode) {
    const validModes = ['prompts', 'full', 'outputs'];
    if (mode && !validModes.includes(mode)) {
      throw new Error(`exportMode must be one of: ${validModes.join(', ')}`);
    }
    return mode || 'prompts';
  }
  
  static validateExportFormat(format) {
    const validFormats = ['markdown', 'json', 'both'];
    if (format && !validFormats.includes(format)) {
      throw new Error(`exportFormat must be one of: ${validFormats.join(', ')}`);
    }
    return format || 'markdown';
  }
  
  static validateGroupBy(groupBy) {
    const validOptions = ['project', 'date', 'none'];
    if (groupBy && !validOptions.includes(groupBy)) {
      throw new Error(`groupBy must be one of: ${validOptions.join(', ')}`);
    }
    return groupBy || 'project';
  }
}

/**
 * Rate limiting implementation
 */
export class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }
  
  checkLimit(clientId = 'default') {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Clean old entries
    const clientRequests = this.requests.get(clientId) || [];
    const recentRequests = clientRequests.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= this.maxRequests) {
      const resetTime = new Date(recentRequests[0] + this.windowMs);
      throw new Error(`Rate limit exceeded. Try again after ${resetTime.toISOString()}`);
    }
    
    recentRequests.push(now);
    this.requests.set(clientId, recentRequests);
  }
}

/**
 * File system utilities
 */
export class FileSystemUtils {
  static async ensureDirectory(dirPath) {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }

  static async writeFileSafely(filePath, content, encoding = 'utf8') {
    const tempPath = `${filePath}.tmp`;
    
    try {
      await fs.promises.writeFile(tempPath, content, encoding);
      await fs.promises.rename(tempPath, filePath);
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.promises.unlink(tempPath);
      } catch {}
      
      throw new Error(`Failed to write file ${filePath}: ${error.message}`);
    }
  }

  static detectClaudeHome() {
    const homeDir = os.homedir();
    const candidates = [
      process.env.CLAUDE_HOME,
      path.join(homeDir, '.claude'),
      path.join(homeDir, '.config', 'claude')
    ].filter(Boolean);

    for (const candidate of candidates) {
      try {
        const projectsPath = path.join(candidate, 'projects');
        if (fs.existsSync(projectsPath) && fs.statSync(projectsPath).isDirectory()) {
          return candidate;
        }
      } catch (error) {
        // Continue to next candidate
      }
    }

    return null;
  }
}

/**
 * Project utilities
 */
export function findClaudeProjects(claudeHome, logger) {
  logger.debug('Finding Claude projects', { claudeHome });
  
  const projectsPath = path.join(claudeHome, 'projects');
  if (!fs.existsSync(projectsPath)) {
    logger.warn('Projects directory not found', { projectsPath });
    return [];
  }
  
  try {
    const dirs = fs.readdirSync(projectsPath);
    const projects = dirs
      .filter(dir => {
        try {
          const stat = fs.statSync(path.join(projectsPath, dir));
          return stat.isDirectory();
        } catch (error) {
          logger.warn('Failed to stat directory', { dir, error: error.message });
          return false;
        }
      })
      .slice(0, CONFIG.MAX_PROJECTS_TO_PROCESS)
      .map(dir => ({
        name: dir,
        path: path.join(projectsPath, dir)
      }));
    
    logger.info('Found Claude projects', { count: projects.length });
    return projects;
  } catch (error) {
    logger.error('Error reading projects directory', { projectsPath, error: error.message });
    return [];
  }
}

/**
 * Path decoding utilities
 */
export function decodePath(encodedPath, logger) {
  try {
    // Claude encodes paths by replacing / and _ with -
    const parts = encodedPath.split('-');
    const decoded = parts.join('/');
    
    // Validate the decoded path doesn't contain dangerous patterns
    if (decoded.includes('..') || decoded.includes('~')) {
      logger.warn('Potentially dangerous path pattern detected', { encodedPath, decoded });
      return encodedPath;
    }
    
    return decoded;
  } catch (error) {
    logger.error('Error decoding path', { encodedPath, error: error.message });
    return encodedPath;
  }
}

/**
 * Response formatting utilities
 */
export class ResponseFormatter {
  static success(requestId, message, details) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          requestId,
          message,
          details
        }, null, 2)
      }]
    };
  }

  static error(requestId, error, tool, duration) {
    const showStack = process.env.MCP_DEBUG === 'true';
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          requestId,
          error: error.message,
          errorType: error.constructor.name,
          details: {
            tool,
            duration: `${duration}ms`
          },
          ...(showStack ? { stack: error.stack } : {})
        }, null, 2)
      }],
      isError: true
    };
  }
}

/**
 * Generate unique request ID
 */
export function generateRequestId() {
  return Math.random().toString(36).substring(2, 9);
}