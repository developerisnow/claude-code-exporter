// Test setup file
import { jest } from '@jest/globals';

// Mock modules that are not available in test environment
jest.mock('../exporter-wrapper.js', () => ({
  default: jest.fn().mockImplementation((projectPath, options) => ({
    export: jest.fn().mockReturnValue({
      sessionsExported: 5,
      totalMessages: 100
    }),
    extractMessages: jest.fn().mockReturnValue([
      {
        id: 'session-1',
        messages: [
          { role: 'user', content: 'Test message', timestamp: new Date().toISOString() },
          { role: 'assistant', content: 'Test response', timestamp: new Date().toISOString() }
        ],
        stats: {
          userMessages: 1,
          assistantMessages: 1
        }
      }
    ])
  }))
}));

// Set up global test environment
global.testTimeout = 10000;