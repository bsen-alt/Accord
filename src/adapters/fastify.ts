// src/adapters/fastify.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { Accord } from '../accord';
import { Decision } from '../core/types';

export interface AccordHookOptions {
  accordInstance: Accord;
  action: string;
  resourceType: string;
  // Optional: Custom function to extract User ID
  getId?: (req: FastifyRequest) => string;
}

/**
 * Fastify Hook Factory
 * Usage: fastify.addHook('onRequest', accordHook({ ... }))
 */
export function accordHook(options: AccordHookOptions) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      // 1. Determine User ID
      const userId = options.getId 
        ? options.getId(req) 
        : req.headers['x-user-id'] as string;

      if (!userId) {
        return reply.status(401).send({ error: 'User ID missing' });
      }

      // 2. Construct Resource
      const resource = {
        type: options.resourceType,
        id: (req.params as any).id,
        attributes: req.body || {}
      };

      // 3. Check Policy
      const decision: Decision = await options.accordInstance.check(
        userId,
        options.action,
        resource
      );

      // 4. Enforce
      if (decision.decision === 'allow') {
        (req as any).authDecision = decision;
        return; // Continue
      } else {
        return reply.status(403).send({ 
          error: 'Access Denied', 
          reason: decision.reason 
        });
      }
    } catch (error) {
      console.error('Fastify Accord Hook Error:', error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  };
}