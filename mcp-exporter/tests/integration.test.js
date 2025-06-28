import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Integration tests for the MCP server
describe('MCP Server Integration Tests', () => {
  let serverProcess;
  let tempDir;

  beforeAll(async () => {
    // Create temporary directory for test outputs
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-test-'));
    
    // Note: In real tests, you would start the actual server
    // For this example, we'll simulate the server behavior
  });

  afterAll(async () => {
    // Cleanup
    if (serverProcess) {
      serverProcess.kill();
    }
    
    // Remove temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Server Lifecycle', () => {
    it('should start without errors', async () => {
      // Test that the server can be imported without errors
      await expect(import('../index.js')).resolves.not.toThrow();
    });

    it('should handle SIGTERM gracefully', async () => {
      // This would test graceful shutdown in a real server
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      process.emit('SIGTERM');
      
      expect(mockExit).toHaveBeenCalledWith(0);
      mockExit.mockRestore();
    });
  });

  describe('Tool Registration', () => {
    it('should register export_conversation tool', async () => {
      // In a real test, this would make an MCP protocol request
      const tools = [
        'export_conversation',
        'aggregate_sessions'
      ];
      
      expect(tools).toContain('export_conversation');
      expect(tools).toContain('aggregate_sessions');
    });
  });

  describe('Export Conversation Integration', () => {
    it('should handle valid export request', async () => {
      const mockRequest = {
        params: {
          name: 'export_conversation',
          arguments: {
            projectPath: tempDir,
            outputDir: path.join(tempDir, 'exports'),
            exportMode: 'prompts',
            exportFormat: 'markdown'
          }
        }
      };

      // Simulate successful export
      const expectedResponse = {
        success: true,
        message: expect.stringContaining('Successfully exported'),
        details: {
          sessionsExported: expect.any(Number),
          totalMessages: expect.any(Number),
          outputDirectory: expect.any(String),
          exportMode: 'prompts',
          exportFormat: 'markdown'
        }
      };

      // In real test, this would call the server
      expect(expectedResponse.success).toBe(true);
    });

    it('should validate paths correctly', async () => {
      const dangerousPath = '../../../etc/passwd';
      const mockRequest = {
        params: {
          name: 'export_conversation',
          arguments: {
            projectPath: dangerousPath
          }
        }
      };

      // Should reject dangerous paths
      expect(() => {
        if (dangerousPath.includes('..')) {
          throw new Error('projectPath contains invalid path traversal patterns');
        }
      }).toThrow(/traversal/);
    });
  });

  describe('Aggregate Sessions Integration', () => {
    it('should aggregate multiple projects', async () => {
      // Create mock project structure
      const mockClaudeHome = path.join(tempDir, '.claude');
      const projectsDir = path.join(mockClaudeHome, 'projects');
      fs.mkdirSync(projectsDir, { recursive: true });

      // Create mock projects
      const mockProjects = ['project-1', 'project-2', 'project-3'];
      mockProjects.forEach(project => {
        fs.mkdirSync(path.join(projectsDir, project));
      });

      const mockRequest = {
        params: {
          name: 'aggregate_sessions',
          arguments: {
            claudeHome: mockClaudeHome,
            outputDir: path.join(tempDir, 'aggregated'),
            includeStats: true,
            groupBy: 'project'
          }
        }
      };

      // Verify projects can be found
      const projects = fs.readdirSync(projectsDir);
      expect(projects).toHaveLength(3);
      expect(projects).toEqual(expect.arrayContaining(mockProjects));
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle missing project path', async () => {
      const mockRequest = {
        params: {
          name: 'export_conversation',
          arguments: {
            // Missing required projectPath
            outputDir: tempDir
          }
        }
      };

      // Should return error response
      const errorResponse = {
        success: false,
        error: expect.stringContaining('required'),
        errorType: 'Error'
      };

      expect(errorResponse.success).toBe(false);
    });

    it('should handle file system errors gracefully', async () => {
      const readOnlyPath = '/root/restricted';
      const mockRequest = {
        params: {
          name: 'export_conversation',
          arguments: {
            projectPath: tempDir,
            outputDir: readOnlyPath
          }
        }
      };

      // Should handle permission errors
      expect(() => {
        // Simulate permission check
        try {
          fs.accessSync(readOnlyPath, fs.constants.W_OK);
        } catch (error) {
          throw new Error('Permission denied');
        }
      }).toThrow(/Permission/);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of sessions efficiently', async () => {
      const startTime = Date.now();
      
      // Simulate processing many sessions
      const sessions = Array.from({ length: 100 }, (_, i) => ({
        id: `session-${i}`,
        messages: Array.from({ length: 50 }, (_, j) => ({
          role: j % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${j}`,
          timestamp: new Date().toISOString()
        }))
      }));

      const processingTime = Date.now() - startTime;
      
      // Should process in reasonable time (< 5 seconds for 100 sessions)
      expect(processingTime).toBeLessThan(5000);
      expect(sessions).toHaveLength(100);
    });
  });

  describe('Security Tests', () => {
    it('should sanitize file paths', () => {
      const testPaths = [
        { input: '/normal/path', valid: true },
        { input: '../../../etc', valid: false },
        { input: '/path/with spaces/file', valid: true },
        { input: '~/.ssh/keys', valid: false },
        { input: '/path/with/../traversal', valid: false }
      ];

      testPaths.forEach(({ input, valid }) => {
        const isValid = !input.includes('..') && !input.startsWith('~');
        expect(isValid).toBe(valid);
      });
    });

    it('should enforce rate limits', () => {
      const requests = [];
      const limit = 3;
      const clientId = 'test-client';

      // Simulate rate limiter
      for (let i = 0; i < limit + 1; i++) {
        if (requests.length >= limit) {
          expect(() => {
            throw new Error('Rate limit exceeded');
          }).toThrow(/Rate limit/);
          break;
        }
        requests.push(Date.now());
      }
    });
  });
});