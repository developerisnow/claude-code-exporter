# Changelog

All notable changes to the Claude Code Exporter MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-01-15

### Added
- Comprehensive error handling with detailed error types and messages
- Input validation for all parameters with security checks
- Rate limiting to prevent abuse (100 requests/minute default)
- Structured JSON logging with configurable log levels
- Request tracking with unique IDs for debugging
- Timeout protection (5 minutes default)
- Path traversal attack prevention
- Modular architecture with separate utility functions
- Comprehensive test suite with unit and integration tests
- Enhanced documentation with examples and security guide
- Performance optimizations for large projects
- Graceful shutdown handling
- Support for DEBUG mode with stack traces

### Changed
- Improved error messages with actionable solutions
- Enhanced security with path normalization
- Better project detection with multiple fallbacks
- More robust file writing with atomic operations
- Cleaner code organization with utilities module

### Security
- Added path validation to prevent directory traversal
- Implemented rate limiting to prevent DoS
- No sensitive data in logs
- Safe error messages without system details

## [1.0.0] - 2024-01-10

### Added
- Initial release of Claude Code Exporter MCP Server
- `export_conversation` tool for exporting Claude Code conversations
- `aggregate_sessions` tool for analyzing multiple projects
- Support for multiple export formats (Markdown, JSON)
- Three export modes (prompts, outputs, full)
- Automatic Claude home directory detection
- Cross-platform support (macOS, Windows, Linux)
- Basic error handling
- NPM package publication support

### Features
- Non-interactive operation suitable for MCP
- Project activity tracking
- Customizable output directories
- Environment variable configuration
- Comprehensive aggregation reports

## [0.9.0] - 2024-01-05 (Pre-release)

### Added
- Basic MCP server implementation
- Core export functionality
- Initial testing framework

### Known Issues
- Limited error handling
- No rate limiting
- Basic logging only

---

## Upgrade Guide

### From 1.0.0 to 1.1.0

1. Update your package:
   ```bash
   npm update mcp-claude-exporter
   ```

2. Update environment variables (optional):
   ```json
   {
     "env": {
       "MCP_LOG_LEVEL": "INFO",
       "MCP_DEBUG": "false"
     }
   }
   ```

3. Review new security features in the documentation

### Breaking Changes

None in 1.1.0 - fully backward compatible.

## Roadmap

### Version 1.2.0 (Planned)
- [ ] Streaming support for very large exports
- [ ] Custom export templates
- [ ] Search functionality within exports
- [ ] Export scheduling/automation
- [ ] Webhook notifications

### Version 2.0.0 (Future)
- [ ] Database backend for faster queries
- [ ] Web UI for browsing exports
- [ ] Multi-user support
- [ ] Cloud storage integration
- [ ] Advanced analytics and visualization