# Error Handling Guide

This guide covers common errors you might encounter and how to resolve them.

## Error Types and Solutions

### 1. Rate Limiting Errors

**Error Message:**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again after 2024-01-15T10:30:00.000Z",
  "errorType": "Error"
}
```

**Cause**: Too many requests in a short time period (default: 100 requests per minute)

**Solutions:**
1. Wait for the specified time before retrying
2. Reduce frequency of requests
3. Batch operations when possible

### 2. Path Validation Errors

**Error Message:**
```json
{
  "success": false,
  "error": "projectPath contains invalid path traversal patterns",
  "errorType": "Error"
}
```

**Cause**: Security validation rejected the path

**Solutions:**
1. Use absolute paths only
2. Avoid `..` in paths
3. Ensure paths don't contain symbolic links

### 3. Permission Errors

**Error Message:**
```json
{
  "success": false,
  "error": "EACCES: permission denied, access '/Users/protected/folder'",
  "errorType": "Error"
}
```

**Cause**: Insufficient permissions to read or write files

**Solutions:**
1. Check file/directory permissions
2. Ensure Claude Desktop has necessary access
3. Use directories where you have write access

### 4. Claude Home Not Found

**Error Message:**
```json
{
  "success": false,
  "error": "Could not find Claude home directory. Please specify claudeHome parameter.",
  "errorType": "Error"
}
```

**Cause**: Unable to locate Claude configuration

**Solutions:**
1. Specify claudeHome explicitly:
   ```
   Use export_conversation with claudeHome: /Users/me/.claude
   ```
2. Set CLAUDE_HOME environment variable
3. Verify Claude Desktop is installed

### 5. Empty Project

**Error Message:**
```json
{
  "success": true,
  "message": "Successfully exported 0 sessions with 0 messages"
}
```

**Cause**: No conversations found in the project

**Solutions:**
1. Verify the project path is correct
2. Ensure you've used Claude Code with this project
3. Check if conversations are in a different project path

### 6. Timeout Errors

**Error Message:**
```json
{
  "success": false,
  "error": "Request timeout",
  "errorType": "Error"
}
```

**Cause**: Operation took longer than 5 minutes

**Solutions:**
1. Process fewer projects at once
2. Export specific projects instead of aggregating all
3. Check system resources

## Debugging Steps

### 1. Enable Debug Logging

Set environment variable in Claude Desktop config:
```json
{
  "mcpServers": {
    "claude-code-exporter": {
      "env": {
        "MCP_LOG_LEVEL": "DEBUG",
        "MCP_DEBUG": "true"
      }
    }
  }
}
```

### 2. Check Logs

Logs are written to stderr and can be viewed in:
- **macOS**: Console.app (search for "claude")
- **Windows**: Event Viewer
- **Linux**: System logs or Claude Desktop terminal output

### 3. Validate Paths

Test path accessibility:
```bash
# Check if path exists
ls -la /path/to/project

# Check Claude home
ls -la ~/.claude/projects
```

### 4. Test Individual Operations

Start with simple operations:
```
# Test basic export
Use export_conversation with projectPath: /simple/test/path

# If that works, add parameters
Use export_conversation with projectPath: /simple/test/path, exportFormat: json
```

## Advanced Troubleshooting

### Corrupted Claude Data

**Symptoms:**
- Consistent errors for specific projects
- Partial exports with missing data
- JSON parsing errors

**Solution:**
1. Try exporting other projects to isolate the issue
2. Report the issue with project details
3. Claude Desktop may need to rebuild its index

### Performance Issues

**Symptoms:**
- Very slow exports
- High memory usage
- System becomes unresponsive

**Solutions:**
1. Process projects individually:
   ```
   Export /project1 first, then /project2, instead of aggregating
   ```
2. Reduce parallel operations
3. Close other applications

### Network/Proxy Issues

If behind a corporate proxy:
1. Ensure Node.js proxy settings are configured
2. Check firewall rules
3. Verify no security software is blocking file access

## Getting Help

If you continue to experience issues:

1. **Collect Information:**
   - Error message (full JSON response)
   - Request ID from error
   - Claude Desktop version
   - Operating system
   - Node.js version (`node --version`)

2. **Check Existing Issues:**
   - [GitHub Issues](https://github.com/developerisnow/claude-code-exporter/issues)

3. **Create New Issue:**
   Include all collected information and steps to reproduce

## Prevention Tips

1. **Regular Exports**: Export important conversations regularly
2. **Backup Strategy**: Keep exports in version control
3. **Monitor Usage**: Use aggregation to track conversation growth
4. **Update Regularly**: Keep the MCP server updated

Remember: Most errors are related to paths, permissions, or configuration. Start with the basics before assuming a bug.