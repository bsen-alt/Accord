//src/store/adapters/file.ts
import { IStorageAdapter, Policy, Identity } from '../../core/types';
import * as fs from 'fs';
import * as path from 'path';
import { Schemas } from '../../core/validation';

export class FileStoreAdapter implements IStorageAdapter {
  private policyPath: string;
  private identityPath: string;

  constructor(policyPath: string, identityPath: string) {
    this.policyPath = path.resolve(policyPath);
    this.identityPath = path.resolve(identityPath);
  }

  // --- Policy Methods ---
  async getPolicy(id: string): Promise<Policy | null> {
    const policies = await this.listPolicies();
    return policies.find(p => p.id === id) || null;
  }

  async listPolicies(): Promise<Policy[]> {
    try {
      const content = fs.readFileSync(this.policyPath, 'utf-8');
      const data = JSON.parse(content);
      const result = Schemas.Policy.array().safeParse(Array.isArray(data) ? data : [data]);
      return result.success ? result.data : [];
    } catch (e) {
      return [];
    }
  }

  async savePolicy(policy: Policy): Promise<void> {
    const policies = await this.listPolicies();
    const index = policies.findIndex(p => p.id === policy.id);
    if (index >= 0) {
      policies[index] = policy;
    } else {
      policies.push(policy);
    }
    fs.writeFileSync(this.policyPath, JSON.stringify(policies, null, 2));
  }

  async deletePolicy(id: string): Promise<void> {
    const policies = (await this.listPolicies()).filter(p => p.id !== id);
    fs.writeFileSync(this.policyPath, JSON.stringify(policies, null, 2));
  }

  // --- Identity Methods ---
  async getIdentity(id: string): Promise<Identity | null> {
    const identities = await this.listIdentities();
    return identities.find(i => i.id === id) || null;
  }

  async listIdentities(): Promise<Identity[]> {
    try {
      if (!fs.existsSync(this.identityPath)) return [];
      const content = fs.readFileSync(this.identityPath, 'utf-8');
      const data = JSON.parse(content);
      const result = Schemas.Identity.array().safeParse(data);
      return result.success ? result.data : [];
    } catch (e) {
      return [];
    }
  }

  async saveIdentity(identity: Identity): Promise<void> {
    const identities = await this.listIdentities();
    const index = identities.findIndex(i => i.id === identity.id);
    if (index >= 0) {
      identities[index] = identity;
    } else {
      identities.push(identity);
    }
    fs.writeFileSync(this.identityPath, JSON.stringify(identities, null, 2));
  }

  async updateIdentity(id: string, updates: Partial<Identity>): Promise<void> {
    const current = await this.getIdentity(id);
    if (!current) throw new Error(`Identity ${id} not found`);
    await this.saveIdentity({ ...current, ...updates });
  }
}