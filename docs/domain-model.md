# Domain Model Design

## Core Domain Entities

### 1. Session
The root aggregate representing a Claude Code conversation session.

```typescript
export class Session {
  readonly id: SessionId;
  readonly projectPath: string;
  readonly createdAt: Date;
  readonly metadata: SessionMetadata;
  private prompts: Prompt[];
  
  constructor(params: CreateSessionParams) {
    this.id = params.id || SessionId.generate();
    this.projectPath = params.projectPath;
    this.createdAt = params.createdAt || new Date();
    this.metadata = params.metadata || {};
    this.prompts = [];
  }
  
  addPrompt(prompt: Prompt): void {
    this.prompts.push(prompt);
    this.addDomainEvent(new PromptAddedEvent(this.id, prompt));
  }
  
  getStatistics(): SessionStatistics {
    return new SessionStatistics({
      totalPrompts: this.prompts.length,
      userPrompts: this.prompts.filter(p => p.role === Role.USER).length,
      assistantPrompts: this.prompts.filter(p => p.role === Role.ASSISTANT).length,
      firstPromptAt: this.prompts[0]?.timestamp,
      lastPromptAt: this.prompts[this.prompts.length - 1]?.timestamp
    });
  }
}
```

### 2. Prompt
Individual message within a session.

```typescript
export class Prompt {
  readonly id: PromptId;
  readonly sessionId: SessionId;
  readonly role: Role;
  readonly content: string;
  readonly timestamp: Date;
  readonly metadata: PromptMetadata;
  private topics: TopicAssignment[];
  
  constructor(params: CreatePromptParams) {
    this.id = params.id || PromptId.generate();
    this.sessionId = params.sessionId;
    this.role = params.role;
    this.content = params.content;
    this.timestamp = params.timestamp;
    this.metadata = params.metadata || {};
    this.topics = [];
  }
  
  assignTopic(topic: Topic, confidence: number): void {
    this.topics.push(new TopicAssignment(topic, confidence));
    this.addDomainEvent(new TopicAssignedEvent(this.id, topic.id, confidence));
  }
  
  getContentLength(): number {
    return this.content.length;
  }
  
  getWordCount(): number {
    return this.content.split(/\s+/).filter(word => word.length > 0).length;
  }
}
```

### 3. Topic
Custom categorization for prompts.

```typescript
export class Topic {
  readonly id: TopicId;
  readonly name: string;
  readonly description: string;
  readonly rules: TopicRules;
  readonly createdAt: Date;
  readonly createdBy: UserId;
  
  constructor(params: CreateTopicParams) {
    this.id = params.id || TopicId.generate();
    this.name = params.name;
    this.description = params.description;
    this.rules = params.rules;
    this.createdAt = params.createdAt || new Date();
    this.createdBy = params.createdBy;
    
    this.validate();
  }
  
  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new InvalidTopicError('Topic name is required');
    }
    
    if (this.name.length > 200) {
      throw new InvalidTopicError('Topic name must be less than 200 characters');
    }
  }
  
  matchesPrompt(prompt: Prompt): number {
    return this.rules.calculateConfidence(prompt);
  }
}
```

### 4. DailyAggregation
Pre-computed daily statistics.

```typescript
export class DailyAggregation {
  readonly date: DateOnly;
  readonly sessionCount: number;
  readonly promptCount: number;
  readonly userPromptCount: number;
  readonly assistantPromptCount: number;
  readonly avgPromptLength: number;
  readonly topicDistribution: Map<TopicId, number>;
  
  constructor(params: DailyAggregationParams) {
    this.date = params.date;
    this.sessionCount = params.sessionCount;
    this.promptCount = params.promptCount;
    this.userPromptCount = params.userPromptCount;
    this.assistantPromptCount = params.assistantPromptCount;
    this.avgPromptLength = params.avgPromptLength;
    this.topicDistribution = params.topicDistribution;
  }
  
  getResponseRatio(): number {
    if (this.userPromptCount === 0) return 0;
    return this.assistantPromptCount / this.userPromptCount;
  }
}
```

