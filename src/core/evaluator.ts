// src/core/evaluator.ts
import { CompiledPolicy, AccessRequest, Decision, Identity } from './types';
import jsonata from 'jsonata'; 

/**
 * Helper: Matches attributes between policy and request.
 */
function matchesAttributes(
  policyAttrs: Record<string, any> | undefined,
  requestSubject: Identity
): boolean {
  if (!policyAttrs) return true;

  for (const key in policyAttrs) {
    const expectedValue = policyAttrs[key];

    if (key === 'status') {
      if (requestSubject.status !== expectedValue) return false;
    } 
    else {
      if (requestSubject.attributes?.[key] !== expectedValue) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Helper: Checks if the policy subject matches the request subject.
 */
function matchesSubject(policy: CompiledPolicy, request: AccessRequest): boolean {
  const pSub = policy.subject;
  const rSub = request.subject;

  if (pSub.type && pSub.type !== rSub.type) {
    return false;
  }

  if (pSub.id && pSub.id !== rSub.id) {
    return false;
  }

  if (!matchesAttributes(pSub.attributes, rSub)) {
    return false;
  }

  return true;
}

/**
 * Helper: Checks if the policy resource matches the request resource.
 */
function matchesResource(policy: CompiledPolicy, request: AccessRequest): boolean {
  const pRes = policy.resource;
  const rRes = request.resource;

  if (pRes.type && pRes.type !== rRes.type) {
    return false;
  }

  if (pRes.attributes) {
    for (const key in pRes.attributes) {
      if (rRes.attributes[key] !== pRes.attributes[key]) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Helper: Checks if the action is covered by the policy.
 */
function matchesAction(policy: CompiledPolicy, request: AccessRequest): boolean {
  return policy.action.includes(request.action);
}

/**
 * Helper: Evaluates Condition using a PRE-COMPILED function.
 * Falls back to runtime compilation if no pre-compiled function exists (for unit tests).
 */
async function evaluateCondition(policy: CompiledPolicy, request: AccessRequest): Promise<boolean> {
  // If no condition, it passes.
  if (!policy.condition) return true;

  try {
    const scope = {
      subject: request.subject,
      resource: request.resource,
      context: request.context || {}
    };

    // 1. Optimized Path: Use pre-compiled function (Production)
    if (policy.compiledCondition) {
      const result = await policy.compiledCondition(scope);
      return (result as any) === true;
    } 
    
    // 2. Fallback Path: Compile and run immediately (Unit Tests / Raw Data)
    // This ensures unit tests using raw Policy objects still work.
    else {
      const expression = jsonata(policy.condition);
      const result = await expression.evaluate(scope);
      return (result as any) === true;
    }

  } catch (error) {
    console.error(`Condition evaluation error for policy ${policy.id}:`, error);
    return false;
  }
}

/**
 * CORE FUNCTION: Evaluates a single policy against a request.
 */
async function isApplicable(policy: CompiledPolicy, request: AccessRequest): Promise<boolean> {
  return (
    matchesSubject(policy, request) &&
    matchesResource(policy, request) &&
    matchesAction(policy, request) &&
    (await evaluateCondition(policy, request))
  );
}

/**
 * MAIN ENTRY POINT: The Brain.
 */
export async function evaluate(request: AccessRequest, policies: CompiledPolicy[]): Promise<Decision> {
  let hasMatch = false;
  let deniedBy: string | undefined;

  // 1. Scan all policies
  for (const policy of policies) {
    if (await isApplicable(policy, request)) {
      hasMatch = true;

      // 2. Conflict Resolution: Explicit Deny wins immediately
      if (policy.effect === 'deny') {
        return {
          decision: 'deny',
          policy_id: policy.id,
          reason: 'Explicit deny policy matched',
        };
      }
    }
  }

  // 3. Final Decision
  if (hasMatch) {
    const allowingPolicy = policies.find(p => 
      p.effect === 'allow' && 
      matchesSubject(p, request) && 
      matchesResource(p, request) && 
      matchesAction(p, request)
    ); 
    
    return {
      decision: 'allow',
      policy_id: allowingPolicy?.id, 
      reason: 'Allowed by matching policy',
    };
  }

  // 4. Default Deny
  return {
    decision: 'deny',
    reason: 'No matching policy found (Default Deny)',
  };
}