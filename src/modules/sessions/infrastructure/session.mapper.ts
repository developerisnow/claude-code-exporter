import { Injectable } from '@nestjs/common';
import { SessionEntity } from '../../../database/entities/session.entity';
import { Session } from '../domain/session.entity';
import { SessionId } from '../../common/domain/value-objects';

@Injectable()
export class SessionMapper {
  toPersistence(session: Session): SessionEntity {
    const entity = new SessionEntity();
    entity.id = session.id.toString();
    entity.project_path = session.projectPath;
    entity.start_time = session.createdAt;
    entity.end_time = null;
    entity.prompt_count = session.getPromptCount();
    entity.code_files_count = 0;
    entity.metadata = session.metadata || null;
    entity.created_at = session.createdAt;
    entity.updated_at = new Date();

    return entity;
  }

  toDomain(entity: SessionEntity): Session {
    return new Session({
      id: SessionId.fromString(entity.id),
      projectPath: entity.project_path,
      createdAt: entity.created_at,
      metadata: entity.metadata || undefined,
    });
  }
}
