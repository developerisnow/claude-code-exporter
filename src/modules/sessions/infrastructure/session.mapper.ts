import { Injectable } from '@nestjs/common';
import { SessionEntity } from '../../../database/entities/session.entity';
import { Session } from '../domain/session.entity';
import { SessionId } from '../../common/domain/value-objects';

@Injectable()
export class SessionMapper {
  toPersistence(session: Session): SessionEntity {
    const entity = new SessionEntity();
    entity.id = session.id.toString();
    entity.projectPath = session.projectPath;
    entity.createdAt = session.createdAt;
    entity.metadata = session.metadata;
    
    return entity;
  }

  toDomain(entity: SessionEntity): Session {
    return new Session({
      id: SessionId.fromString(entity.id),
      projectPath: entity.projectPath,
      createdAt: entity.createdAt,
      metadata: entity.metadata,
    });
  }
}