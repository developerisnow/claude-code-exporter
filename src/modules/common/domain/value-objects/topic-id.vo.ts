import { v4 as uuidv4 } from 'uuid';

export class TopicId {
  private static readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  constructor(private readonly value: string) {
    if (!TopicId.isValidUuid(value)) {
      throw new Error(`Invalid TopicId: ${value}`);
    }
  }

  static generate(): TopicId {
    return new TopicId(uuidv4());
  }

  static fromString(value: string): TopicId {
    return new TopicId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: TopicId): boolean {
    return this.value === other.value;
  }

  private static isValidUuid(value: string): boolean {
    return TopicId.UUID_REGEX.test(value);
  }
}