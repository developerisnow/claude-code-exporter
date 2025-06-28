import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionRepository } from './session.repository';
import { SessionEntity } from '../entities/session.entity';
import { ProjectEntity } from '../../../projects/infrastructure/entities/project.entity';
import { Session } from '../../domain/entities/session.entity';
import { SessionMapper } from '../mappers/session.mapper';

describe('SessionRepository', () => {
  let repository: SessionRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<SessionEntity>>;
  let mockProjectRepo: jest.Mocked<Repository<ProjectEntity>>;
  let mockMapper: jest.Mocked<SessionMapper>;

  beforeEach(async () => {
    // Create mocks
    mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    } as any;

    mockProjectRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    mockMapper = {
      toDomain: jest.fn(),
      toPersistence: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionRepository,
        { provide: getRepositoryToken(SessionEntity), useValue: mockTypeOrmRepo },
        { provide: getRepositoryToken(ProjectEntity), useValue: mockProjectRepo },
        { provide: SessionMapper, useValue: mockMapper },
      ],
    }).compile();

    repository = module.get<SessionRepository>(SessionRepository);
  });

  describe('save', () => {
    it('should save a new session with project', async () => {
      // Given
      const session = new Session();
      session.id = 'session-id';
      session.sessionId = 'claude-session-123';
      session.projectPath = '/test/project';
      session.messageCount = 5;
      session.userMessageCount = 3;
      session.assistantMessageCount = 2;

      const projectEntity = new ProjectEntity();
      projectEntity.id = 'project-id';
      projectEntity.path = '/test/project';
      projectEntity.name = 'test';
      projectEntity.encodedPath = '-test-project';

      const sessionEntity = new SessionEntity();
      sessionEntity.id = 'session-id';
      sessionEntity.projectId = 'project-id';

      mockProjectRepo.findOne.mockResolvedValue(null);
      mockProjectRepo.save.mockResolvedValue(projectEntity);
      mockMapper.toPersistence.mockReturnValue(sessionEntity);
      mockTypeOrmRepo.save.mockResolvedValue(sessionEntity);
      mockTypeOrmRepo.findOne.mockResolvedValue(sessionEntity);
      mockMapper.toDomain.mockReturnValue(session);

      // When
      const result = await repository.save(session);

      // Then
      expect(mockProjectRepo.findOne).toHaveBeenCalledWith({
        where: { path: '/test/project' },
      });
      expect(mockProjectRepo.save).toHaveBeenCalledWith({
        path: '/test/project',
        name: 'test',
        encodedPath: '-test-project',
        firstSeen: expect.any(Date),
        lastUpdated: expect.any(Date),
      });
      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(sessionEntity);
      expect(result).toBe(session);
    });

    it('should update existing session', async () => {
      // Given
      const session = new Session();
      session.id = 'existing-id';
      session.sessionId = 'claude-session-123';
      session.messageCount = 10;

      const existingEntity = new SessionEntity();
      existingEntity.id = 'existing-id';

      mockTypeOrmRepo.findOne.mockResolvedValueOnce(existingEntity);
      mockMapper.toPersistence.mockReturnValue(existingEntity);
      mockTypeOrmRepo.save.mockResolvedValue(existingEntity);
      mockTypeOrmRepo.findOne.mockResolvedValueOnce(existingEntity);
      mockMapper.toDomain.mockReturnValue(session);

      // When
      const result = await repository.save(session);

      // Then
      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(existingEntity);
      expect(result.messageCount).toBe(10);
    });
  });

  describe('findByProjectPath', () => {
    it('should find all sessions for a project', async () => {
      // Given
      const projectPath = '/test/project';
      const sessionEntities = [
        { id: '1', sessionId: 'session-1' },
        { id: '2', sessionId: 'session-2' },
      ] as SessionEntity[];

      const domainSessions = sessionEntities.map(e => {
        const s = new Session();
        s.id = e.id;
        s.sessionId = e.sessionId;
        return s;
      });

      const queryBuilder = mockTypeOrmRepo.createQueryBuilder();
      mockTypeOrmRepo.createQueryBuilder.mockReturnValue(queryBuilder as any);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue(sessionEntities);
      mockMapper.toDomain.mockImplementation((e, i) => domainSessions[i]);

      // When
      const result = await repository.findByProjectPath(projectPath);

      // Then
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('session.project', 'project');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('session.messages', 'messages');
      expect(queryBuilder.where).toHaveBeenCalledWith('project.path = :path', { path: projectPath });
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('session.startedAt', 'DESC');
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no sessions found', async () => {
      // Given
      const queryBuilder = mockTypeOrmRepo.createQueryBuilder();
      mockTypeOrmRepo.createQueryBuilder.mockReturnValue(queryBuilder as any);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([]);

      // When
      const result = await repository.findByProjectPath('/empty/project');

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('findBySessionId', () => {
    it('should find session by claude session id', async () => {
      // Given
      const sessionId = 'claude-123';
      const sessionEntity = new SessionEntity();
      sessionEntity.sessionId = sessionId;

      const domainSession = new Session();
      domainSession.sessionId = sessionId;

      mockTypeOrmRepo.findOne.mockResolvedValue(sessionEntity);
      mockMapper.toDomain.mockReturnValue(domainSession);

      // When
      const result = await repository.findBySessionId(sessionId);

      // Then
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { sessionId },
        relations: ['project', 'messages'],
      });
      expect(result?.sessionId).toBe(sessionId);
    });

    it('should return null when session not found', async () => {
      // Given
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      // When
      const result = await repository.findBySessionId('non-existent');

      // Then
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete session by id', async () => {
      // Given
      const sessionId = 'session-to-delete';
      mockTypeOrmRepo.delete.mockResolvedValue({ affected: 1 } as any);

      // When
      await repository.delete(sessionId);

      // Then
      expect(mockTypeOrmRepo.delete).toHaveBeenCalledWith(sessionId);
    });

    it('should throw error when session not found', async () => {
      // Given
      mockTypeOrmRepo.delete.mockResolvedValue({ affected: 0 } as any);

      // When/Then
      await expect(repository.delete('non-existent')).rejects.toThrow(
        'Session not found'
      );
    });
  });
});