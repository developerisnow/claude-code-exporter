import { v4 as uuidv4 } from 'uuid';

export class PromptId {
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  constructor(private readonly value: string) {
    if (!PromptId.isValidUuid(value)) {
      throw new Error(`Invalid PromptId: ${value}`);
    }
  }

  static generate(): PromptId {
    return new PromptId(uuidv4());
  }

  static fromString(value: string): PromptId {
    return new PromptId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: PromptId): boolean {
    return this.value === other.value;
  }

  private static isValidUuid(value: string): boolean {
    return PromptId.UUID_REGEX.test(value);
  }
}
