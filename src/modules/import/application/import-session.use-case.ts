import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Session } from '../../sessions/domain/session.entity';
import { ISessionRepository } from '../../sessions/domain/session.repository.interface';
import { IPromptRepository } from '../../prompts/domain/prompt.repository.interface';
import { SessionFactory } from '../domain/session.factory';
import { IClaudeSessionParser } from '../domain/claude-session-parser.interface';
import { ImportSessionCommand } from './commands/import-session.command';
import { ImportResult } from './import-result.dto';

@Injectable()
export class ImportSessionUseCase {
  private readonly logger = new Logger(ImportSessionUseCase.name);

  constructor(
    private readonly parser: IClaudeSessionParser,
    private readonly sessionRepository: ISessionRepository,
    private readonly promptRepository: IPromptRepository,
    private readonly sessionFactory: SessionFactory,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ImportSessionCommand): Promise<ImportResult> {
    this.logger.debug('Importing sessions', { command });

    try {
      // Parse raw session data from Claude directory
      const rawSessions = await this.parser.parse(command.projectPath);
      
      if (rawSessions.length === 0) {
        return new ImportResult({
          sessionCount: 0,
          promptCount: 0,
          errors: [],
          duration: 0,
        });
      }

      const startTime = Date.now();
      const results = {
        sessionCount: 0,
        promptCount: 0,
        errors: [] as string[],
      };

      // Process each session
      for (const rawData of rawSessions) {
        try {
          // Skip if already imported and not forcing
          if (!command.force) {
            const existingSession = await this.sessionRepository.findByProjectPath(
              rawData.projectPath,
            );
            
            if (existingSession.length > 0) {
              this.logger.debug('Session already imported, skipping', {
                projectPath: rawData.projectPath,
              });
              continue;
            }
          }

          // Create domain entities
          const session = this.sessionFactory.createFromRaw(rawData);
          
          // Save session
          await this.sessionRepository.save(session);
          
          // Save prompts
          const prompts = session.getPrompts();
          if (prompts.length > 0) {
            await this.promptRepository.saveMany([...prompts]);
          }
          
          // Mark as imported and collect events
          session.markAsImported();
          
          // Publish domain events
          const events = session.getUncommittedEvents();
          for (const event of events) {
            await this.eventBus.publish(event);
          }
          
          results.sessionCount++;
          results.promptCount += prompts.length;
          
          this.logger.log('Session imported successfully', {
            sessionId: session.id.toString(),
            promptCount: prompts.length,
          });
        } catch (error) {
          const errorMessage = `Failed to import session: ${error.message}`;
          results.errors.push(errorMessage);
          this.logger.error(errorMessage, error.stack);
          
          if (!command.continueOnError) {
            throw error;
          }
        }
      }

      const duration = Date.now() - startTime;
      
      return new ImportResult({
        sessionCount: results.sessionCount,
        promptCount: results.promptCount,
        errors: results.errors,
        duration,
      });
    } catch (error) {
      this.logger.error('Import failed', error.stack);
      throw error;
    }
  }
}