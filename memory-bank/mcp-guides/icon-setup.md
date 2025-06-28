# Icon Setup for MCP Registry

## Quick Icon Creation

Since the MCP registry requires a favicon/icon, here are quick options:

### Option 1: Use Claude's Favicon
```bash
# Download Claude's favicon
curl -o assets/icon.png https://claude.ai/favicon.ico
```

### Option 2: Create Simple Text Icon
Use any online tool like favicon.io to create a simple icon with:
- Text: "CE" (Claude Exporter)
- Background: #6366F1 (Indigo)
- Text Color: White
- Size: 32x32 or 16x16

### Option 3: Use Generic Export Icon
Download a free export icon from:
- https://icons8.com/icons/set/export
- https://www.flaticon.com/free-icons/export
- https://heroicons.com/

### Setting Up the Icon

1. Create assets directory:
```bash
mkdir -p assets
```

2. Add icon.png (16x16 or larger):
```bash
# Place your icon file here
cp /path/to/your/icon.png assets/icon.png
```

3. Commit the icon:
```bash
git add assets/icon.png
git commit -m "Add icon for MCP registry"
git push
```

4. Verify the URL works:
```
https://raw.githubusercontent.com/developerisnow/claude-code-exporter/main/assets/icon.png
```

## Alternative: Use Existing Icon Services

If you don't want to host the icon, you can use:

1. **GitHub's default avatar**:
```markdown
<img height="12" width="12" src="https://github.com/developerisnow.png?size=24" alt="Claude Code Exporter Logo" />
```

2. **Placeholder service**:
```markdown
<img height="12" width="12" src="https://via.placeholder.com/16/6366F1/FFFFFF?text=CE" alt="Claude Code Exporter Logo" />
```

3. **Emoji as icon** (less professional but works):
```markdown
💾 **[Claude Code Exporter](https://github.com/developerisnow/claude-code-exporter/tree/main/mcp-exporter)**
```

## Recommended Approach

For the PR, I recommend using option 2 with a placeholder service initially, then updating to a proper icon after the PR is accepted. This avoids blocking the submission on icon creation.