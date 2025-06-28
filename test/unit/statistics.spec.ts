import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionEntity } from '../../src/modules/sessions/infrastructure/entities/session.entity';
import { ProjectEntity } from '../../src/modules/projects/infrastructure/entities/project.entity';
import { MessageEntity } from '../../src/modules/sessions/infrastructure/entities/message.entity';
import { DataSource } from 'typeorm';

describe('Session Statistics', () => {
  let dataSource: jest.Mocked<DataSource>;
  let sessionRepo: any;
  let projectRepo: any;
  let messageRepo: any;

  beforeEach(async () => {
    // Mock repositories
    sessionRepo = {
      createQueryBuilder: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: getRepositoryToken(SessionEntity), useValue: sessionRepo },
        { provide: getRepositoryToken(ProjectEntity), useValue: projectRepo },
        { provide: getRepositoryToken(MessageEntity), useValue: messageRepo },
      ],
    }).compile();
  });

  describe('getProjectStatistics', () => {
    it('should calculate correct statistics for a project', async () => {
      // Given
      const projectPath = '/test/project';
      const mockStats = {
        sessionCount: '5',
        totalPrompts: '50',
        totalOutputs: '45',
        firstSession: new Date('2024-01-01'),
        lastSession: new Date('2024-06-26'),
      };

      sessionRepo.getRawOne.mockResolvedValue(mockStats);

      // When
      const query = sessionRepo.createQueryBuilder('session');
      const result = await query
        .leftJoin('session.project', 'project')
        .select('COUNT(DISTINCT session.id)', 'sessionCount')
        .addSelect('SUM(session.userMessageCount)', 'totalPrompts')
        .addSelect('SUM(session.assistantMessageCount)', 'totalOutputs')
        .addSelect('MIN(session.startedAt)', 'firstSession')
        .addSelect('MAX(session.endedAt)', 'lastSession')
        .where('project.path = :path', { path: projectPath })
        .getRawOne();

      // Then
      expect(result.sessionCount).toBe('5');
      expect(result.totalPrompts).toBe('50');
      expect(result.totalOutputs).toBe('45');
      expect(result.firstSession).toEqual(new Date('2024-01-01'));
      expect(result.lastSession).toEqual(new Date('2024-06-26'));
    });

    it('should return zero counts for project with no sessions', async () => {
      // Given
      sessionRepo.getRawOne.mockResolvedValue({
        sessionCount: null,
        totalPrompts: null,
        totalOutputs: null,
        firstSession: null,
        lastSession: null,
      });

      // When
      const result = await sessionRepo.createQueryBuilder().getRawOne();

      // Then
      expect(parseInt(result.sessionCount) || 0).toBe(0);
      expect(parseInt(result.totalPrompts) || 0).toBe(0);
    });
  });

  describe('getDailyStatistics', () => {
    it('should calculate daily message counts', async () => {
      // Given
      const mockDailyStats = [
        { date: '2024-06-24', userCount: '10', assistantCount: '8' },
        { date: '2024-06-25', userCount: '15', assistantCount: '12' },
        { date: '2024-06-26', userCount: '20', assistantCount: '18' },
      ];

      sessionRepo.getRawMany.mockResolvedValue(mockDailyStats);

      // When
      const result = await sessionRepo
        .createQueryBuilder('message')
        .select("DATE(message.createdAt)", 'date')
        .addSelect("COUNT(CASE WHEN message.role = 'user' THEN 1 END)", 'userCount')
        .addSelect("COUNT(CASE WHEN message.role = 'assistant' THEN 1 END)", 'assistantCount')
        .groupBy('DATE(message.createdAt)')
        .getRawMany();

      // Then
      expect(result).toHaveLength(3);
      expect(result[0].userCount).toBe('10');
      expect(result[1].userCount).toBe('15');
      expect(result[2].userCount).toBe('20');
      
      const totalUserMessages = result.reduce((sum, day) => sum + parseInt(day.userCount), 0);
      expect(totalUserMessages).toBe(45);
    });
  });

  describe('getSessionLengthDistribution', () => {
    it('should calculate message count distribution', async () => {
      // Given
      const mockDistribution = [
        { range: '0-10', count: '15' },
        { range: '11-50', count: '25' },
        { range: '51-100', count: '10' },
        { range: '100+', count: '5' },
      ];

      sessionRepo.getRawMany.mockResolvedValue(mockDistribution);

      // When
      const result = await sessionRepo
        .createQueryBuilder('session')
        .select(`
          CASE 
            WHEN session.messageCount <= 10 THEN '0-10'
            WHEN session.messageCount <= 50 THEN '11-50'
            WHEN session.messageCount <= 100 THEN '51-100'
            ELSE '100+'
          END
        `, 'range')
        .addSelect('COUNT(*)', 'count')
        .groupBy('range')
        .getRawMany();

      // Then
      expect(result).toHaveLength(4);
      expect(result.find(r => r.range === '11-50').count).toBe('25');
      
      const totalSessions = result.reduce((sum, range) => sum + parseInt(range.count), 0);
      expect(totalSessions).toBe(55);
    });
  });

  describe('getMostActiveProjects', () => {
    it('should rank projects by activity', async () => {
      // Given
      const mockActiveProjects = [
        { 
          projectPath: '/project/one',
          projectName: 'one',
          sessionCount: '50',
          totalMessages: '1500',
          lastActivity: new Date('2024-06-26'),
        },
        {
          projectPath: '/project/two',
          projectName: 'two',
          sessionCount: '30',
          totalMessages: '800',
          lastActivity: new Date('2024-06-25'),
        },
      ];

      sessionRepo.getRawMany.mockResolvedValue(mockActiveProjects);

      // When
      const result = await sessionRepo
        .createQueryBuilder('session')
        .leftJoin('session.project', 'project')
        .select('project.path', 'projectPath')
        .addSelect('project.name', 'projectName')
        .addSelect('COUNT(session.id)', 'sessionCount')
        .addSelect('SUM(session.messageCount)', 'totalMessages')
        .addSelect('MAX(session.endedAt)', 'lastActivity')
        .groupBy('project.id')
        .orderBy('totalMessages', 'DESC')
        .limit(10)
        .getRawMany();

      // Then
      expect(result).toHaveLength(2);
      expect(result[0].projectPath).toBe('/project/one');
      expect(result[0].totalMessages).toBe('1500');
    });
  });
});