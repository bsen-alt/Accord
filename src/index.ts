// src/index.ts
export { Accord } from './accord';
// Re-export config with backward compatible name
export type { AccordV2Config as AccordConfig } from './accord';

// Re-export types for convenience
export * from './core/types';
export * from './adapters/express';
export { AccordGuard } from './adapters/nest';
export { accordHook } from './adapters/fastify';