## Value Objects

### SessionId
```typescript
export class SessionId {
  constructor(private readonly value: string) {
    if (!this.isValidUuid(value)) {
      throw new InvalidSessionIdError(value);
    }
  }
  
  static generate(): SessionId {
    return new SessionId(uuid());
  }
  
  toString(): string {
    return this.value;
  }
  
  equals(other: SessionId): boolean {
    return this.value === other.value;
  }
  
  private isValidUuid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}
```

### Role
```typescript
export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}
```

### ExportFormat
```typescript
export enum ExportFormat {
  MARKDOWN = 'markdown',
  JSON = 'json',
  CSV = 'csv'
}
```

### DateOnly
```typescript
export class DateOnly {
  private readonly value: Date;
  
  constructor(date: Date | string) {
    this.value = new Date(date);
    this.value.setHours(0, 0, 0, 0);
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
  
  static today(): DateOnly {
    return new DateOnly(new Date());
  }
}
```

### TopicRules
```typescript
export class TopicRules {
  constructor(
    private readonly keywords: string[],
    private readonly patterns: RegExp[],
    private readonly excludeKeywords: string[],
    private readonly minConfidence: number = 0.5
  ) {}
  
  calculateConfidence(prompt: Prompt): number {
    let score = 0;
    const content = prompt.content.toLowerCase();
    
    // Keyword matching
    for (const keyword of this.keywords) {
      if (content.includes(keyword.toLowerCase())) {
        score += 0.2;
      }
    }
    
    // Pattern matching
    for (const pattern of this.patterns) {
      if (pattern.test(content)) {
        score += 0.3;
      }
    }
    
    // Exclude keywords
    for (const exclude of this.excludeKeywords) {
      if (content.includes(exclude.toLowerCase())) {
        score -= 0.5;
      }
    }
    
    return Math.max(0, Math.min(1, score));
  }
}
```

## Domain Services

### PromptAggregator
```typescript
export class PromptAggregator {
  aggregateByDay(prompts: Prompt[]): Map<DateOnly, DailyAggregation> {
    const grouped = this.groupByDate(prompts);
    const aggregations = new Map<DateOnly, DailyAggregation>();
    
    for (const [date, dayPrompts] of grouped) {
      const stats = this.calculateDayStats(dayPrompts);
      aggregations.set(date, new DailyAggregation({
        date,
        ...stats
      }));
    }
    
    return aggregations;
  }
  
  private groupByDate(prompts: Prompt[]): Map<DateOnly, Prompt[]> {
    const grouped = new Map<DateOnly, Prompt[]>();
    
    for (const prompt of prompts) {
      const date = new DateOnly(prompt.timestamp);
      const existing = grouped.get(date) || [];
      existing.push(prompt);
      grouped.set(date, existing);
    }
    
    return grouped;
  }
  
  private calculateDayStats(prompts: Prompt[]): DailyStatsData {
    const sessionIds = new Set(prompts.map(p => p.sessionId.toString()));
    const userPrompts = prompts.filter(p => p.role === Role.USER);
    const assistantPrompts = prompts.filter(p => p.role === Role.ASSISTANT);
    const totalLength = prompts.reduce((sum, p) => sum + p.getContentLength(), 0);
    
    return {
      sessionCount: sessionIds.size,
      promptCount: prompts.length,
      userPromptCount: userPrompts.length,
      assistantPromptCount: assistantPrompts.length,
      avgPromptLength: prompts.length > 0 ? totalLength / prompts.length : 0,
      topicDistribution: this.calculateTopicDistribution(prompts)
    };
  }
}
```

