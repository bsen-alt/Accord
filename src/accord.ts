import { compilePolicies } from './core/compiler';
import { IdentityResolver } from './core/resolver';
import { evaluate } from './core/evaluator';
import { IStorageAdapter, JITConfig, LifecycleHooks, DecisionTrace, AccordConfig, Policy } from './core/types';
import { ConsoleAuditLogger } from './core/logger';

// Re-exporting AccordConfig from types for backward compatibility in index.ts
export type AccordV2Config = {
  adapter: IStorageAdapter;
  jit?: JITConfig;
  hooks?: LifecycleHooks;
  logger?: any;
};

export class Accord {
  private adapter: IStorageAdapter;
  private resolver: IdentityResolver;
  private policies: Policy[] = [];
  private hooks: LifecycleHooks;
  private logger: any; 

  constructor(config: AccordV2Config) {
    this.adapter = config.adapter;
    this.hooks = config.hooks || {};
    this.logger = config.logger || new ConsoleAuditLogger();
    
    this.resolver = new IdentityResolver(this.adapter, config.jit);

    this.init();
  }

  private async init() {
    await this.reload();
  }

  async reload(): Promise<void> {
    const rawPolicies = await this.adapter.listPolicies();
    this.policies = compilePolicies(rawPolicies);
    console.log(`[Accord] Reloaded ${this.policies.length} policies`);
  }

  async check(
    externalId: string,
    action: string,
    resource: any,
    context?: any
  ): Promise<DecisionTrace> {
    const startTime = Date.now();
    
    try {
      const identity = await this.resolver.resolve(externalId, context);

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

      this.logger.log({
        timestamp: new Date(),
        decision: decision.decision,
        userId: externalId,
        action,
        resourceType: resource.type,
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
}