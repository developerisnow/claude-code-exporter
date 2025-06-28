# MCP NPM Publishing Guide

## NPM Package Naming Conventions for MCPs

### Naming Pattern
MCP packages should follow this naming convention:
- `@modelcontextprotocol/{name}` - Official MCP packages
- `mcp-{name}` - Community packages (recommended)
- `{org}/mcp-{name}` - Scoped organizational packages

### Examples
- `mcp-exporter` - Export functionality MCP
- `mcp-database` - Database interaction MCP
- `@mycompany/mcp-analytics` - Company-specific MCP

## Required Metadata

### Essential package.json Fields
```json
{
  "name": "mcp-exporter",
  "version": "1.0.0",
  "description": "Model Context Protocol server for exporting Claude conversation data",
  "keywords": [
    "mcp",
    "modelcontextprotocol",
    "claude",
    "anthropic",
    "ai",
    "llm",
    "export",
    "conversation",
    "data-export"
  ],
  "author": "Your Name <email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/username/repo.git"
  },
  "bugs": {
    "url": "https://github.com/username/repo/issues"
  },
  "homepage": "https://github.com/username/repo#readme",
  "engines": {
    "node": ">=18.0.0"
  },
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```

## Keywords for Discoverability

### Required Keywords
- `mcp` - Essential for all MCP packages
- `modelcontextprotocol` - Full protocol name

### Recommended Keywords
- `claude` - If Claude-specific
- `anthropic` - If using Anthropic services
- `ai`, `llm` - General AI/LLM keywords
- Feature-specific: `export`, `database`, `api`, etc.
- Language: `typescript`, `javascript`

## Publishing Checklist

### Pre-publish Verification
- [ ] **Version Check**: Ensure version follows semver (start with 1.0.0)
- [ ] **Build Success**: Run `npm run build` successfully
- [ ] **Tests Pass**: All tests passing with good coverage
- [ ] **Type Definitions**: TypeScript definitions generated
- [ ] **Documentation**: README.md is comprehensive
- [ ] **License**: LICENSE file exists and matches package.json
- [ ] **Clean Working Directory**: No uncommitted changes

### Build & Test
```bash
# Clean previous builds
rm -rf dist/

# Run tests
npm test

# Build the package
npm run build

# Test the package locally
npm pack
# This creates mcp-exporter-1.0.0.tgz
```

### Publishing Steps
```bash
# Login to NPM (if not already)
npm login

# Publish with public access
npm publish --access public

# For scoped packages
npm publish --access public --scope @yourorg
```

### Post-publish Verification
- [ ] Package visible on npmjs.com
- [ ] Installation works: `npm install mcp-exporter`
- [ ] GitHub release created with matching tag
- [ ] Documentation updated with installation instructions

## Version Management Strategy

### Semantic Versioning
- **Major (X.0.0)**: Breaking API changes
- **Minor (1.X.0)**: New features, backward compatible
- **Patch (1.0.X)**: Bug fixes, backward compatible

### Version Bumping
```bash
# Patch release (1.0.0 -> 1.0.1)
npm version patch

# Minor release (1.0.1 -> 1.1.0)
npm version minor

# Major release (1.1.0 -> 2.0.0)
npm version major

# With commit message
npm version patch -m "Fix: %s"
```

### Pre-release Versions
```bash
# Beta release
npm version 1.0.0-beta.1

# Release candidate
npm version 1.0.0-rc.1

# Publish with beta tag
npm publish --tag beta
```

### Git Tags
- NPM version commands automatically create git tags
- Push tags after version bump: `git push --tags`
- Use annotated tags for releases

### Release Process
1. **Update CHANGELOG.md** with version notes
2. **Run tests** and ensure all pass
3. **Bump version**: `npm version minor`
4. **Build**: `npm run build`
5. **Publish**: `npm publish`
6. **Push tags**: `git push && git push --tags`
7. **Create GitHub release** from tag

## NPM Scripts

### Recommended Scripts
```json
{
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src --ext .ts",
    "prepublishOnly": "npm run test && npm run build",
    "version": "npm run format && git add -A src",
    "postversion": "git push && git push --tags"
  }
}
```

## Security Considerations

### NPM Token Management
- Use granular access tokens
- Store tokens in CI/CD secrets
- Rotate tokens regularly
- Enable 2FA on NPM account

### Package Security
- Run `npm audit` before publishing
- Keep dependencies up to date
- Use `npm ci` in CI/CD
- Consider using `.npmrc` for registry config

## Troubleshooting

### Common Issues
1. **403 Forbidden**: Check npm login and package name availability
2. **File not included**: Update `files` array in package.json
3. **Missing types**: Ensure TypeScript declaration files are generated
4. **Version conflict**: Bump version before republishing

### Useful Commands
```bash
# Check what will be published
npm pack --dry-run

# View package info
npm info mcp-exporter

# Check package size
npm publish --dry-run
```