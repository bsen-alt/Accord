// tests/v13.routes.test.ts
import { buildPolicyGraph } from '../src/core/graph';
import { Policy, Identity } from '../src/core/types';
import { FileStoreAdapter } from '../src/store/adapters/file';
import { Accord } from '../src/accord';
import * as fs from 'fs';

describe('ACCORD v1.3 Features', () => {

  describe('Graph Builder', () => {
    test('Should generate a graph from policies', () => {
      const policies: Policy[] = [
        {
          id: 'p1',
          version: '1.0',
          effect: 'allow',
          subject: { type: 'user', attributes: { role: 'admin' } },
          action: ['read'],
          resource: { type: 'document' }
        }
      ];

      const graph = buildPolicyGraph(policies);

      expect(graph.nodes).toHaveLength(3); // policy, role, resource
      expect(graph.edges).toHaveLength(2); // role->policy, policy->resource
      expect(graph.edges[0].type).toBe('applies_to');
    });
  });

  describe('Simulation', () => {
    test('Should allow testing with a mock identity', async () => {
      const adapter = new FileStoreAdapter('./config/policies.json', './config/identities.json');
      const accord = await Accord.create({ adapter }); // Use create

      const mockIdentity: Identity = {
        id: 'test-user',
        type: 'user', // Fixed: strict type match
        status: 'active',
        attributes: { role: 'admin' }
      };

      const decision = await accord.simulate(
        mockIdentity,
        'delete',
        { type: 'booking', id: 'b1' }
      );

      expect(decision).toBeDefined();
      expect(['allow', 'deny']).toContain(decision.decision);
    });
  });
});