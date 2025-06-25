import { AggregateRoot } from '../../common/domain/aggregate-root';
import { TopicId } from '../../common/domain/value-objects';
import { Prompt } from '../../prompts/domain/prompt.entity';
import { TopicRules } from './topic-rules.vo';

export interface CreateTopicParams {
  id?: TopicId;
  name: string;
  description?: string;
  rules: TopicRules;
  createdAt?: Date;
  createdBy?: string;
}

export class Topic extends AggregateRoot {
  readonly id: TopicId;
  readonly name: string;
  readonly description: string;
  readonly rules: TopicRules;
  readonly createdAt: Date;
  readonly createdBy: string;

  constructor(params: CreateTopicParams) {
    super();
    this.id = params.id || TopicId.generate();
    this.name = params.name;
    this.description = params.description || '';
    this.rules = params.rules;
    this.createdAt = params.createdAt || new Date();
    this.createdBy = params.createdBy || 'system';
    
    this.validate();
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Topic name is required');
    }
    
    if (this.name.length > 200) {
      throw new Error('Topic name must be less than 200 characters');
    }
    
    // Name should be alphanumeric with spaces, hyphens, and underscores
    const nameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!nameRegex.test(this.name)) {
      throw new Error('Topic name can only contain letters, numbers, spaces, hyphens, and underscores');
    }
  }

  matchesPrompt(prompt: Prompt): number {
    return this.rules.calculateConfidence(prompt);
  }

  wouldMatchPrompt(content: string): number {
    return this.rules.calculateConfidenceForContent(content);
  }

  hasKeyword(keyword: string): boolean {
    return this.rules.hasKeyword(keyword);
  }

  hasPattern(pattern: string): boolean {
    return this.rules.hasPattern(pattern);
  }

  updateRules(newRules: TopicRules): Topic {
    return new Topic({
      id: this.id,
      name: this.name,
      description: this.description,
      rules: newRules,
      createdAt: this.createdAt,
      createdBy: this.createdBy,
    });
  }

  updateDescription(newDescription: string): Topic {
    return new Topic({
      id: this.id,
      name: this.name,
      description: newDescription,
      rules: this.rules,
      createdAt: this.createdAt,
      createdBy: this.createdBy,
    });
  }

  isSystemTopic(): boolean {
    return this.createdBy === 'system';
  }

  isUserTopic(): boolean {
    return this.createdBy !== 'system';
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id.toString(),
      name: this.name,
      description: this.description,
      rules: this.rules.toJSON(),
      createdAt: this.createdAt.toISOString(),
      createdBy: this.createdBy,
    };
  }
}