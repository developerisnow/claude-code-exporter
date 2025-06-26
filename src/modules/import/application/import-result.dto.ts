export interface ImportResultData {
  sessionCount: number;
  promptCount: number;
  errors: string[];
  duration: number;
}

export class ImportResult {
  readonly sessionCount: number;
  readonly promptCount: number;
  readonly errors: string[];
  readonly duration: number;

  constructor(data: ImportResultData) {
    this.sessionCount = data.sessionCount;
    this.promptCount = data.promptCount;
    this.errors = data.errors;
    this.duration = data.duration;
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  isSuccess(): boolean {
    return !this.hasErrors() && this.sessionCount > 0;
  }

  getAveragePromptsPerSession(): number {
    if (this.sessionCount === 0) return 0;
    return this.promptCount / this.sessionCount;
  }

  getDurationInSeconds(): number {
    return this.duration / 1000;
  }

  toJSON(): Record<string, any> {
    return {
      sessionCount: this.sessionCount,
      promptCount: this.promptCount,
      errors: this.errors,
      duration: this.duration,
      averagePromptsPerSession: this.getAveragePromptsPerSession(),
      durationInSeconds: this.getDurationInSeconds(),
    };
  }
}
