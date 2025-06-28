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

// Import the existing exporter functionality
import ClaudePromptExporter from './exporter-wrapper.js';

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

// Create the MCP server
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

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'export_conversation',
        description: 'Export Claude Code conversations from a specific project path',
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

  try {
    if (name === 'export_conversation') {
      // Validate required parameters
      if (!args.projectPath) {
        throw new Error('projectPath is required');
      }

      // Create exporter instance
      const exporter = new ClaudePromptExporter(args.projectPath, {
        verbose: false,
        exportMode: args.exportMode || 'prompts',
        exportFormat: args.exportFormat || 'markdown',
        interactive: false,
        claudeHome: args.claudeHome
      });

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
                exportFormat: args.exportFormat || 'markdown'
              }
            }, null, 2)
          }
        ]
      };
    } else if (name === 'aggregate_sessions') {
      // Detect Claude home
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

      // Find all projects
      const projects = findClaudeProjects(claudeHome);
      
      if (projects.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: 'No Claude projects found',
                claudeHome
              }, null, 2)
            }
          ]
        };
      }

      // Aggregate data from all projects
      const aggregatedData = {
        totalProjects: projects.length,
        totalSessions: 0,
        totalMessages: 0,
        totalUserMessages: 0,
        totalAssistantMessages: 0,
        projects: [],
        exportDate: new Date().toISOString()
      };

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
            claudeHome
          });

          // Extract messages
          const sessions = exporter.extractMessages();
          
          if (sessions.length > 0) {
            const projectData = {
              name: project.name,
              decodedPath,
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
            processedCount++;
          } catch (error) {
            errorCount++;
            logger.error('Error processing project', { 
              projectName: project.name,
              error: error.message,
              stack: error.stack 
            });
          }
        }
        
        logger.info('Aggregation processing complete', { 
          requestId,
          processedCount,
          errorCount,
          totalProjects: projects.length 
        });

      // Create output directory
      const outputDir = path.resolve(args.outputDir || './aggregated-prompts');
      fs.mkdirSync(outputDir, { recursive: true });

      // Generate report based on grouping
      let report = '# Claude Code Sessions Aggregate Report\n\n';
      report += `Generated on: ${new Date().toLocaleString()}\n\n`;
      report += '## Summary\n\n';
      report += `- **Total Projects**: ${aggregatedData.totalProjects}\n`;
      report += `- **Active Projects**: ${aggregatedData.projects.length}\n`;
      report += `- **Total Sessions**: ${aggregatedData.totalSessions}\n`;
      report += `- **Total Messages**: ${aggregatedData.totalMessages}\n`;
      report += `- **User Messages**: ${aggregatedData.totalUserMessages}\n`;
      report += `- **Assistant Messages**: ${aggregatedData.totalAssistantMessages}\n\n`;

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
                totalProjects: aggregatedData.totalProjects,
                activeProjects: aggregatedData.projects.length,
                totalSessions: aggregatedData.totalSessions,
                totalMessages: aggregatedData.totalMessages,
                reportPath,
                jsonPath
              }
            }, null, 2)
          }
        ]
      };
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Claude Code Exporter MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});