import { Injectable } from '@nestjs/common';
import { PromptEntity } from '../../../database/entities/prompt.entity';
import { Prompt, Role } from '../domain/prompt.entity';
import { PromptId, SessionId } from '../../common/domain/value-objects';

@Injectable()
export class PromptMapper {
  toPersistence(prompt: Prompt): PromptEntity {
    const entity = new PromptEntity();
    entity.id = prompt.id.toString();
    entity.session_id = prompt.sessionId.toString();
    entity.role = this.mapRoleToEntity(prompt.role);
    entity.content = prompt.content;
    entity.timestamp = prompt.timestamp;
    entity.sequence_number = prompt.sequenceNumber || 0;
    entity.file_count = 0;
    entity.metadata = prompt.metadata || null;
    entity.created_at = new Date();
    entity.updated_at = new Date();

    return entity;
  }

  toDomain(entity: PromptEntity): Prompt {
    return new Prompt({
      id: PromptId.fromString(entity.id),
      sessionId: SessionId.fromString(entity.session_id),
      role: this.mapRoleFromEntity(entity.role),
      content: entity.content,
      timestamp: entity.timestamp,
      metadata: entity.metadata || undefined,
      sequenceNumber: entity.sequence_number,
    });
  }

  private mapRoleToEntity(role: Role): string {
    return role; // Role enum values already match the database values
  }

  private mapRoleFromEntity(role: string): Role {
    switch (role) {
      case 'user':
        return Role.USER;
      case 'assistant':
        return Role.ASSISTANT;
      case 'system':
        return Role.SYSTEM;
      default:
        throw new Error(`Unknown prompt role: ${role}`);
    }
  }
}
