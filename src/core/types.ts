// src/core/types.ts

/**
 * The fundamental primitive: Who is acting?
 * In Accord v1, this is the Internal Identity profile.
 */
export interface Identity {
  id: string;
  type: 'user' | 'service' | 'system' | 'agent';
  status: 'active' | 'suspended' | 'revoked';
  attributes: Record<string, any>;
}

/**
 * The fundamental primitive: What is being acted upon?
 */
export interface Resource {
  type: string;
  id?: string; // Optional in policy matching, but usually required for logic
  attributes: Record<string, any>;
}

/**
 * The fundamental primitive: What is happening?
 * Verb-based, not permission-based.
 */
export type Action = string | string[];

/**
 * The fundamental primitive: The situation.
 * Runtime context like Tenant, Time, IP, etc.
 */
export type Context = Record<string, any>;

/**
 * Policy Definition (APL v1)
 */
export interface Policy {
  id: string;
  version: string;
  effect: 'allow' | 'deny';
  
  // Who matches this policy?
  subject: {
    type?: string;       // e.g., "user"
    id?: string;         // Specific ID
    attributes?: Record<string, any>; // e.g., { role: "admin" }
  };

  // What actions are covered?
  action: string[];

  // What resources are covered?
  resource: {
    type?: string;
    attributes?: Record<string, any>;
  };

  // Logic condition (String to be evaluated by Expression Engine)
  condition?: string;
}

/**
 * A Policy with a pre-compiled expression function.
 * Used internally by Accord for performance.
 */
export interface CompiledPolicy extends Policy {
  compiledCondition?: ((scope: any) => any);
}

/**
 * The Input Request for the Evaluation Engine
 */
export interface AccessRequest {
  subject: Identity;
  action: string;
  resource: Resource;
  context?: Context;
}

/**
 * The Output Decision
 */
export interface Decision {
  decision: 'allow' | 'deny';
  policy_id?: string;
  reason?: string;
}

