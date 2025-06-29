#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.error('MCP Server: Starting...');
console.error('MCP Server: Node version:', process.version);
console.error('MCP Server: Script path:', __filename);

console.error('MCP Server: Imports successful');

// Import the existing exporter functionality
import ClaudePromptExporter from './exporter-wrapper.js';

console.error('MCP Server: ClaudePromptExporter imported');

// Helper function to find Claude projects
function findClaudeProjects(claudeHome) {
  const projectsPath = path.join(claudeHome, 'projects');
  if (!fs.existsSync(projectsPath)) {
    return [];
  }
  
  try {
    const dirs = fs.readdirSync(projectsPath);
    return dirs.map(dir => ({
      name: dir,
      path: path.join(projectsPath, dir)
    }));
  } catch (error) {
    return [];
  }
}

// Helper function to decode Claude's path encoding
function decodePath(encodedPath) {
  // Claude encodes paths by replacing / and _ with -
  // This is a basic attempt to reverse it
  const parts = encodedPath.split('-');
  // Try to reconstruct a path-like structure
  return parts.join('/');
}

// Helper function to detect Claude home directories
function detectClaudeHomes() {
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const candidates = [
    path.join(homeDir, '.claude'),
    path.join(homeDir, '.config', 'claude')
  ];
  
  return candidates.filter(dir => fs.existsSync(path.join(dir, 'projects')));
}

