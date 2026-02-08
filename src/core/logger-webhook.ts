// src/core/logger-webhook.ts
import { AuditLogger, AuditEvent } from './logger';
import { WebhookConfig } from './types';

/**
 * v1.3: Webhook Audit Logger.
 * Pushes audit events to an external HTTP endpoint.
 */
export class WebhookAuditLogger implements AuditLogger {
  private config: WebhookConfig;

  constructor(config: WebhookConfig) {
    this.config = config;
  }

  async log(event: AuditEvent): Promise<void> {
    // Check if this event type is subscribed
    const eventType = event.decision === 'allow' || event.decision === 'deny' ? 'decision' : 'policy_change';
    if (!this.config.events.includes(eventType as any)) return;

    try {
      const payload = JSON.stringify(event);
      
      // Optional: Add HMAC Signature header for security
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Accord-Event': eventType,
      };

      if (this.config.secret) {
        // Simple mock signature. In prod, use crypto.createHmac
        headers['X-Accord-Signature'] = Buffer.from(this.config.secret).toString('base64');
      }

      // Non-blocking fire and forget
      fetch(this.config.url, {
        method: 'POST',
        headers,
        body: payload,
      }).catch(err => console.error('Webhook delivery failed:', err));
      
    } catch (error) {
      // Swallow errors to avoid crashing auth engine due to webhook downtime
      console.error('Webhook log error:', error);
    }
  }
}