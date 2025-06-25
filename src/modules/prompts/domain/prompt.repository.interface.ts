import { PromptId, SessionId } from '../../common/domain/value-objects';
import { Prompt } from './prompt.entity';

export interface IPromptRepository {
  save(prompt: Prompt): Promise<void>;
  saveMany(prompts: Prompt[]): Promise<void>;
  findById(id: PromptId): Promise<Prompt | null>;
  findBySessionId(sessionId: SessionId): Promise<Prompt[]>;
  findByDateRange(start: Date, end: Date): Promise<Prompt[]>;
  search(query: string, limit: number): Promise<Prompt[]>;
  count(): Promise<number>;
  countBySessionId(sessionId: SessionId): Promise<number>;
}