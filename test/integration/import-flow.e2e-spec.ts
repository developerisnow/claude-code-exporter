import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { ImportSessionUseCase } from '../../src/modules/import/application/import-session.use-case';
import { SessionRepository } from '../../src/modules/sessions/infrastructure/repositories/session.repository';
import { ProjectEntity } from '../../src/modules/projects/infrastructure/entities/project.entity';
import { SessionEntity } from '../../src/modules/sessions/infrastructure/entities/session.entity';
import { MessageEntity } from '../../src/modules/sessions/infrastructure/entities/message.entity';
import { ExportEntity } from '../../src/modules/export/infrastructure/entities/export.entity';
import { AggregateJobEntity } from '../../src/modules/aggregation/infrastructure/entities/aggregate-job.entity';
import { AggregateResultEntity } from '../../src/modules/aggregation/infrastructure/entities/aggregate-result.entity';

describe('Import Flow E2E', () => {
  let app: TestingModule;
  let dataSource: DataSource;
  let importUseCase: ImportSessionUseCase;
  let sessionRepo: SessionRepository;
  
  // Test data path
  const testDataPath = path.join(__dirname, 'fixtures', 'claude-sessions');

  beforeAll(async () => {
    // Create test database connection
    app = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT || '5432'),
          username: process.env.DATABASE_USERNAME || 'claude_exporter',
          password: process.env.DATABASE_PASSWORD || 'claude_exp_2024',
          database: process.env.DATABASE_NAME || 'claude_exporter_test',
          entities: [
            ProjectEntity,
            SessionEntity,
            MessageEntity,
            ExportEntity,
            AggregateJobEntity,
            AggregateResultEntity,
          ],
          synchronize: true, // For tests only
          dropSchema: true, // Clean database before tests
        }),
        TypeOrmModule.forFeature([
          ProjectEntity,
          SessionEntity,
          MessageEntity,
        ]),
      ],
      providers: [
        ImportSessionUseCase,
        SessionRepository,
        // Add other providers
      ],
    }).compile();

    dataSource = app.get(DataSource);
    importUseCase = app.get(ImportSessionUseCase);
    sessionRepo = app.get(SessionRepository);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await dataSource.synchronize(true);
  });

  describe('Import real Claude session', () => {
    it('should import a session from JSONL file', async () => {
      // Given
      const testSessionContent = `
{"message":{"role":"user","content":"Hello Claude"},"timestamp":"2024-01-01T10:00:00Z"}
{"message":{"role":"assistant","content":[{"type":"text","text":"Hello! How can I help you today?"}]},"timestamp":"2024-01-01T10:00:05Z"}
{"message":{"role":"user","content":"Can you explain TypeScript?"},"timestamp":"2024-01-01T10:01:00Z"}
{"message":{"role":"assistant","content":[{"type":"text","text":"TypeScript is a typed superset of JavaScript..."}]},"timestamp":"2024-01-01T10:01:10Z"}
`.trim();

      // Create test session file
      const sessionId = 'test-session-001';
      const sessionPath = path.join(testDataPath, `${sessionId}.jsonl`);
      fs.mkdirSync(path.dirname(sessionPath), { recursive: true });
      fs.writeFileSync(sessionPath, testSessionContent);

      // When
      const result = await importUseCase.execute({
        projectPath: '/test/project',
        sessionId,
        options: {
          claudeHome: path.dirname(testDataPath),
        },
      });

      // Then
      expect(result.sessionsImported).toBe(1);
      expect(result.totalMessages).toBe(4);

      // Verify in database
      const sessions = await dataSource.getRepository(SessionEntity).find({
        relations: ['messages', 'project'],
      });
      
      expect(sessions).toHaveLength(1);
      expect(sessions[0].sessionId).toBe(sessionId);
      expect(sessions[0].messageCount).toBe(4);
      expect(sessions[0].userMessageCount).toBe(2);
      expect(sessions[0].assistantMessageCount).toBe(2);
      
      const messages = sessions[0].messages;
      expect(messages).toHaveLength(4);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('Hello Claude');
      expect(messages[1].role).toBe('assistant');
      expect(messages[1].content).toContain('Hello! How can I help you today?');

      // Clean up
      fs.unlinkSync(sessionPath);
    });

    it('should handle complex message structures', async () => {
      // Given - session with tool use
      const complexSession = `
{"message":{"role":"user","content":"Read file.txt"},"timestamp":"2024-01-01T10:00:00Z"}
{"message":{"role":"assistant","content":[{"type":"text","text":"I'll read that file for you."},{"type":"tool_use","id":"tool_1","name":"read_file","input":{"path":"file.txt"}}]},"timestamp":"2024-01-01T10:00:05Z"}
{"message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"tool_1","content":"File contents here"}]},"timestamp":"2024-01-01T10:00:10Z"}
{"message":{"role":"assistant","content":[{"type":"text","text":"The file contains..."}]},"timestamp":"2024-01-01T10:00:15Z"}
`.trim();

      const sessionId = 'complex-session';
      const sessionPath = path.join(testDataPath, `${sessionId}.jsonl`);
      fs.writeFileSync(sessionPath, complexSession);

      // When
      const result = await importUseCase.execute({
        projectPath: '/test/project',
        sessionId,
      });

      // Then
      const session = await sessionRepo.findBySessionId(sessionId);
      expect(session).toBeDefined();
      expect(session!.messages).toHaveLength(4);
      
      const assistantMessage = session!.messages.find(m => 
        m.role === 'assistant' && m.sequenceNumber === 1
      );
      expect(assistantMessage?.structuredContent).toBeDefined();
      expect(assistantMessage?.content).toContain("I'll read that file");

      // Clean up
      fs.unlinkSync(sessionPath);
    });

    it('should update existing session with new messages', async () => {
      // Given - initial import
      const initialContent = `
{"message":{"role":"user","content":"First message"},"timestamp":"2024-01-01T10:00:00Z"}
{"message":{"role":"assistant","content":[{"type":"text","text":"First response"}]},"timestamp":"2024-01-01T10:00:05Z"}
`.trim();

      const sessionId = 'growing-session';
      const sessionPath = path.join(testDataPath, `${sessionId}.jsonl`);
      fs.writeFileSync(sessionPath, initialContent);

      await importUseCase.execute({
        projectPath: '/test/project',
        sessionId,
      });

      // Add more messages
      const updatedContent = initialContent + '\n' + `
{"message":{"role":"user","content":"Second message"},"timestamp":"2024-01-01T10:01:00Z"}
{"message":{"role":"assistant","content":[{"type":"text","text":"Second response"}]},"timestamp":"2024-01-01T10:01:05Z"}
`.trim();

      fs.writeFileSync(sessionPath, updatedContent);

      // When - reimport
      const result = await importUseCase.execute({
        projectPath: '/test/project',
        sessionId,
      });

      // Then
      expect(result.totalMessages).toBe(4);
      
      const session = await sessionRepo.findBySessionId(sessionId);
      expect(session!.messageCount).toBe(4);
      expect(session!.messages).toHaveLength(4);

      // Clean up
      fs.unlinkSync(sessionPath);
    });
  });

  describe('Project statistics', () => {
    it('should calculate correct statistics after import', async () => {
      // Given - multiple sessions
      const sessions = [
        { id: 'session-1', messages: 5, user: 3, assistant: 2 },
        { id: 'session-2', messages: 10, user: 5, assistant: 5 },
        { id: 'session-3', messages: 3, user: 2, assistant: 1 },
      ];

      for (const sessionData of sessions) {
        const content = [];
        for (let i = 0; i < sessionData.user; i++) {
          content.push(`{"message":{"role":"user","content":"Question ${i}"},"timestamp":"2024-01-01T10:0${i}:00Z"}`);
          if (i < sessionData.assistant) {
            content.push(`{"message":{"role":"assistant","content":[{"type":"text","text":"Answer ${i}"}]},"timestamp":"2024-01-01T10:0${i}:05Z"}`);
          }
        }
        
        const sessionPath = path.join(testDataPath, `${sessionData.id}.jsonl`);
        fs.writeFileSync(sessionPath, content.join('\n'));
        
        await importUseCase.execute({
          projectPath: '/test/project',
          sessionId: sessionData.id,
        });
      }

      // When - query project statistics
      const stats = await dataSource.query(`
        SELECT * FROM project_statistics 
        WHERE path = '/test/project'
      `);

      // Then
      expect(stats).toHaveLength(1);
      expect(stats[0].session_count).toBe('3');
      expect(stats[0].total_prompts).toBe('10'); // 3 + 5 + 2
      expect(stats[0].total_outputs).toBe('8');  // 2 + 5 + 1
      expect(stats[0].total_messages).toBe('18');

      // Clean up
      sessions.forEach(s => {
        fs.unlinkSync(path.join(testDataPath, `${s.id}.jsonl`));
      });
    });
  });

  describe('Error handling', () => {
    it('should handle corrupt JSONL gracefully', async () => {
      // Given
      const corruptContent = `
{"message":{"role":"user","content":"Valid message"},"timestamp":"2024-01-01T10:00:00Z"}
{invalid json here
{"message":{"role":"assistant","content":"This won't be read"},"timestamp":"2024-01-01T10:00:05Z"}
`.trim();

      const sessionId = 'corrupt-session';
      const sessionPath = path.join(testDataPath, `${sessionId}.jsonl`);
      fs.writeFileSync(sessionPath, corruptContent);

      // When/Then
      await expect(importUseCase.execute({
        projectPath: '/test/project',
        sessionId,
      })).rejects.toThrow();

      // Verify partial import didn't happen
      const sessions = await dataSource.getRepository(SessionEntity).find();
      expect(sessions).toHaveLength(0);

      // Clean up
      fs.unlinkSync(sessionPath);
    });

    it('should handle missing session file', async () => {
      // When/Then
      await expect(importUseCase.execute({
        projectPath: '/test/project',
        sessionId: 'non-existent-session',
      })).rejects.toThrow('Session file not found');
    });
  });
});