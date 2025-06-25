import { DomainEvent } from '../../../common/domain/aggregate-root';
import { PromptId, TopicId } from '../../../common/domain/value-objects';

export class TopicAssignedEvent extends DomainEvent {
  constructor(
    public readonly promptId: PromptId,
    public readonly topicId: TopicId,
    public readonly confidence: number,
  ) {
    super(promptId.toString());
  }
}