import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SessionsModule } from '../sessions/sessions.module';
import { PromptsModule } from '../prompts/prompts.module';
import { ImportSessionUseCase } from './application/import-session.use-case';
import { ClaudeSessionParser } from './infrastructure/claude-session-parser';
import { SessionFactory } from './domain/session.factory';

@Module({
  imports: [CqrsModule, SessionsModule, PromptsModule],
  providers: [
    ImportSessionUseCase,
    SessionFactory,
    {
      provide: 'IClaudeSessionParser',
      useClass: ClaudeSessionParser,
    },
  ],
  exports: [ImportSessionUseCase],
})
export class ImportModule {}
