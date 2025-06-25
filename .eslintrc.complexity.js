// Additional ESLint rules for code complexity
module.exports = {
  rules: {
    // Complexity Rules
    'complexity': ['error', { max: 10 }],
    'max-depth': ['error', { max: 4 }],
    'max-lines': ['error', { 
      max: 300, 
      skipBlankLines: true, 
      skipComments: true 
    }],
    'max-lines-per-function': ['error', { 
      max: 50, 
      skipBlankLines: true, 
      skipComments: true 
    }],
    'max-params': ['error', { max: 4 }],
    'max-statements': ['error', { max: 15 }],
    'max-nested-callbacks': ['error', { max: 3 }],
    
    // Clean Code Rules
    'no-magic-numbers': ['warn', { 
      ignore: [0, 1, -1], 
      ignoreArrayIndexes: true,
      enforceConst: true,
      detectObjects: false 
    }],
    'no-console': 'error',
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-commented-out-code': 'off', // Would need a plugin
    
    // Naming Conventions
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        prefix: ['I']
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase']
      },
      {
        selector: 'enum',
        format: ['PascalCase']
      },
      {
        selector: 'class',
        format: ['PascalCase']
      },
      {
        selector: 'method',
        format: ['camelCase']
      }
    ],
    
    // Import Organization
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always',
      'alphabetize': {
        'order': 'asc',
        'caseInsensitive': true
      }
    }]
  }
};