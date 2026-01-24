// src/accord.ts
import { loadPolicies } from './core/loader';
import { compilePolicies } from './core/compiler'; // NEW
import { IdentityStore } from './store/identity';
import { IdentityResolver } from './core/resolver';
import { evaluate } from './core/evaluator';
import { AccessRequest, Decision, CompiledPolicy } from './core/types'; // ADDED CompiledPolicy

export interface AccordConfig {
  policyPath: string;
  identityPath: string;
}

export class Accord {
  private policies: CompiledPolicy[]; // CHANGED TYPE
  private identityStore: IdentityStore;
  private resolver: IdentityResolver;
  private config: AccordConfig;

  constructor(config: AccordConfig) {
    this.config = config;
    
    // 1. Initialize Store
    this.identityStore = new IdentityStore(config.identityPath);

    // 2. Initialize Resolver
    this.resolver = new IdentityResolver(this.identityStore);

    // 3. Load and COMPILE Policies
    const rawPolicies = loadPolicies(config.policyPath);
    this.policies = compilePolicies(rawPolicies); 
  }

  async check(
    externalId: string,
    action: string,
    resource: any,
    context?: any
  ): Promise<Decision> {
    try {
      // 1. Resolve Identity
      const identity = this.resolver.resolve(externalId);

      // 2. Construct AccessRequest
      const request: AccessRequest = {
        subject: identity,
        action: action,
        resource: resource,
        context: context || {}
      };

      // 3. Evaluate
      const decision = await evaluate(request, this.policies);

      return decision;
    } catch (error) {
      return {
        decision: 'deny',
        reason: (error as Error).message
      };
    }
  }
  
  getStore(): IdentityStore {
    return this.identityStore;
  }
}