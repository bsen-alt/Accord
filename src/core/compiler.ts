// src/core/compiler.ts
import { Policy, CompiledPolicy } from './types';
import jsonata from 'jsonata';

/**
 * Compiles policy conditions into executable functions.
 * This happens ONCE at startup.
 */
export function compilePolicies(policies: Policy[]): CompiledPolicy[] {
  return policies.map(policy => {
    const compiled: CompiledPolicy = { ...policy };

    // Only compile if a condition exists
    if (policy.condition) {
      try {
        const expression = jsonata(policy.condition);
        // Store the compiled function. We evaluate it later.
        compiled.compiledCondition = expression.evaluate.bind(expression);
      } catch (error) {
        console.error(`Failed to compile condition for policy ${policy.id}:`, error);
        // If it fails to compile, it effectively becomes "false" (Deny)
        compiled.compiledCondition = () => false;
      }
    }

    return compiled;
  });
}