# Claude Code Exporter MCP - Example Usage

This guide provides comprehensive examples of using the Claude Code Exporter MCP server with Claude Desktop.

## Table of Contents

1. [Basic Export](#basic-export)
2. [Advanced Export Options](#advanced-export-options)
3. [Aggregating Sessions](#aggregating-sessions)
4. [Troubleshooting Common Issues](#troubleshooting-common-issues)
5. [Best Practices](#best-practices)

## Basic Export

### Example 1: Export User Prompts Only

The simplest use case - export only your prompts from a project:

```
Use the export_conversation tool to export my project at /Users/me/my-project
```

This will:
- Export only user messages (prompts)
- Save to `./claude-prompts` directory
- Use markdown format
- Create files named like `session-id-title-prompts.md`

### Example 2: Export with Custom Output Directory

```
Use the export_conversation tool to export conversations from /Users/me/my-project 
and save them to /Users/me/Documents/claude-exports
```

## Advanced Export Options

### Example 3: Export Full Conversations

To export complete conversations including both user and assistant messages:

```
Use the export_conversation tool with these parameters:
- projectPath: /Users/me/my-project
- exportMode: full
- outputDir: ./my-exports
```

### Example 4: Export Only Assistant Responses

Useful for reviewing Claude's outputs:

```
Use the export_conversation tool to export only Claude's responses from /Users/me/my-project
Set exportMode to "outputs"
```

### Example 5: Export as JSON

For programmatic processing:

```
Export the conversations from /Users/me/my-project in JSON format using the export_conversation tool
```

### Example 6: Export Both Markdown and JSON

```
Use export_conversation with:
- projectPath: /Users/me/my-project  
- exportFormat: both
- exportMode: full
```

## Aggregating Sessions

### Example 7: Basic Aggregation

Create a summary of all your Claude Code sessions:

```
Use the aggregate_sessions tool to create a summary of all my Claude sessions
```

This will:
- Scan all projects in your Claude home directory
- Generate a markdown report with statistics
- Create a JSON file with detailed data
- Group results by project

### Example 8: Custom Aggregation Options

```
Use aggregate_sessions with these settings:
- groupBy: date
- includeStats: true
- outputDir: /Users/me/claude-analytics
```

### Example 9: Aggregation with Custom Claude Home

If your Claude configuration is in a non-standard location:

```
Aggregate all sessions using aggregate_sessions with claudeHome set to /Users/me/.config/claude-custom
```

## Troubleshooting Common Issues

### Issue: "Claude home directory not found"

**Solution 1**: Specify the claudeHome parameter explicitly:

```
Use export_conversation with:
- projectPath: /Users/me/project
- claudeHome: /Users/me/.claude
```

**Solution 2**: Set the CLAUDE_HOME environment variable in your MCP configuration.

### Issue: "Project path does not exist"

Make sure you're using the exact path you use in Claude Code. Check for:
- Correct capitalization
- No trailing slashes
- Full absolute path

### Issue: Rate limit exceeded

The server implements rate limiting to prevent abuse. If you hit the limit:
- Wait a minute before retrying
- Process fewer projects at once
- Use the tool less frequently

### Issue: Export produces empty files

This usually means the conversation data couldn't be found. Check:
- The project has been used with Claude Code
- The Claude home directory is correct
- You have read permissions on the Claude data files

## Best Practices

### 1. Regular Exports

Set up a routine to export your conversations:

```
# Weekly export of active project
Use export_conversation to backup /Users/me/active-project to /Users/me/backups/claude/week-45
```

### 2. Organized Output Structure

Use meaningful output directories:

```
/Users/me/claude-exports/
├── project-a/
│   ├── 2024-01-15/
│   └── 2024-01-22/
├── project-b/
└── aggregated-reports/
```

### 3. Combine Export Modes

For comprehensive documentation:

```
# First, export prompts for quick reference
Use export_conversation with projectPath: /path/to/project and exportMode: prompts

# Then, export full conversations for complete context
Use export_conversation with projectPath: /path/to/project and exportMode: full
```

### 4. Use JSON for Analysis

Export to JSON when you need to:
- Count specific types of messages
- Analyze conversation patterns
- Build custom visualizations
- Integrate with other tools

### 5. Monitor Usage with Aggregation

Run weekly aggregations to track:
- Which projects are most active
- How your usage patterns change
- Total message volume
- Conversation complexity

```
# Weekly analytics
Use aggregate_sessions with groupBy: date and outputDir: ./weekly-reports
```

## Environment Variables

You can set these in your MCP configuration:

```json
{
  "mcpServers": {
    "claude-code-exporter": {
      "command": "node",
      "args": ["/path/to/mcp-exporter/index.js"],
      "env": {
        "CLAUDE_HOME": "/Users/me/.claude",
        "MCP_LOG_LEVEL": "INFO",
        "MCP_DEBUG": "false"
      }
    }
  }
}
```

### Available Environment Variables:

- `CLAUDE_HOME`: Override default Claude home directory
- `MCP_LOG_LEVEL`: Set to ERROR, WARN, INFO, or DEBUG
- `MCP_DEBUG`: Set to "true" to include stack traces in error responses

## Advanced Scenarios

### Exporting Multiple Projects

While the tool processes one project at a time, you can chain commands:

```
First, export project A:
Use export_conversation with projectPath: /Users/me/project-a

Then, export project B:  
Use export_conversation with projectPath: /Users/me/project-b

Finally, aggregate everything:
Use aggregate_sessions to see the complete picture
```

### Filtering by Date

While not directly supported, you can achieve date filtering by:
1. Exporting to JSON format
2. Using the timestamp fields in the JSON
3. Processing with external tools

### Integration with Git

Example workflow for version controlling your prompts:

```
1. Export conversations: Use export_conversation with projectPath: /my/project
2. Copy to git repo: The files are in ./claude-prompts
3. Commit with meaningful message about the session
```

## Security Considerations

1. **Output Directory Permissions**: Exported files may contain sensitive information. Ensure output directories have appropriate permissions.

2. **Path Validation**: The server validates paths to prevent directory traversal attacks. Always use absolute paths.

3. **Rate Limiting**: Built-in rate limiting prevents abuse. Default: 100 requests per minute.

4. **Logging**: Sensitive data is not logged. Enable DEBUG mode only in development.

## Performance Tips

1. **Large Projects**: For projects with many sessions, exports may take time. Be patient.

2. **Aggregation**: Processing many projects can be resource-intensive. The server limits to 1000 projects by default.

3. **Output Formats**: JSON exports are faster to generate but larger. Markdown is more readable but takes more processing.

## Next Steps

- Explore the generated markdown files to review your conversations
- Use the JSON exports to build custom analytics
- Set up regular exports as part of your workflow
- Share interesting prompts with your team (after reviewing for sensitive data)

For more information, see the main README or report issues on GitHub.