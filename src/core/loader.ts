// src/core/loader.ts
import { Policy, Identity } from './types';
import { Schemas } from './validation';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * Loads Policies from a file (JSON or YAML).
 * Validates structure using Zod.
 */
export function loadPolicies(filePath: string): Policy[] {
  try {
    const absolutePath = path.resolve(filePath);
    const fileContent = fs.readFileSync(absolutePath, 'utf-8');
    let rawData: any;

    // Detect extension and parse
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      rawData = yaml.load(fileContent);
    // Normalize to Array if YAML returns a single object (single policy in a file) -> wrapped in an array automatically.
      if (!Array.isArray(rawData)) {
        rawData = [rawData];
      }
    } else {
      // Default to JSON
      rawData = JSON.parse(fileContent);
    }

    // VALIDATION STEP
    const result = Schemas.Policy.array().safeParse(rawData);

    if (!result.success) {
      console.error('Invalid Policy Structure:', result.error.format());
      throw new Error(`Policy validation failed for ${filePath}`);
    }

    return result.data; // Return validated, typed data
  } catch (error) {
    console.error(`Failed to load policies from ${filePath}:`, error);
    throw error; // Let application fail hard if config is bad.
  }
}