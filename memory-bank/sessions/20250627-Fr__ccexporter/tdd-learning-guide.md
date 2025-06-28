# 🧪 TDD Learning Guide - Claude Code Exporter

## 📚 What is Test-Driven Development (TDD)?

TDD is a software development approach where you write tests BEFORE writing the actual code. The cycle is:

1. **RED** - Write a failing test
2. **GREEN** - Write minimal code to make the test pass
3. **REFACTOR** - Improve the code while keeping tests green

## 🎯 Why TDD?

- **Design First**: Forces you to think about API/interface before implementation
- **Confidence**: Every line of code is tested
- **Documentation**: Tests serve as living documentation
- **Refactoring Safety**: Can change code without fear
- **Bug Prevention**: Catch issues early

## 📝 TDD in Action - Real Examples from This Project

### Example 1: ImportSessionUseCase

#### Step 1: Write the Test First (RED)

```typescript
describe('ImportSessionUseCase', () => {
  it('should import a valid session with messages', async () => {
    // Given - Setup test data
    const command = new ImportSessionCommand({
      projectPath: '/test/project',
      sessionId: 'test-session-123',
    });

    const parsedData = {
      sessionId: 'test-session-123',
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' }
      ]
    };

    // Mock dependencies
    mockParser.parseSessionFiles.mockResolvedValue([parsedData]);
    
    // When - Execute the use case
    const result = await useCase.execute(command);

    // Then - Assert expectations
    expect(result.sessionsImported).toBe(1);
    expect(result.totalMessages).toBe(2);
    expect(mockSessionRepo.save).toHaveBeenCalled();
  });
});
```

#### Step 2: Write Minimal Code (GREEN)

```typescript
export class ImportSessionUseCase {
  async execute(command: ImportSessionCommand): Promise<ImportResult> {
    const parsedSessions = await this.parser.parseSessionFiles(
      command.projectPath,
      command.sessionId
    );

    const session = this.sessionFactory.createFromParsedData(parsedSessions[0]);
    await this.sessionRepository.save(session);

    return new ImportResult(1, session.messageCount, command.projectPath);
  }
}
```

#### Step 3: Refactor

```typescript
export class ImportSessionUseCase {
  async execute(command: ImportSessionCommand): Promise<ImportResult> {
    this.logger.log(`Importing sessions from ${command.projectPath}`);
    
    const parsedSessions = await this.parser.parseSessionFiles(
      command.projectPath,
      command.sessionId
    );

    if (parsedSessions.length === 0) {
      throw new Error(`No sessions found for project: ${command.projectPath}`);
    }

    // Improved: Handle multiple sessions, add error handling, emit events
    let totalImported = 0;
    let totalMessages = 0;

    for (const parsed of parsedSessions) {
      const session = this.sessionFactory.createFromParsedData(parsed);
      await this.sessionRepository.save(session);
      await this.eventBus.publish(new SessionImportedEvent(session));
      
      totalImported++;
      totalMessages += session.messageCount;
    }

    return new ImportResult(totalImported, totalMessages, command.projectPath);
  }
}
```

### Example 2: Repository Pattern Testing

#### Test Different Scenarios

```typescript
describe('SessionRepository', () => {
  describe('save', () => {
    it('should create project if not exists', async () => {
      // Given
      const session = new Session();
      session.projectPath = '/new/project';
      
      mockProjectRepo.findOne.mockResolvedValue(null); // Project doesn't exist
      
      // When
      await repository.save(session);
      
      // Then
      expect(mockProjectRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/new/project',
          name: 'project',
          encodedPath: '-new-project'
        })
      );
    });

    it('should update existing session', async () => {
      // Test update scenario
    });

    it('should handle database errors', async () => {
      // Test error handling
    });
  });
});
```

### Example 3: Integration Testing

