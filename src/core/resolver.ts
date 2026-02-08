//src/core/resolver.ts
import { Identity, JITConfig, Context } from './types';
import { IStorageAdapter } from '../adapters/interface';
import jsonata from 'jsonata';

export class IdentityResolver {
  private store: IStorageAdapter;
  private jitConfig: JITConfig;

  constructor(store: IStorageAdapter, jitConfig: JITConfig = { enabled: false, attributeMapping: {}, defaultStatus: 'active' }) {
    this.store = store;
    this.jitConfig = jitConfig;
  }

  async resolve(externalId: string, context?: Context): Promise<Identity> {
    let identity = await this.store.getIdentity(externalId);

    // PILLAR 6: JIT Provisioning
    if (!identity && this.jitConfig.enabled) {
      identity = await this.provisionIdentity(externalId, context || {});
    }

    if (!identity) {
      throw new Error(`Identity not found: ${externalId}`);
    }

    // Enforcement: Kill Switch
    if (identity.status !== 'active') {
      throw new Error(`Identity ${externalId} is ${identity.status}. Access denied.`);
    }

    return identity;
  }

  private async provisionIdentity(externalId: string, context: Context): Promise<Identity> {
    const attributes: Record<string, any> = {};
    
    // Map attributes from context/claims using JSONata
    for (const [key, expression] of Object.entries(this.jitConfig.attributeMapping)) {
      try {
        const expr = jsonata(expression);
        const result = expr.evaluate(context);
        if (result !== undefined) {
          attributes[key] = result;
        }
      } catch (e) {
        console.warn(`JIT Mapping failed for ${key}:`, e);
      }
    }

    const newIdentity: Identity = {
      id: externalId,
      type: 'user', // Default to user
      status: this.jitConfig.defaultStatus,
      attributes
    };

    await this.store.saveIdentity(newIdentity);
    console.log(`[JIT] Provisioned identity for ${externalId}`);
    return newIdentity;
  }
}