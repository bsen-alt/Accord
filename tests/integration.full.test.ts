// tests/integration.full.test.ts
import { Accord, AccordConfig } from '../src/accord';
import { Policy } from '../src/core/types';

describe('Accord Full Pipeline Integration', () => {
  let accord: Accord;

  beforeAll(() => {
    const config: AccordConfig = {
      policyPath: './config/policies.json', // <--- CHANGE to YAML below
      identityPath: './config/identities.json'
    };
    accord = new Accord(config);
  });

  // 1. Should ALLOW via high-level API (JSON Admin)
  // This checks default functionality (still using policies.json for v1).
  // You don't need to do anything with YAML yet to pass this test.
  // You will wire in `reload` (Step 4) later).
  test('1. Should ALLOW via high-level API (u1 is admin)', async () => {
    const decision = await accord.check(
      'u1', 
      'delete', 
      { type: 'booking', id: 'b1', attributes: {} }
    );

    expect(decision.decision).toBe('allow');
    expect(decision.policy_id).toBe('policy-admin-allow'); // Matches default JSON policy
  });

  // 2. Should DENY suspended user via high-level API (u1 Suspended)
  // Verify standard logging behavior.
  // Note: We rely on the "Kill Switch" (Resolver) logic for this test.
  async () => {
    // 1. Setup a suspended user via direct store access (for testing)
    accord.getStore().updateIdentity('u1', { status: 'suspended' });

    // 2. Check access
    const decision = await accord.check('u1', 'delete', { type: 'booking', id: 'b1', attributes: {} });

    expect(decision.decision).toBe('deny');
    expect(decision.reason).toContain('suspended');
  };
});