export interface SessionStatisticsData {
  totalPrompts: number;
  userPrompts: number;
  assistantPrompts: number;
  firstPromptAt?: Date;
  lastPromptAt?: Date;
}

export class SessionStatistics {
  readonly totalPrompts: number;
  readonly userPrompts: number;
  readonly assistantPrompts: number;
  readonly firstPromptAt?: Date;
  readonly lastPromptAt?: Date;

  constructor(data: SessionStatisticsData) {
    this.totalPrompts = data.totalPrompts;
    this.userPrompts = data.userPrompts;
    this.assistantPrompts = data.assistantPrompts;
    this.firstPromptAt = data.firstPromptAt;
    this.lastPromptAt = data.lastPromptAt;
  }

  getResponseRatio(): number {
    if (this.userPrompts === 0) return 0;
    return this.assistantPrompts / this.userPrompts;
  }

  getDuration(): number | null {
    if (!this.firstPromptAt || !this.lastPromptAt) {
      return null;
    }
    return this.lastPromptAt.getTime() - this.firstPromptAt.getTime();
  }

  getDurationInMinutes(): number | null {
    const duration = this.getDuration();
    if (duration === null) return null;
    return Math.round(duration / (1000 * 60));
  }

  getAveragePromptsPerMinute(): number | null {
    const durationInMinutes = this.getDurationInMinutes();
    if (!durationInMinutes || durationInMinutes === 0) return null;
    return this.totalPrompts / durationInMinutes;
  }

  isEmpty(): boolean {
    return this.totalPrompts === 0;
  }
}