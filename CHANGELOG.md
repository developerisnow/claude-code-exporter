# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2024-06-23

### Added
- Full conversation export mode with `--full` flag
- Assistant outputs only export mode with `--outputs-only` flag
- Support for multiple export modes in programmatic API
- Enhanced markdown formatting for different message types
- Message role identification (User, Assistant, System)
- Statistics tracking for different message types

### Changed
- Improved output format with export mode indication
- Enhanced session information in exported files
- Better handling of non-string message content in full mode

## [1.1.0] - 2024-06-23

### Added
- Support for dual Claude home directories (`~/.claude` and `~/.config/claude`)
- Interactive prompt when both directories exist
- `--claude-home` CLI option to specify custom Claude home directory
- `CLAUDE_HOME` environment variable support
- Automatic detection and selection of available Claude homes
- Enhanced error messages with specific directory paths

### Changed
- Claude home resolution now follows a clear priority order
- Improved verbose logging for directory detection

## [1.0.1] - 2024-06-22

### Fixed
- Fixed filtering of tool result messages that were incorrectly exported as user prompts
- Now properly excludes JSON arrays and objects (tool results) from export
- Matches the behavior of the original script

## [1.0.0] - 2024-06-22

### Added
- Initial release
- CLI tool for exporting Claude Code prompts to markdown
- Programmatic API for integration
- Smart path detection for Claude sessions
- Filtering of system-generated messages
- Support for verbose mode and debugging
- Session listing without export
- Cross-platform support (macOS, Linux, Windows)
- Comprehensive test suite
- Full documentation and examples

### Fixed
- Proper handling of object-type message content
- Correct path encoding for Claude's directory structure
