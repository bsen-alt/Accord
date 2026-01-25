// tests/logger.test.ts
import { ConsoleAuditLogger, FileAuditLogger } from '../src/core/logger';
import * as fs from 'fs';

describe('Audit Logger', () => {
  const logFile = './test-audit.log';

  // Cleanup: Ensure we start with a clean slate (no leftovers from previous runs)
  beforeAll(() => {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }
  });

  afterAll(() => {
    // Final cleanup
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }
  });

  describe('ConsoleAuditLogger', () => {
    test('1. Console Logger should format Allow message', () => {
      const logger = new ConsoleAuditLogger();
      
      // Spy on console methods to capture output without printing to test console
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const mockEvent = {
        timestamp: new Date(),
        decision: 'allow' as const,
        userId: 'u1',
        action: 'delete',
        resourceType: 'booking',
        resourceId: 'b1',
        policyId: 'policy-admin'
      };

      logger.log(mockEvent);

      // Verify log message format
      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0].join(' ');
      
      expect(loggedMessage).toContain('[ALLOW]');
      expect(loggedMessage).toContain('u1 -> delete on booking/b1');
      expect(loggedMessage).toContain('Policy: policy-admin');

      // Restore console
      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    test('2. Console Logger should format Deny message', () => {
      const logger = new ConsoleAuditLogger();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const mockEvent = {
        timestamp: new Date(),
        decision: 'deny' as const,
        userId: 'u2',
        action: 'delete',
        resourceType: 'booking',
        reason: 'Access forbidden'
      };

      logger.log(mockEvent);

      expect(consoleWarnSpy).toHaveBeenCalled();
      const loggedMessage = consoleWarnSpy.mock.calls[0].join(' ');
      
      expect(loggedMessage).toContain('[DENY]');
      expect(loggedMessage).toContain('u2');
      expect(loggedMessage).toContain('Reason: Access forbidden');

      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('FileAuditLogger', () => {
    test('3. File Logger should write to disk', () => {
      const logger = new FileAuditLogger(logFile);

      const mockEvent = {
        timestamp: new Date(),
        decision: 'allow' as const,
        userId: 'u1',
        action: 'delete',
        resourceType: 'booking',
        resourceId: 'b1',
        policyId: 'policy-1'
      };

      logger.log(mockEvent);

      // Verify file write
      expect(fs.existsSync(logFile)).toBe(true);
      const fileContent = fs.readFileSync(logFile, 'utf-8');
      const lines = fileContent.trim().split('\n');
      
      expect(lines.length).toBe(1);
      
      // Verify JSON content
      const logEntry = JSON.parse(lines[0]);
      expect(logEntry.decision).toBe('allow');
      expect(logEntry.userId).toBe('u1');
      expect(logEntry.resourceType).toBe('booking');
    });
  });
});