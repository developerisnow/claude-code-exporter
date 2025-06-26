import { Prompt } from '../../prompts/domain/prompt.entity';

export interface TopicRulesData {
  keywords: string[];
  patterns: string[];
  excludeKeywords: string[];
  minConfidence?: number;
}

export class TopicRules {
  readonly keywords: string[];
  readonly patterns: RegExp[];
  readonly excludeKeywords: string[];
  readonly minConfidence: number;

  constructor(data: TopicRulesData) {
    this.keywords = data.keywords.map((k) => k.toLowerCase());
    this.patterns = data.patterns.map((p) => new RegExp(p, 'i'));
    this.excludeKeywords = data.excludeKeywords.map((k) => k.toLowerCase());
    this.minConfidence = data.minConfidence || 0.5;

    this.validate();
  }

  private validate(): void {
    if (this.minConfidence < 0 || this.minConfidence > 1) {
      throw new Error('Minimum confidence must be between 0 and 1');
    }

    // Validate regex patterns
    for (const pattern of this.patterns) {
      try {
        pattern.test('test');
      } catch {
        throw new Error(`Invalid regex pattern: ${pattern}`);
      }
    }
  }

  calculateConfidence(prompt: Prompt): number {
    return this.calculateConfidenceForContent(prompt.content);
  }

  calculateConfidenceForContent(content: string): number {
    let score = 0;
    const lowerContent = content.toLowerCase();
    const maxScore = this.keywords.length * 0.2 + this.patterns.length * 0.3;

    // Keyword matching (0.2 points each)
    for (const keyword of this.keywords) {
      if (lowerContent.includes(keyword)) {
        score += 0.2;
      }
    }

    // Pattern matching (0.3 points each)
    for (const pattern of this.patterns) {
      if (pattern.test(content)) {
        score += 0.3;
      }
    }

    // Exclude keywords (minus 0.5 points each)
    for (const exclude of this.excludeKeywords) {
      if (lowerContent.includes(exclude)) {
        score -= 0.5;
      }
    }

    // Normalize to 0-1 range
    if (maxScore > 0) {
      score = score / maxScore;
    }

    return Math.max(0, Math.min(1, score));
  }

  hasKeyword(keyword: string): boolean {
    return this.keywords.includes(keyword.toLowerCase());
  }

  hasPattern(pattern: string): boolean {
    return this.patterns.some((p) => p.source === pattern);
  }

  hasExcludeKeyword(keyword: string): boolean {
    return this.excludeKeywords.includes(keyword.toLowerCase());
  }

  addKeyword(keyword: string): TopicRules {
    if (this.hasKeyword(keyword)) {
      return this;
    }

    return new TopicRules({
      keywords: [...this.keywords, keyword],
      patterns: this.patterns.map((p) => p.source),
      excludeKeywords: this.excludeKeywords,
      minConfidence: this.minConfidence,
    });
  }

  removeKeyword(keyword: string): TopicRules {
    return new TopicRules({
      keywords: this.keywords.filter((k) => k !== keyword.toLowerCase()),
      patterns: this.patterns.map((p) => p.source),
      excludeKeywords: this.excludeKeywords,
      minConfidence: this.minConfidence,
    });
  }

  isEmpty(): boolean {
    return (
      this.keywords.length === 0 &&
      this.patterns.length === 0 &&
      this.excludeKeywords.length === 0
    );
  }

  toJSON(): TopicRulesData {
    return {
      keywords: [...this.keywords],
      patterns: this.patterns.map((p) => p.source),
      excludeKeywords: [...this.excludeKeywords],
      minConfidence: this.minConfidence,
    };
  }
}
