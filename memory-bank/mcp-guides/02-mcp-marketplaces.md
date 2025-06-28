# MCP Marketplaces and Registries Guide

This guide documents the top 5 MCP (Model Context Protocol) marketplaces and registries where you can list and discover MCP servers.

## 1. Official Anthropic MCP Registry (GitHub)

### URL
- Main Repository: https://github.com/modelcontextprotocol/servers
- Registry (In Development): https://github.com/modelcontextprotocol/registry

### Submission Process
1. **Develop your server in a separate repository** - The official repo now focuses on reference implementations only
2. **Submit a Pull Request** to add your server to the README.md file
3. **Add entry in alphabetical order** to minimize merge conflicts
4. **Include**:
   - Server name
   - Brief description
   - Link to your repository or npm package

### Requirements
- Must follow MCP protocol standards
- Use official SDKs (TypeScript, Python, C#, Java, Kotlin)
- Provide clear documentation
- Host on your own GitHub repository

### Guidelines
- Reference Servers: Demonstrate MCP features and official SDKs
- Official Integrations: Production-ready servers by companies
- Community Servers: Open to all developers

### Benefits
- Official recognition from Anthropic
- High visibility in the MCP ecosystem
- Direct integration with Claude Desktop app
- Access to over 5,000 active MCP servers (as of May 2025)

## 2. GitHub Awesome Lists

### URLs
- https://github.com/wong2/awesome-mcp-servers
- https://github.com/punkpeye/awesome-mcp-servers
- https://github.com/appcypher/awesome-mcp-servers
- https://github.com/TensorBlock/awesome-mcp-servers (7260 servers as of May 2025)

### Submission Process
1. **Fork the repository**
2. **Add your server** to the appropriate category
3. **Follow the existing format** for consistency
4. **Submit a Pull Request** with clear description

### Requirements
- Working MCP server implementation
- Clear documentation and usage examples
- Appropriate categorization (e.g., Databases, AI Services, Development Tools)
- Follow the repository's contribution guidelines

### Guidelines
- Servers are organized by category
- Include server name, description, and link
- Some lists have quality standards for inclusion
- Web directory available at mcpservers.org

### Benefits
- Community recognition
- Searchable web interface (mcpservers.org)
- Categorized listings for easy discovery
- Part of the "awesome" ecosystem on GitHub

## 3. NPM Registry

### URL
- https://www.npmjs.com/search?q=%40modelcontextprotocol
- Official SDK: https://www.npmjs.com/package/@modelcontextprotocol/sdk

### Submission Process
1. **Create TypeScript project** using `@modelcontextprotocol/sdk`
2. **Configure package.json**:
   ```json
   {
     "type": "module",
     "bin": {
       "your-server-name": "./build/index.js"
     },
     "scripts": {
       "build": "tsc && chmod 755 build/index.js"
     }
   }
   ```
3. **Build and test** your server
4. **Publish to NPM**: `npm publish`

### Requirements
- Valid NPM account
- Follow NPM package naming conventions
- Include proper metadata in package.json
- Use semantic versioning
- Include LICENSE file

### Guidelines
- Use `@yourscope/mcp-server-name` naming convention
- Provide comprehensive README
- Include examples and documentation
- Consider using MCP-Framework for architecture

### Benefits
- Easy installation via npm/npx
- Version management
- Dependency resolution
- Integration with Node.js ecosystem
- Automatic updates for users

## 4. MCP-Get Package Registry

### URL
- https://mcp-get.com/
- GitHub: https://github.com/michaellatman/mcp-get

### Submission Process
1. **Publish to underlying registry** (npm, pypi, Docker)
2. **Create metadata file** with required structure:
   ```json
   {
     "name": "your-package-name",
     "description": "Brief description",
     "vendor": "Your Name/Organization",
     "sourceUrl": "Repository URL",
     "homepage": "Documentation URL",
     "license": "MIT",
     "runtime": "node | python | go",
     "environmentVariables": {}
   }
   ```
3. **Submit to mcp-get registry**

### Requirements
- Package must be published to npm, pypi, or Docker Hub
- Complete metadata file
- Valid license
- Working source code repository

### Guidelines
- Support multiple runtime environments
- Document environment variables
- Provide clear installation instructions
- Include usage examples

### Benefits
- Cross-platform package discovery
- CLI tool for easy installation
- Centralized metadata management
- Automatic listing on mcp-get.com
- Support for multiple languages/runtimes

## 5. Community Directories

### URLs
- https://mcpservers.org/ (Awesome MCP Servers)
- https://mcp.so/
- Docker MCP Catalog: https://hub.docker.com/u/mcp

### Submission Process

#### For mcpservers.org:
1. **Check if repository accepts contributions**
2. **Follow contribution guidelines** (typically via GitHub PR)
3. **Add server to appropriate category**

#### For Docker Hub:
1. **Create Docker image** for your MCP server
2. **Publish under mcp/ namespace**
3. **Follow Docker MCP contributing guidelines**

### Requirements
- Working MCP server
- Appropriate categorization
- Clear documentation
- Contact maintainers for specific requirements

### Guidelines
- Match existing format and style
- Provide accurate descriptions
- Include all necessary metadata
- Test your server thoroughly

### Benefits
- Additional exposure channels
- Community-driven curation
- Specialized audiences
- Docker ecosystem integration

## Future Developments

### Official MCP Metaregistry
- REST API for centralized metadata
- GitHub authentication for publishing
- Standardized "mcp.json" format
- Programmatic access for MCP clients

### Best Practices for All Registries

1. **Quality First**
   - Thoroughly test your server
   - Provide comprehensive documentation
   - Include usage examples and tutorials

2. **Metadata Completeness**
   - Clear, descriptive names
   - Accurate categorization
   - Complete environment variable documentation
   - License information

3. **Maintenance**
   - Regular updates
   - Respond to issues
   - Keep documentation current
   - Follow semantic versioning

4. **Security**
   - Review security implications
   - Document required permissions
   - Handle sensitive data properly
   - Consider privacy implications

5. **Community Engagement**
   - Respond to user feedback
   - Contribute to MCP ecosystem
   - Share knowledge and best practices
   - Collaborate with other developers

## Summary

The MCP ecosystem offers multiple avenues for listing and discovering servers:

1. **Official channels** provide legitimacy and direct integration
2. **Community lists** offer broader exposure and categorization
3. **Package registries** enable easy installation and updates
4. **Specialized platforms** cater to specific needs and audiences

Choose the registries that best match your server's purpose and target audience. Many successful MCP servers are listed across multiple registries to maximize discoverability and reach.