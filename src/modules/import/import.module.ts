import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsModule } from '../sessions/sessions.module';
import { PromptsModule } from '../prompts/prompts.module';
import { ProvidersModule } from '../providers/providers.module';
import { ProjectsModule } from '../projects/projects.module';
import { ImportSessionUseCase } from './application/import-session.use-case';
import { ClaudeSessionParser } from './infrastructure/claude-session-parser';
import { SessionFactory } from './domain/session.factory';
import { CursorImportService } from './cursor/cursor-import.service';
import { ConversationEntity } from './cursor/entities/conversation.entity';
import { ConversationTurnEntity } from './cursor/entities/conversation-turn.entity';

@Module({
  imports: [
    CqrsModule, 
    SessionsModule, 
    PromptsModule,
    ProvidersModule,
    ProjectsModule,
    TypeOrmModule.forFeature([ConversationEntity, ConversationTurnEntity]),
  ],
  providers: [
    ImportSessionUseCase,
    SessionFactory,
    CursorImportService,
    {
      provide: 'IClaudeSessionParser',
      useClass: ClaudeSessionParser,
    },
  ],
  exports: [ImportSessionUseCase, CursorImportService],
})
export class ImportModule {}
