import { AggregateRoot } from '../../common/domain/aggregate-root';
import { PromptId, SessionId, TopicId } from '../../common/domain/value-objects';
import { PromptAddedEvent } from './events/prompt-added.event';
import { TopicAssignedEvent } from './events/topic-assigned.event';
import { TopicAssignment } from './topic-assignment.vo';

export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export interface PromptMetadata {
  [key: string]: any;
}

export interface CreatePromptParams {
  id?: PromptId;
  sessionId: SessionId;
  role: Role;
  content: string;
  timestamp: Date;
  metadata?: PromptMetadata;
}

export class Prompt extends AggregateRoot {
  readonly id: PromptId;
  readonly sessionId: SessionId;
  readonly role: Role;
  readonly content: string;
  readonly timestamp: Date;
  readonly metadata: PromptMetadata;
  private topics: TopicAssignment[] = [];

  constructor(params: CreatePromptParams) {
    super();
    this.id = params.id || PromptId.generate();
    this.sessionId = params.sessionId;
    this.role = params.role;
    this.content = params.content;
    this.timestamp = params.timestamp;
    this.metadata = params.metadata || {};
    
    this.validate();
  }

  private validate(): void {
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('Prompt content is required');
    }
    
    if (!Object.values(Role).includes(this.role)) {
      throw new Error(`Invalid role: ${this.role}`);
    }
  }

  assignTopic(topicId: TopicId, confidence: number): void {
    if (confidence < 0 || confidence > 1) {
      throw new Error('Topic confidence must be between 0 and 1');
    }
    
    const existingAssignment = this.topics.find(
      t => t.topicId.equals(topicId)
    );
    
    if (existingAssignment) {
      throw new Error('Topic already assigned to this prompt');
    }
    
    this.topics.push(new TopicAssignment(topicId, confidence));
    
    this.addDomainEvent(
      new TopicAssignedEvent(this.id, topicId, confidence),
    );
  }

  getTopics(): readonly TopicAssignment[] {
    return [...this.topics];
  }

  hasTopics(): boolean {
    return this.topics.length > 0;
  }

  getTopicCount(): number {
    return this.topics.length;
  }

  getHighConfidenceTopics(minConfidence: number = 0.8): TopicAssignment[] {
    return this.topics.filter(t => t.confidence >= minConfidence);
  }

  getContentLength(): number {
    return this.content.length;
  }

  getWordCount(): number {
    return this.content
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }

  isUserRole(): boolean {
    return this.role === Role.USER;
  }

  isAssistantRole(): boolean {
    return this.role === Role.ASSISTANT;
  }

  isSystemRole(): boolean {
    return this.role === Role.SYSTEM;
  }

  markAsAdded(): void {
    this.addDomainEvent(
      new PromptAddedEvent(
        this.id,
        this.sessionId,
        this.role,
        this.timestamp,
        this.getContentLength(),
      ),
    );
  }

  containsText(searchText: string, caseSensitive: boolean = false): boolean {
    if (caseSensitive) {
      return this.content.includes(searchText);
    }
    return this.content.toLowerCase().includes(searchText.toLowerCase());
  }

  getPreview(maxLength: number = 100): string {
    if (this.content.length <= maxLength) {
      return this.content;
    }
    return this.content.substring(0, maxLength) + '...';
  }
}