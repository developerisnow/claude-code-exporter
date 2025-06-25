export class DateOnly {
  private readonly value: Date;

  constructor(date: Date | string) {
    this.value = new Date(date);
    this.value.setHours(0, 0, 0, 0);
  }

  static today(): DateOnly {
    return new DateOnly(new Date());
  }

  static yesterday(): DateOnly {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return new DateOnly(date);
  }

  static fromString(dateString: string): DateOnly {
    return new DateOnly(dateString);
  }

  toString(): string {
    return this.value.toISOString().split('T')[0];
  }

  toDate(): Date {
    return new Date(this.value);
  }

  equals(other: DateOnly): boolean {
    return this.value.getTime() === other.value.getTime();
  }

  isBefore(other: DateOnly): boolean {
    return this.value.getTime() < other.value.getTime();
  }

  isAfter(other: DateOnly): boolean {
    return this.value.getTime() > other.value.getTime();
  }

  addDays(days: number): DateOnly {
    const newDate = new Date(this.value);
    newDate.setDate(newDate.getDate() + days);
    return new DateOnly(newDate);
  }

  getDifferenceInDays(other: DateOnly): number {
    const diffTime = Math.abs(this.value.getTime() - other.value.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}