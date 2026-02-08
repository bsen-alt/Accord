// src/server/routes.ts
import { FastifyInstance } from 'fastify';
import { Accord } from '../accord';
import { Policy, Identity } from '../core/types';
import { Schemas } from '../core/validation';
import { buildPolicyGraph } from '../core/graph'; // v1.3

export async function registerRoutes(fastify: FastifyInstance, accord: Accord) {
  const adapter = accord.getAdapter();

  fastify.get('/health', async (req, res) => {
    return { status: 'ok', version: '1.3.0' };
  });

  // --- EXISTING ROUTES ---

  fastify.post('/api/v1/check', async (req, res) => {
    const body = req.body as any;
    const decision = await accord.check(
      body.userId,
      body.action,
      body.resource,
      body.context
    );
    return decision;
  });

  fastify.post('/api/v1/reload', async (req, res) => {
    await accord.reload();
    return { status: 'reloaded' };
  });

  fastify.get('/api/v1/policies', async (req, res) => {
    const policies = await adapter.listPolicies();
    return policies;
  });

  fastify.post('/api/v1/policies', async (req, res) => {
    const validation = Schemas.Policy.safeParse(req.body);
    if (!validation.success) return res.status(400).send(validation.error);

    await adapter.savePolicy(validation.data);
    await accord.reload();
    return res.status(201).send({ message: 'Policy created' });
  });

  fastify.delete('/api/v1/policies/:id', async (req, res) => {
    const { id } = req.params as any;
    await adapter.deletePolicy(id);
    await accord.reload();
    return { message: 'Policy deleted' };
  });

  fastify.get('/api/v1/identities', async (req, res) => {
    return adapter.listIdentities();
  });

  fastify.post('/api/v1/identities', async (req, res) => {
    const validation = Schemas.Identity.safeParse(req.body);
    if (!validation.success) return res.status(400).send(validation.error);

    await adapter.saveIdentity(validation.data);
    return res.status(201).send({ message: 'Identity created' });
  });
  
  fastify.patch('/api/v1/identities/:id', async (req, res) => {
    const { id } = req.params as any;
    const updates = req.body as Partial<Identity>;
    await adapter.updateIdentity(id, updates);
    return { message: 'Identity updated' };
  });

  // --- v1.3 NEW ROUTES ---

  // PILLAR 1: Simulation Engine
  fastify.post('/api/v1/simulate', async (req, res) => {
    const body = req.body as any;
    
    // Construct a temporary identity for simulation from the request body
    const mockIdentity: Identity = {
      id: body.identity?.id || 'sim-user',
      type: body.identity?.type || 'user',
      status: 'active',
      attributes: body.identity?.attributes || {}
    };

    // Use the new simulate method which bypasses the database resolver
    const decision = await accord.simulate(
      mockIdentity,
      body.action,
      body.resource,
      body.context
    );
    
    return decision;
  });

  // PILLAR 2: Impact Analysis
  fastify.post('/api/v1/policies/impact', async (req, res) => {
    const draftPolicy = req.body as Policy;
    
    // Validate
    const validation = Schemas.Policy.safeParse(draftPolicy);
    if (!validation.success) return res.status(400).send(validation.error);

    // Fetch identities (with limit for performance)
    const identities = await adapter.listIdentities(100); // Default sampling
    
    let affectedCount = 0;
    let allowCount = 0;
    let denyCount = 0;

    // Perform a basic check to estimate impact. 
    // In a full implementation, this would use a mock evaluator.
    identities.forEach(identity => {
      // Check if Subject matches
      const matchesType = !draftPolicy.subject.type || draftPolicy.subject.type === identity.type;
      
      let matchesAttributes = true;
      if (draftPolicy.subject.attributes) {
        for (const [key, value] of Object.entries(draftPolicy.subject.attributes)) {
          if (identity.attributes?.[key] !== value) {
            matchesAttributes = false;
            break;
          }
        }
      }

      if (matchesType && matchesAttributes) {
        affectedCount++;
        if (draftPolicy.effect === 'allow') allowCount++;
        else denyCount++;
      }
    });

    return {
      policyId: draftPolicy.id,
      affectedIdentities: affectedCount,
      sampledIdentities: identities.length,
      estimatedAccessGains: allowCount,
      estimatedAccessRevocations: denyCount
    };
  });

  // PILLAR 4: Visual Graph
  fastify.get('/api/v1/policies/graph', async (req, res) => {
    const policies = await adapter.listPolicies();
    const graph = buildPolicyGraph(policies);
    return graph;
  });

  // PILLAR 5: Rollback
  fastify.post('/api/v1/policies/:id/rollback', async (req, res) => {
    const { id } = req.params as any;
    const { version } = req.body as any;

    if (!version) {
      return res.status(400).send({ error: 'Missing version in request body' });
    }
    
    try {
      await adapter.rollbackPolicy(id, version);
      await accord.reload();
      return { message: `Rolled back ${id} to version ${version}` };
    } catch (error) {
      // Handle case where adapter doesn't support rollback (e.g. FileAdapter)
      if ((error as Error).message.includes('not supported')) {
        return res.status(400).send({ error: (error as Error).message });
      }
      throw error;
    }
  });
}