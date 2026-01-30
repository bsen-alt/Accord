//src/server/routes.ts
import { FastifyInstance } from 'fastify';
import { Accord } from '../accord';
import { Policy, Identity } from '../core/types';
import { Schemas } from '../core/validation';

export async function registerRoutes(fastify: FastifyInstance, accord: Accord) {
  const adapter = accord.getAdapter();

  fastify.get('/health', async (req, res) => {
    return { status: 'ok', version: '1.2.0' };
  });

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
    // FIX: Cast body to Partial<Identity>
    const updates = req.body as Partial<Identity>;
    await adapter.updateIdentity(id, updates);
    return { message: 'Identity updated' };
  });
}