### TopicClassifier
```typescript
export class TopicClassifier {
  constructor(
    private readonly topics: Topic[],
    private readonly minConfidence: number = 0.5
  ) {}
  
  classifyPrompt(prompt: Prompt): TopicAssignment[] {
    const assignments: TopicAssignment[] = [];
    
    for (const topic of this.topics) {
      const confidence = topic.matchesPrompt(prompt);
      
      if (confidence >= this.minConfidence) {
        assignments.push(new TopicAssignment(topic, confidence));
      }
    }
    
    // Sort by confidence descending
    return assignments.sort((a, b) => b.confidence - a.confidence);
  }
}
```

### SessionParser
```typescript
export interface ISessionParser {
  parse(projectPath: string): Promise<RawSessionData[]>;
}

export class ClaudeSessionParser implements ISessionParser {
  async parse(projectPath: string): Promise<RawSessionData[]> {
    const claudeDir = path.join(projectPath, '.claude');
    const sessionDirs = await this.findSessionDirectories(claudeDir);
    const sessions: RawSessionData[] = [];
    
    for (const sessionDir of sessionDirs) {
      const sessionData = await this.parseSessionDirectory(sessionDir);
      if (sessionData) {
        sessions.push(sessionData);
      }
    }
    
    return sessions;
  }
  
  private async parseSessionDirectory(sessionPath: string): Promise<RawSessionData | null> {
    const conversationFile = path.join(sessionPath, 'conversation.json');
    
    if (!await this.fileExists(conversationFile)) {
      return null;
    }
    
    const content = await fs.readFile(conversationFile, 'utf-8');
    const data = JSON.parse(content);
    
    return {
      sessionId: path.basename(sessionPath),
      projectPath: path.dirname(path.dirname(sessionPath)),
      messages: data.messages || [],
      metadata: {
        version: data.version,
        createdAt: data.createdAt
      }
    };
  }
}
```

## Domain Events

### SessionImportedEvent
```typescript
export class SessionImportedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: SessionId,
    public readonly projectPath: string,
    public readonly promptCount: number,
    public readonly metadata: Record<string, any>
  ) {
    super(sessionId.toString());
  }
}
```

### PromptAddedEvent
```typescript
export class PromptAddedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: SessionId,
    public readonly promptId: PromptId,
    public readonly role: Role,
    public readonly timestamp: Date
  ) {
    super(promptId.toString());
  }
}
```

### TopicAssignedEvent
```typescript
export class TopicAssignedEvent extends DomainEvent {
  constructor(
    public readonly promptId: PromptId,
    public readonly topicId: TopicId,
    public readonly confidence: number
  ) {
    super(promptId.toString());
  }
}
```

## Repository Interfaces

### ISessionRepository
```typescript
export interface ISessionRepository {
  save(session: Session): Promise<void>;
  findById(id: SessionId): Promise<Session | null>;
  findByProjectPath(path: string): Promise<Session[]>;
  findByDateRange(start: Date, end: Date): Promise<Session[]>;
  delete(id: SessionId): Promise<void>;
  exists(id: SessionId): Promise<boolean>;
}
```

### IPromptRepository
```typescript
export interface IPromptRepository {
  save(prompt: Prompt): Promise<void>;
  saveMany(prompts: Prompt[]): Promise<void>;
  findById(id: PromptId): Promise<Prompt | null>;
  findBySessionId(sessionId: SessionId): Promise<Prompt[]>;
  findByDateRange(start: Date, end: Date): Promise<Prompt[]>;
  search(query: string, limit: number): Promise<Prompt[]>;
}
```

### ITopicRepository
```typescript
export interface ITopicRepository {
  save(topic: Topic): Promise<void>;
  findById(id: TopicId): Promise<Topic | null>;
  findByName(name: string): Promise<Topic | null>;
  findAll(): Promise<Topic[]>;
  delete(id: TopicId): Promise<void>;
}
```

### IAggregationRepository
```typescript
export interface IAggregationRepository {
  save(aggregation: DailyAggregation): Promise<void>;
  findByDate(date: DateOnly): Promise<DailyAggregation | null>;
  findByDateRange(start: DateOnly, end: DateOnly): Promise<DailyAggregation[]>;
  refreshMaterializedViews(): Promise<void>;
}
```