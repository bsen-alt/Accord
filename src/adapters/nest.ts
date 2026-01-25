// src/adapters/nest.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Accord } from '../accord';
import { Decision } from '../core/types';

/**
 * Options for the NestJS Guard.
 * For v1.1, we define Action/Resource statically on the guard.
 * Future: Use Decorators to set metadata on routes.
 */
export interface AccordGuardOptions {
  accordInstance: Accord;
  action: string;
  resourceType: string;
  // Optional: Custom function to extract User ID from Request
  getId?: (req: any) => string;
}

@Injectable()
export class AccordGuard implements CanActivate {
  private options: AccordGuardOptions;

  constructor(options: AccordGuardOptions) {
    this.options = options;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    try {
      // 1. Determine User ID
      const userId = this.options.getId 
        ? this.options.getId(req) 
        : req.headers['x-user-id'] as string;

      if (!userId) {
        // Nest often handles exceptions via Exception Filters, 
        // but returning false is standard for guards.
        return false; 
      }

      // 2. Construct Resource
      const resource = {
        type: this.options.resourceType,
        id: req.params.id,
        attributes: req.body || {}
      };

      // 3. Check Policy
      const decision: Decision = await this.options.accordInstance.check(
        userId,
        this.options.action,
        resource
      );

      // 4. Attach decision to request (useful for downstream logic)
      (req as any).authDecision = decision;

      return decision.decision === 'allow';
    } catch (error) {
      console.error('NestJS Accord Guard Error:', error);
      return false; // Fail safe: Deny
    }
  }
}