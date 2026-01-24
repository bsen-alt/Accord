// src/core/loader.ts
import { Policy, Identity } from './types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Loads Policies from a JSON file.
 */
export function loadPolicies(filePath: string): Policy[] {
  try {
    const absolutePath = path.resolve(filePath);
    const fileContent = fs.readFileSync(absolutePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Failed to load policies from ${filePath}:`, error);
    return []; // Return empty array on failure to be safe
  }
}