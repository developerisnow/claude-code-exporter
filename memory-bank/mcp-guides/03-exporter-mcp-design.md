# Claude Code Exporter MCP Design

## Overview

The Claude Code Exporter MCP (Model Context Protocol) server provides tools and resources for exporting, aggregating, and accessing Claude conversation data. This design transforms the existing CLI tool into a comprehensive MCP server that can be used by any MCP-compatible client.

## Architecture

### Core Components

```
claude-code-exporter-mcp/
├── src/
│   ├── index.ts           # MCP server entry point
│   ├── server.ts          # Server configuration and setup
│   ├── tools/             # MCP tool implementations
│   │   ├── export.ts      # Export conversation tool
│   │   ├── aggregate.ts   # Session aggregation tool
│   │   ├── filter.ts      # Period filtering tool
│   │   └── search.ts      # Search prompts tool
│   ├── resources/         # MCP resource providers
│   │   ├── sessions.ts    # Session data resource
│   │   ├── prompts.ts     # Prompts resource
│   │   └── stats.ts       # Statistics resource
│   ├── prompts/           # MCP prompt templates
│   │   ├── export.ts      # Export scenario prompts
│   │   ├── analyze.ts     # Analysis prompts
│   │   └── report.ts      # Report generation prompts
│   ├── lib/              # Core functionality
│   │   ├── parser.ts     # Claude data parser
│   │   ├── exporter.ts   # Export logic
│   │   ├── aggregator.ts # Aggregation logic
│   │   └── storage.ts    # Data persistence
│   └── types/            # TypeScript types
│       ├── mcp.ts        # MCP protocol types
│       ├── claude.ts     # Claude data types
│       └── index.ts      # Export types
├── package.json
├── tsconfig.json
└── README.md
```

## MCP Tools

### 1. Export Tool (`claude_export`)

Exports Claude conversations with flexible options.

```typescript
{
  name: "claude_export",
  description: "Export Claude Code conversations to markdown or JSON",
  inputSchema: {
    type: "object",
    properties: {
      projectPath: {
        type: "string",
        description: "Path to the project directory"
      },
      exportMode: {
        type: "string",
        enum: ["prompts", "full", "outputs"],
        default: "prompts",
        description: "Export mode: prompts only, full conversation, or outputs only"
      },
      exportFormat: {
        type: "string",
        enum: ["markdown", "json", "both"],
        default: "markdown",
        description: "Export format"
      },
      outputDir: {
        type: "string",
        description: "Output directory for exported files"
      },
      claudeHome: {
        type: "string",
        description: "Optional: Claude home directory path"
      }
    },
    required: ["projectPath"]
  }
}
```

### 2. Aggregate Tool (`claude_aggregate`)

Aggregates multiple Claude sessions for analysis.

```typescript
{
  name: "claude_aggregate",
  description: "Aggregate multiple Claude sessions by project, date, or topic",
  inputSchema: {
    type: "object",
    properties: {
      aggregationType: {
        type: "string",
        enum: ["project", "date", "topic", "all"],
        default: "project",
        description: "Type of aggregation"
      },
      filter: {
        type: "object",
        properties: {
          projects: {
            type: "array",
            items: { type: "string" },
            description: "Filter by project paths"
          },
          dateRange: {
            type: "object",
            properties: {
              start: { type: "string", format: "date" },
              end: { type: "string", format: "date" }
            }
          },
          topics: {
            type: "array",
            items: { type: "string" },
            description: "Filter by topics/tags"
          }
        }
      },
      outputFormat: {
        type: "string",
        enum: ["summary", "detailed", "statistics"],
        default: "summary"
      }
    },
    required: ["aggregationType"]
  }
}
```

### 3. Filter Tool (`claude_filter`)

Filters exported data by various criteria.

```typescript
{
  name: "claude_filter",
  description: "Filter Claude conversations by time period, project, or content",
  inputSchema: {
    type: "object",
    properties: {
      period: {
        type: "string",
        enum: ["today", "yesterday", "this_week", "last_week", "this_month", "last_month", "custom"],
        description: "Time period to filter"
      },
      customDateRange: {
        type: "object",
        properties: {
          start: { type: "string", format: "date-time" },
          end: { type: "string", format: "date-time" }
        },
        description: "Custom date range (required if period is 'custom')"
      },
      projects: {
        type: "array",
        items: { type: "string" },
        description: "Filter by specific projects"
      },
      contentFilter: {
        type: "object",
        properties: {
          includes: {
            type: "array",
            items: { type: "string" },
            description: "Include messages containing these keywords"
          },
          excludes: {
            type: "array",
            items: { type: "string" },
            description: "Exclude messages containing these keywords"
          }
        }
      }
    },
    required: ["period"]
  }
}
```

### 4. Search Tool (`claude_search`)

Search through exported Claude conversations.

