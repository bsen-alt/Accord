// src/core/types.ts
import { z } from 'zod';

// --- Existing Types ---
export interface Identity {
  id: string;
  type: 'user' | 'service' | 'system' | 'agent';
  status: 'active' | 'suspended' | 'revoked';
  attributes: Record<string, any>;
}

export interface Resource {
  type: string;
  id?: string;
  attributes: Record<string, any>;
}

export type Action = string | string[];
export type Context = Record<string, any>;

/**
 * The Input Request for the Evaluation Engine
 */
export interface AccessRequest {
  subject: Identity;
  action: string;
  resource: Resource;
  context?: Context;
}

export interface Policy {
  id: string;
  version: string;
  effect: 'allow' | 'deny';
  subject: {
    type?: string;
    id?: string; // Re-added for backward compatibility with evaluator
    attributes?: Record<string, any>;
  };
  action: string[];
  resource: {
    type?: string;
    id?: string; // Re-added for backward compatibility with evaluator
    attributes?: Record<string, any>;
  };
  condition?: string;
}

export interface CompiledPolicy extends Policy {
  compiledCondition?: ((scope: any) => any);
}

export interface Decision {
  decision: 'allow' | 'deny';
  policy_id?: string;
  reason?: string;
}

// --- NEW v1.2 Types ---

export interface DecisionTrace extends Decision {
  trace: {
    matchedPolicies: string[];
    evaluatedPolicies: string[];
    latencyMs: number;
    resolvedAttributes: Record<string, any>;
  };
}

export interface IStorageAdapter {
  getPolicy(id: string): Promise<Policy | null>;
  listPolicies(): Promise<Policy[]>;
  savePolicy(policy: Policy): Promise<void>;
  deletePolicy(id: string): Promise<void>;

  getIdentity(id: string): Promise<Identity | null>;
  listIdentities(): Promise<Identity[]>;
  saveIdentity(identity: Identity): Promise<void>;
  updateIdentity(id: string, updates: Partial<Identity>): Promise<void>;
}

export interface JITConfig {
  enabled: boolean;
  attributeMapping: Record<string, string>;
  defaultStatus: 'active' | 'suspended';
}

export type BeforeDecisionHook = (ctx: { request: any; attributes: any }) => void | Promise<void>;
export type AfterDecisionHook = (result: DecisionTrace) => void | Promise<void>;

export interface LifecycleHooks {
  beforeDecision?: BeforeDecisionHook[];
  afterDecision?: AfterDecisionHook[];
}

// Legacy Config for backwards compatibility in exports
export interface AccordConfig {
  policyPath?: string;
  identityPath?: string;
  adapter?: IStorageAdapter;
  jit?: JITConfig;
  hooks?: LifecycleHooks;
  logger?: any;
}