import { Test, TestingModule } from '@nestjs/testing';
import { ExportSessionUseCase } from './export-session.use-case';
import { ISessionRepository } from '../../sessions/domain/session.repository.interface';
import { IPromptRepository } from '../../prompts/domain/prompt.repository.interface';
import { MarkdownExporter } from '../infrastructure/markdown-exporter';
import { JsonExporter } from '../infrastructure/json-exporter';
import { FileSystemService } from '../infrastructure/file-system.service';
import { Session } from '../../sessions/domain/session.entity';
import { Prompt, Role } from '../../prompts/domain/prompt.entity';
import { SessionId, PromptId } from '../../common/domain/value-objects';
import { ExportSessionCommand } from './commands/export-session.command';
import { ExportFormat, ExportMode } from '../domain/export-format.enum';

describe('ExportSessionUseCase', () => {
  let useCase: ExportSessionUseCase;
  let sessionRepository: jest.Mocked<ISessionRepository>;
  let promptRepository: jest.Mocked<IPromptRepository>;
  let markdownExporter: jest.Mocked<MarkdownExporter>;
  let jsonExporter: jest.Mocked<JsonExporter>;
  let fileSystemService: jest.Mocked<FileSystemService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportSessionUseCase,
        {
          provide: 'ISessionRepository',
          useValue: {
            findByProjectPath: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: 'IPromptRepository',
          useValue: {
            findBySessionId: jest.fn(),
          },
        },
        {
          provide: MarkdownExporter,
          useValue: {
            export: jest.fn(),
          },
        },
        {
          provide: JsonExporter,
          useValue: {
            export: jest.fn(),
          },
        },
        {
          provide: FileSystemService,
          useValue: {
            ensureDirectory: jest.fn(),
            writeFile: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ExportSessionUseCase>(ExportSessionUseCase);
    sessionRepository = module.get('ISessionRepository');
    promptRepository = module.get('IPromptRepository');
    markdownExporter = module.get(MarkdownExporter);
    jsonExporter = module.get(JsonExporter);
    fileSystemService = module.get(FileSystemService);
  });

  describe('execute', () => {
    it('should export sessions in markdown format', async () => {
      // Given
      const command = new ExportSessionCommand({
        projectPath: '/test/project',
        outputPath: '/output',
        format: ExportFormat.MARKDOWN,
        mode: ExportMode.PROMPTS_ONLY,
      });

      const session = createTestSession();
      const prompts = createTestPrompts(session.id);

      sessionRepository.findByProjectPath.mockResolvedValue([session]);
      promptRepository.findBySessionId.mockResolvedValue(prompts);
      markdownExporter.export.mockReturnValue('# Exported content');

      // When
      const result = await useCase.execute(command);

      // Then
      expect(result.filesCreated).toBe(1);
      expect(result.format).toBe(ExportFormat.MARKDOWN);
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.md'),
        '# Exported content',
      );
    });

    it('should export in both formats when specified', async () => {
      // Given
      const command = new ExportSessionCommand({
        projectPath: '/test/project',
        outputPath: '/output',
        format: ExportFormat.BOTH,
        mode: ExportMode.FULL_CONVERSATION,
      });

      const session = createTestSession();
      const prompts = createTestPrompts(session.id);

      sessionRepository.findByProjectPath.mockResolvedValue([session]);
      promptRepository.findBySessionId.mockResolvedValue(prompts);
      markdownExporter.export.mockReturnValue('# Markdown');
      jsonExporter.export.mockReturnValue('{"json": true}');

      // When
      const result = await useCase.execute(command);

      // Then
      expect(result.filesCreated).toBe(6); // 3 modes × 2 formats
      expect(fileSystemService.writeFile).toHaveBeenCalledTimes(6);
    });

    it('should filter prompts based on export mode', async () => {
      // Given
      const command = new ExportSessionCommand({
        projectPath: '/test/project',
        outputPath: '/output',
        format: ExportFormat.JSON,
        mode: ExportMode.PROMPTS_ONLY,
      });

      const session = createTestSession();
      const prompts = createTestPrompts(session.id);

      sessionRepository.findByProjectPath.mockResolvedValue([session]);
      promptRepository.findBySessionId.mockResolvedValue(prompts);
      jsonExporter.export.mockReturnValue('{}');

      // When
      await useCase.execute(command);

      // Then
      expect(jsonExporter.export).toHaveBeenCalledWith(
        expect.objectContaining({
          sessions: expect.arrayContaining([
            expect.objectContaining({
              prompts: expect.arrayContaining([
                expect.objectContaining({ role: Role.USER }),
              ]),
            }),
          ]),
        }),
      );
    });

    it('should handle empty sessions gracefully', async () => {
      // Given
      const command = new ExportSessionCommand({
        projectPath: '/test/project',
        outputPath: '/output',
        format: ExportFormat.MARKDOWN,
        mode: ExportMode.FULL_CONVERSATION,
      });

      sessionRepository.findByProjectPath.mockResolvedValue([]);

      // When
      const result = await useCase.execute(command);

      // Then
      expect(result.filesCreated).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  function createTestSession(): Session {
    return new Session({
      id: SessionId.generate(),
      projectPath: '/test/project',
      createdAt: new Date('2024-01-01'),
    });
  }

  function createTestPrompts(sessionId: SessionId): Prompt[] {
    return [
      new Prompt({
        id: PromptId.generate(),
        sessionId,
        role: Role.USER,
        content: 'Test prompt',
        timestamp: new Date('2024-01-01T10:00:00'),
      }),
      new Prompt({
        id: PromptId.generate(),
        sessionId,
        role: Role.ASSISTANT,
        content: 'Test response',
        timestamp: new Date('2024-01-01T10:00:30'),
      }),
    ];
  }
});
