// tests/integration.full.test.ts
import { Accord } from '../src/accord';
import { Policy } from '../src/core/types';

describe('Accord Full Pipeline Integration', () => {
  let accord: Accord;

  beforeAll(async () => {
    accord = await Accord.create({
      policyPath: './config/policies.json',
      identityPath: './config/identities.json'
    } as any);
  });

  // 1. Should ALLOW via high-level API (JSON Admin)
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
  test('2. Should DENY suspended user', async () => {
    // 1. Setup a suspended user via direct store access (for testing)
    await accord.getStore().updateIdentity('u1', { status: 'suspended' });

    // 2. Check access
    const decision = await accord.check('u1', 'delete', { type: 'booking', id: 'b1', attributes: {} });

    expect(decision.decision).toBe('deny');
    expect(decision.reason).toContain('suspended');
    
    // Cleanup
    await accord.getStore().updateIdentity('u1', { status: 'active' });
  });
});