```typescript
describe('Import Flow E2E', () => {
  it('should import real JSONL file', async () => {
    // Given - Create test file
    const testContent = `
{"message":{"role":"user","content":"Hello"},"timestamp":"2024-01-01T10:00:00Z"}
{"message":{"role":"assistant","content":[{"type":"text","text":"Hi!"}]},"timestamp":"2024-01-01T10:00:05Z"}
    `.trim();
    
    fs.writeFileSync(sessionPath, testContent);
    
    // When - Import
    const result = await importUseCase.execute({
      projectPath: '/test/project',
      sessionId: 'test-001'
    });
    
    // Then - Verify in database
    const sessions = await dataSource.getRepository(SessionEntity).find();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].messageCount).toBe(2);
  });
});
```

## 🔍 Key Testing Patterns

### 1. **Arrange-Act-Assert (AAA)**
```typescript
it('should do something', () => {
  // Arrange (Given)
  const input = setupTestData();
  
  // Act (When)
  const result = systemUnderTest.execute(input);
  
  // Assert (Then)
  expect(result).toEqual(expected);
});
```

### 2. **Mock External Dependencies**
```typescript
const mockRepo = {
  save: jest.fn(),
  findById: jest.fn()
};

// Inject mock
const service = new Service(mockRepo);
```

### 3. **Test Edge Cases**
```typescript
it('should handle empty input', async () => {
  const result = await service.process([]);
  expect(result).toEqual([]);
});

it('should handle null values', async () => {
  await expect(service.process(null)).rejects.toThrow();
});
```

### 4. **Test Business Rules**
```typescript
it('should filter messages by role', () => {
  const messages = [
    { role: 'user', content: 'Q1' },
    { role: 'assistant', content: 'A1' },
    { role: 'user', content: 'Q2' }
  ];
  
  const filtered = filterByRole(messages, 'user');
  expect(filtered).toHaveLength(2);
  expect(filtered.every(m => m.role === 'user')).toBe(true);
});
```

## 📊 Coverage Metrics

Our project targets:
- **Statements**: 90%
- **Branches**: 85%
- **Functions**: 90%
- **Lines**: 90%

Run coverage with:
```bash
npm run test:cov
```

## 🎓 TDD Best Practices

1. **Start Small**: Test one thing at a time
2. **Test Behavior, Not Implementation**: Focus on what, not how
3. **Keep Tests Fast**: Mock external dependencies
4. **Use Descriptive Names**: Test names should explain the scenario
5. **Follow FIRST**:
   - **F**ast - Tests run quickly
   - **I**ndependent - Tests don't depend on each other
   - **R**epeatable - Same result every time
   - **S**elf-validating - Pass or fail, no manual inspection
   - **T**imely - Written just before production code

## 🚀 Getting Started with TDD

1. **Identify a Feature**: What should the code do?
2. **Write Test First**: Describe the expected behavior
3. **Run Test (RED)**: Confirm it fails
4. **Write Code**: Just enough to pass
5. **Run Test (GREEN)**: Confirm it passes
6. **Refactor**: Improve without breaking tests
7. **Repeat**: Next feature/test

## 💡 Common Testing Anti-patterns to Avoid

❌ **Testing Implementation Details**
```typescript
// Bad
expect(service._privateMethod()).toBe(true);

// Good
expect(service.publicMethod()).toBe(expectedResult);
```

❌ **Too Many Assertions**
```typescript
// Bad - Multiple concerns
it('should do everything', () => {
  expect(result.a).toBe(1);
  expect(result.b).toBe(2);
  expect(result.c).toBe(3);
  // ... 10 more assertions
});

// Good - Single concern
it('should calculate sum correctly', () => {
  expect(result.sum).toBe(6);
});
```

❌ **Not Testing Edge Cases**
```typescript
// Incomplete
it('should process array', () => {
  expect(process([1,2,3])).toEqual([2,4,6]);
});

// Complete
it('should handle empty array', () => {
  expect(process([])).toEqual([]);
});
it('should handle single element', () => {
  expect(process([1])).toEqual([2]);
});
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing NestJS](https://docs.nestjs.com/fundamentals/testing)
- [TDD by Example - Kent Beck](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
- [Clean Code - Robert Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)

Remember: **The robots LOVE TDD!** 🤖❤️