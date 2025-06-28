import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionEntity } from '../entities/session.entity';
import { ProjectEntity } from '../../../projects/infrastructure/entities/project.entity';
import { ISessionRepository } from '../../domain/session.repository.interface';
import { Session } from '../../domain/session.entity';
import { SessionMapper } from '../session.mapper';

@Injectable()
export class SessionRepository implements ISessionRepository {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    private readonly mapper: SessionMapper,
  ) {}

  async save(session: Session): Promise<Session> {
    // Ensure project exists
    let project = await this.projectRepo.findOne({
      where: { path: session.projectPath },
    });

    if (!project) {
      // Create project if it doesn't exist
      project = this.projectRepo.create({
        path: session.projectPath,
        name: this.extractProjectName(session.projectPath),
        encodedPath: this.encodeProjectPath(session.projectPath),
        firstSeen: new Date(),
        lastUpdated: new Date(),
      });
      project = await this.projectRepo.save(project);
    } else {
      // Update last updated
      project.lastUpdated = new Date();
      await this.projectRepo.save(project);
    }

    // Check if session exists
    let sessionEntity = await this.sessionRepo.findOne({
      where: { sessionId: session.sessionId },
    });

    if (sessionEntity) {
      // Update existing
      sessionEntity = Object.assign(sessionEntity, this.mapper.toPersistence(session));
    } else {
      // Create new
      sessionEntity = this.mapper.toPersistence(session);
    }

    if (sessionEntity) {
      sessionEntity.projectId = project.id;
      const savedEntity = await this.sessionRepo.save(sessionEntity);

      // Reload with relations
      const reloadedEntity = await this.sessionRepo.findOne({
        where: { id: savedEntity.id },
        relations: ['project', 'messages'],
      });

      return this.mapper.toDomain(reloadedEntity!);
    }

    throw new Error('Failed to create session entity');
  }

  async findById(id: string): Promise<Session | null> {
    const entity = await this.sessionRepo.findOne({
      where: { id },
      relations: ['project', 'messages'],
    });

    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findBySessionId(sessionId: string): Promise<Session | null> {
    const entity = await this.sessionRepo.findOne({
      where: { sessionId },
      relations: ['project', 'messages'],
    });

    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByProjectPath(projectPath: string): Promise<Session[]> {
    const sessions = await this.sessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.project', 'project')
      .leftJoinAndSelect('session.messages', 'messages')
      .where('project.path = :path', { path: projectPath })
      .orderBy('session.startedAt', 'DESC')
      .getMany();

    return sessions.map(entity => this.mapper.toDomain(entity));
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
  }): Promise<Session[]> {
    const query = this.sessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.project', 'project')
      .leftJoinAndSelect('session.messages', 'messages');

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    if (options?.orderBy) {
      const [field, order] = options.orderBy.split(':');
      query.orderBy(`session.${field}`, order as 'ASC' | 'DESC');
    } else {
      query.orderBy('session.createdAt', 'DESC');
    }

    const sessions = await query.getMany();
    return sessions.map(entity => this.mapper.toDomain(entity));
  }

  async delete(id: string): Promise<void> {
    const result = await this.sessionRepo.delete(id);
    if (result.affected === 0) {
      throw new Error('Session not found');
    }
  }

  async getStatisticsByProject(projectPath: string): Promise<{
    sessionCount: number;
    totalPrompts: number;
    totalOutputs: number;
    firstSession: Date | null;
    lastSession: Date | null;
  }> {
    const result = await this.sessionRepo
      .createQueryBuilder('session')
      .leftJoin('session.project', 'project')
      .select('COUNT(DISTINCT session.id)', 'sessionCount')
      .addSelect('SUM(session.userMessageCount)', 'totalPrompts')
      .addSelect('SUM(session.assistantMessageCount)', 'totalOutputs')
      .addSelect('MIN(session.startedAt)', 'firstSession')
      .addSelect('MAX(session.endedAt)', 'lastSession')
      .where('project.path = :path', { path: projectPath })
      .getRawOne();

    return {
      sessionCount: parseInt(result.sessionCount) || 0,
      totalPrompts: parseInt(result.totalPrompts) || 0,
      totalOutputs: parseInt(result.totalOutputs) || 0,
      firstSession: result.firstSession,
      lastSession: result.lastSession,
    };
  }

  private extractProjectName(projectPath: string): string {
    return projectPath.split('/').filter(Boolean).pop() || 'unknown';
  }

  private encodeProjectPath(projectPath: string): string {
    return projectPath.replace(/\//g, '-').replace(/_/g, '-');
  }
}