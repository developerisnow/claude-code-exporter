export abstract class DomainEvent {
  public readonly occurredOn: Date;

  constructor(public readonly aggregateId: string) {
    this.occurredOn = new Date();
  }
}

export abstract class AggregateRoot {
  private domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  clearEvents(): void {
    this.domainEvents = [];
  }

  getUncommittedEvents(): DomainEvent[] {
    return this.domainEvents;
  }
}
