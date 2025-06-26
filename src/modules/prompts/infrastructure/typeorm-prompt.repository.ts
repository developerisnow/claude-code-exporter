import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromptEntity } from '../../../database/entities/prompt.entity';
import { IPromptRepository } from '../domain/prompt.repository.interface';
import { Prompt } from '../domain/prompt.entity';
import { PromptId, SessionId } from '../../common/domain/value-objects';
import { PromptMapper } from './prompt.mapper';

@Injectable()
export class TypeOrmPromptRepository implements IPromptRepository {
  constructor(
    @InjectRepository(PromptEntity)
    private readonly repository: Repository<PromptEntity>,
    private readonly mapper: PromptMapper,
  ) {}

  async save(prompt: Prompt): Promise<void> {
    const entity = this.mapper.toPersistence(prompt);
    await this.repository.save(entity);
  }

  async saveMany(prompts: Prompt[]): Promise<void> {
    const entities = prompts.map((prompt) => this.mapper.toPersistence(prompt));
    await this.repository.save(entities);
  }

  async findById(id: PromptId): Promise<Prompt | null> {
    const entity = await this.repository.findOne({
      where: { id: id.toString() },
    });

    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findBySessionId(sessionId: SessionId): Promise<Prompt[]> {
    const entities = await this.repository.find({
      where: { session_id: sessionId.toString() },
      order: { timestamp: 'ASC' },
    });

    return entities.map((entity) => this.mapper.toDomain(entity));
  }

  async findByDateRange(start: Date, end: Date): Promise<Prompt[]> {
    const entities = await this.repository
      .createQueryBuilder('prompt')
      .where('prompt.timestamp >= :start', { start })
      .andWhere('prompt.timestamp <= :end', { end })
      .orderBy('prompt.timestamp', 'ASC')
      .getMany();

    return entities.map((entity) => this.mapper.toDomain(entity));
  }

  async search(query: string, limit: number): Promise<Prompt[]> {
    const entities = await this.repository
      .createQueryBuilder('prompt')
      .where('prompt.content ILIKE :query', { query: `%${query}%` })
      .orderBy('prompt.timestamp', 'DESC')
      .limit(limit)
      .getMany();

    return entities.map((entity) => this.mapper.toDomain(entity));
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  async countBySessionId(sessionId: SessionId): Promise<number> {
    return this.repository.count({
      where: { session_id: sessionId.toString() },
    });
  }
}
