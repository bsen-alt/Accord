// src/store/identity.ts
import { Identity } from '../core/types';
import { Schemas } from '../core/validation';
import * as fs from 'fs';
import * as path from 'path';

export class IdentityStore {
  private filePath: string;
  private identities: Identity[] = [];

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
    this.load();
  }

  /**
   * Loads identities from the JSON file into memory.
   */
  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        const rawData = JSON.parse(fileContent);

         // VALIDATION STEP
        const result = Schemas.Identity.array().safeParse(rawData);

        if (!result.success) {
          console.error('Invalid Identity Structure:', result.error.format());
          // For v1, we start empty on fail to be safe, or throw. 
          // Let's throw to match enterprise behavior.
          throw new Error(`Identity validation failed for ${this.filePath}`);
        }

        this.identities = result.data;
      } else {
        this.identities = [];
        console.warn(`Identity file not found at ${this.filePath}, starting empty.`);
      }
    } catch (error) {
      console.error('Failed to load identities:', error);
      this.identities = [];
    }
  }

  /**
   * Saves the current in-memory identities back to the JSON file.
   */
  private save(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.identities, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save identities:', error);
      throw new Error('Could not write to identity store');
    }
  }

  /**
   * Retrieves an identity by ID.
   */
  getIdentity(id: string): Identity | undefined {
    return this.identities.find(ident => ident.id === id);
  }

  /**
   * Updates attributes (including status) of a specific identity.
   * If the identity doesn't exist, it can optionally create one (not implemented for v1 safety).
   */
  updateIdentity(id: string, updates: Partial<Identity>): Identity {
    const index = this.identities.findIndex(ident => ident.id === id);

    if (index === -1) {
      throw new Error(`Identity with ID ${id} not found.`);
    }

    // Merge updates (shallow merge for simplicity in v1)
    // We specifically handle 'attributes' merging so we don't overwrite the whole attributes object
    const current = this.identities[index];
    
    if (updates.attributes) {
      this.identities[index] = {
        ...current,
        ...updates,
        attributes: { ...current.attributes, ...updates.attributes }
      };
    } else {
      this.identities[index] = { ...current, ...updates };
    }

    this.save(); // Persist to disk
    return this.identities[index];
  }

  /**
   * Helper to get all identities (useful for testing/debugging)
   */
  getAllIdentities(): Identity[] {
    return this.identities;
  }

    /**
   * Reloads identities from disk.
   * Useful if the file was edited externally.
   */
  reload(): void {
    this.load(); // Re-run the load logic
  }
}