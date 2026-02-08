// examples/risk-signal-hook.ts
/**
 * Example: Using Risk Signals in ACCORD v1.3
 * 
 * This demonstrates how to inject external risk data (IP reputation, Geo-fencing)
 * into the authorization context using lifecycle hooks.
 */

import { Accord } from '../src/accord';
import { PostgresStoreAdapter } from '../src/store/adapters/postgres';
import { BeforeDecisionHookContext } from '../src/core/types';

// Mock external risk service
async function checkRiskScore(ip: string): Promise<number> {
  // In reality, call Fraud API, MaxMind, or internal service
  if (ip === '192.168.1.50') return 95; // High risk
  return 10; // Low risk
}

const adapter = new PostgresStoreAdapter({ connectionString: process.env.DATABASE_URL });

const accord = new Accord({
  adapter,
  hooks: {
    // v1.3: Hooks must be an array. 
    // TypeScript now correctly infers the type from BeforeDecisionHookContext.
    beforeDecision: [
      async (ctx: BeforeDecisionHookContext) => {
        // 1. Extract IP from request context (assumed passed in context)
        const userIp = ctx.request.context?.ip;

        if (userIp) {
          const riskScore = await checkRiskScore(userIp);
          
          // 2. Enrich context with the risk score
          // This makes 'context.riskScore' available in Policy Conditions
          ctx.request.context.riskScore = riskScore;
          ctx.request.context.riskLevel = riskScore > 50 ? 'high' : 'low';
          
          console.log(`[RiskHook] IP ${userIp} has risk score ${riskScore}`);
        }
      }
    ]
  }
});

// Example Policy that uses this risk context:
/*
{
  "id": "high-value-transfer",
  "effect": "allow",
  "subject": { "attributes": { "role": "finance" } },
  "action": ["transfer"],
  "resource": { "type": "money" },
  "condition": "context.riskLevel = 'low'"
}
*/