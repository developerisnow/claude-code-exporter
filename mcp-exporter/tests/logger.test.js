import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Logger } from '../index.js';

describe('Logger', () => {
  let logger;
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.MCP_LOG_LEVEL = 'DEBUG';
    logger = new Logger('test-component');
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    delete process.env.MCP_LOG_LEVEL;
  });

  it('should log messages with correct format', () => {
    const testMessage = 'Test log message';
    const testData = { key: 'value' };

    logger.info(testMessage, testData);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

    expect(logOutput).toMatchObject({
      level: 'INFO',
      component: 'test-component',
      message: testMessage,
      key: 'value'
    });
    expect(logOutput.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should respect log levels', () => {
    // Set to WARN level
    process.env.MCP_LOG_LEVEL = 'WARN';
    logger = new Logger('test-component');

    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warn message');
    logger.error('Error message');

    expect(consoleErrorSpy).toHaveBeenCalledTimes(2); // Only WARN and ERROR
    
    const calls = consoleErrorSpy.mock.calls.map(call => JSON.parse(call[0]));
    expect(calls[0].level).toBe('WARN');
    expect(calls[1].level).toBe('ERROR');
  });

  it('should handle missing data parameter', () => {
    logger.info('Message without data');

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

    expect(logOutput).toMatchObject({
      level: 'INFO',
      component: 'test-component',
      message: 'Message without data'
    });
  });

  it('should log all levels when set to DEBUG', () => {
    process.env.MCP_LOG_LEVEL = 'DEBUG';
    logger = new Logger('test-component');

    logger.debug('Debug');
    logger.info('Info');
    logger.warn('Warn');
    logger.error('Error');

    expect(consoleErrorSpy).toHaveBeenCalledTimes(4);
  });

  it('should only log errors when set to ERROR', () => {
    process.env.MCP_LOG_LEVEL = 'ERROR';
    logger = new Logger('test-component');

    logger.debug('Debug');
    logger.info('Info');
    logger.warn('Warn');
    logger.error('Error');

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
    expect(logOutput.level).toBe('ERROR');
  });

  it('should default to INFO level when not specified', () => {
    delete process.env.MCP_LOG_LEVEL;
    logger = new Logger('test-component');

    logger.debug('Debug - should not appear');
    logger.info('Info - should appear');

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
    expect(logOutput.message).toBe('Info - should appear');
  });

  it('should include component name in all logs', () => {
    const componentLogger = new Logger('special-component');
    
    componentLogger.info('Test message');

    const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
    expect(logOutput.component).toBe('special-component');
  });

  it('should merge data properties correctly', () => {
    const complexData = {
      userId: '12345',
      action: 'export',
      metadata: {
        projectPath: '/test/path',
        sessionCount: 5
      }
    };

    logger.info('Complex operation', complexData);

    const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
    expect(logOutput).toMatchObject({
      level: 'INFO',
      component: 'test-component',
      message: 'Complex operation',
      userId: '12345',
      action: 'export',
      metadata: {
        projectPath: '/test/path',
        sessionCount: 5
      }
    });
  });
});