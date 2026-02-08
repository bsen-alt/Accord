// src/accord.ts
import { compilePolicies } from './core/compiler';
import { IdentityResolver } from './core/resolver';
import { evaluate } from './core/evaluator';
import { 
  IStorageAdapter, 
  JITConfig, 
  LifecycleHooks, 
  DecisionTrace, 
  AccordV2Config, 
  Policy, 
  Identity, 
  WebhookConfig 
} from './core/types';
import { ConsoleAuditLogger } from './core/logger';
import { WebhookAuditLogger } from './core/logger-webhook';
import { FileStoreAdapter } from './store/adapters/file';

export class Accord {
  private adapter: IStorageAdapter;
  private resolver: IdentityResolver;
  private policies: Policy[] = [];
  private hooks: LifecycleHooks;
  private logger: any; 
  private initialized: Promise<void>; // Track init promise

  private constructor(config: AccordV2Config) {
    // v1.3: Backward compatibility
    if (!config.adapter && (config as any).policyPath && (config as any).identityPath) {
      this.adapter = new FileStoreAdapter(
        (config as any).policyPath, 
        (config as any).identityPath
      );
    } else {
      this.adapter = config.adapter!;
    }

    this.hooks = config.hooks || {};
    
    if (config.webhook) {
      this.logger = new WebhookAuditLogger(config.webhook);
    } else {
      this.logger = config.logger || new ConsoleAuditLogger();
    }
    
    this.resolver = new IdentityResolver(this.adapter, config.jit);
    
    // Capture the init promise so we can await it later
    this.initialized = this.init();
  }

  // v1.3: Static factory method to ensure async init completes
  public static async create(config: AccordV2Config): Promise<Accord> {
    const instance = new Accord(config);
    await instance.initialized;
    return instance;
  }

  private async init() {
    await this.reload();
  }

  async reload(): Promise<void> {
    const rawPolicies = await this.adapter.listPolicies();
    this.policies = compilePolicies(rawPolicies);
    console.log(`[Accord] Reloaded ${this.policies.length} policies`);
  }

  async simulate(
    mockIdentity: Identity,
    action: string,
    resource: any,
    context?: any
  ): Promise<DecisionTrace> {
    return this.performEvaluation(mockIdentity, action, resource, context);
  }

  async check(
    externalId: string,
    action: string,
    resource: any,
    context?: any
  ): Promise<DecisionTrace> {
    // Wait for initialization to be sure policies are loaded
    await this.initialized;

    try {
      const identity = await this.resolver.resolve(externalId, context);
      return this.performEvaluation(identity, action, resource, context);
    } catch (error) {
       return {
        decision: 'deny',
        reason: (error as Error).message,
        trace: {
          matchedPolicies: [],
          evaluatedPolicies: [],
          latencyMs: 0,
          resolvedAttributes: {}
        }
      };
    }
  }

  private async performEvaluation(
    identity: Identity,
    action: string,
    resource: any,
    context?: any
  ): Promise<DecisionTrace> {
    const startTime = Date.now();
    
    try {
      if (this.hooks.beforeDecision) {
        for (const hook of this.hooks.beforeDecision) {
          await hook({ request: { subject: identity, action, resource }, attributes: context });
        }
      }

      const request = {
        subject: identity,
        action,
        resource,
        context: context || {}
      };

      const compiledPolicies = this.policies as any; 
      const decision = await evaluate(request, compiledPolicies);

      if (this.hooks.afterDecision) {
        for (const hook of this.hooks.afterDecision) {
          await hook(decision);
        }
      }

      // FIX: Include reason and policy_id in log payload
      this.logger.log({
        timestamp: new Date(),
        decision: decision.decision,
        userId: identity.id,
        action,
        resourceType: resource.type,
        reason: decision.reason,
        policyId: decision.policy_id,
        ...decision.trace
      });

      return decision;

    } catch (error) {
      return {
        decision: 'deny',
        reason: (error as Error).message,
        trace: {
          matchedPolicies: [],
          evaluatedPolicies: [],
          latencyMs: Date.now() - startTime,
          resolvedAttributes: {}
        }
      };
    }
  }

  getAdapter(): IStorageAdapter {
    return this.adapter;
  }

  getStore(): IStorageAdapter {
    return this.adapter;
  }
}

export type { AccordV2Config };