// src/index.ts
export { Accord, AccordConfig } from './accord';
// Re-export types for convenience if needed
export * from './core/types';
export * from './adapters/express';
export { AccordGuard } from './adapters/nest';
export { accordHook } from './adapters/fastify';