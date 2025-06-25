#!/bin/bash

# Enhanced tooling setup for Claude Code Exporter v2
echo "Installing additional development tools..."

# Complexity analysis
npm install --save-dev \
  eslint-plugin-complexity \
  eslint-plugin-sonarjs \
  eslint-plugin-import

# Security scanning
npm install --save-dev \
  eslint-plugin-security \
  @typescript-eslint/eslint-plugin-tslint

# Testing enhancements
npm install --save-dev \
  jest-extended \
  jest-mock-extended \
  @golevelup/ts-jest

# Code coverage
npm install --save-dev \
  @vitest/coverage-c8

# Documentation
npm install --save-dev \
  @compodoc/compodoc \
  typedoc

# Performance monitoring
npm install --save-dev \
  clinic \
  0x

# Bundle analysis
npm install --save-dev \
  webpack-bundle-analyzer \
  source-map-explorer

# Git hooks enhancement
npm install --save-dev \
  lint-staged

echo "Setting up lint-staged configuration..."
cat > .lintstagedrc.json << 'EOF'
{
  "*.ts": [
    "eslint --fix",
    "prettier --write",
    "jest --findRelatedTests --passWithNoTests"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
EOF

echo "Updating Husky pre-commit hook..."
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged
npx lint-staged

# Type checking
npm run build -- --noEmit

# Complexity check
npx eslint "{src,apps,libs,test}/**/*.ts" --config .eslintrc.complexity.js --max-warnings=0
EOF

chmod +x .husky/pre-commit

echo "Creating code quality scripts..."
cat >> package.json << 'EOF'

# Add these to scripts section:
# "analyze:bundle": "nest build && source-map-explorer dist/**/*.js",
# "analyze:complexity": "eslint \"{src,apps,libs,test}/**/*.ts\" --config .eslintrc.complexity.js",
# "docs:generate": "compodoc -p tsconfig.json -s",
# "test:mutation": "stryker run",
# "security:check": "npm audit && eslint \"{src,apps,libs,test}/**/*.ts\" --plugin security",
# "perf:profile": "clinic doctor -- node dist/main",
# "perf:flame": "0x dist/main"
EOF

echo "Tooling setup complete!"
echo "Run 'npm install' to install the new dependencies"