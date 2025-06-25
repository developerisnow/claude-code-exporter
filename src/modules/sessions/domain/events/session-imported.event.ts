import { DomainEvent } from '../../../common/domain/aggregate-root';
import { SessionId } from '../../../common/domain/value-objects';

export class SessionImportedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: SessionId,
    public readonly projectPath: string,
    public readonly promptCount: number,
    public readonly metadata: Record<string, any>,
  ) {
    super(sessionId.toString());
  }
}