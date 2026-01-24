// src/core/resolver.ts
import { Identity } from './types';
import { IdentityStore } from '../store/identity';

export class IdentityResolver {
  private store: IdentityStore;

  constructor(identityStore: IdentityStore) {
    this.store = identityStore;
  }

  /**
   * Resolves an external ID to an Internal Identity.
   * This is the "Bridge" logic.
   */
  resolve(externalId: string): Identity {
    const identity = this.store.getIdentity(externalId);

    if (!identity) {
      // In a real app, you might auto-provision here (Shadow Identity).
      // For v1, we strictly require the user to exist in the DB.
      throw new Error(`Identity not found for ID: ${externalId}`);
    }

    // ENFORCEMENT: The "Kill Switch"
    // Even if the token is valid, if internal status is suspended, access is denied.
    if (identity.status !== 'active') {
      throw new Error(`Identity ${externalId} is ${identity.status}. Access denied.`);
    }

    return identity;
  }
}