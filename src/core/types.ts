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
    id?: string;
    attributes?: Record<string, any>;
  };
  action: string[];
  resource: {
    type?: string;
    id?: string;
    attributes?: Record<string, any>;
  };
  condition?: string;
  created_at?: string; // v1.3: Added for versioning
}

export interface CompiledPolicy extends Policy {
  compiledCondition?: ((scope: any) => any);
}

export interface Decision {
  decision: 'allow' | 'deny';
  policy_id?: string;
  reason?: string;
}

export interface DecisionTrace extends Decision {
  trace: {
    matchedPolicies: string[];
    evaluatedPolicies: string[];
    latencyMs: number;
    resolvedAttributes: Record<string, any>;
  };
}

// --- v1.3 UPDATED INTERFACES ---

export interface IStorageAdapter {
  getPolicy(id: string): Promise<Policy | null>;
  getPolicyVersion(id: string, version: string): Promise<Policy | null>; // NEW
  listPolicies(): Promise<Policy[]>;
  listPolicyHistory(id: string): Promise<Policy[]>; // NEW
  savePolicy(policy: Policy): Promise<void>;
  rollbackPolicy(id: string, targetVersion: string): Promise<void>; // NEW
  deletePolicy(id: string): Promise<void>;

  getIdentity(id: string): Promise<Identity | null>;
  listIdentities(limit?: number): Promise<Identity[]>; // Updated: Added limit for sampling
  saveIdentity(identity: Identity): Promise<void>;
  updateIdentity(id: string, updates: Partial<Identity>): Promise<void>;
}

export interface JITConfig {
  enabled: boolean;
  attributeMapping: Record<string, string>;
  defaultStatus: 'active' | 'suspended';
}

// v1.3 FIX: Defined explicit interface for Context to allow reuse in imports
export interface BeforeDecisionHookContext {
  request: any;
  attributes: any;
}

export type BeforeDecisionHook = (ctx: BeforeDecisionHookContext) => void | Promise<void>;
export type AfterDecisionHook = (result: DecisionTrace) => void | Promise<void>;

export interface LifecycleHooks {
  beforeDecision?: BeforeDecisionHook[];
  afterDecision?: AfterDecisionHook[];
}

// v1.3: Added Webhook Configuration
export interface WebhookConfig {
  url: string;
  secret?: string; // Optional HMAC signature
  events: ('decision' | 'policy_change' | 'identity_provision')[];
}

export interface AccordConfig {
  policyPath?: string;
  identityPath?: string;
  adapter?: IStorageAdapter;
  jit?: JITConfig;
  hooks?: LifecycleHooks;
  logger?: any;
  webhook?: WebhookConfig; // v1.3
}

// v1.3: Graph Types
export interface GraphNode {
  id: string;
  type: 'identity' | 'role' | 'resource' | 'policy';
  label: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  type: 'allow' | 'deny' | 'has_role' | 'applies_to';
}

export interface PolicyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Legacy Config for backwards compatibility
export interface AccordV2Config {
  adapter: IStorageAdapter;
  jit?: JITConfig;
  hooks?: LifecycleHooks;
  logger?: any;
  webhook?: WebhookConfig;
}