import { TopicId } from '../../common/domain/value-objects';

export class TopicAssignment {
  constructor(
    public readonly topicId: TopicId,
    public readonly confidence: number,
    public readonly assignedAt: Date = new Date(),
    public readonly assignedBy: string = 'system',
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.confidence < 0 || this.confidence > 1) {
      throw new Error('Confidence must be between 0 and 1');
    }
  }

  isHighConfidence(threshold: number = 0.8): boolean {
    return this.confidence >= threshold;
  }

  isMediumConfidence(): boolean {
    return this.confidence >= 0.5 && this.confidence < 0.8;
  }

  isLowConfidence(): boolean {
    return this.confidence < 0.5;
  }

  isManualAssignment(): boolean {
    return this.assignedBy !== 'system' && this.assignedBy !== 'auto';
  }

  toJSON(): Record<string, any> {
    return {
      topicId: this.topicId.toString(),
      confidence: this.confidence,
      assignedAt: this.assignedAt.toISOString(),
      assignedBy: this.assignedBy,
    };
  }
}
