//src/server/index.ts
import Fastify, { FastifyInstance } from 'fastify';
import { Accord } from '../accord';
import { registerRoutes } from './routes';

export interface ServerOptions {
  port: number;
  host?: string;
  accordInstance: Accord;
}

export async function startServer(options: ServerOptions): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: true });

  // Enable CORS for Ops tools
  fastify.register(require('@fastify/cors'), { 
    origin: true 
  });

  // Register Routes
  await registerRoutes(fastify, options.accordInstance);

  // Start listening
  const address = await fastify.listen({ port: options.port, host: options.host || '0.0.0.0' });
  
  console.log(`[Server] Accord listening on ${address}`);
  return fastify;
}