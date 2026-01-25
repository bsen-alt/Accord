// src/core/validation.ts
import { z } from 'zod';

/**
 * Zod Schemas for Accord v1.1
 * These ensure that config files are structurally correct before the engine runs.
 */

// Enums
const EffectSchema = z.enum(['allow', 'deny']);
const StatusSchema = z.enum(['active', 'suspended', 'revoked']);
const IdentityTypeSchema = z.enum(['user', 'service', 'system', 'agent']);

// Objects
const ResourceSchema = z.object({
  type: z.string().optional(),
  id: z.string().optional(),
  attributes: z.record(z.string(), z.any()).optional().default({}),
});

const SubjectSchema = z.object({
  type: z.string().optional(),
  id: z.string().optional(),
  attributes: z.record(z.string(), z.any()).optional().default({}),
});

const PolicySchema = z.object({
  id: z.string(),
  version: z.string(),
  effect: EffectSchema,
  subject: SubjectSchema,
  action: z.array(z.string()),
  resource: ResourceSchema,
  condition: z.string().optional(),
});

const IdentitySchema = z.object({
  id: z.string(),
  type: IdentityTypeSchema,
  status: StatusSchema,
  attributes: z.record(z.string(), z.any()).optional().default({}),
});

// Export for use in Loaders
export const Schemas = {
  Policy: PolicySchema,
  Identity: IdentitySchema,
};