// src/store/adapters/postgres.ts
import { Pool, PoolConfig } from 'pg';
import { IStorageAdapter, Policy, Identity } from '../../core/types';
import { Schemas } from '../../core/validation';

export class PostgresStoreAdapter implements IStorageAdapter {
  private pool: Pool;

  constructor(config: PoolConfig) {
    this.pool = new Pool(config);
  }

  private validatePolicy(data: any): Policy {
    return Schemas.Policy.parse(data);
  }
  
  private validateIdentity(data: any): Identity {
    return Schemas.Identity.parse(data);
  }

  async getPolicy(id: string): Promise<Policy | null> {
    // v1.3: Fetch the LATEST version by created_at
    const query = 'SELECT data FROM policies WHERE id = $1 ORDER BY created_at DESC LIMIT 1';
    const res = await this.pool.query(query, [id]);
    if (res.rows.length === 0) return null;
    return this.validatePolicy(res.rows[0].data);
  }

  async getPolicyVersion(id: string, version: string): Promise<Policy | null> {
    // v1.3: Fetch specific version
    const res = await this.pool.query('SELECT data FROM policies WHERE id = $1 AND version = $2', [id, version]);
    if (res.rows.length === 0) return null;
    return this.validatePolicy(res.rows[0].data);
  }

  async listPolicies(): Promise<Policy[]> {
    // v1.3: Distinct on ID to get only latest versions
    const query = `
      SELECT DISTINCT ON (id) data 
      FROM policies 
      ORDER BY id, created_at DESC
    `;
    const res = await this.pool.query(query);
    return res.rows.map(row => this.validatePolicy(row.data));
  }

  async listPolicyHistory(id: string): Promise<Policy[]> {
    const res = await this.pool.query('SELECT data FROM policies WHERE id = $1 ORDER BY created_at DESC', [id]);
    return res.rows.map(row => this.validatePolicy(row.data));
  }

  async savePolicy(policy: Policy): Promise<void> {
    const validated = this.validatePolicy(policy);
    
    // v1.3: REMOVED ON CONFLICT DO UPDATE. We always INSERT new versions.
    const query = `
      INSERT INTO policies (id, version, data, created_at)
      VALUES ($1, $2, $3, NOW())
    `;
    await this.pool.query(query, [validated.id, validated.version, JSON.stringify(validated)]);
  }

  async rollbackPolicy(id: string, targetVersion: string): Promise<void> {
    // v1.3: Fetch old version -> Save as NEW version (Preserves history)
    const oldPolicy = await this.getPolicyVersion(id, targetVersion);
    if (!oldPolicy) throw new Error(`Version ${targetVersion} not found for policy ${id}`);

    // Increment version number (Simple logic, could be smarter)
    const newVersion = `${targetVersion}-rollback-${Date.now()}`;
    
    await this.savePolicy({
      ...oldPolicy,
      version: newVersion,
      created_at: new Date().toISOString()
    });
  }

  async deletePolicy(id: string): Promise<void> {
    await this.pool.query('DELETE FROM policies WHERE id = $1', [id]);
  }

  async getIdentity(id: string): Promise<Identity | null> {
    const res = await this.pool.query('SELECT data FROM identities WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.validateIdentity(res.rows[0].data);
  }

  async listIdentities(limit: number = 1000): Promise<Identity[]> { // v1.3: Added limit
    const res = await this.pool.query('SELECT data FROM identities LIMIT $1', [limit]);
    return res.rows.map(row => this.validateIdentity(row.data));
  }

  async saveIdentity(identity: Identity): Promise<void> {
    const validated = this.validateIdentity(identity);
    const query = `
      INSERT INTO identities (id, data)
      VALUES ($1, $2)
      ON CONFLICT (id) DO UPDATE SET data = $2
    `;
    await this.pool.query(query, [validated.id, JSON.stringify(validated)]);
  }

  async updateIdentity(id: string, updates: Partial<Identity>): Promise<void> {
    const current = await this.getIdentity(id);
    if (!current) throw new Error('Identity not found');
    await this.saveIdentity({ ...current, ...updates });
  }
  
  async close(): Promise<void> {
    await this.pool.end();
  }
}