// src/accord.ts
import { loadPolicies } from './core/loader';
import { compilePolicies } from './core/compiler';
import { IdentityStore } from './store/identity';
import { IdentityResolver } from './core/resolver';
import { evaluate } from './core/evaluator';
import { AuditLogger, ConsoleAuditLogger, AuditEvent } from './core/logger'; // NEW IMPORTS
import { AccessRequest, Decision, CompiledPolicy } from './core/types';

export interface AccordConfig {
  policyPath: string;
  identityPath: string;
  logger?: AuditLogger; // OPTIONAL: Default to ConsoleAuditLogger if undefined
}

export class Accord {
  private policies: CompiledPolicy[];
  private identityStore: IdentityStore;
  private resolver: IdentityResolver;
  private config: AccordConfig;
  private logger: AuditLogger; // NEW PROPERTY

  constructor(config: AccordConfig) {
    this.config = config;
    
    // 1. Initialize Logger (Default to ConsoleAuditLogger)
    this.logger = config.logger || new ConsoleAuditLogger();

    // 2. Initialize Store
    this.identityStore = new IdentityStore(config.identityPath);

    // 3. Initialize Resolver
    this.resolver = new IdentityResolver(this.identityStore);

    // 4. Load and COMPILE Policies
    const rawPolicies = loadPolicies(config.policyPath);
    this.policies = compilePolicies(rawPolicies); 
  }

  async check(
    externalId: string,
    action: string,
    resource: any,
    context?: any
  ): Promise<Decision> {
    let decision: Decision;

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
      decision = await evaluate(request, this.policies);

    } catch (error) {
      decision = {
        decision: 'deny',
        reason: (error as Error).message
      };
    }

    // 4. AUDIT LOG (New Step)
    this.logger.log({
      timestamp: new Date(),
      decision: decision.decision,
      policyId: decision.policy_id,
      reason: decision.reason,
      userId: externalId,
      action: action,
      resourceType: resource.type,
      resourceId: resource.id
    });

    return decision;
  }
  
  getStore(): IdentityStore {
    return this.identityStore;
  }

  /**
   * Reloads Policies and Identities from disk.
   * SAFETY: If the new config is invalid, the old config remains active.
   */
  reload(): void {
    try {
      // 1. Reload Policies
      const newRawPolicies = loadPolicies(this.config.policyPath);
      const newCompiledPolicies = compilePolicies(newRawPolicies);

      // 2. Reload Identities
      this.identityStore.reload();

      // 3. Swap Logic (Atomic Update)
      this.policies = newCompiledPolicies;

      console.log('✓ Accord Reloaded Successfully');
    } catch (error) {
      console.error('✗ Reload Failed. Old config is still active.');
      console.error('Reason:', (error as Error).message);
      // We do NOT throw here. We want the app to keep running on old config.
    }
  }
}