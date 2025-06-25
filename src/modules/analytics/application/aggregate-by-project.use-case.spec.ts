import { Test, TestingModule } from '@nestjs/testing';
import { AggregateByProjectUseCase } from './aggregate-by-project.use-case';
import { ISessionRepository } from '../../sessions/domain/session.repository.interface';
import { IPromptRepository } from '../../prompts/domain/prompt.repository.interface';
import { FileSystemService } from '../../export/infrastructure/file-system.service';
import { Session } from '../../sessions/domain/session.entity';
import { Prompt, Role } from '../../prompts/domain/prompt.entity';
import { SessionId } from '../../common/domain/value-objects';
import { AggregateByProjectCommand } from './commands/aggregate-by-project.command';

describe('AggregateByProjectUseCase', () => {
  let useCase: AggregateByProjectUseCase;
  let sessionRepository: jest.Mocked<ISessionRepository>;
  let promptRepository: jest.Mocked<IPromptRepository>;
  let fileSystemService: jest.Mocked<FileSystemService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AggregateByProjectUseCase,
        {
          provide: 'ISessionRepository',
          useValue: {
            findAll: jest.fn(),
            findByProjectPath: jest.fn(),
          },
        },
        {
          provide: 'IPromptRepository',
          useValue: {
            findBySessionId: jest.fn(),
          },
        },
        {
          provide: FileSystemService,
          useValue: {
            ensureDirectory: jest.fn(),
            writeFile: jest.fn(),
            exists: jest.fn(),
            readFile: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<AggregateByProjectUseCase>(AggregateByProjectUseCase);
    sessionRepository = module.get('ISessionRepository');
    promptRepository = module.get('IPromptRepository');
    fileSystemService = module.get(FileSystemService);
  });

  describe('execute', () => {
    it('should aggregate all prompts by project', async () => {
      // Given
      const command = new AggregateByProjectCommand({
        outputPath: '/output/aggregated',
        appendOnly: true,
      });

      const sessions = [
        createSession('/project1'),
        createSession('/project1'),
        createSession('/project2'),
      ];

      sessionRepository.findAll.mockResolvedValue(sessions);
      
      for (const session of sessions) {
        const prompts = createPrompts(session.id, 2);
        promptRepository.findBySessionId.mockResolvedValueOnce(prompts);
      }

      fileSystemService.exists.mockResolvedValue(false);

      // When
      const result = await useCase.execute(command);

      // Then
      expect(result.projectsAggregated).toBe(2);
      expect(result.totalPrompts).toBe(6);
      expect(fileSystemService.writeFile).toHaveBeenCalledTimes(2);
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('project1.md'),
        expect.any(String),
      );
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('project2.md'),
        expect.any(String),
      );
    });

    it('should append to existing files when appendOnly is true', async () => {
      // Given
      const command = new AggregateByProjectCommand({
        outputPath: '/output/aggregated',
        appendOnly: true,
      });

      const session = createSession('/project1');
      sessionRepository.findAll.mockResolvedValue([session]);
      
      const prompts = createPrompts(session.id, 1);
      promptRepository.findBySessionId.mockResolvedValue(prompts);

      fileSystemService.exists.mockResolvedValue(true);
      fileSystemService.readFile.mockResolvedValue('# Existing content\n');

      // When
      await useCase.execute(command);

      // Then
      expect(fileSystemService.readFile).toHaveBeenCalled();
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('# Existing content'),
      );
    });

    it('should create new files when appendOnly is false', async () => {
      // Given
      const command = new AggregateByProjectCommand({
        outputPath: '/output/aggregated',
        appendOnly: false,
      });

      const session = createSession('/project1');
      sessionRepository.findAll.mockResolvedValue([session]);
      
      const prompts = createPrompts(session.id, 1);
      promptRepository.findBySessionId.mockResolvedValue(prompts);

      // When
      await useCase.execute(command);

      // Then
      expect(fileSystemService.exists).not.toHaveBeenCalled();
      expect(fileSystemService.readFile).not.toHaveBeenCalled();
      expect(fileSystemService.writeFile).toHaveBeenCalled();
    });

    it('should handle sessions without prompts', async () => {
      // Given
      const command = new AggregateByProjectCommand({
        outputPath: '/output/aggregated',
        appendOnly: true,
      });

      const session = createSession('/project1');
      sessionRepository.findAll.mockResolvedValue([session]);
      promptRepository.findBySessionId.mockResolvedValue([]);

      // When
      const result = await useCase.execute(command);

      // Then
      expect(result.projectsAggregated).toBe(0);
      expect(result.totalPrompts).toBe(0);
      expect(fileSystemService.writeFile).not.toHaveBeenCalled();
    });
  });

  function createSession(projectPath: string): Session {
    return new Session({
      id: SessionId.generate(),
      projectPath,
      createdAt: new Date(),
    });
  }

  function createPrompts(sessionId: SessionId, count: number): Prompt[] {
    const prompts: Prompt[] = [];
    for (let i = 0; i < count; i++) {
      prompts.push(
        new Prompt({
          sessionId,
          role: i % 2 === 0 ? Role.USER : Role.ASSISTANT,
          content: `Test content ${i}`,
          timestamp: new Date(),
        }),
      );
    }
    return prompts;
  }
});