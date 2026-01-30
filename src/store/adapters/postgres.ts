//src/store/adapters/postgres.ts
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
    const res = await this.pool.query('SELECT data FROM policies WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.validatePolicy(res.rows[0].data);
  }

  async listPolicies(): Promise<Policy[]> {
    const res = await this.pool.query('SELECT data FROM policies');
    return res.rows.map(row => this.validatePolicy(row.data));
  }

  async savePolicy(policy: Policy): Promise<void> {
    const validated = this.validatePolicy(policy);
    const query = `
      INSERT INTO policies (id, version, data)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET data = $3, version = $2
    `;
    await this.pool.query(query, [validated.id, validated.version, JSON.stringify(validated)]);
  }

  async deletePolicy(id: string): Promise<void> {
    await this.pool.query('DELETE FROM policies WHERE id = $1', [id]);
  }

  async getIdentity(id: string): Promise<Identity | null> {
    const res = await this.pool.query('SELECT data FROM identities WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.validateIdentity(res.rows[0].data);
  }

  async listIdentities(): Promise<Identity[]> {
    const res = await this.pool.query('SELECT data FROM identities');
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
  
  // FIXED: Return type changed to Promise<void>
  async close(): Promise<void> {
    await this.pool.end();
  }
}