import { v4 as uuidv4 } from 'uuid';

export class SessionId {
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  constructor(private readonly value: string) {
    if (!SessionId.isValidUuid(value)) {
      throw new Error(`Invalid SessionId: ${value}`);
    }
  }

  static generate(): SessionId {
    return new SessionId(uuidv4());
  }

  static fromString(value: string): SessionId {
    return new SessionId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: SessionId): boolean {
    return this.value === other.value;
  }

  private static isValidUuid(value: string): boolean {
    return SessionId.UUID_REGEX.test(value);
  }
}
