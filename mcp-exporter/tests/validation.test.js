import { describe, it, expect, beforeEach } from '@jest/globals';
import { InputValidator } from '../index.js';

describe('InputValidator', () => {
  describe('validatePath', () => {
    it('should accept valid paths', () => {
      const validPaths = [
        '/home/user/project',
        '/Users/john/Documents/code',
        'C:\\Users\\john\\project',
        '/tmp/export'
      ];

      validPaths.forEach(path => {
        expect(() => InputValidator.validatePath(path, 'testPath')).not.toThrow();
      });
    });

    it('should reject empty or invalid paths', () => {
      const invalidPaths = [
        '',
        null,
        undefined,
        123,
        {},
        []
      ];

      invalidPaths.forEach(path => {
        expect(() => InputValidator.validatePath(path, 'testPath')).toThrow();
      });
    });

    it('should reject paths with traversal patterns', () => {
      const dangerousPaths = [
        '../etc/passwd',
        '../../sensitive',
        '/home/../../../etc',
        './../../system'
      ];

      dangerousPaths.forEach(path => {
        expect(() => InputValidator.validatePath(path, 'testPath')).toThrow(/traversal/);
      });
    });

    it('should reject paths exceeding maximum length', () => {
      const longPath = '/'.repeat(2000);
      expect(() => InputValidator.validatePath(longPath, 'testPath')).toThrow(/exceeds maximum length/);
    });
  });

  describe('validateExportMode', () => {
    it('should accept valid export modes', () => {
      expect(InputValidator.validateExportMode('prompts')).toBe('prompts');
      expect(InputValidator.validateExportMode('full')).toBe('full');
      expect(InputValidator.validateExportMode('outputs')).toBe('outputs');
    });

    it('should return default for undefined', () => {
      expect(InputValidator.validateExportMode()).toBe('prompts');
      expect(InputValidator.validateExportMode(null)).toBe('prompts');
    });

    it('should reject invalid export modes', () => {
      expect(() => InputValidator.validateExportMode('invalid')).toThrow();
      expect(() => InputValidator.validateExportMode('partial')).toThrow();
    });
  });

  describe('validateExportFormat', () => {
    it('should accept valid export formats', () => {
      expect(InputValidator.validateExportFormat('markdown')).toBe('markdown');
      expect(InputValidator.validateExportFormat('json')).toBe('json');
      expect(InputValidator.validateExportFormat('both')).toBe('both');
    });

    it('should return default for undefined', () => {
      expect(InputValidator.validateExportFormat()).toBe('markdown');
    });

    it('should reject invalid export formats', () => {
      expect(() => InputValidator.validateExportFormat('xml')).toThrow();
      expect(() => InputValidator.validateExportFormat('csv')).toThrow();
    });
  });

  describe('validateGroupBy', () => {
    it('should accept valid groupBy options', () => {
      expect(InputValidator.validateGroupBy('project')).toBe('project');
      expect(InputValidator.validateGroupBy('date')).toBe('date');
      expect(InputValidator.validateGroupBy('none')).toBe('none');
    });

    it('should return default for undefined', () => {
      expect(InputValidator.validateGroupBy()).toBe('project');
    });

    it('should reject invalid groupBy options', () => {
      expect(() => InputValidator.validateGroupBy('user')).toThrow();
      expect(() => InputValidator.validateGroupBy('type')).toThrow();
    });
  });
});