// Create the MCP server
console.error('MCP Server: Creating server instance...');
const server = new Server(
  {
    name: 'claude-code-exporter-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);
console.error('MCP Server: Server instance created');

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error('MCP Server: Received ListToolsRequest');
  return {
    tools: [
      {
        name: 'export_conversation',
        description: 'Export Claude Code conversations from a specific project path with advanced filtering options',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Absolute path to the project directory'
            },
            outputDir: {
              type: 'string',
              description: 'Output directory for exported files (default: ./claude-prompts)'
            },
            exportMode: {
              type: 'string',
              enum: ['prompts', 'full', 'outputs'],
              description: 'Export mode: prompts (user only), full (all messages), outputs (assistant only)',
              default: 'prompts'
            },
            exportFormat: {
              type: 'string',
              enum: ['markdown', 'json', 'both'],
              description: 'Export format: markdown, json, or both',
              default: 'markdown'
            },
            claudeHome: {
              type: 'string',
              description: 'Claude home directory path (optional)'
            },
            period: {
              type: 'string',
              pattern: '^\\d+[dwmy]$',
              description: 'Filter sessions by time period (e.g., 7d, 2w, 3m, 1y)'
            },
            periodGroup: {
              type: 'string',
              enum: ['d', 'w', 'm', 'y'],
              description: 'Group sessions by period (day, week, month, year)'
            },
            nested: {
              type: 'boolean',
              description: 'Create nested directory structure for outputs',
              default: false
            },
            verbose: {
              type: 'boolean',
              description: 'Enable verbose logging',
              default: false
            }
          },
          required: ['projectPath']
        }
      },
      {
        name: 'aggregate_sessions',
        description: 'Aggregate and analyze Claude Code sessions across multiple projects',
        inputSchema: {
          type: 'object',
          properties: {
            claudeHome: {
              type: 'string',
              description: 'Claude home directory path (optional)'
            },
            outputDir: {
              type: 'string',
              description: 'Output directory for aggregated report',
              default: './aggregated-prompts'
            },
            includeStats: {
              type: 'boolean',
              description: 'Include detailed statistics in the output',
              default: true
            },
            groupBy: {
              type: 'string',
              enum: ['project', 'date', 'none'],
              description: 'How to group sessions in the output',
              default: 'project'
            },
            bothDirs: {
              type: 'boolean',
              description: 'Process both Claude home directories if available',
              default: false
            },
            period: {
              type: 'string',
              pattern: '^\\d+[dwmy]$',
              description: 'Filter sessions by time period (e.g., 7d, 2w, 3m, 1y)'
            },
            verbose: {
              type: 'boolean',
              description: 'Enable verbose logging',
              default: false
            }
          }
        }
      },
      {
        name: 'list_sessions',
        description: 'List available Claude sessions with metadata',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Absolute path to the project directory (optional, lists all if not provided)'
            },
            claudeHome: {
              type: 'string',
              description: 'Claude home directory path (optional)'
            },
            bothDirs: {
              type: 'boolean',
              description: 'List sessions from both Claude home directories',
              default: false
            },
            period: {
              type: 'string',
              pattern: '^\\d+[dwmy]$',
              description: 'Filter sessions by time period (e.g., 7d, 2w, 3m, 1y)'
            },
            verbose: {
              type: 'boolean',
              description: 'Include detailed session information',
              default: false
            }
          }
        }
      }
    ]
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.error('MCP Server: Received CallToolRequest:', name);

  try {
    if (name === 'export_conversation') {
      // Validate required parameters
      if (!args.projectPath) {
        throw new Error('projectPath is required');
      }

      // Create exporter instance with all options
      const options = {
        verbose: args.verbose || false,
        exportMode: args.exportMode || 'prompts',
        exportFormat: args.exportFormat || 'markdown',
        interactive: false,
        claudeHome: args.claudeHome,
        period: args.period,
        periodGroup: args.periodGroup,
        nested: args.nested || false,
        aggregate: args.nested || false // nested implies aggregate
      };

      if (args.verbose) {
        console.error('MCP Server: Export options:', options);
      }

      const exporter = new ClaudePromptExporter(args.projectPath, options);

      // Export the conversation
      const result = exporter.export(args.outputDir || './claude-prompts');

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Successfully exported ${result.sessionsExported} sessions with ${result.totalMessages} messages`,
              details: {
                sessionsExported: result.sessionsExported,
                totalMessages: result.totalMessages,
                outputDirectory: path.resolve(args.outputDir || './claude-prompts'),
                exportMode: args.exportMode || 'prompts',
                exportFormat: args.exportFormat || 'markdown',
                period: args.period,
                periodGroup: args.periodGroup,
                nested: args.nested
              }
            }, null, 2)
          }
        ]
      };
    } else if (name === 'aggregate_sessions') {
      // Detect Claude home directories
      let claudeHomes = [];
      
      if (args.bothDirs) {
        claudeHomes = detectClaudeHomes();
        if (claudeHomes.length === 0) {
          throw new Error('No Claude home directories found');
        }
      } else {
        // Use specified or detect single home
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        const claudeHomeCandidates = [
          args.claudeHome,
          process.env.CLAUDE_HOME,
          path.join(homeDir, '.claude'),
          path.join(homeDir, '.config', 'claude')
        ].filter(Boolean);

        let claudeHome = null;
        for (const candidate of claudeHomeCandidates) {
          if (fs.existsSync(path.join(candidate, 'projects'))) {
            claudeHome = candidate;
            break;
          }
        }

        if (!claudeHome) {
          throw new Error('Could not find Claude home directory. Please specify claudeHome parameter.');
        }
        
        claudeHomes = [claudeHome];
      }

      // Aggregate data from all Claude homes
      const aggregatedData = {
        totalProjects: 0,
        totalSessions: 0,
        totalMessages: 0,
        totalUserMessages: 0,
        totalAssistantMessages: 0,
        projects: [],
        claudeHomes: claudeHomes.length,
        exportDate: new Date().toISOString()
      };

      // Process each Claude home
      for (const claudeHome of claudeHomes) {
        if (args.verbose) {
          console.error('MCP Server: Processing Claude home:', claudeHome);
        }

        // Find all projects
        const projects = findClaudeProjects(claudeHome);
        aggregatedData.totalProjects += projects.length;
        
        // Process each project
        for (const project of projects) {
          try {
            // Try to decode the project path
            const decodedPath = decodePath(project.name);
            
            // Create exporter for this project
            const exporter = new ClaudePromptExporter(decodedPath, {
              verbose: false,
              exportMode: 'full',
              exportFormat: 'json',
              interactive: false,
              claudeHome,
              period: args.period
            });

            // Extract messages
            const sessions = exporter.extractMessages();
            
            if (sessions.length > 0) {
              const projectData = {
                name: project.name,
                decodedPath,
                claudeHome,
                sessions: sessions.length,
                totalMessages: 0,
                userMessages: 0,
                assistantMessages: 0,
                firstActivity: null,
                lastActivity: null
              };

              sessions.forEach(session => {
                projectData.totalMessages += session.messages.length;
                projectData.userMessages += session.stats.userMessages;
                projectData.assistantMessages += session.stats.assistantMessages;
                
                // Track activity dates
                if (session.messages.length > 0) {
                  const firstTimestamp = new Date(session.messages[0].timestamp);
                  const lastTimestamp = new Date(session.messages[session.messages.length - 1].timestamp);
                  
                  if (!projectData.firstActivity || firstTimestamp < new Date(projectData.firstActivity)) {
                    projectData.firstActivity = firstTimestamp.toISOString();
                  }
                  
                  if (!projectData.lastActivity || lastTimestamp > new Date(projectData.lastActivity)) {
                    projectData.lastActivity = lastTimestamp.toISOString();
                  }
                }
              });

              aggregatedData.projects.push(projectData);
              aggregatedData.totalSessions += sessions.length;
              aggregatedData.totalMessages += projectData.totalMessages;
              aggregatedData.totalUserMessages += projectData.userMessages;
              aggregatedData.totalAssistantMessages += projectData.assistantMessages;
            }
          } catch (error) {
            if (args.verbose) {
              console.error('Error processing project:', project.name, error.message);
            }
          }
        }
      }

      // Create output directory
      const outputDir = path.resolve(args.outputDir || './aggregated-prompts');
      fs.mkdirSync(outputDir, { recursive: true });

      // Generate report based on grouping
      let report = '# Claude Code Sessions Aggregate Report\n\n';
      report += `Generated on: ${new Date().toLocaleString()}\n\n`;
      report += '## Summary\n\n';
      report += `- **Claude Homes Processed**: ${aggregatedData.claudeHomes}\n`;
      report += `- **Total Projects**: ${aggregatedData.totalProjects}\n`;
      report += `- **Active Projects**: ${aggregatedData.projects.length}\n`;
      report += `- **Total Sessions**: ${aggregatedData.totalSessions}\n`;
      report += `- **Total Messages**: ${aggregatedData.totalMessages}\n`;
      report += `- **User Messages**: ${aggregatedData.totalUserMessages}\n`;
      report += `- **Assistant Messages**: ${aggregatedData.totalAssistantMessages}\n`;
      
      if (args.period) {
        report += `- **Period Filter**: ${args.period}\n`;
      }
      
      report += '\n';

      if (args.includeStats !== false) {
        report += '## Projects Detail\n\n';
        
        // Sort projects based on grouping
        let sortedProjects = [...aggregatedData.projects];
        if (args.groupBy === 'date') {
          sortedProjects.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
        } else {
          sortedProjects.sort((a, b) => b.totalMessages - a.totalMessages);
        }

        sortedProjects.forEach((project, index) => {
          report += `### ${index + 1}. ${project.decodedPath}\n\n`;
          report += `- **Claude Home**: ${project.claudeHome}\n`;
          report += `- **Sessions**: ${project.sessions}\n`;
          report += `- **Total Messages**: ${project.totalMessages}\n`;
          report += `- **User Messages**: ${project.userMessages}\n`;
          report += `- **Assistant Messages**: ${project.assistantMessages}\n`;
          report += `- **First Activity**: ${new Date(project.firstActivity).toLocaleString()}\n`;
          report += `- **Last Activity**: ${new Date(project.lastActivity).toLocaleString()}\n\n`;
        });
      }

      // Save report
      const reportPath = path.join(outputDir, `aggregate-report-${new Date().toISOString().split('T')[0]}.md`);
      fs.writeFileSync(reportPath, report);

      // Save JSON data
      const jsonPath = path.join(outputDir, `aggregate-data-${new Date().toISOString().split('T')[0]}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(aggregatedData, null, 2));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Successfully aggregated ${aggregatedData.totalSessions} sessions from ${aggregatedData.projects.length} active projects`,
              details: {
                claudeHomes: aggregatedData.claudeHomes,
                totalProjects: aggregatedData.totalProjects,
                activeProjects: aggregatedData.projects.length,
                totalSessions: aggregatedData.totalSessions,
                totalMessages: aggregatedData.totalMessages,
                reportPath,
                jsonPath,
                period: args.period,
                bothDirs: args.bothDirs
              }
            }, null, 2)
          }
        ]
      };
    } else if (name === 'list_sessions') {
      // Detect Claude home directories
      let claudeHomes = [];
      
      if (args.bothDirs) {
        claudeHomes = detectClaudeHomes();
        if (claudeHomes.length === 0) {
          throw new Error('No Claude home directories found');
        }
      } else {
        // Use specified or detect single home
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        const claudeHomeCandidates = [
          args.claudeHome,
          process.env.CLAUDE_HOME,
          path.join(homeDir, '.claude'),
          path.join(homeDir, '.config', 'claude')
        ].filter(Boolean);

        let claudeHome = null;
        for (const candidate of claudeHomeCandidates) {
          if (fs.existsSync(path.join(candidate, 'projects'))) {
            claudeHome = candidate;
            break;
          }
        }

        if (!claudeHome) {
          throw new Error('Could not find Claude home directory. Please specify claudeHome parameter.');
        }
        
        claudeHomes = [claudeHome];
      }

      const allSessions = [];

      // Process each Claude home
      for (const claudeHome of claudeHomes) {
        if (args.verbose) {
          console.error('MCP Server: Listing sessions from:', claudeHome);
        }

        if (args.projectPath) {
          // List sessions for specific project
          try {
            const exporter = new ClaudePromptExporter(args.projectPath, {
              verbose: false,
              exportMode: 'full',
              exportFormat: 'json',
              interactive: false,
              claudeHome,
              period: args.period
            });

            const sessions = exporter.extractMessages();
            sessions.forEach(session => {
              allSessions.push({
                projectPath: args.projectPath,
                claudeHome,
                sessionId: session.sessionId,
                title: session.title,
                messageCount: session.messages.length,
                userMessages: session.stats.userMessages,
                assistantMessages: session.stats.assistantMessages,
                lastActivity: session.lastActivity,
                firstMessage: session.messages[0]?.timestamp,
                lastMessage: session.messages[session.messages.length - 1]?.timestamp
              });
            });
          } catch (error) {
            if (args.verbose) {
              console.error('Error listing sessions for project:', args.projectPath, error.message);
            }
          }
        } else {
          // List all sessions across all projects
          const projects = findClaudeProjects(claudeHome);
          
          for (const project of projects) {
            try {
              const decodedPath = decodePath(project.name);
              const exporter = new ClaudePromptExporter(decodedPath, {
                verbose: false,
                exportMode: 'full',
                exportFormat: 'json',
                interactive: false,
                claudeHome,
                period: args.period
              });

              const sessions = exporter.extractMessages();
              sessions.forEach(session => {
                allSessions.push({
                  projectPath: decodedPath,
                  projectName: project.name,
                  claudeHome,
                  sessionId: session.sessionId,
                  title: session.title,
                  messageCount: session.messages.length,
                  userMessages: session.stats.userMessages,
                  assistantMessages: session.stats.assistantMessages,
                  lastActivity: session.lastActivity,
                  firstMessage: session.messages[0]?.timestamp,
                  lastMessage: session.messages[session.messages.length - 1]?.timestamp
                });
              });
            } catch (error) {
              if (args.verbose) {
                console.error('Error processing project:', project.name, error.message);
              }
            }
          }
        }
      }

      // Sort sessions by last activity
      allSessions.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Found ${allSessions.length} sessions`,
              details: {
                sessionCount: allSessions.length,
                claudeHomes: claudeHomes.length,
                period: args.period,
                sessions: args.verbose ? allSessions : allSessions.map(s => ({
                  sessionId: s.sessionId,
                  title: s.title,
                  project: s.projectPath,
                  messages: s.messageCount,
                  lastActivity: s.lastActivity
                }))
              }
            }, null, 2)
          }
        ]
      };
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error('MCP Server: Error executing tool:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack,
            tool: name,
            parameters: args
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('MCP Server: Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('MCP Server: Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
async function main() {
  try {
    console.error('MCP Server: Creating transport...');
    const transport = new StdioServerTransport();
    
    console.error('MCP Server: Connecting to transport...');
    await server.connect(transport);
    
    console.error('Claude Code Exporter MCP Server running on stdio');
    
    // Keep the process alive
    process.stdin.resume();
  } catch (error) {
    console.error('MCP Server: Fatal error in main():', error);
    process.exit(1);
  }
}

console.error('MCP Server: Calling main()...');
main();