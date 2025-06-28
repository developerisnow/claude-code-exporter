import { Test, TestingModule } from '@nestjs/testing';
import { ImportSessionUseCase } from './import-session.use-case';
import { IClaudeSessionParser } from '../domain/interfaces/claude-session-parser.interface';
import { ISessionRepository } from '../../sessions/domain/interfaces/session-repository.interface';
import { IPromptRepository } from '../../sessions/domain/interfaces/prompt-repository.interface';
import { SessionFactory } from '../../sessions/domain/factories/session.factory';
import { EventBus } from '@nestjs/cqrs';
import { SessionImportedEvent } from '../domain/events/session-imported.event';
import { ImportSessionCommand } from './commands/import-session.command';
import { SessionEntity } from '../../sessions/domain/entities/session.entity';
import { MessageEntity } from '../../sessions/domain/entities/message.entity';
import { ExportFormat, ExportMode } from '../../export/domain/export-format.enum';

describe('ImportSessionUseCase', () => {
  let useCase: ImportSessionUseCase;
  let mockParser: jest.Mocked<IClaudeSessionParser>;
  let mockSessionRepo: jest.Mocked<ISessionRepository>;
  let mockPromptRepo: jest.Mocked<IPromptRepository>;
  let mockSessionFactory: jest.Mocked<SessionFactory>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(async () => {
    // Create mocks
    mockParser = {
      parseSessionFiles: jest.fn(),
      findSessionDirectory: jest.fn(),
    };

    mockSessionRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findBySessionId: jest.fn(),
      findByProjectPath: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    mockPromptRepo = {
      save: jest.fn(),
      saveMany: jest.fn(),
      findBySessionId: jest.fn(),
      findByRole: jest.fn(),
      delete: jest.fn(),
    };

    mockSessionFactory = {
      createFromParsedData: jest.fn(),
    } as any;

    mockEventBus = {
      publish: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportSessionUseCase,
        { provide: 'IClaudeSessionParser', useValue: mockParser },
        { provide: 'ISessionRepository', useValue: mockSessionRepo },
        { provide: 'IPromptRepository', useValue: mockPromptRepo },
        { provide: SessionFactory, useValue: mockSessionFactory },
        { provide: EventBus, useValue: mockEventBus },
      ],
    }).compile();

    useCase = module.get<ImportSessionUseCase>(ImportSessionUseCase);
  });

  describe('execute', () => {
    it('should import a valid session with messages', async () => {
      // Given
      const command = new ImportSessionCommand({
        projectPath: '/test/project',
        sessionId: 'test-session-123',
      });

      const parsedData = {
        sessionId: 'test-session-123',
        projectPath: '/test/project',
        messages: [
          {
            role: 'user',
            content: 'Hello Claude',
            timestamp: new Date('2024-01-01'),
            sequenceNumber: 0,
          },
          {
            role: 'assistant',
            content: 'Hello! How can I help?',
            timestamp: new Date('2024-01-01'),
            sequenceNumber: 1,
          },
        ],
        metadata: {
          title: 'Test Session',
          startedAt: new Date('2024-01-01'),
          endedAt: new Date('2024-01-01'),
        },
      };

      const mockSession = new SessionEntity();
      mockSession.id = 'session-uuid';
      mockSession.sessionId = 'test-session-123';
      mockSession.projectPath = '/test/project';
      mockSession.messageCount = 2;
      mockSession.userMessageCount = 1;
      mockSession.assistantMessageCount = 1;

      mockParser.parseSessionFiles.mockResolvedValue([parsedData]);
      mockSessionFactory.createFromParsedData.mockReturnValue(mockSession);
      mockSessionRepo.save.mockResolvedValue(mockSession);

      // When
      const result = await useCase.execute(command);

      // Then
      expect(mockParser.parseSessionFiles).toHaveBeenCalledWith('/test/project', 'test-session-123');
      expect(mockSessionFactory.createFromParsedData).toHaveBeenCalledWith(parsedData);
      expect(mockSessionRepo.save).toHaveBeenCalledWith(mockSession);
      expect(mockPromptRepo.saveMany).toHaveBeenCalled();
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any(SessionImportedEvent)
      );
      expect(result.sessionsImported).toBe(1);
      expect(result.totalMessages).toBe(2);
    });

    it('should throw error when session not found', async () => {
      // Given
      const command = new ImportSessionCommand({
        projectPath: '/test/project',
        sessionId: 'non-existent',
      });

      mockParser.parseSessionFiles.mockResolvedValue([]);

      // When/Then
      await expect(useCase.execute(command)).rejects.toThrow(
        'No sessions found for project: /test/project'
      );
    });

    it('should handle sessions with no messages', async () => {
      // Given
      const command = new ImportSessionCommand({
        projectPath: '/test/project',
      });

      const parsedData = {
        sessionId: 'empty-session',
        projectPath: '/test/project',
        messages: [],
        metadata: {},
      };

      const mockSession = new SessionEntity();
      mockSession.messageCount = 0;

      mockParser.parseSessionFiles.mockResolvedValue([parsedData]);
      mockSessionFactory.createFromParsedData.mockReturnValue(mockSession);

      // When
      const result = await useCase.execute(command);

      // Then
      expect(result.sessionsImported).toBe(1);
      expect(result.totalMessages).toBe(0);
      expect(mockPromptRepo.saveMany).not.toHaveBeenCalled();
    });

    it('should filter messages based on export mode', async () => {
      // Given
      const command = new ImportSessionCommand({
        projectPath: '/test/project',
        options: {
          exportMode: ExportMode.PROMPTS_ONLY,
        },
      });

      const parsedData = {
        sessionId: 'test-session',
        messages: [
          { role: 'user', content: 'Question 1' },
          { role: 'assistant', content: 'Answer 1' },
          { role: 'user', content: 'Question 2' },
        ],
      };

      mockParser.parseSessionFiles.mockResolvedValue([parsedData]);
      
      // When
      await useCase.execute(command);

      // Then
      const savedMessages = mockPromptRepo.saveMany.mock.calls[0][0];
      expect(savedMessages).toHaveLength(2);
      expect(savedMessages.every(m => m.role === 'user')).toBe(true);
    });

    it('should handle corrupt session data gracefully', async () => {
      // Given
      const command = new ImportSessionCommand({
        projectPath: '/test/project',
      });

      mockParser.parseSessionFiles.mockRejectedValue(
        new Error('Invalid JSON in session file')
      );

      // When/Then
      await expect(useCase.execute(command)).rejects.toThrow(
        'Invalid JSON in session file'
      );
    });
  });
});