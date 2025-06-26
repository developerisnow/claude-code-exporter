import { DomainEvent } from '../../../common/domain/aggregate-root';
import { PromptId, SessionId } from '../../../common/domain/value-objects';
import { Role } from '../prompt.entity';

export class PromptAddedEvent extends DomainEvent {
  constructor(
    public readonly promptId: PromptId,
    public readonly sessionId: SessionId,
    public readonly role: Role,
    public readonly timestamp: Date,
    public readonly contentLength: number,
  ) {
    super(promptId.toString());
  }
}
