# Claude Code Exporter v2

A powerful TypeScript/NestJS tool for exporting and analyzing Claude Code conversation sessions. This is a complete rewrite of the original claude-code-exporter with database support, aggregation features, and both CLI and API interfaces.

## Features

- 🔄 **Backward Compatible**: Maintains full compatibility with v1 CLI
- 📊 **Database Support**: PostgreSQL backend for persistent storage (optional)
- 🔍 **Smart Aggregation**: Aggregate prompts by project across all sessions
- 🎯 **Multiple Export Modes**: Prompts only, outputs only, or full conversations
- 📝 **Multiple Formats**: Markdown, JSON, TXT, or all formats at once
- 📁 **Organized Output**: Timestamped directories when exporting multiple formats
- 🎮 **Interactive Mode**: Wizard-style prompts for easy selection
- 🏗️ **Clean Architecture**: Domain-driven design with SOLID principles
- 🧪 **Fully Tested**: Comprehensive unit and integration tests

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/claude-code-exporter-v2.git
cd claude-code-exporter-v2

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Set up the database (PostgreSQL required)
# Update DATABASE_* variables in .env

# Run database migrations
npm run migration:run

# Build the project
npm run build
```

## Quick Start

### CLI Usage

```bash
# Install globally
npm install -g claude-code-exporter

# Export current directory sessions (interactive mode)
claude-prompts

# Export specific project
claude-prompts /path/to/project

# Export with specific mode
claude-prompts --prompts    # User prompts only
claude-prompts --outputs    # Assistant outputs only  
claude-prompts --full       # Full conversation

# Export with specific format
claude-prompts --markdown   # Markdown format (default)
claude-prompts --json       # JSON format
claude-prompts --txt        # Plain text format
claude-prompts --both       # All formats (creates 6-8 files)

# Aggregate prompts across all projects
claude-prompts --aggregate -o aggregated-prompts

# Combine options
claude-prompts /path/to/project --full --both -o export-dir
```

### Programmatic Usage

```typescript
import { ClaudePromptExporter } from 'claude-code-exporter';

// Create exporter instance
const exporter = new ClaudePromptExporter('/path/to/project', {
  exportMode: 'prompts-only',
  exportFormat: 'markdown',
  verbose: true
});

// Export to files
const result = await exporter.export();
console.log(`Created ${result.filesCreated} files in ${result.outputPath}`);

// Extract messages without exporting
const messages = await exporter.extractMessages();
```

### New v2 API

```typescript
import { 
  ImportSessionUseCase,
  ExportSessionUseCase,
  AggregateByProjectUseCase
} from 'claude-code-exporter';

// Import sessions
const importResult = await importUseCase.execute({
  projectPath: '/path/to/project',
  recursive: true,
  force: false
});

// Export sessions
const exportResult = await exportUseCase.execute({
  projectPath: '/path/to/project',
  outputPath: 'output-dir',
  format: ExportFormat.MARKDOWN,
  mode: ExportMode.PROMPTS_ONLY
});

// Aggregate by project
const aggregateResult = await aggregateUseCase.execute({
  outputPath: 'aggregated',
  appendOnly: true
});
```

## Configuration

### Environment Variables

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=claude_exporter
DATABASE_PASSWORD=password
DATABASE_NAME=claude_exporter

# Claude
CLAUDE_HOME=~/.claude

# Aggregation
AGGREGATION_ENABLED=true
AGGREGATION_OUTPUT_PATH=./aggregated
AGGREGATION_SCHEDULE=*/5 * * * *  # Cron expression

# Logging
LOG_LEVEL=info
```

### Export Modes

- **Prompts Only**: Export only user prompts
- **Outputs Only**: Export only assistant responses
- **Full Conversation**: Export complete conversation with prompts and outputs

### Export Formats

- **Markdown**: Human-readable markdown files
- **JSON**: Machine-readable JSON format
- **Both**: Export in both formats simultaneously

## Architecture

The project follows Clean Architecture principles:

```
src/
├── modules/
│   ├── sessions/          # Session management
│   ├── prompts/           # Prompt handling
│   ├── topics/            # Topic categorization
│   ├── import/            # Import functionality
│   ├── export/            # Export functionality
│   ├── analytics/         # Aggregation and analytics
│   └── cli/               # CLI commands
├── database/              # Database entities and migrations
├── config/                # Configuration management
└── lib/                   # Backward compatibility layer
```

## Development

```bash
# Run in development mode
npm run start:dev

# Run tests
npm test

# Run tests with coverage
npm run test:cov

# Run linter
npm run lint

# Run linter with auto-fix
npm run lint -- --fix

# Generate database migration
npm run migration:generate -- -n MigrationName
```

## API Endpoints (when running as server)

```
GET  /sessions              # List all sessions
GET  /sessions/:id          # Get session details
POST /sessions/import       # Import sessions
POST /sessions/export       # Export sessions
GET  /analytics/aggregate   # Get aggregated data
POST /analytics/aggregate   # Trigger aggregation
```

## Testing

The project includes comprehensive tests:

- Unit tests for all domain entities and use cases
- Integration tests for repositories and services
- E2E tests for CLI commands
- Test coverage targets: 90% statements, 85% branches

## Migration from v1

The v2 version is fully backward compatible. Your existing code will continue to work:

```typescript
// This still works!
const exporter = new ClaudePromptExporter(projectPath);
await exporter.export();
```

To use new features, you can gradually adopt the new API:

```typescript
// New way with more control
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'claude-code-exporter/app.module';

const app = await NestFactory.createApplicationContext(AppModule);
const importUseCase = app.get(ImportSessionUseCase);
// ... use the new features
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

Built with:
- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [TypeORM](https://typeorm.io/) - TypeScript ORM
- [Commander](https://github.com/tj/commander.js/) - CLI framework
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) principles

## Support

For issues and feature requests, please use the [GitHub issue tracker](https://github.com/yourusername/claude-code-exporter/issues).