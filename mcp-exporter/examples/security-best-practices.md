# Security Best Practices

This guide outlines security considerations and best practices when using the Claude Code Exporter MCP Server.

## Overview

The MCP server implements multiple security layers to protect your data and system. Understanding these measures helps you use the tool safely and effectively.

## Built-in Security Features

### 1. Path Validation

All file paths are validated to prevent:
- **Directory Traversal**: Blocks `../` patterns
- **Symbolic Link Attacks**: Normalizes paths
- **Length Limits**: Maximum 1024 characters

```javascript
// These paths will be rejected:
"../../../etc/passwd"
"/home/user/../../../sensitive"
"~/.ssh/keys"
```

### 2. Input Sanitization

All inputs undergo strict validation:
- Type checking (string, boolean, etc.)
- Enum validation for predefined options
- Length limits on all string inputs
- No command injection possible

### 3. Rate Limiting

Prevents abuse and resource exhaustion:
- Default: 100 requests per minute
- Per-client tracking
- Automatic cleanup of old entries
- Configurable limits

### 4. Secure Logging

Logging follows security best practices:
- No passwords or sensitive data logged
- Structured JSON format
- Configurable log levels
- Stack traces only in debug mode

```json
// Example secure log entry
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "component": "claude-code-exporter-mcp",
  "message": "Export completed",
  "requestId": "abc123",
  "sessionsExported": 5
}
```

## Configuration Security

### 1. Environment Variables

Secure your configuration:

```json
{
  "mcpServers": {
    "claude-code-exporter": {
      "env": {
        "CLAUDE_HOME": "/secure/path/.claude",
        "MCP_LOG_LEVEL": "ERROR",  // Minimal logging in production
        "MCP_DEBUG": "false"        // No stack traces
      }
    }
  }
}
```

### 2. File Permissions

Protect your exports:

```bash
# Set restrictive permissions on output directory
mkdir -p ~/claude-exports
chmod 700 ~/claude-exports

# After export, protect files
chmod 600 ~/claude-exports/*.md
chmod 600 ~/claude-exports/*.json
```

### 3. Output Directory Security

Choose output locations carefully:
- Avoid system directories
- Use dedicated export directories
- Don't export to public/shared folders
- Consider encryption for sensitive projects

## Operational Security

### 1. Pre-Export Review

Before exporting:
1. Review the project for sensitive data
2. Consider what will be included
3. Choose appropriate export mode
4. Select secure output location

### 2. Post-Export Security

After exporting:
1. Review exported content
2. Remove sensitive information if needed
3. Apply appropriate file permissions
4. Consider encrypting archives

```bash
# Example: Encrypt exported data
tar -czf - ~/claude-exports | gpg -c > exports.tar.gz.gpg
```

### 3. Sharing Exports

When sharing exports:
- Review all content first
- Remove API keys, passwords, secrets
- Use secure transfer methods
- Consider access controls

## Data Privacy

### 1. What Gets Exported

Understanding export contents:
- **Prompts mode**: Only your messages
- **Outputs mode**: Only Claude's responses  
- **Full mode**: Complete conversations
- **Metadata**: Timestamps, session IDs

### 2. Sensitive Data Handling

The MCP server does NOT:
- Store conversations permanently
- Send data to external servers
- Log message contents
- Cache sensitive information

### 3. GDPR/Compliance

For compliance requirements:
- Exports provide data portability
- All data stays local
- No third-party processing
- Full control over data lifecycle

## Network Security

### 1. Local Operation

The MCP server:
- Runs entirely locally
- No network requests
- No external dependencies
- No telemetry or analytics

### 2. Proxy Considerations

If behind a corporate proxy:
- MCP server doesn't make network calls
- All operations are file-based
- No proxy configuration needed

## Threat Model

### 1. Protected Against

- Path traversal attacks
- Command injection
- Resource exhaustion
- Information disclosure
- Denial of service

### 2. Assumptions

- Claude Desktop is trusted
- Local file system is secure
- User has legitimate access
- Output directories are protected

### 3. Out of Scope

- Malicious Claude Desktop
- Compromised operating system
- Physical access attacks
- Network-based attacks (runs locally)

## Security Checklist

Before using in production:

- [ ] Review and understand all security features
- [ ] Configure appropriate log levels
- [ ] Set secure output directories
- [ ] Apply file permission best practices
- [ ] Establish data handling procedures
- [ ] Train users on security practices
- [ ] Regular security updates
- [ ] Incident response plan

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** create a public issue
2. Email: security@[maintainer-domain].com
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Security Updates

Stay secure:
1. Monitor for updates
2. Review changelogs
3. Update promptly
4. Test in non-production first

## Additional Resources

- [OWASP Security Guidelines](https://owasp.org)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [MCP Security Documentation](https://modelcontextprotocol.com/docs/security)

Remember: Security is a shared responsibility. While the MCP server implements many security features, proper configuration and usage are essential for maintaining security.