// src/adapters/express.ts
import { Request, Response, NextFunction } from 'express';
import { Accord } from '../accord';
import { Decision } from '../core/types';

export interface MiddlewareOptions {
  accordInstance: Accord;
  action: string; // e.g., 'delete', 'update'
  resourceType: string; // e.g., 'booking'
  // Optional: Custom function to extract User ID from req
  getId?: (req: Request) => string;
}

/**
 * Express Middleware Factory
 * Usage: app.use(protect({ accord: myAccord, action: 'delete', resourceType: 'booking' }))
 */
export function protect(options: MiddlewareOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Determine User ID
      // In real app, this comes from JWT (req.user.sub). 
      // For v1, we support a custom getter or default to req.headers['x-user-id']
      const userId = options.getId 
        ? options.getId(req) 
        : req.headers['x-user-id'] as string;

      if (!userId) {
        return res.status(401).json({ error: 'User ID missing' });
      }

      // 2. Construct Resource Object
      // We extract ID from route params (e.g., /bookings/:id)
      const resource = {
        type: options.resourceType,
        id: req.params.id, 
        attributes: req.body || {} // Merge body attributes for ABAC checks
      };

      // 3. Check Policy
      const decision: Decision = await options.accordInstance.check(
        userId,
        options.action,
        resource
      );

      // 4. Enforce Decision
      if (decision.decision === 'allow') {
        // Optional: Attach decision to request for downstream use
        (req as any).authDecision = decision;
        next();
      } else {
        res.status(403).json({ 
          error: 'Access Denied', 
          reason: decision.reason 
        });
      }

    } catch (error) {
      console.error('Middleware Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}