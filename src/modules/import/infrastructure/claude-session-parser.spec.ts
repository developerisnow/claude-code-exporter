import { Test, TestingModule } from '@nestjs/testing';
import { ClaudeSessionParser } from './claude-session-parser';
import * as fs from 'fs/promises';
import * as path from 'path';
import { RawSessionData } from '../domain/claude-session-parser.interface';

jest.mock('fs/promises');
jest.mock('fs');

describe('ClaudeSessionParser', () => {
  let parser: ClaudeSessionParser;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClaudeSessionParser],
    }).compile();

    parser = module.get<ClaudeSessionParser>(ClaudeSessionParser);
    mockFs = fs as jest.Mocked<typeof fs>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('parse', () => {
    it('should parse sessions from Claude projects directory', async () => {
      // Given
      const projectPath = '/Users/test/project';
      const claudeHome = '/Users/test/.claude';
      const encodedPath = '-Users-test-project';
      const sessionDir = path.join(claudeHome, 'projects', encodedPath);
      
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValueOnce(['session1.jsonl', 'session2.jsonl', 'other.txt'] as any);
      
      const mockSessionData = [
        JSON.stringify({
          message: { role: 'user', content: 'Hello' },
          timestamp: '2024-01-01T00:00:00Z'
        }),
        JSON.stringify({
          message: { role: 'assistant', content: 'Hi there!' },
          timestamp: '2024-01-01T00:00:01Z'
        })
      ].join('\n');
      
      mockFs.readFile.mockResolvedValue(mockSessionData);

      // When
      const result = await parser.parse(projectPath);

      // Then
      expect(result).toHaveLength(2); // Two .jsonl files
      expect(result[0]).toMatchObject({
        projectPath,
        messages: [
          {
            role: 'user',
            content: 'Hello',
            timestamp: '2024-01-01T00:00:00Z'
          },
          {
            role: 'assistant',
            content: 'Hi there!',
            timestamp: '2024-01-01T00:00:01Z'
          }
        ]
      });
    });

    it('should handle empty sessions directory', async () => {
      // Given
      const projectPath = '/Users/test/project';
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValueOnce([] as any);

      // When
      const result = await parser.parse(projectPath);

      // Then
      expect(result).toHaveLength(0);
    });

    it('should skip invalid JSON lines', async () => {
      // Given
      const projectPath = '/Users/test/project';
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValueOnce(['session.jsonl'] as any);
      
      const mockSessionData = [
        'invalid json',
        JSON.stringify({
          message: { role: 'user', content: 'Valid message' },
          timestamp: '2024-01-01T00:00:00Z'
        }),
        '{ broken json'
      ].join('\n');
      
      mockFs.readFile.mockResolvedValue(mockSessionData);

      // When
      const result = await parser.parse(projectPath);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].messages).toHaveLength(1);
      expect(result[0].messages[0].content).toBe('Valid message');
    });

    it('should handle messages without timestamp', async () => {
      // Given
      const projectPath = '/Users/test/project';
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValueOnce(['session.jsonl'] as any);
      
      const mockSessionData = JSON.stringify({
        message: { role: 'user', content: 'No timestamp' }
      });
      
      mockFs.readFile.mockResolvedValue(mockSessionData);

      // When
      const result = await parser.parse(projectPath);

      // Then
      expect(result[0].messages[0].timestamp).toBeDefined();
      expect(new Date(result[0].messages[0].timestamp)).toBeInstanceOf(Date);
    });

    it('should throw error when Claude home not found', async () => {
      // Given
      const projectPath = '/Users/test/project';
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      // When/Then
      await expect(parser.parse(projectPath)).rejects.toThrow('Claude home directory not found');
    });

    it('should encode project path correctly', async () => {
      // Given
      const projectPath = '/Users/test/__Repositories/my_project';
      const expectedEncoded = '-Users-test---Repositories-my-project';
      
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValueOnce([] as any);

      // When
      await parser.parse(projectPath);

      // Then
      expect(mockFs.readdir).toHaveBeenCalledWith(
        expect.stringContaining(expectedEncoded)
      );
    });
  });
});