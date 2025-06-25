import { AggregateRoot } from '../../common/domain/aggregate-root';
import { SessionId } from '../../common/domain/value-objects';
import { Prompt } from '../../prompts/domain/prompt.entity';
import { SessionImportedEvent } from './events/session-imported.event';
import { SessionStatistics } from './session-statistics.vo';

export interface SessionMetadata {
  version?: string;
  [key: string]: any;
}

export interface CreateSessionParams {
  id?: SessionId;
  projectPath: string;
  createdAt?: Date;
  metadata?: SessionMetadata;
}

export class Session extends AggregateRoot {
  readonly id: SessionId;
  readonly projectPath: string;
  readonly createdAt: Date;
  readonly metadata: SessionMetadata;
  private prompts: Prompt[] = [];

  constructor(params: CreateSessionParams) {
    super();
    this.id = params.id || SessionId.generate();
    this.projectPath = params.projectPath;
    this.createdAt = params.createdAt || new Date();
    this.metadata = params.metadata || {};
    
    this.validate();
  }

  private validate(): void {
    if (!this.projectPath || this.projectPath.trim().length === 0) {
      throw new Error('Session project path is required');
    }
    
    if (this.projectPath.length > 500) {
      throw new Error('Session project path must be less than 500 characters');
    }
  }

  addPrompt(prompt: Prompt): void {
    if (!prompt.sessionId.equals(this.id)) {
      throw new Error('Prompt does not belong to this session');
    }
    
    this.prompts.push(prompt);
  }

  getPrompts(): readonly Prompt[] {
    return [...this.prompts];
  }

  getStatistics(): SessionStatistics {
    return new SessionStatistics({
      totalPrompts: this.prompts.length,
      userPrompts: this.prompts.filter(p => p.isUserRole()).length,
      assistantPrompts: this.prompts.filter(p => p.isAssistantRole()).length,
      firstPromptAt: this.prompts[0]?.timestamp,
      lastPromptAt: this.prompts[this.prompts.length - 1]?.timestamp,
    });
  }

  markAsImported(): void {
    this.addDomainEvent(
      new SessionImportedEvent(
        this.id,
        this.projectPath,
        this.prompts.length,
        this.metadata,
      ),
    );
  }

  hasPrompts(): boolean {
    return this.prompts.length > 0;
  }

  getPromptCount(): number {
    return this.prompts.length;
  }

  getTimeRange(): { start: Date; end: Date } | null {
    if (this.prompts.length === 0) {
      return null;
    }

    const timestamps = this.prompts.map(p => p.timestamp);
    return {
      start: new Date(Math.min(...timestamps.map(t => t.getTime()))),
      end: new Date(Math.max(...timestamps.map(t => t.getTime()))),
    };
  }
}