# Claude Code Exporter v2 - AI Development Guidelines

## Project Overview
This is a TypeScript/NestJS refactor of claude-code-exporter with database support, aggregation features, and dual CLI/API interfaces.

## Architecture Principles
- **Clean Architecture**: Domain → Application → Infrastructure → Presentation
- **SOLID Principles**: Always apply without exception
- **TDD**: Write tests BEFORE implementation
- **DRY**: Extract common logic to domain services
- **KISS**: Prefer simple solutions over clever ones

## Code Standards

### TypeScript Rules
- Use strict mode always
- No `any` types - use `unknown` or proper types
- Prefer interfaces over types for objects
- Use enums for fixed sets of values
- All async functions must return Promise<T>

### Function Complexity
- Max 50 lines per function
- Max cyclomatic complexity: 10
- Max nesting depth: 4
- Max parameters: 4 (use objects for more)

### Naming Conventions
- Interfaces: `ISessionRepository`, `IPromptService`
- Classes: `SessionEntity`, `ImportSessionUseCase`
- Value Objects: `SessionId`, `ExportFormat`
- Events: `SessionImportedEvent`, `StatsUpdatedEvent`
- DTOs: `CreateSessionDto`, `SessionResponseDto`

### File Organization
```
src/
├── modules/
│   ├── sessions/
│   │   ├── domain/           # Entities, value objects
│   │   ├── application/      # Use cases, commands, queries
│   │   ├── infrastructure/   # Repository implementations
│   │   └── presentation/     # Controllers, DTOs
│   └── [other-modules]/
├── common/
│   ├── database/
│   ├── filters/
│   └── interceptors/
└── main.ts
```

## Testing Requirements

### Coverage Targets
- Statements: 90%
- Branches: 85%
- Functions: 90%
- Lines: 90%

### Test Structure
```typescript
describe('SessionService', () => {
  let service: SessionService;
  let mockRepository: jest.Mocked<ISessionRepository>;

  beforeEach(() => {
    // Setup
  });

  describe('importSession', () => {
    it('should import valid session', async () => {
      // Given
      const command = new ImportSessionCommand(/*...*/);
      
      // When
      const result = await service.importSession(command);
      
      // Then
      expect(result).toMatchObject({/*...*/});
      expect(mockRepository.save).toHaveBeenCalledWith(/*...*/);
    });

    it('should throw error for invalid path', async () => {
      // Test error cases
    });
  });
});
```

## Domain Modeling

### Entities Must:
- Have a unique identifier
- Encapsulate business rules
- Emit domain events for state changes
- Not depend on infrastructure

### Value Objects Must:
- Be immutable
- Have equality by value
- Validate on construction
- Provide factory methods

Example:
```typescript
export class SessionId {
  constructor(private readonly value: string) {
    if (!value || !this.isValidUuid(value)) {
      throw new InvalidSessionIdError(value);
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: SessionId): boolean {
    return this.value === other.value;
  }

  static generate(): SessionId {
    return new SessionId(uuid());
  }
}
```

## Use Case Pattern

```typescript
export class ImportSessionUseCase {
  constructor(
    private readonly parser: IClaudeParser,
    private readonly repository: ISessionRepository,
    private readonly eventBus: EventBus,
    private readonly logger: Logger
  ) {}

  async execute(command: ImportSessionCommand): Promise<ImportResult> {
    this.logger.debug('Importing session', { command });
    
    // 1. Parse raw data
    const rawData = await this.parser.parse(command.projectPath);
    
    // 2. Create domain entity
    const session = SessionFactory.createFromRaw(rawData);
    
    // 3. Business rules validation
    session.validate();
    
    // 4. Persist
    await this.repository.save(session);
    
    // 5. Emit events
    await this.eventBus.publish(
      new SessionImportedEvent(session.id, session.statistics)
    );
    
    return new ImportResult(session);
  }
}
```

## Database Guidelines

### Migrations
- One migration per feature
- Always reversible
- Test rollback in dev
- Never modify existing migrations

### Queries
- Use query builder for complex queries
- Avoid N+1 queries (use relations)
- Add indexes for frequent queries
- Use database views for aggregations

## API Design

### REST Endpoints
- GET /sessions - List with pagination
- GET /sessions/:id - Get single session
- POST /sessions/import - Import new sessions
- GET /stats/daily - Daily aggregations
- POST /topics - Create topic
- GET /prompts/search - Search prompts

### Response Format
```typescript
// Success
{
  "data": { /* actual data */ },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "2.0.0"
  }
}

// Error
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session with id X not found",
    "details": { /* additional context */ }
  }
}
```

## Security Checklist
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (use parameterized queries)
- [ ] Rate limiting implemented
- [ ] Authentication for sensitive operations
- [ ] No sensitive data in logs
- [ ] CORS properly configured

## Performance Guidelines
- Cache aggregation results in Redis
- Use pagination for large datasets
- Implement database connection pooling
- Use streaming for large exports
- Background jobs for heavy operations

## Git Workflow
- Feature branches: `feature/add-topic-management`
- Commit format: `feat(sessions): add import validation`
- PR requires: passing tests, code review, no conflicts
- Squash commits before merge

## Common Patterns

### Repository Pattern
```typescript
export interface ISessionRepository {
  save(session: Session): Promise<void>;
  findById(id: SessionId): Promise<Session | null>;
  findByDateRange(start: Date, end: Date): Promise<Session[]>;
  delete(id: SessionId): Promise<void>;
}
```

### Factory Pattern
```typescript
export class SessionFactory {
  static createFromRaw(raw: RawSessionData): Session {
    const id = SessionId.generate();
    const prompts = raw.messages.map(PromptFactory.create);
    return new Session(id, raw.projectPath, prompts);
  }
}
```

### Event Pattern
```typescript
export class Session extends AggregateRoot {
  import(): void {
    // Business logic
    this.addDomainEvent(new SessionImportedEvent(this.id));
  }
}
```

## Debugging Tips
- Use debug namespaces: `DEBUG=app:*`
- Structured logging with context
- Request ID tracking
- Performance monitoring with APM

Remember: The robots LOVE TDD! Write tests first, implement second.