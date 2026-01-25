// src/core/logger.ts
import { Decision, AccessRequest } from './types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Data shape for a single Audit Event.
 */
export interface AuditEvent {
  timestamp: Date;
  decision: 'allow' | 'deny';
  policyId?: string;
  reason?: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
}

/**
 * Interface for Audit Loggers.
 * Allows users to implement custom loggers (e.g., send to Splunk).
 */
export interface AuditLogger {
  log(event: AuditEvent): void | Promise<void>;
}

/**
 * Console Logger: For local development.
 * Color codes output (Green = Allow, Red = Deny).
 */
export class ConsoleAuditLogger implements AuditLogger {
  log(event: AuditEvent): void {
    const color = event.decision === 'allow' ? '\x1b[32m' : '\x1b[31m'; // Green or Red
    const reset = '\x1b[0m';

    const message = `${color}[${event.decision.toUpperCase()}]${reset} ${event.userId} -> ${event.action} on ${event.resourceType}${event.resourceId ? `/${event.resourceId}` : ''}`;
    
    if (event.decision === 'deny') {
      console.warn(message, `| Reason: ${event.reason}`);
    } else {
      console.log(message, `| Policy: ${event.policyId}`);
    }
  }
}

/**
 * File Logger: For production/audit trails.
 * Appends JSON lines to a file (Splunk/ELK friendly).
 */
export class FileAuditLogger implements AuditLogger {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
  }

  log(event: AuditEvent): void {
    try {
      const logLine = JSON.stringify(event) + '\n';
      fs.appendFileSync(this.filePath, logLine, 'utf-8');
    } catch (error) {
      // Don't crash the app if logging fails, just warn
      console.error('Failed to write audit log:', error);
    }
  }
}