```typescript
{
  name: "claude_search",
  description: "Search through Claude conversations and prompts",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query (supports regex)"
      },
      searchIn: {
        type: "array",
        items: {
          type: "string",
          enum: ["prompts", "responses", "all"]
        },
        default: ["all"],
        description: "Where to search"
      },
      caseSensitive: {
        type: "boolean",
        default: false
      },
      regex: {
        type: "boolean",
        default: false,
        description: "Treat query as regex pattern"
      },
      limit: {
        type: "number",
        default: 50,
        description: "Maximum number of results"
      }
    },
    required: ["query"]
  }
}
```

## MCP Resources

### 1. Sessions Resource

Provides access to Claude session data.

```typescript
{
  uri: "claude://sessions",
  name: "Claude Sessions",
  description: "Access exported Claude conversation sessions",
  mimeType: "application/json",
  // Dynamic content based on available sessions
}
```

### 2. Prompts Resource

Provides access to extracted prompts.

```typescript
{
  uri: "claude://prompts/{project}",
  name: "Claude Prompts",
  description: "Access prompts from specific projects",
  mimeType: "text/markdown",
  // Dynamic content based on project
}
```

### 3. Statistics Resource

Provides aggregated statistics.

```typescript
{
  uri: "claude://stats",
  name: "Claude Statistics",
  description: "Aggregated statistics about Claude usage",
  mimeType: "application/json",
  // Returns usage stats, popular topics, etc.
}
```

## MCP Prompts

### 1. Export Scenarios

```typescript
{
  name: "export_daily_review",
  description: "Export today's Claude conversations for daily review",
  arguments: [
    {
      name: "includeCode",
      description: "Include code snippets in export",
      required: false
    }
  ]
}
```

### 2. Analysis Prompts

```typescript
{
  name: "analyze_coding_patterns",
  description: "Analyze coding patterns and practices from Claude sessions",
  arguments: [
    {
      name: "language",
      description: "Programming language to focus on",
      required: false
    },
    {
      name: "timeframe",
      description: "Time period to analyze",
      required: true
    }
  ]
}
```

### 3. Report Generation

```typescript
{
  name: "generate_weekly_report",
  description: "Generate a weekly report of Claude usage and learnings",
  arguments: [
    {
      name: "format",
      description: "Report format (markdown, html, pdf)",
      required: false
    }
  ]
}
```

## Data Storage

### Local Storage Structure

```
~/.claude-exporter-mcp/
├── config.json           # MCP server configuration
├── sessions/            # Exported session data
│   ├── by-date/        # Sessions organized by date
│   ├── by-project/     # Sessions organized by project
│   └── index.json      # Session index
├── aggregations/       # Pre-computed aggregations
│   ├── daily/         # Daily aggregations
│   ├── weekly/        # Weekly aggregations
│   └── monthly/       # Monthly aggregations
└── cache/             # Temporary cache files
```

### Database Schema (Optional SQLite)

```sql
-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  project_path TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  message_count INTEGER,
  export_mode TEXT,
  metadata JSON
);

-- Messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  metadata JSON,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Aggregations table
CREATE TABLE aggregations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  period TEXT NOT NULL,
  data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL
);

-- Index for fast queries
CREATE INDEX idx_sessions_project ON sessions(project_path);
CREATE INDEX idx_sessions_created ON sessions(created_at);
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
```

## Implementation Notes

### 1. Backward Compatibility
- Support existing CLI functionality through MCP tools
- Maintain same export formats (markdown, JSON)
- Preserve existing file naming conventions

### 2. Performance Considerations
- Implement caching for frequently accessed data
- Use streaming for large exports
- Background processing for aggregations
- Pagination for resource listings

### 3. Error Handling
- Graceful fallback when Claude home not found
- Clear error messages for missing projects
- Validation of export parameters
- Recovery from partial exports

### 4. Security
- Validate file paths to prevent directory traversal
- Sanitize search queries
- Rate limiting for resource access
- Optional authentication for sensitive data

## Usage Examples

### CLI Usage with MCP

```bash
# Start the MCP server
npx claude-code-exporter-mcp

# In another terminal, use with mcp-cli
mcp-cli call claude_export --projectPath ./my-project --exportMode full

# Aggregate sessions
mcp-cli call claude_aggregate --aggregationType date --filter.dateRange.start 2024-01-01

# Search prompts
mcp-cli call claude_search --query "typescript" --searchIn prompts
```

### Integration with Claude Desktop

Add to Claude Desktop config:

```json
{
  "mcpServers": {
    "claude-exporter": {
      "command": "npx",
      "args": ["claude-code-exporter-mcp"],
      "env": {
        "CLAUDE_HOME": "~/.claude"
      }
    }
  }
}
```

## Future Enhancements

1. **Real-time Export**: Watch for new conversations and auto-export
2. **Cloud Sync**: Optional cloud storage integration
3. **Analytics Dashboard**: Web UI for viewing statistics
4. **Export Templates**: Customizable export formats
5. **Collaboration**: Share exported sessions with team members
6. **AI Analysis**: Use LLMs to analyze conversation patterns
7. **Integration APIs**: Webhooks for external integrations