// src/core/evaluator.ts
import { CompiledPolicy, AccessRequest, DecisionTrace, Identity } from './types';
import jsonata from 'jsonata';

/**
 * Helper: Matches attributes between policy and request.
 * Handles the special case of 'status' which sits at the root of the Identity object,
 * vs custom attributes which sit in 'attributes'.
 */
function matchesAttributes(
  policyAttrs: Record<string, any> | undefined,
  requestSubject: Identity
): boolean {
  if (!policyAttrs) return true;

  for (const key in policyAttrs) {
    const expectedValue = policyAttrs[key];

    // Special handling for 'status' field on Identity
    if (key === 'status') {
      if (requestSubject.status !== expectedValue) return false;
    } 
    else {
      // Standard attribute lookup
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

  // Note: Policies can match on resource ID if specified, though less common in ABAC
  if (pRes.id && pRes.id !== rRes.id) {
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
 * Helper: Determines if a policy applies to the request.
 * A policy applies if Subject, Resource, and Action match, AND Condition is met.
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
 * Evaluates all policies against the request to produce a DecisionTrace.
 */
export async function evaluate(request: AccessRequest, policies: CompiledPolicy[]): Promise<DecisionTrace> {
  const startTime = Date.now();
  const evaluatedPolicies: string[] = [];
  const matchedPolicies: string[] = [];
  
  let explicitDeny: CompiledPolicy | null = null;
  let allowMatch: CompiledPolicy | null = null;

  // 1. Scan all policies
  for (const policy of policies) {
    evaluatedPolicies.push(policy.id);
    const isMatch = await isApplicable(policy, request);

    if (isMatch) {
      matchedPolicies.push(policy.id);
      
      // 2. Conflict Resolution: Explicit Deny wins immediately
      if (policy.effect === 'deny') {
        explicitDeny = policy;
        break; 
      } else if (policy.effect === 'allow') {
        // Track the most recent allow (or could be first, depending on preference. 
        // In this implementation, we continue scanning for potential overrides/denies)
        allowMatch = policy;
      }
    }
  }

  const latencyMs = Date.now() - startTime;

  // 3. Construct Final Decision
  if (explicitDeny) {
    return {
      decision: 'deny',
      policy_id: explicitDeny.id,
      reason: 'Explicit deny policy matched',
      trace: {
        matchedPolicies,
        evaluatedPolicies,
        latencyMs,
        resolvedAttributes: request.subject.attributes
      }
    };
  }

  if (allowMatch) {
    return {
      decision: 'allow',
      policy_id: allowMatch.id,
      reason: 'Allowed by matching policy',
      trace: {
        matchedPolicies,
        evaluatedPolicies,
        latencyMs,
        resolvedAttributes: request.subject.attributes
      }
    };
  }

  // 4. Default Deny
  return {
    decision: 'deny',
    reason: 'No matching policy found',
    trace: {
      matchedPolicies,
      evaluatedPolicies,
      latencyMs,
      resolvedAttributes: request.subject.attributes
    }
  };
}