import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionEntity } from '../../../database/entities/session.entity';
import { ISessionRepository } from '../domain/session.repository.interface';
import { Session } from '../domain/session.entity';
import { SessionId } from '../../common/domain/value-objects';
import { SessionMapper } from './session.mapper';

@Injectable()
export class TypeOrmSessionRepository implements ISessionRepository {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly repository: Repository<SessionEntity>,
    private readonly mapper: SessionMapper,
  ) {}

  async save(session: Session): Promise<void> {
    const entity = this.mapper.toPersistence(session);
    await this.repository.save(entity);
  }

  async findById(id: SessionId): Promise<Session | null> {
    const entity = await this.repository.findOne({
      where: { id: id.toString() },
    });
    
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByProjectPath(path: string): Promise<Session[]> {
    const entities = await this.repository.find({
      where: { projectPath: path },
      order: { createdAt: 'ASC' },
    });
    
    return entities.map(entity => this.mapper.toDomain(entity));
  }

  async findByDateRange(start: Date, end: Date): Promise<Session[]> {
    const entities = await this.repository
      .createQueryBuilder('session')
      .where('session.createdAt >= :start', { start })
      .andWhere('session.createdAt <= :end', { end })
      .orderBy('session.createdAt', 'ASC')
      .getMany();
    
    return entities.map(entity => this.mapper.toDomain(entity));
  }

  async findAll(): Promise<Session[]> {
    const entities = await this.repository.find({
      order: { createdAt: 'ASC' },
    });
    
    return entities.map(entity => this.mapper.toDomain(entity));
  }

  async delete(id: SessionId): Promise<void> {
    await this.repository.delete({ id: id.toString() });
  }

  async exists(id: SessionId): Promise<boolean> {
    const count = await this.repository.count({
      where: { id: id.toString() },
    });
    
    return count > 0;
  }

  async count(): Promise<number> {
    return this.repository.count();
  }
}